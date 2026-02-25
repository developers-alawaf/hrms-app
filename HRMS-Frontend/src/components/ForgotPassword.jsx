import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { ArrowLeft, Mail } from 'lucide-react';
import '../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      if (data.success) {
        setSuccess(data.message || 'If an account exists with this email, you will receive a password reset link shortly.');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.error || 'Failed to send reset link. Please try again.');
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
        <Link to="/login" className="back-link">
          <ArrowLeft className="back-icon" />
          Back to Login
        </Link>
        <div className="logo-container">
          <img src="/Kloud_Technologies_Logo.svg" alt="Alawaf HRMS Logo" className="login-logo" />
        </div>
        <h2 className="login-title">Forgot Password</h2>
        <p className="forgot-subtitle">Enter your email and we&apos;ll send you a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="login-input"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="invitation-link">
          Remember your password?{' '}
          <Link to="/login">Back to Login</Link>
        </p>
        <p className="powered-by">Powered by Alawaf</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
