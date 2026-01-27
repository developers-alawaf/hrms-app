// src/components/EmployeeUpdate.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getEmployeeProfile, updateEmployee } from '../api/employee';
import { getCompanies } from '../api/company';
import { getEmployees as getAllEmployees } from '../api/employee';
import { getDepartmentsByCompany } from '../api/department';
import { getDesignationsByDepartment } from '../api/designation';
import { getAllShifts } from '../api/shift'; // <-- Import getAllShifts
import { User, Briefcase, Home, CheckSquare, FileText } from 'lucide-react';
import '../styles/EmployeeCreate.css'; // ← Reuse same CSS

const EmployeeUpdate = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const canEditRole = user?.role === 'Super Admin' || user?.role === 'HR Manager';
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'Super Admin';

  const [formData, setFormData] = useState({
    companyId: '',
    fullName: '',
    newEmployeeCode: '',
    role: '',
    joiningDate: '',
    department: '',
    designation: '',
    shiftId: '', // <-- Add shiftId here
    email: '',
    createUser: false,
    createDeviceUser: false,
    oldEmployeeCode: '',
    deviceUserId: '',
    currentDesignation: '',
    lastWorkingDay: '',
    ageOfService: '',
    personalPhoneNumber: '',
    emergencyContactNumber: '',
    hasIdCard: false,
    idCardStatus: '',
    presentAddress: '',
    permanentAddress: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    nidPassportNumber: '',
    fatherName: '',
    motherName: '',
    employeeStatus: 'active',
    separationType: '',
    separationReason: '',
    separationRemarks: '',
    idCardReturned: false,
    managerId: '',
    passportSizePhoto: null,
    appointmentLetter: null,
    resume: null,
    nidCopy: null,
  });

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]); // <-- Add shifts state
  const [employeesList, setEmployeesList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [hasUserAccount, setHasUserAccount] = useState(false);
  const [hasDeviceUser, setHasDeviceUser] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const defaultAvatar = '/default-avatar.png';
  const fileFields = ['passportSizePhoto', 'appointmentLetter', 'resume', 'nidCopy'];

  const tabs = [
    { key: 'info', label: 'Info', icon: <User size={18} /> },
    { key: 'work', label: 'Work Details', icon: <Briefcase size={18} /> },
    { key: 'personal', label: 'Personal Info', icon: <Home size={18} /> },
    { key: 'status', label: 'Status', icon: <CheckSquare size={18} /> },
    { key: 'documents', label: 'Documents', icon: <FileText size={18} /> },
  ];

  // Fetch employee + supporting data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const employeeData = await getEmployeeProfile(id, token);
        if (employeeData.success) {
          const emp = employeeData.data;

          let calculatedAgeOfService = '';
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
            
            calculatedAgeOfService = service.length > 0 ? service.join(', ') : '0 days';
          }

          setFormData({
            companyId: emp.companyId?._id || emp.companyId || '',
            fullName: emp.fullName || '',
            newEmployeeCode: emp.newEmployeeCode || '',
            role: emp.role || '',
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
            department: emp.department?._id || emp.department || '',
            designation: emp.designation?._id || emp.designation || '',
            shiftId: emp.shiftId?._id || emp.shiftId || '', // <-- Set shiftId
            email: emp.email || '',
            createUser: false,
            createDeviceUser: false,
            oldEmployeeCode: emp.oldEmployeeCode || '',
            deviceUserId: emp.deviceUserId || '',
            currentDesignation: emp.currentDesignation || '',
            lastWorkingDay: emp.lastWorkingDay ? new Date(emp.lastWorkingDay).toISOString().split('T')[0] : '',
            ageOfService: calculatedAgeOfService, // Use the dynamically calculated value
            personalPhoneNumber: emp.personalPhoneNumber || '',
            emergencyContactNumber: emp.emergencyContactNumber || '',
            hasIdCard: emp.hasIdCard || false,
            idCardStatus: emp.idCardStatus || '',
            presentAddress: emp.presentAddress || '',
            permanentAddress: emp.permanentAddress || '',
            gender: emp.gender || '',
            dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
            bloodGroup: emp.bloodGroup || '',
            nidPassportNumber: emp.nidPassportNumber || '',
            fatherName: emp.fatherName || '',
            motherName: emp.motherName || '',
            employeeStatus: emp.employeeStatus || 'active',
            separationType: emp.separationType || '',
            separationReason: emp.separationReason || '',
            separationRemarks: emp.separationRemarks || '',
            idCardReturned: emp.idCardReturned || false,
            managerId: emp.managerId || '',
            passportSizePhoto: null,
            appointmentLetter: null,
            resume: null,
            nidCopy: null,
          });

          setPreviewImage(emp.passportSizePhoto ? `${import.meta.env.VITE_API_URL}${emp.passportSizePhoto}` : null);
          setHasUserAccount(emp.hasUserAccount || false);
          setHasDeviceUser(!!emp.deviceUserId);
        } else {
          setError('Failed to fetch employee data');
        }

        const companyData = await getCompanies(token);
        if (companyData.success) {
          setCompanies(companyData.data);
        }

        const empData = await getAllEmployees(token);
        if (empData.success) {
          setEmployeesList(empData.data);
        }

        const shiftData = await getAllShifts();
        if (shiftData.data.success) {
          setShifts(shiftData.data.data);
        }

      } catch (err) {
        setError(err.error || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch departments & designations
  useEffect(() => {
    if (formData.companyId) {
      (async () => {
        const token = localStorage.getItem('token');
        const data = await getDepartmentsByCompany(formData.companyId, token);
        if (data.success) setDepartments(data.data);
      })();
    } else setDepartments([]);
  }, [formData.companyId]);

  useEffect(() => {
    if (formData.department) {
      (async () => {
        const token = localStorage.getItem('token');
        const data = await getDesignationsByDepartment(formData.department, token);
        if (data.success) setDesignations(data.data);
      })();
    } else setDesignations([]);
  }, [formData.department]);

  // Age of service
  useEffect(() => {
    if (formData.joiningDate) {
      const today = new Date();
      const join = new Date(formData.joiningDate);
      
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
      
      setFormData(prev => ({ ...prev, ageOfService: service.length > 0 ? service.join(', ') : '0 days' }));
    }
  }, [formData.joiningDate]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (fileFields.includes(name)) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      if (name === 'passportSizePhoto') {
        setPreviewImage(file ? URL.createObjectURL(file) : null);
      }
    // } else if (name === 'role' && !isSuperAdmin) {
    // } else if (name === 'role' && user?.role !== 'Super Admin' && user?.role !== 'C-Level Executive' && user?.role !== 'HR Manager') {
    } else if (name === 'role' && !canEditRole) { 
    return;
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
        if (name === 'companyId') {
          newData.department = '';
          newData.designation = '';
        }
        if (name === 'department') {
          newData.designation = '';
        }
        return newData;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (fileFields.includes(key) && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if ((key === 'createUser' || key === 'createDeviceUser') && !hasUserAccount && formData[key]) {
          formDataToSend.append(key, 'true');
        } else if (key !== 'createUser' && formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key].toString());
        }
      });

      const data = await updateEmployee(id, formDataToSend, token);
      if (data.success) {
        setSuccess('Employee updated successfully!');
        setTimeout(() => navigate('/employees'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="employee-create-container"><p className="message">Loading...</p></div>;

  return (
    <div className="employee-create-container">
      <h2 className="employee-create-title">Update Employee</h2>

      {/* Tab Bar */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="employee-create-form" encType="multipart/form-data">
        {/* === INFO TAB === */}
        {activeTab === 'info' && (
          <div className="section-card">
            <div className="section-header">
              <User size={20} />
              <h3>Basic Information</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>New HRMS ID *</label>
                <input type="text" name="newEmployeeCode" value={formData.newEmployeeCode} readOnly />
              </div>
              <div className="form-group">
                <label>Company *</label>
                <select name="companyId" value={formData.companyId} onChange={handleChange} required>
                  <option value="">Select</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">

                <label>Role *</label>
<select
  name="role"
  value={formData.role}
  onChange={handleChange}
  required
  disabled={!canEditRole}
>
  <option value="Employee">Employee</option>
  {canEditRole && (
    <>
      <option value="Manager">Manager</option>
      <option value="HR Manager">HR Manager</option>
      <option value="Company Admin">Company Admin</option>
      {user?.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
      <option value="C-Level Executive">C-Level Executive</option>
    </>
  )}
</select>
                {/* <label>Role *</label>
                <select name="role" value={formData.role} onChange={handleChange} required>
                  <option value="Employee">Employee</option>
                  { (
                    <>
                      <option value="Manager">Manager</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Company Admin">Company Admin</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="C-Level Executive">C-Level Executive</option>
                    </>
                  )}
                </select> */}
              </div>
              <div className="form-group">
                <label>Create User Account</label>
                <input
                  type="checkbox"
                  name="createUser"
                  checked={hasUserAccount || formData.createUser}
                  onChange={handleChange}
                  disabled={hasUserAccount}
                />
                {hasUserAccount && <small style={{ color: '#aaa', marginLeft: '8px' }}>(Account exists)</small>}
              </div>
              {(hasUserAccount || formData.createUser) && (
                <div className="form-group full-span">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
              )}
            </div>
          </div>
        )}

        {/* === WORK DETAILS TAB === */}
        {activeTab === 'work' && (
          <div className="section-card">
            <div className="section-header">
              <Briefcase size={20} />
              <h3>Work Details</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Joining Date *</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select name="department" value={formData.department} onChange={handleChange} required>
                  <option value="">Select</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Designation *</label>
                <select name="designation" value={formData.designation} onChange={handleChange} required>
                  <option value="">Select</option>
                  {designations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Shift</label>
                <select name="shiftId" value={formData.shiftId} onChange={handleChange} disabled={!formData.companyId}>
                  <option value="">{formData.companyId ? 'Select Shift' : 'Select Company First'}</option>
                  {shifts
                    .filter(s => s.companyId._id === formData.companyId)
                    .map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Manager</label>
                <select name="managerId" value={formData.managerId} onChange={handleChange}>
                  <option value="">None</option>
                  {employeesList.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Create Device User</label>
                <input
                  type="checkbox"
                  name="createDeviceUser"
                  checked={hasDeviceUser || formData.createDeviceUser}
                  onChange={handleChange}
                  disabled={hasDeviceUser}
                />
                {hasDeviceUser && <small style={{ color: '#aaa', marginLeft: '8px' }}>(Device user exists)</small>}
              </div>
              <div className="form-group">
                <label>Age of Service</label>
                <input type="text" value={formData.ageOfService} readOnly />
              </div>
            </div>
          </div>
        )}

        {/* === PERSONAL TAB === */}
        {activeTab === 'personal' && (
          <div className="section-card">
            <div className="section-header">
              <Home size={20} />
              <h3>Personal Info</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone</label>
                <input type="text" name="personalPhoneNumber" value={formData.personalPhoneNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Emergency Contact</label>
                <input type="text" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  {/* <option>Other</option> */}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>NID / Passport</label>
                <input type="text" name="nidPassportNumber" value={formData.nidPassportNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Father's Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Mother's Name</label>
                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} />
              </div>
              <div className="form-group full-span">
                <label>Present Address</label>
                <input type="text" name="presentAddress" value={formData.presentAddress} onChange={handleChange} />
              </div>
              <div className="form-group full-span">
                <label>Permanent Address</label>
                <input type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        {/* === STATUS TAB === */}
        {activeTab === 'status' && (
          <div className="section-card">
            <div className="section-header">
              <CheckSquare size={20} />
              <h3>Status & Permissions</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Has ID Card</label>
                <input type="checkbox" name="hasIdCard" checked={formData.hasIdCard} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Employee Status</label>
                <select name="employeeStatus" value={formData.employeeStatus} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="probation">Probation</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div className="form-group">
                <label>Last Working Day</label>
                <input type="date" name="lastWorkingDay" value={formData.lastWorkingDay} onChange={handleChange} />
              </div>
              {/* <div className="form-group">
                <label>Separation Type</label>
                <input type="text" name="separationType" value={formData.separationType} onChange={handleChange} />
              </div> */}
              <div className="form-group">
                <label>Separation Reason</label>
                <select name="separationReason" value={formData.separationReason} onChange={handleChange}>
                  <option value="">Select Reason</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                  <option value="layoff">Layoff</option>
                </select>
              </div>
              <div className="form-group full-span">
                <label>Separation Remarks</label>
                <textarea name="separationRemarks" value={formData.separationRemarks} onChange={handleChange} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label>ID Card Returned</label>
                <input type="checkbox" name="idCardReturned" checked={formData.idCardReturned} onChange={handleChange} />
              </div>
              {formData.hasIdCard && (
                <div className="form-group full-span">
                  <label>ID Card Status</label>
                  <input type="text" name="idCardStatus" value={formData.idCardStatus} onChange={handleChange} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* === DOCUMENTS TAB === */}
        {activeTab === 'documents' && (
          <div className="section-card">
            <div className="section-header">
              <FileText size={20} />
              <h3>Upload Documents</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Passport Size Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={previewImage || defaultAvatar}
                    alt="Preview"
                    style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }}
                    onError={e => e.target.src = defaultAvatar}
                  />
                  <input type="file" name="passportSizePhoto" accept="image/*" onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Appointment Letter</label>
                <input type="file" name="appointmentLetter" accept=".pdf" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Resume</label>
                <input type="file" name="resume" accept=".pdf" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>NID Copy</label>
                <input type="file" name="nidCopy" accept="image/*,.pdf" onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        {/* Messages & Submit */}
        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Updating...' : 'Update Employee'}
        </button>
      </form>
    </div>
  );
};

export default EmployeeUpdate;
