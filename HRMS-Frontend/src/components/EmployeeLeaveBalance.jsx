import React, { useState, useEffect, useContext } from 'react';
import { getLeaveSummary } from '../api/leave';
import { getEmployees } from '../api/employee';
import { AuthContext } from '../context/AuthContext';
import '../styles/Leave.css';

const EmployeeLeaveBalance = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isHRorAdmin = ['HR Manager', 'Super Admin'].includes(user?.role);

  useEffect(() => {
    const fetchEmployeesData = async () => {
      if (isHRorAdmin) {
        try {
          const token = localStorage.getItem('token');
          const data = await getEmployees(token);
          if (data.success) {
            setEmployees(data.data);
            if (data.data.length > 0 && !selectedEmployeeId) {
              setSelectedEmployeeId(data.data[0]._id);
            }
          } else {
            setError(data.error || 'Failed to fetch employees.');
          }
        } catch (err) {
          setError(err.error || 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (user?.employeeId) {
        setSelectedEmployeeId(user.employeeId);
        setLoading(false);
      }
    };
    fetchEmployeesData();
  }, [user, isHRorAdmin]);

  useEffect(() => {
    if (selectedEmployeeId && year) {
      fetchLeaveSummary(selectedEmployeeId, year);
    } else {
      setLeaveSummary(null);
    }
  }, [selectedEmployeeId, year]);

  const fetchLeaveSummary = async (employeeIdToFetch, yearToFetch) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);
      const data = await getLeaveSummary(employeeIdToFetch, yearToFetch, token);
      if (data.success) {
        setLeaveSummary(data.data);
      } else {
        setError(data.error || 'Failed to fetch leave summary.');
        setLeaveSummary(null);
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
      setLeaveSummary(null);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="employee-message employee-error">Please log in to view leave balance.</div>;
  if (loading) return <div className="employee-message">Loading...</div>;
  if (error) return <div className="employee-message employee-error">Error: {error}</div>;

  const leaveTypes = ['casual', 'sick', 'annual', 'maternity', 'festive'];

  return (
    <div className="leave-container">
      <h3 className="employee-title">Employee Leave Balance</h3>

      <div className="filter-controls">
        {isHRorAdmin && (
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
        )}
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

      {selectedEmployeeId && leaveSummary && (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Entitlement (days)</th>
                <th>Taken (days)</th>
                <th>Balance (days)</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map(type => (
                <tr key={type}>
                  <td>{type.charAt(0).toUpperCase() + type.slice(1)}</td>
                  <td>{leaveSummary.entitlement[type] || 0}</td>
                  <td>{leaveSummary.leaveTaken[type] || 0}</td>
                  <td>{leaveSummary.balance[type] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEmployeeId && !leaveSummary && !loading && !error && (
        <p className="employee-message">No leave summary found for this employee and year.</p>
      )}
    </div>
  );
};

export default EmployeeLeaveBalance;
