import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Auth.css';

const ChangePassword = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [oldPasswordTimer, setOldPasswordTimer] = useState(null);
  const [newPasswordTimer, setNewPasswordTimer] = useState(null);

  useEffect(() => {
    return () => {
      if (oldPasswordTimer) clearTimeout(oldPasswordTimer);
      if (newPasswordTimer) clearTimeout(newPasswordTimer);
    };
  }, [oldPasswordTimer, newPasswordTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'old') {
      if (oldPasswordTimer) clearTimeout(oldPasswordTimer);
      if (showOldPassword) {
        setShowOldPassword(false);
      } else {
        setShowOldPassword(true);
        const timer = setTimeout(() => setShowOldPassword(false), 3000);
        setOldPasswordTimer(timer);
      }
    } else if (field === 'new') {
      if (newPasswordTimer) clearTimeout(newPasswordTimer);
      if (showNewPassword) {
        setShowNewPassword(false);
      } else {
        setShowNewPassword(true);
        const timer = setTimeout(() => setShowNewPassword(false), 3000);
        setNewPasswordTimer(timer);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = await changePassword(formData.oldPassword, formData.newPassword, token);
      if (data.success) {
        setSuccess('Password changed successfully! You will be redirected to the dashboard.');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="oldPassword">Old Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showOldPassword ? 'text' : 'password'}
              id="oldPassword"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              required
              className="auth-input"
            />
            <div className="password-toggle-icon" onClick={() => togglePasswordVisibility('old')}>
              {showOldPassword ? <EyeOff /> : <Eye />}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="auth-input"
            />
            <div className="password-toggle-icon" onClick={() => togglePasswordVisibility('new')}>
              {showNewPassword ? <EyeOff /> : <Eye />}
            </div>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;