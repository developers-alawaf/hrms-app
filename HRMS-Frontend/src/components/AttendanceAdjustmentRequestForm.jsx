import React, { useState, useContext } from 'react';
import { createAdjustmentRequest } from '../api/attendance';
import { AuthContext } from '../context/AuthContext';
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
    <div className="attendance-adjustment-form-container attendance-form">
      <h3>Submit Attendance Adjustment Request</h3>
      <form onSubmit={handleSubmit} className="attendance-adjustment-form">
        <div className="form-group">
          <label htmlFor="attendanceDate">Attendance Date:</label>
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
          <label htmlFor="proposedCheckIn">Proposed Check-in Time:</label>
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
          <label htmlFor="proposedCheckOut">Proposed Check-out Time:</label>
          <input
            type="time"
            id="proposedCheckOut"
            name="proposedCheckOut"
            value={formData.proposedCheckOut}
            onChange={handleChange}
            className="employee-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="reason">Reason:</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="3"
            required
            className="employee-input"
          ></textarea>
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button type="submit" disabled={loading || (!formData.proposedCheckIn && !formData.proposedCheckOut)} className="employee-button">
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default AttendanceAdjustmentRequestForm;