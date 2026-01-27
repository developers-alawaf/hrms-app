import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { Eye, EyeOff } from 'lucide-react';

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
    } else {
      setError('No reset token found. Please request a new password reset link.');
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
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="card-title text-center">Reset Password</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="input-group">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                    />
                    <div className="input-group-append">
                      <span className="input-group-text" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeOff /> : <Eye />}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <div className="input-group-append">
                      <span className="input-group-text" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
