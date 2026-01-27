import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvitation } from '../api/auth';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Auth.css';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [formData, setFormData] = useState({
    token,
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTimer, setPasswordTimer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cleanup timer on component unmount
    return () => {
      if (passwordTimer) {
        clearTimeout(passwordTimer);
      }
    };
  }, [passwordTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    if (passwordTimer) {
      clearTimeout(passwordTimer);
      setPasswordTimer(null);
    }

    if (showPassword) {
      setShowPassword(false);
    } else {
      setShowPassword(true);
      const timer = setTimeout(() => {
        setShowPassword(false);
        setPasswordTimer(null);
      }, 3000);
      setPasswordTimer(timer);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await acceptInvitation(formData.token, formData.newPassword);
      if (data.success) {
        setSuccess('Invitation accepted successfully! You will be redirected to login.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Accept Invitation</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {/* <div className="form-group">
          <label htmlFor="token">Invitation Token</label>
          <input
            type="text"
            id="token"
            name="token"
            value={formData.token}
            onChange={handleChange}
            required
            className="auth-input"
          />
        </div> */}
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="auth-input"
            />
            <div className="password-toggle-icon" onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOff /> : <Eye />}
            </div>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Submitting...' : 'Accept Invitation'}
        </button>
      </form>
    </div>
  );
};
export default  AcceptInvitation