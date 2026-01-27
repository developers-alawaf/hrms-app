import React, { useState, useEffect } from 'react';
import { createDesignation } from '../api/designation';
import { getDepartments } from '../api/department';
import '../styles/CompanyCreate.css'; // Reusing company styles for now

const CreateDesignationForm = () => {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await getDepartments(token);
        if (data.success) {
          setDepartments(data.data);
        } else {
          setError(data.error || 'Failed to fetch departments.');
        }
      } catch (err) {
        setError(err.error || 'An unexpected error occurred.');
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = await createDesignation({ name, department: departmentId }, token);
      if (data.success) {
        setSuccess('Designation created successfully!');
        setName('');
        setDepartmentId('');
      } else {
        setError(data.error || 'Failed to create designation.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-container">
      <h2 className="company-title">Create Designation</h2>
      <form onSubmit={handleSubmit} className="company-form">
        <div className="form-group">
          <label htmlFor="name">Designation Name:</label>
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
          <label htmlFor="departmentId">Department:</label>
          <select
            id="departmentId"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="company-input"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="company-message company-error">{error}</p>}
        {success && <p className="company-message company-success">{success}</p>}
        <button type="submit" className="company-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Designation'}
        </button>
      </form>
    </div>
  );
};

export default CreateDesignationForm;