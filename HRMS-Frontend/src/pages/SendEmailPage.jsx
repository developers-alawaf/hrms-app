import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getEmployees } from '../api/employee';
import { sendEmailToEmployees } from '../api/email';
import { Mail, Search, X, Users, Send } from 'lucide-react';
import '../styles/SendEmail.css';

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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (emp.fullName || '').toLowerCase();
    const code = (emp.newEmployeeCode || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const handleSelectAll = () => {
    const ids = filteredEmployees.map((e) => e._id);
    const allFilteredSelected = ids.every((id) => selectedIds.includes(id));
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
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
      <div className="send-email-page">
        <div className="send-email-state error">Access denied. Super Admin only.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="send-email-page">
        <div className="send-email-state">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="send-email-page">
      <header className="send-email-header">
        <h1>
          <Mail size={28} />
          Send Email
        </h1>
        <p>Select recipients and compose your message to send via Zoho Mail</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="send-email-card">
          <h3 className="send-email-card-title">
            <Users size={20} />
            Recipients
          </h3>

          {selectedIds.length > 0 && (
            <div className="send-email-selected">
              <div className="send-email-selected-label">
                Selected ({selectedIds.length})
              </div>
              <div className="send-email-chips">
                {employees
                  .filter((e) => selectedIds.includes(e._id))
                  .map((emp) => (
                    <span key={emp._id} className="send-email-chip">
                      {emp.fullName}
                      {emp.newEmployeeCode && (
                        <span className="send-email-chip-code">{emp.newEmployeeCode}</span>
                      )}
                      <button
                        type="button"
                        className="send-email-chip-remove"
                        onClick={() => handleEmployeeToggle(emp._id)}
                        aria-label="Remove"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="send-email-search-wrap">
            <Search size={20} />
            <input
              type="text"
              className="send-email-search"
              placeholder="Search by name or employee code to add more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search employees"
            />
          </div>

          <button
            type="button"
            className="send-email-select-all"
            onClick={handleSelectAll}
          >
            {filteredEmployees.length > 0 &&
            filteredEmployees.every((e) => selectedIds.includes(e._id))
              ? 'Deselect all visible'
              : 'Select all visible'}
          </button>

          <div className="send-email-list">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <label key={emp._id} className="send-email-list-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp._id)}
                    onChange={() => handleEmployeeToggle(emp._id)}
                  />
                  <span>
                    {emp.fullName}
                    {emp.newEmployeeCode && <code>{emp.newEmployeeCode}</code>}
                  </span>
                </label>
              ))
            ) : (
              <div className="send-email-empty">
                {employees.length === 0
                  ? 'No employees found.'
                  : 'No employees match your search.'}
              </div>
            )}
          </div>
        </div>

        <div className="send-email-card">
          <h3 className="send-email-card-title">
            <Mail size={20} />
            Compose
          </h3>

          <div className="send-email-field">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              required
            />
          </div>

          <div className="send-email-field">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              required
              rows={6}
            />
          </div>
        </div>

        {error && (
          <div className="send-email-alert error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="send-email-alert success" role="status">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="send-email-submit"
          disabled={sending || selectedIds.length === 0}
        >
          <Send size={20} />
          {sending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
};

export default SendEmailPage;
