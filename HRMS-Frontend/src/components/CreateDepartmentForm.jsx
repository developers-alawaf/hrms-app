import React, { useState, useEffect } from 'react';
import { createDepartment } from '../api/department';
import { getCompanies } from '../api/company';
import '../styles/CompanyCreate.css'; // Reusing company styles for now

const CreateDepartmentForm = () => {
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await getCompanies(token);
        if (data.success) {
          setCompanies(data.data);
        } else {
          setError(data.error || 'Failed to fetch companies.');
        }
      } catch (err) {
        setError(err.error || 'An unexpected error occurred.');
      }
    };
    fetchCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = await createDepartment({ name, company: companyId }, token);
      if (data.success) {
        setSuccess('Department created successfully!');
        setName('');
        setCompanyId('');
      } else {
        setError(data.error || 'Failed to create department.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-container">
      <h2 className="company-title">Create Department</h2>
      <form onSubmit={handleSubmit} className="company-form">
        <div className="form-group">
          <label htmlFor="name">Department Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="company-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyId">Company:</label>
          <select
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="company-input"
            required
          >
            <option value="">Select Company</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="company-message company-error">{error}</p>}
        {success && <p className="company-message company-success">{success}</p>}
        <button type="submit" className="company-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Department'}
        </button>
      </form>
    </div>
  );
};

export default CreateDepartmentForm;