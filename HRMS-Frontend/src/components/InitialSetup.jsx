import React, { useState, useContext } from 'react';
import { initialSetup } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

const InitialSetup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [companyName, setCompanyName] = useState(''); // Commented out as per instruction
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // const response = await initialSetup(fullName, email, password, companyName); // Modified API call
      const response = await initialSetup(fullName, email, password); // Updated API call
      if (response.success) {
        authLogin(response.token, { id: response.user.id, email: response.user.email, role: response.user.role, employeeId: response.user.employeeId, companyId: response.user.companyId });
        navigate('/dashboard');
      } else {
        setError(response.error || 'Initial setup failed.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Initial HRMS Setup</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>
        {/* Commented out companyName input as per instruction */}
        {/* <div className="form-group">
          <label htmlFor="companyName">Company Name:</label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="login-input"
          />
        </div> */}
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
};

export default InitialSetup;