import { useState, useEffect } from 'react';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  getScheduleOverrides,
  createScheduleOverride,
  deleteScheduleOverride,
} from '../api/company';
import '../styles/CompanyCreate.css';

const defaultFormData = () => ({
  name: '',
  abbreviation: '',
  employeeIdBase: '',
  isActive: true,
  defaultOfficeStartTime: '09:00',
  defaultOfficeEndTime: '18:00',
  gracePeriod: 0,
});

const defaultOverrideForm = () => ({
  name: '',
  effectiveFrom: '',
  effectiveTo: '',
  officeStartTime: '09:00',
  officeEndTime: '18:00',
  gracePeriod: 0,
});

const CompanyCreate = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(defaultFormData());
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [overrides, setOverrides] = useState([]);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideForm, setOverrideForm] = useState(defaultOverrideForm());
  const [savingOverride, setSavingOverride] = useState(false);
  const companiesPerPage = 10;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getCompanies(token);
      if (data.success) {
        setCompanies(data.data);
        setFilteredCompanies(data.data);
      } else {
        setError(data.error || 'Failed to fetch companies');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [searchQuery, companies]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'employeeIdBase' ? (value === '' ? '' : parseInt(value, 10)) : (name === 'gracePeriod' ? parseInt(value, 10) || 0 : value)),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        defaultOfficeStartTime: formData.defaultOfficeStartTime || '09:00',
        defaultOfficeEndTime: formData.defaultOfficeEndTime || '18:00',
        gracePeriod: Number(formData.gracePeriod) || 0,
      };
      if (editingCompany) {
        const data = await updateCompany(editingCompany._id, payload, token);
        if (data.success) {
          setSuccess('Company updated successfully!');
          closeModal();
          await fetchCompanies();
        } else {
          setError(data.error || 'Something went wrong');
        }
      } else {
        const data = await createCompany(payload, token);
        if (data.success) {
          setSuccess('Company created successfully!');
          setFormData(defaultFormData());
          setShowCreateModal(false);
          setError('');
          await fetchCompanies();
        } else {
          setError(data.error || 'Something went wrong');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      abbreviation: company.abbreviation,
      employeeIdBase: company.employeeIdBase ?? '',
      isActive: company.isActive !== false,
      defaultOfficeStartTime: company.defaultOfficeStartTime || '09:00',
      defaultOfficeEndTime: company.defaultOfficeEndTime || '18:00',
      gracePeriod: company.gracePeriod ?? 0,
    });
    setShowCreateModal(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await getScheduleOverrides(company._id, token);
      setOverrides(res.success ? res.data : []);
    } catch {
      setOverrides([]);
    }
    setShowOverrideForm(false);
    setOverrideForm(defaultOverrideForm());
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCompany(null);
    setError('');
    setFormData(defaultFormData());
    setOverrides([]);
    setShowOverrideForm(false);
    setOverrideForm(defaultOverrideForm());
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData(defaultFormData());
    setOverrides([]);
    setShowOverrideForm(false);
    setError('');
    setSuccess('');
    setShowCreateModal(true);
  };

  const handleOverrideChange = (e) => {
    const { name, value } = e.target;
    setOverrideForm({ ...overrideForm, [name]: value });
  };

  const padTime = (t) => {
    if (!t || typeof t !== 'string') return t;
    const [h, m] = t.split(':');
    if (!h || m === undefined) return t;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!overrideForm.name || !overrideForm.effectiveFrom || !overrideForm.effectiveTo || !overrideForm.officeStartTime || !overrideForm.officeEndTime) {
      setError('All override fields are required');
      return;
    }
    if (new Date(overrideForm.effectiveFrom) > new Date(overrideForm.effectiveTo)) {
      setError('Start date must be before end date');
      return;
    }
    setSavingOverride(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const overrideData = {
        name: overrideForm.name.trim(),
        effectiveFrom: overrideForm.effectiveFrom,
        effectiveTo: overrideForm.effectiveTo,
        officeStartTime: padTime(overrideForm.officeStartTime) || '09:00',
        officeEndTime: padTime(overrideForm.officeEndTime) || '18:00',
        gracePeriod: Number(overrideForm.gracePeriod) || 0,
      };
      const data = await createScheduleOverride(editingCompany._id, overrideData, token);
      if (data.success) {
        setOverrides([...overrides, data.data]);
        setOverrideForm(defaultOverrideForm());
        setShowOverrideForm(false);
      } else {
        setError(data.error || 'Failed to add override');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.error || err.message || 'Failed to add override';
      setError(msg);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    if (!window.confirm('Delete this schedule override?')) return;
    try {
      const token = localStorage.getItem('token');
      const data = await deleteScheduleOverride(overrideId, token);
      if (data.success) {
        setOverrides(overrides.filter((o) => o._id !== overrideId));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete');
    }
  };

  const to12Hour = (time) => {
    const [h, m] = (time || '09:00').split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const formatSchedule = (c) => {
    const start = c.defaultOfficeStartTime || '09:00';
    const end = c.defaultOfficeEndTime || '18:00';
    return `${to12Hour(start)} - ${to12Hour(end)}`;
  };

  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="company-container">
      <div className="company-header company-header--main">
        <h2 className="company-page-title">Companies</h2>
        <button
          type="button"
          className="company-button company-button--create"
          onClick={openCreateModal}
        >
          Create Company
        </button>
      </div>

      {success && (
        <p className="company-message company-success company-message--inline">{success}</p>
      )}

      <div className="company-header">
        <h3 className="company-section-title">Company List</h3>
        <div className="company-controls">
          <input
            type="text"
            placeholder="Search by company name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input company-search"
          />
        </div>
      </div>

      {loadingCompanies ? (
        <div className="company-message">Loading companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="company-message">No companies found.</div>
      ) : (
        <>
          <div className="company-table-container">
            <table className="company-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Abbreviation</th>
                  <th>Office Hours</th>
                  <th>Company ID Base</th>
                  <th>Active</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCompanies.map((company) => (
                  <tr key={company._id}>
                    <td>{company.name || '-'}</td>
                    <td>{company.abbreviation || '-'}</td>

                    <td>{formatSchedule(company)}</td>
                    
                    <td>{company.employeeIdBase ?? '-'}</td>
                    <td>{company.isActive ? 'Yes' : 'No'}</td>
                    <td>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <button
                        type="button"
                        className="company-button company-button--small"
                        onClick={() => openEditModal(company)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length > companiesPerPage && (
            <div className="company-pagination pagination-controls">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">Page {currentPage} of {totalPages}</span>
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

      {showCreateModal && (
        <div className="company-modal-backdrop" onClick={closeModal} aria-hidden="true">
          <div className="company-modal company-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="company-modal-header">
              <h3 className="company-modal-title">
                {editingCompany ? 'Edit Company' : 'Create Company'}
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
                <label htmlFor="name">Company Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="company-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="abbreviation">Abbreviation</label>
                <input
                  type="text"
                  id="abbreviation"
                  name="abbreviation"
                  value={formData.abbreviation}
                  onChange={handleChange}
                  className="company-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="employeeIdBase">Company ID Base</label>
                <input
                  type="number"
                  id="employeeIdBase"
                  name="employeeIdBase"
                  value={formData.employeeIdBase}
                  onChange={handleChange}
                  className="company-input"
                  required
                />
              </div>

              <h4 className="company-form-section">Default Office Hours</h4>
              <p className="company-form-hint">Used for late/overtime calculation. Example: Alawaf 10:00–18:00, Kloud 09:00–18:00</p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="defaultOfficeStartTime">Office Start</label>
                  <input
                    type="time"
                    id="defaultOfficeStartTime"
                    name="defaultOfficeStartTime"
                    value={formData.defaultOfficeStartTime || '09:00'}
                    onChange={handleChange}
                    className="company-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="defaultOfficeEndTime">Office End</label>
                  <input
                    type="time"
                    id="defaultOfficeEndTime"
                    name="defaultOfficeEndTime"
                    value={formData.defaultOfficeEndTime || '18:00'}
                    onChange={handleChange}
                    className="company-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gracePeriod">Grace Period (min)</label>
                  <input
                    type="number"
                    id="gracePeriod"
                    name="gracePeriod"
                    min={0}
                    value={formData.gracePeriod ?? 0}
                    onChange={handleChange}
                    className="company-input"
                  />
                </div>
              </div>

              <div className="form-group form-group--row">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="company-checkbox"
                />
                <label htmlFor="isActive" className="form-group--row-label">Active</label>
              </div>

              {editingCompany && (
                <div className="company-overrides-block">
                  <h4 className="company-form-section">Special Schedules (e.g. Ramadan)</h4>
                  <p className="company-form-hint">Override office hours for specific date ranges. Stored in database. Example: 20 Feb 2026 – 10 Mar 2026, 9 AM–3 PM (6 hours). Late/overtime/shortfall use these hours for matching dates.</p>
                  {overrides.length > 0 && (
                    <ul className="company-override-list">
                      {overrides.map((o) => {
                        const [sh, sm] = (o.officeStartTime || '09:00').split(':').map(Number);
                        const [eh, em] = (o.officeEndTime || '18:00').split(':').map(Number);
                        const startMins = sh * 60 + sm;
                        let endMins = eh * 60 + em;
                        if (endMins <= startMins) endMins += 24 * 60;
                        const hours = Math.floor((endMins - startMins) / 60);
                        const mins = (endMins - startMins) % 60;
                        const hoursLabel = mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
                        return (
                        <li key={o._id} className="company-override-item">
                          <span>{o.name}: {new Date(o.effectiveFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(o.effectiveTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="company-override-times">{o.officeStartTime} – {o.officeEndTime} <span className="company-override-hours">({hoursLabel})</span></span>
                          <button
                            type="button"
                            className="company-button company-button--danger company-button--small"
                            onClick={() => handleDeleteOverride(o._id)}
                          >
                            Delete
                          </button>
                        </li>
                      );})}
                    </ul>
                  )}
                  {showOverrideForm ? (
                    <div className="company-override-form" role="form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            name="name"
                            value={overrideForm.name}
                            onChange={handleOverrideChange}
                            placeholder="e.g. Ramadan 2026"
                            className="company-input"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>From</label>
                          <input
                            type="date"
                            name="effectiveFrom"
                            value={overrideForm.effectiveFrom}
                            onChange={handleOverrideChange}
                            className="company-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>To</label>
                          <input
                            type="date"
                            name="effectiveTo"
                            value={overrideForm.effectiveTo}
                            onChange={handleOverrideChange}
                            className="company-input"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Start</label>
                          <input
                            type="time"
                            name="officeStartTime"
                            value={overrideForm.officeStartTime}
                            onChange={handleOverrideChange}
                            className="company-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>End</label>
                          <input
                            type="time"
                            name="officeEndTime"
                            value={overrideForm.officeEndTime}
                            onChange={handleOverrideChange}
                            className="company-input"
                          />
                        </div>
                      </div>
                      <div className="company-override-actions">
                        <button type="button" className="company-button" disabled={savingOverride} onClick={handleAddOverride}>
                          {savingOverride ? 'Adding...' : 'Add Override'}
                        </button>
                        <button type="button" className="company-button company-button--secondary" onClick={() => { setShowOverrideForm(false); setOverrideForm(defaultOverrideForm()); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="company-button company-button--secondary company-add-override-btn"
                      onClick={() => setShowOverrideForm(true)}
                    >
                      + Add Special Schedule
                    </button>
                  )}
                </div>
              )}

              {error && <p className="company-message company-error">{error}</p>}
              <div className="company-modal-actions">
                <button type="button" className="company-button company-button--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="company-button" disabled={loading}>
                  {loading ? (editingCompany ? 'Updating...' : 'Creating...') : (editingCompany ? 'Update Company' : 'Create Company')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCreate;
