import React, { useState, useContext } from 'react';
import { createAdjustmentRequest } from '../api/attendance';
import { AuthContext } from '../context/AuthContext';
import '../styles/Employee.css';
import '../styles/Attendance.css';

const AttendanceAdjustmentRequestForm = ({ onFormSubmit }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    attendanceDate: '',
    proposedCheckIn: '',
    proposedCheckOut: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        attendanceDate: formData.attendanceDate,
        proposedCheckIn: formData.proposedCheckIn ? `${formData.attendanceDate}T${formData.proposedCheckIn}:00.000Z` : undefined,
        proposedCheckOut: formData.proposedCheckOut ? `${formData.attendanceDate}T${formData.proposedCheckOut}:00.000Z` : undefined,
        reason: formData.reason,
      };

      const data = await createAdjustmentRequest(payload, token);
      if (data.success) {
        setSuccess('Adjustment request submitted successfully!');
        setFormData({
          attendanceDate: '',
          proposedCheckIn: '',
          proposedCheckOut: '',
          reason: '',
        });
        if (onFormSubmit) {
          onFormSubmit();
        }
      } else {
        setError(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card attendance-adjustment-section">
      <div className="section-header">
        <h3>Submit Attendance Adjustment Request</h3>
      </div>
      <div className="section-body">
        <form onSubmit={handleSubmit} className="employee-form attendance-adjustment-form">
          <div className="form-grid attendance-adjustment-grid">
            <div className="form-group">
              <label htmlFor="attendanceDate">Attendance Date</label>
              <input
                type="date"
                id="attendanceDate"
                name="attendanceDate"
                value={formData.attendanceDate}
                onChange={handleChange}
                required
                className="employee-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="proposedCheckIn">Proposed Check-in</label>
              <input
                type="time"
                id="proposedCheckIn"
                name="proposedCheckIn"
                value={formData.proposedCheckIn}
                onChange={handleChange}
                className="employee-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="proposedCheckOut">Proposed Check-out</label>
              <input
                type="time"
                id="proposedCheckOut"
                name="proposedCheckOut"
                value={formData.proposedCheckOut}
                onChange={handleChange}
                className="employee-input"
              />
            </div>
            <div className="form-group full-span">
              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                placeholder="Explain why this adjustment is needed..."
                required
                className="employee-input employee-textarea"
              />
            </div>
          </div>
          {error && (
            <div className="employee-message employee-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="employee-message employee-success">
              {success}
            </div>
          )}
          <div className="attendance-adjustment-form-actions">
            <button
              type="submit"
              disabled={loading || (!formData.proposedCheckIn && !formData.proposedCheckOut)}
              className="employee-button employee-btn-primary"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceAdjustmentRequestForm;