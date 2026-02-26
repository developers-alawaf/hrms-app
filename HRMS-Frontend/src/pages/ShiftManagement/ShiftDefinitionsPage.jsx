import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  getRosterDutyShifts,
  createRosterDutyShift,
  updateRosterDutyShift,
  deleteRosterDutyShift,
} from '../../api/shiftManagement';
import '../../styles/CompanyCreate.css';

const defaultFormData = () => ({
  name: '',
  shiftCode: '',
  officeStartTime: '',
  officeEndTime: '',
  isOffDay: false,
});

const ShiftDefinitionsPage = () => {
  const { user } = useContext(AuthContext);
  const [shifts, setShifts] = useState([]);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState(defaultFormData());
  const [currentPage, setCurrentPage] = useState(1);
  const shiftsPerPage = 10;

  const isInNoc = user?.department?.name?.toLowerCase?.().includes('noc');
  const canEdit =
    user?.role === 'Super Admin' ||
    (user?.role === 'Manager' && isInNoc);
  const isAuthorized =
    canEdit || (user?.role === 'Employee' && isInNoc);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getRosterDutyShifts();
      if (res.status === 200) {
        setShifts(res.data || []);
        setFilteredShifts(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchShifts();
  }, [isAuthorized]);

  useEffect(() => {
    const filtered = shifts.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.shiftCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredShifts(filtered);
    setCurrentPage(1);
  }, [searchQuery, shifts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'isOffDay' && checked) {
      setFormData((prev) => ({ ...prev, officeStartTime: '', officeEndTime: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: formData.name.trim(),
        shiftCode: formData.shiftCode.trim() || formData.name.replace(/\s+/g, '-').toLowerCase(),
        officeStartTime: formData.isOffDay ? '' : formData.officeStartTime,
        officeEndTime: formData.isOffDay ? '' : formData.officeEndTime,
        isOffDay: formData.isOffDay,
      };
      if (editingShift) {
        await updateRosterDutyShift(editingShift._id, payload);
        setSuccess('Shift updated successfully!');
      } else {
        await createRosterDutyShift(payload);
        setSuccess('Shift created successfully!');
      }
      closeModal();
      await fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save shift.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
    setFormData(defaultFormData());
    setError('');
  };

  const openCreateModal = () => {
    setEditingShift(null);
    setFormData(defaultFormData());
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name || '',
      shiftCode: shift.shiftCode || '',
      officeStartTime: shift.officeStartTime || '',
      officeEndTime: shift.officeEndTime || '',
      isOffDay: !!shift.isOffDay,
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (shift) => {
    if (!window.confirm(`Delete shift "${shift.name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteRosterDutyShift(shift._id);
      setSuccess('Shift deleted successfully.');
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete shift.');
    }
  };

  const formatTime = (t) => {
    if (!t) return '-';
    const [h, m] = (t || '00:00').split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const indexOfLast = currentPage * shiftsPerPage;
  const indexOfFirst = indexOfLast - shiftsPerPage;
  const currentShifts = filteredShifts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredShifts.length / shiftsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (!isAuthorized) {
    return (
      <div className="company-container">
        <p className="company-message company-error">
          Access denied. Super Admin, NOC Manager, or NOC Employee can access.
        </p>
      </div>
    );
  }

  return (
    <div className="company-container">
      <div className="company-header company-header--main">
        <h2 className="company-page-title">Shift Definitions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            to="/shift-management/roster-duty/schedule"
            className="company-button company-button--secondary"
          >
            Employee Schedule
          </Link>
          {canEdit && (
            <button
              type="button"
              className="company-button company-button--create"
              onClick={openCreateModal}
            >
              Create Shift
            </button>
          )}
        </div>
      </div>

      {success && (
        <p className="company-message company-success company-message--inline">{success}</p>
      )}

      <div className="company-header">
        <h3 className="company-section-title">Time Schedule</h3>
        <div className="company-controls">
          <input
            type="text"
            placeholder="Search by shift name or code"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input company-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="company-message">Loading shifts...</div>
      ) : filteredShifts.length === 0 ? (
        <div className="company-message">
          {canEdit ? 'No shifts found. Click Create Shift to add your first shift.' : 'No shifts found.'}
        </div>
      ) : (
        <>
          <div className="company-table-container">
            <table className="company-table">
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Code</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Off Day</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentShifts.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name || '-'}</td>
                    <td>{s.shiftCode || '-'}</td>
                    <td>{formatTime(s.officeStartTime)}</td>
                    <td>{formatTime(s.officeEndTime)}</td>
                    <td>{s.isOffDay ? 'Yes' : 'No'}</td>
                    {canEdit && (
                      <td>
                        <button
                          type="button"
                          className="company-button company-button--small"
                          onClick={() => openEditModal(s)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="company-button company-button--danger company-button--small"
                          onClick={() => handleDelete(s)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredShifts.length > shiftsPerPage && (
            <div className="company-pagination pagination-controls">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="company-modal-backdrop" onClick={closeModal} aria-hidden="true">
          <div className="company-modal company-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="company-modal-header">
              <h3 className="company-modal-title">
                {editingShift ? 'Edit Shift' : 'Create Shift'}
              </h3>
              <button
                type="button"
                className="company-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="company-form company-form--modal">
              <div className="form-group">
                <label htmlFor="shift-name">Shift Name *</label>
                <input
                  type="text"
                  id="shift-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Morning, Off-Day"
                  className="company-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="shift-code">Shift Code</label>
                <input
                  type="text"
                  id="shift-code"
                  name="shiftCode"
                  value={formData.shiftCode}
                  onChange={handleChange}
                  placeholder="e.g., MOR"
                  className="company-input"
                />
              </div>

              <h4 className="company-form-section">Schedule Times</h4>
              <p className="company-form-hint">
                Leave times empty for Off Day. Start and End times are optional when Off Day is checked.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="officeStartTime">Start Time {!formData.isOffDay && '*'}</label>
                  <input
                    type="time"
                    id="officeStartTime"
                    name="officeStartTime"
                    value={formData.officeStartTime}
                    onChange={handleChange}
                    disabled={formData.isOffDay}
                    required={!formData.isOffDay}
                    className="company-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="officeEndTime">End Time {!formData.isOffDay && '*'}</label>
                  <input
                    type="time"
                    id="officeEndTime"
                    name="officeEndTime"
                    value={formData.officeEndTime}
                    onChange={handleChange}
                    disabled={formData.isOffDay}
                    required={!formData.isOffDay}
                    className="company-input"
                  />
                </div>
              </div>

              <div className="form-group form-group--row">
                <input
                  type="checkbox"
                  id="isOffDay"
                  name="isOffDay"
                  checked={formData.isOffDay}
                  onChange={handleChange}
                  className="company-checkbox"
                />
                <label htmlFor="isOffDay" className="form-group--row-label">
                  Off Day (no times)
                </label>
              </div>

              {error && <p className="company-message company-error">{error}</p>}
              <div className="company-modal-actions">
                <button type="button" className="company-button company-button--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="company-button">
                  {editingShift ? 'Update Shift' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftDefinitionsPage;
