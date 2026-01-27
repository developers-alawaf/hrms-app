import React, { useState, useEffect, useContext } from 'react';
import { getLeaveEntitlement, updateLeaveEntitlement, generateMissingLeaveEntitlements } from '../api/leave';
import { getEmployees } from '../api/employee';
import { AuthContext } from '../context/AuthContext';
import '../styles/Leave.css';

const LeaveEntitlementManagement = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear(); // Defined here
  const [entitlement, setEntitlement] = useState(null);
  const [formData, setFormData] = useState({
    casual: 0,
    sick: 0,
    annual: 0,
    maternity: 0,
    //Festive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isHRorAdmin = ['HR Manager', 'Super Admin', 'Company Admin'].includes(user?.role);

  useEffect(() => {
    const fetchEmployeesData = async () => {
      console.log('LeaveEntitlementManagement: fetchEmployeesData called. user role:', user?.role);
      if (isHRorAdmin) {
        try {
          const token = localStorage.getItem('token');
          console.log('LeaveEntitlementManagement: Calling getEmployees API.');
          const data = await getEmployees(token);
          if (data.success) {
            console.log('LeaveEntitlementManagement: Fetched employees:', data.data);
            setEmployees(data.data);
            // Automatically select the first employee if available and no employee is already selected
            if (data.data.length > 0 && !selectedEmployeeId) {
              setSelectedEmployeeId(data.data[0]._id);
            }
          } else {
            setError(data.error || 'Failed to fetch employees.');
            console.error('LeaveEntitlementManagement: Error fetching employees:', data.error);
          }
        } catch (err) {
          setError(err.error || 'An unexpected error occurred.');
          console.error('LeaveEntitlementManagement: Exception fetching employees:', err);
        }
      } else if (user?.employeeId) {
        // For non-HR/Admin roles, set their own employeeId
        setSelectedEmployeeId(user.employeeId);
      }
      setLoading(false); // Set loading to false after initial employee fetch/setting
    };
    fetchEmployeesData();
  }, [user, isHRorAdmin]);

  useEffect(() => {
    console.log('LeaveEntitlementManagement: fetchEntitlement useEffect called. selectedEmployeeId:', selectedEmployeeId, 'year:', year);
    if (selectedEmployeeId && year) {
      fetchEntitlement(selectedEmployeeId, year);
    } else {
      setEntitlement(null);
      setFormData({
        casual: 0,
        sick: 0,
        annual: 0,
        maternity: 0,
        //Festive: 0,
      });
      console.log('LeaveEntitlementManagement: selectedEmployeeId or year is empty, resetting entitlement.');
    }
  }, [selectedEmployeeId, year]);

  const fetchEntitlement = async (employeeIdToFetch, yearToFetch) => {
    setLoading(true);
    setError('');
    console.log('LeaveEntitlementManagement: Calling getLeaveEntitlement API for employee:', employeeIdToFetch, 'year:', yearToFetch);
    try {
      const token = localStorage.getItem('token');
      const data = await getLeaveEntitlement(employeeIdToFetch, yearToFetch, token);
      if (data.success) {
        console.log('LeaveEntitlementManagement: Fetched entitlement:', data.data);
        setEntitlement(data.data);
        setFormData({
          casual: data.data.casual,
          sick: data.data.sick,
          annual: data.data.annual,
          maternity: data.data.maternity,
          //Festive: data.data.//Festive,
        });
      } else {
        setError(data.error || 'Failed to fetch leave entitlement.');
        setEntitlement(null);
        console.error('LeaveEntitlementManagement: Error fetching entitlement:', data.error);
      }
    } catch (err) {
      if (err.error === 'Leave entitlement not found') {
        setEntitlement(null);
      } else {
        setError(err.error || 'An unexpected error occurred.');
      }
      console.error('LeaveEntitlementManagement: Exception fetching entitlement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await updateLeaveEntitlement(selectedEmployeeId, { ...formData, year }, token);
      if (data.success) {
        setSuccess('Leave entitlement updated successfully!');
        fetchEntitlement(selectedEmployeeId, year);
      } else {
        setError(data.error || 'Failed to update leave entitlement.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMissing = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await generateMissingLeaveEntitlements(token);
      if (data.success) {
        setSuccess(data.message || 'Missing entitlements generated successfully!');
        // Refetch employees and then fetch the entitlement for the first employee
        const employeesData = await getEmployees(token);
        if (employeesData.success && employeesData.data.length > 0) {
          setEmployees(employeesData.data);
          const firstEmployeeId = employeesData.data[0]._id;
          setSelectedEmployeeId(firstEmployeeId);
          fetchEntitlement(firstEmployeeId, year);
        }
      } else {
        setError(data.error || 'Failed to generate missing entitlements.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="employee-message employee-error">Please log in to view entitlements.</div>;
  if (loading) return <div className="employee-message">Loading...</div>;
  if (error) return <div className="employee-message employee-error">Error: {error}</div>;

  return (
    <div className="leave-container">
      <h3 className="employee-title">Manage Leave Entitlements</h3>

      {isHRorAdmin ? (
        <div className="filter-controls">
          <div className="form-group">
            <label htmlFor="employeeSelect">Select Employee:</label>
            <select
              id="employeeSelect"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="employee-input"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.newEmployeeCode})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="yearSelect">Year:</label>
            <input
              type="number"
              id="yearSelect"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="employee-input"
              min="2000"
              max="2100"
            />
          </div>
          <button onClick={handleGenerateMissing} disabled={loading} className="employee-button">
            Generate Missing Entitlements
          </button>
        </div>
      ) : (
        <div className="filter-controls">
          <p className="employee-message">Viewing entitlement for: {user.fullName || user.email}</p>
          <div className="form-group">
            <label htmlFor="yearSelect">Year:</label>
            <input
              type="number"
              id="yearSelect"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="employee-input"
              min="2000"
              max="2100"
            />
          </div>
        </div>
      )}

      {selectedEmployeeId && entitlement && (
        <form onSubmit={handleSubmit} className="leave-form">
          {Object.keys(formData).map(key => {
            const selectedEmployee = employees.find(emp => emp._id === selectedEmployeeId);
            const isMaleEmployee = selectedEmployee && selectedEmployee.gender === 'Male';
            if (key === 'maternity' && isMaleEmployee) {
              return (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>Maternity Leave (days):</label>
                  <input
                    type="text"
                    id={key}
                    name={key}
                    value="N/A"
                    disabled
                    className="employee-input"
                  />
                </div>
              );
            }
            return (
              <div className="form-group" key={key}>
                <label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)} Leave (days):</label>
                <input
                  type="number"
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  min="0"
                  required
                  className="employee-input"
                />
              </div>
            );
          })}
          {success && <p className="employee-message employee-success">{success}</p>}
          {error && <p className="employee-message employee-error">{error}</p>}
          {isHRorAdmin && (
            <button type="submit" disabled={loading} className="employee-button">
              {loading ? 'Updating...' : 'Update Entitlement'}
            </button>
          )}
        </form>
      )}

      {selectedEmployeeId && !entitlement && !loading && !error && (
        <p className="employee-message">No entitlement found for this employee and year. Generate or select another.</p>
      )}
    </div>
  );
};

export default LeaveEntitlementManagement;