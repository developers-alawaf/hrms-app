import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import '../styles/Login.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    token: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    if (token) {
      setFormData(prev => ({ ...prev, token }));
      setError('');
    } else {
      setError('No reset token found. Please request a new password reset link from the login page.');
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await resetPassword(formData.token, formData.newPassword);
      if (data.success) {
        setSuccess('Password reset successfully! You will be redirected to the login page.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!formData.token) {
    return (
      <div className="login-container">
        <div className="particle-background">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`} />
          ))}
        </div>
        <div className="login-card">
          <Link to="/login" className="back-link">
            <ArrowLeft className="back-icon" />
            Back to Login
          </Link>
          <div className="logo-container">
            <img src="/Kloud_Technologies_Logo.svg" alt="Alawaf HRMS Logo" className="login-logo" />
          </div>
          <h2 className="login-title">Reset Password</h2>
          <p className="error-message">{error}</p>
          <p className="invitation-link">
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
          <p className="powered-by">Powered by Alawaf</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="particle-background">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`} />
        ))}
      </div>
      <div className="login-card">
        <Link to="/login" className="back-link">
          <ArrowLeft className="back-icon" />
          Back to Login
        </Link>
        <div className="logo-container">
          <img src="/Kloud_Technologies_Logo.svg" alt="Alawaf HRMS Logo" className="login-logo" />
        </div>
        <h2 className="login-title">Set New Password</h2>
        <p className="forgot-subtitle">Enter your new password below. It must be at least 8 characters.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Lock className="input-icon" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="New Password"
              className="login-input"
              required
              disabled={loading}
            />
            <div className="password-toggle-icon" onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? <EyeOff /> : <Eye />}
            </div>
          </div>
          <div className="input-group">
            <Lock className="input-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm New Password"
              className="login-input"
              required
              disabled={loading}
            />
            <div className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="invitation-link">
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
        <p className="powered-by">Powered by Alawaf</p>
      </div>
    </div>
  );
};

export default ResetPassword;
