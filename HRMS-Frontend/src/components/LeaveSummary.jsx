import React, { useState, useEffect, useContext } from 'react';
import { getLeaveSummary } from '../api/leave';
import { AuthContext } from '../context/AuthContext';
import '../styles/Leave.css';

const LeaveSummary = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [user, year]);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await getLeaveSummary(null, year, token);
      if (data.success) {
        setSummary(data.data);
      } else {
        setError(data.error || 'Failed to fetch leave summary.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="employee-message">Loading leave summary...</div>;
  if (error) return <div className="employee-message employee-error">Error: {error}</div>;
  if (!summary) return <div className="employee-message">No leave summary available.</div>;

  const { entitlement, leaveTaken, balance } = summary;

  return (
    <div className="leave-container">
      <h3 className="employee-title">Leave Summary for {year}</h3>
      <div className="form-group">
        <label htmlFor="yearSelect">Select Year:</label>
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

      <div className="leave-summary-grid">
        <div className="summary-card">
          <h4>Entitlements</h4>
          <table className="summary-table">
            <tbody>
              {Object.entries(entitlement).map(([key, value]) => {
                if (['_id', 'employeeId', 'year', '__v'].includes(key)) return null;
                return (
                  <tr key={key}>
                    <td>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                    <td>{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="summary-card">
          <h4>Leave Taken</h4>
          <table className="summary-table">
            <tbody>
              {Object.entries(leaveTaken).map(([key, value]) => (
                <tr key={key}>
                  <td>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-card">
          <h4>Balance</h4>
          <table className="summary-table">
            <tbody>
              {Object.entries(balance).map(([key, value]) => (
                <tr key={key}>
                  <td>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveSummary;
