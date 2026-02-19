import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getEmployees } from '../api/employee';
import { sendEmailToEmployees } from '../api/email';
import { Mail } from 'lucide-react';
import '../styles/Employee.css';

const SendEmailPage = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await getEmployees(token, null);
        if (data.success) {
          const active = (data.data || []).filter(
            (e) => e.employeeStatus === 'active'
          );
          setEmployees(active);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'Super Admin') {
      fetchEmployees();
    }
  }, [user]);

  const handleEmployeeToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((e) => e._id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedIds.length === 0) {
      setError('Please select at least one employee.');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const result = await sendEmailToEmployees(
        {
          employeeIds: selectedIds,
          subject: subject.trim(),
          message: message.trim(),
        },
        token
      );

      if (result.success) {
        setSuccess(
          result.message ||
            `Email sent to ${result.sentCount || selectedIds.length} recipient(s).`
        );
        if (result.noEmail?.length) {
          setSuccess(
            (s) =>
              `${s} (${result.noEmail.length} employee(s) have no email on file.)`
          );
        }
        setSubject('');
        setMessage('');
        setSelectedIds([]);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error || 'Failed to send email.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'Super Admin') {
    return (
      <div className="employee-container">
        <div className="employee-message employee-error">Access denied. Super Admin only.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="employee-container">
        <div className="employee-message">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h2 className="employee-title">
          <Mail className="employee-btn-icon" size={24} />
          Send Email to Employees
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="employee-form" style={{ maxWidth: 640 }}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label htmlFor="employee-select" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Select Employee(s)
          </label>
          <div style={{ marginBottom: 8 }}>
            <button
              type="button"
              className="employee-button employee-btn-export"
              onClick={handleSelectAll}
            >
              {selectedIds.length === employees.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div
            className="employee-input"
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {employees.map((emp) => (
              <label
                key={emp._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(emp._id)}
                  onChange={() => handleEmployeeToggle(emp._id)}
                />
                <span>
                  {emp.fullName} {emp.newEmployeeCode && `(${emp.newEmployeeCode})`}
                </span>
              </label>
            ))}
          </div>
          {employees.length === 0 && (
            <p className="employee-message" style={{ marginTop: 8 }}>No employees found.</p>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label htmlFor="subject" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="employee-input"
            placeholder="Enter email subject"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label htmlFor="message" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="employee-input"
            rows={8}
            placeholder="Enter your message..."
            required
            style={{ resize: 'vertical' }}
          />
        </div>

        {error && (
          <p className="employee-message employee-error" style={{ marginBottom: 16 }}>{error}</p>
        )}
        {success && (
          <p className="employee-message employee-success" style={{ marginBottom: 16 }}>{success}</p>
        )}

        <button
          type="submit"
          className="employee-button employee-btn-primary"
          disabled={sending || selectedIds.length === 0}
        >
          {sending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
};

export default SendEmailPage;
