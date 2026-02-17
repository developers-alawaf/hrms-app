import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login as loginAPI } from '../api/auth';
import { ArrowLeft, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
  const { login: setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTimer, setPasswordTimer] = useState(null);

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
    setLoading(true);
    try {
      const data = await loginAPI(formData.email, formData.password);
      console.log('Login API response:', data); // Debug API response
      if (data.success) {
        const result = await setAuth(data.token);
        console.log('setAuth result:', result); // Debug setAuth result
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error || 'Failed to authenticate user');
        }
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err); // Debug full error
      console.error('Login error21:', err.error); // Debug full error
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="particle-background">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`} />
        ))}
      </div>
      <div className="login-card">
        <div className="" />
        <Link to="/" className="back-link">
          <ArrowLeft className="back-icon" />
          Back to Home
        </Link>
        <div className="logo-container">
          <img src="/Kloud_Technologies_Logo.svg" alt="Alawaf HRMS Logo" className="login-logo" />
        </div>
        <h2 className="login-title">Login to HRMS</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="login-input"
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="login-input"
              required
              disabled={loading}
            />
            <div className="password-toggle-icon" onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOff /> : <Eye />}
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="invitation-link">
          New user?{' '}
          <Link to="/accept-invitation">Accept Invitation</Link>
        </p>
        <p className="powered-by">Powered by Alawaf</p>
      </div>
    </div>
  );
};

export default Login;