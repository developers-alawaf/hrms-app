import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getEmployees, getEmployeeProfile } from '../api/employee';
import { resendInvitation } from '../api/auth';
import { getCompanies } from '../api/company';
import * as XLSX from 'xlsx';
import '../styles/Employee.css';
// import { Eye } from 'lucide-react';
import { Download, Edit, Eye } from 'lucide-react';

const defaultAvatar = '/default-avatar.png';

const EmployeeList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const employeesPerPage = 10;
  const authorized = user?.role === 'Super Admin' || user?.role === 'HR Manager';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [employeeData, companyData] = await Promise.all([
          getEmployees(token),
          getCompanies(token),
        ]);
        if (employeeData.success && companyData.success) {
          const employeesWithAge = employeeData.data.map(emp => {
            if (emp.joiningDate) {
              const today = new Date();
              const join = new Date(emp.joiningDate);
              
              let years = today.getFullYear() - join.getFullYear();
              let months = today.getMonth() - join.getMonth();
              let days = today.getDate() - join.getDate();

              if (days < 0) {
                months--;
                days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
              }
              
              if (months < 0) {
                years--;
                months += 12;
              }
              
              const service = [];
              if (years > 0) service.push(`${years} year${years > 1 ? 's' : ''}`);
              if (months > 0) service.push(`${months} month${months > 1 ? 's' : ''}`);
              if (days > 0) service.push(`${days} day${days > 1 ? 's' : ''}`);
              
              emp.ageOfService = service.length > 0 ? service.join(', ') : '0 days';
            }
            return emp;
          });
          
          setEmployees(employeesWithAge);
          setFilteredEmployees(employeesWithAge);
          setCompanies(companyData.data);
        } else {
          setError(employeeData.error || companyData.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.error || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = employees.filter(employee =>
      (employee.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.newEmployeeCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchQuery, employees]);

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c._id === companyId);
    return company ? company.name : '-';
  };

  const handleView = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const data = await getEmployeeProfile(id, token);
      if (data.success) {
        const employeeData = data.data;
        if (employeeData.joiningDate) {
          const today = new Date();
          const join = new Date(employeeData.joiningDate);
          
          let years = today.getFullYear() - join.getFullYear();
          let months = today.getMonth() - join.getMonth();
          let days = today.getDate() - join.getDate();

          if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
          }
          
          if (months < 0) {
            years--;
            months += 12;
          }
          
          const service = [];
          if (years > 0) service.push(`${years} year${years > 1 ? 's' : ''}`);
          if (months > 0) service.push(`${months} month${months > 1 ? 's' : ''}`);
          if (days > 0) service.push(`${days} day${days > 1 ? 's' : ''}`);
          
          employeeData.ageOfService = service.length > 0 ? service.join(', ') : '0 days';
        }
        
        setSelectedEmployee(employeeData);
        setShowModal(true);
      } else {
        setError(data.error || 'Failed to fetch employee details');
      }
    } catch (err) {
      setError(err.error || 'Failed to fetch employee details');
    }
  };

  const handleResendInvitation = async (email) => {
    try {
      const token = localStorage.getItem('token');
      const response = await resendInvitation(email, token);
      if (response.success) {
        alert('Invitation resent successfully');
      } else {
        setError(response.error || 'Failed to resend invitation');
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
    }
  };

  const handleExport = () => {
    const exportData = filteredEmployees.map(employee => ({
      'Profile Image': employee.passportSizePhoto || '-',
      'Full Name': employee.fullName || '-',
      'HRMS ID': employee.newEmployeeCode || '-',
      'Email': employee.email || '-',
      'Company': getCompanyName(employee.companyId),
      'Role': employee.role || '-',
      'Department': employee.department || '-',
      'Designation': employee.designation || '-',
      'Age of Service': employee.joiningDate ? (() => {
        const today = new Date();
        const join = new Date(employee.joiningDate);
        let years = today.getFullYear() - join.getFullYear();
        let months = today.getMonth() - join.getMonth();
        let days = today.getDate() - join.getDate();
        if (days < 0) {
          months--;
          days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }
        if (months < 0) {
          years--;
          months += 12;
        }
        const service = [];
        if (years > 0) service.push(`${years} year${years > 1 ? 's' : ''}`);
        if (months > 0) service.push(`${months} month${months > 1 ? 's' : ''}`);
        if (days > 0) service.push(`${days} day${days > 1 ? 's' : ''}`);
        return service.length > 0 ? service.join(', ') : '0 days';
      })() : '-',
      'Phone': employee.personalPhoneNumber || '-',
      'Address': employee.presentAddress || '-',
      'Gender': employee.gender || '-',
      'Date of Birth': employee.dob ? new Date(employee.dob).toLocaleDateString() : '-',
      'Status': employee.employeeStatus || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
  };

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) return <div className="employee-message">Loading employees...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h2 className="employee-title">Employees</h2>
        <div className="employee-controls">
          <input
            type="text"
            placeholder="Search by name, code, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="employee-input employee-search"
          />
          {authorized && (
            <Link to="/employees/create" className="employee-button">
              Add Employee
            </Link>
          )}
          <button onClick={handleExport} className="employee-button export-button">
            <Download className="button-icon" /> Export
          </button>
        </div>
      </div>
      {filteredEmployees.length === 0 ? (
        <div className="employee-message">No employees found.</div>
      ) : (
        <>
          <div className="employee-table-container">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Profile Image</th>
                  <th>HRMS ID</th>
                  <th>Name</th>
                  
                  <th>Email</th>
                  <th>Company</th>
                  {/* <th>Role</th> */}
                  <th>Shift</th>
                  <th>Department</th>
                  <th>Designation</th>
                  {/* <th>Age of Service</th> */}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>
                      <img
                        src={employee.passportSizePhoto ? `${import.meta.env.VITE_API_URL}${employee.passportSizePhoto}` : defaultAvatar}
                        alt="Profile"
                        className="employee-profile-image"
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50%" }}
                        onError={(e) => {
                          if (e.target.src !== defaultAvatar) {
                            e.target.src = defaultAvatar;
                          }
                        }}
                      />
                    </td>
                    <td>{employee.newEmployeeCode || '-'}</td>
                    <td>{employee.fullName || '-'}</td>
                    
                    <td>{employee.email || '-'}</td>
                    <td>{getCompanyName(employee.companyId)}</td>
                    {/* <td>{employee.role || '-'}</td> */}
                    <td>{employee.shift?.name || '-'}</td>
                    <td>{employee.department?.name || '-'}</td>
                    <td>{employee.designation?.name || '-'}</td>
                    {/* <td>{employee.ageOfService || '-'}</td> */}
                    <td>{employee.employeeStatus || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleView(employee._id)}
                        className="employee-button view-button"
                      >
                        <Eye className="button-icon" /> View
                      </button>
                      {['pending', 'expired', 'sent'].includes(employee.invitationStatus) && (
                        <button
                          onClick={() => handleResendInvitation(employee.email)}
                          className="employee-button resend-button"
                        >
                          Resend Invitation
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length > employeesPerPage && (
            <div className="pagination-controls">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
          {showModal && selectedEmployee && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content employee-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">Employee Details</h3>
                <div className="modal-grid">
                  <div className="modal-image-container">
                    <img
                      src={selectedEmployee.passportSizePhoto ? `${import.meta.env.VITE_API_URL}${selectedEmployee.passportSizePhoto}` : defaultAvatar}
                      alt="Profile"
                      className="employee-profile-image modal-profile-image"
                      onError={(e) => {
                        if (e.target.src !== defaultAvatar) {
                          e.target.src = defaultAvatar;
                        }
                      }}
                    />
                  </div>
                  <div className="modal-details">
                    {Object.keys(selectedEmployee).map((key) => {
                      if (['__v', 'createdAt', 'updatedAt', 'shiftId'].includes(key)) return null; // Exclude shiftId as we'll display shift object
                      let displayValue = selectedEmployee[key];
                      if (displayValue === null || displayValue === undefined || displayValue === '') displayValue = '-';
                      else if (typeof displayValue === 'boolean') displayValue = displayValue ? 'Yes' : 'No';
                      else if (['joiningDate', 'lastWorkingDay', 'dob'].includes(key) && displayValue) {
                        displayValue = new Date(displayValue).toLocaleDateString();
                      } else if (key === 'ageOfService') {
                        return (
                          <div key={key} className="modal-detail-item">
                            <strong>Age of Service:</strong> <span>{displayValue}</span>
                          </div>
                        );
                      } else if (key === 'companyId') {
                        displayValue = getCompanyName(displayValue);
                      } else if (key === 'managerId') {
                        const manager = employees.find(emp => emp._id === displayValue);
                        displayValue = manager ? `${manager.fullName} (${manager.newEmployeeCode})` : '-';
                      } else if (key === 'shift' && displayValue && displayValue.name) {
                        return (
                          <div key={key} className="modal-detail-item">
                            <strong>Shift:</strong> <span>{displayValue.name} ({displayValue.startTime} - {displayValue.endTime})</span>
                          </div>
                        );
                      } else if (typeof displayValue === 'object') return null; // Still filter out other objects
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                      return (
                        <div key={key} className="modal-detail-item">
                          <strong>{label}:</strong> <span>{displayValue}</span>
                        </div>
                      );
                    })}
                    <div className="modal-documents">
                      {selectedEmployee.appointmentLetter && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${selectedEmployee.appointmentLetter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-document-link"
                        >
                          Download Appointment Letter
                        </a>
                      )}
                      {selectedEmployee.resume && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${selectedEmployee.resume}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-document-link"
                        >
                          Download Resume
                        </a>
                      )}
                      {selectedEmployee.nidCopy && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${selectedEmployee.nidCopy}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-document-link"
                        >
                          Download NID Copy
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(false)} className="employee-button modal-button">
                    Close
                  </button>
                  {authorized && (
                    <Link to={`/employees/${selectedEmployee._id}/edit`} className="employee-button modal-button">
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeList;