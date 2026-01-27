import React, { useState, useEffect, useContext } from 'react';
import { getLeavePolicy, updateLeavePolicy } from '../api/leave';
import { getCompanies } from '../api/company';
import { AuthContext } from '../context/AuthContext';
import '../styles/Leave.css';

const LeavePolicyForm = () => {
  const { user } = useContext(AuthContext);
  const [policy, setPolicy] = useState({
    casual: 0,
    sick: 0,
    annual: 0,
    maternity: 0,
    //Festive: 0,
  });
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(user?.companyId || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // New state for year

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'C-Level Executive'].includes(user?.role);
  const isSuperAdmin = user?.role === 'Super Admin';

  useEffect(() => {
    if (!isAuthorized) return;

    const initializePolicyData = async () => {
      setLoading(true);
      setError('');
      try {
        if (isSuperAdmin) {
          const token = localStorage.getItem('token');
          const companiesData = await getCompanies(token);
          if (companiesData.success) {
            setCompanies(companiesData.data);
            if (companiesData.data.length > 0 && !selectedCompanyId) {
              setSelectedCompanyId(companiesData.data[0]._id);
              fetchPolicy(companiesData.data[0]._id, selectedYear);
            } else if (selectedCompanyId) {
              fetchPolicy(selectedCompanyId, selectedYear);
            }
          }
        } else {
          // For non-super admins, fetch policy for their company directly
          if (user?.companyId) {
            setSelectedCompanyId(user.companyId);
            fetchPolicy(user.companyId, selectedYear);
          } else {
            setError('User is not associated with a company.');
          }
        }
      } catch (err) {
        setError(err.error || 'An unexpected error occurred during initialization.');
      } finally {
        setLoading(false);
      }
    };
    initializePolicyData();
  }, [isAuthorized, isSuperAdmin, user?.companyId, selectedYear]); // Added selectedYear to dependencies

  useEffect(() => {
    // Refetch policy when selectedCompanyId or selectedYear changes for Super Admin
    if (isSuperAdmin && selectedCompanyId && selectedYear) {
      fetchPolicy(selectedCompanyId, selectedYear);
    }
  }, [selectedCompanyId, selectedYear, isSuperAdmin]);


  const fetchPolicy = async (companyIdToFetch, yearToFetch) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await getLeavePolicy(token, companyIdToFetch, yearToFetch); // Pass companyId and year
      if (data.success) {
        setPolicy(data.data);
      } else {
        setError(data.error || 'Failed to fetch leave policy.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPolicy(prev => ({
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
      const data = await updateLeavePolicy(selectedCompanyId, { ...policy, year: selectedYear }, token); // Pass companyId and year
      if (data.success) {
        setSuccess('Leave policy updated successfully!');
      } else {
        setError(data.error || 'Failed to update leave policy.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) return <div className="employee-message employee-error">Access Denied</div>;
  if (loading) return <div className="employee-message">Loading leave policy...</div>;
  if (error) return <div className="employee-message employee-error">Error: {error}</div>;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // 2 years back, current, 2 years forward

  return (
    <div className="leave-container">
      <h3 className="employee-title">Manage Leave Policy</h3>
      {isSuperAdmin && (
        <div className="filter-controls">
          <div className="form-group">
            <label htmlFor="companySelect">Select Company:</label>
            <select
              id="companySelect"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="employee-input"
              disabled={loading}
            >
              <option value="">-- Select Company --</option>
              {companies.map(company => (
                <option key={company._id} value={company._id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="yearSelect">Select Year:</label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="employee-input"
              disabled={loading || !selectedCompanyId}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {!selectedCompanyId && isSuperAdmin && !loading && (
        <p className="employee-message employee-error">Please select a company to manage its leave policy.</p>
      )}
      {(selectedCompanyId || !isSuperAdmin) && (
        <form onSubmit={handleSubmit} className="leave-form">
          {Object.keys(policy).map(key => {
            if (['_id', 'companyId', 'createdAt', 'updatedAt', '__v', 'year', 'festive'].includes(key)) return null;
            return (
              <div className="form-group" key={key}>
                <label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)} Leave (days):</label>
                <input
                  type="number"
                  id={key}
                  name={key}
                  value={policy[key]}
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
          <button type="submit" disabled={loading} className="employee-button">
            {loading ? 'Updating...' : 'Update Policy'}
          </button>
        </form>
      )}
    </div>
  );
};

export default LeavePolicyForm;