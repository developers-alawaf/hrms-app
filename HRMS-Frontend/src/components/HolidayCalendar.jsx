import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getHolidaysForYear, setHolidaysForYear, uploadHolidayExcel } from '../api/holiday';
import moment from 'moment';
import toast from 'react-hot-toast';
import { Plus, Upload, X, Calendar } from 'lucide-react';
import '../styles/Employee.css';
import '../styles/HolidayCalendar.css';

const EMPTY_FORM = {
  startDate: moment().format('YYYY-MM-DD'),
  endDate: moment().format('YYYY-MM-DD'),
  name: '',
  type: 'national',
  applicableToAll: true,
};

const HolidayCalendar = () => {
  const { user } = useContext(AuthContext);
  const [year, setYear] = useState(moment().year());
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Excel Upload
  const [excelFile, setExcelFile] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelUploadError, setExcelUploadError] = useState('');
  const [showExcelSection, setShowExcelSection] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getHolidaysForYear(year);
      setHolidays(
        res.data.holidays.map((h) => ({
          ...h,
          startDate: moment(h.startDate).format('YYYY-MM-DD'),
          endDate: h.endDate
            ? moment(h.endDate).format('YYYY-MM-DD')
            : moment(h.startDate).format('YYYY-MM-DD'),
          type: h.type || 'national',
          applicableToAll: true,
        }))
      );
    } catch (error) {
      toast.error('Failed to fetch holidays.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const openCreateModal = () => {
    setEditingIndex(null);
    setFormData({
      ...EMPTY_FORM,
      startDate: moment().year(year).format('YYYY-MM-DD'),
      endDate: moment().year(year).format('YYYY-MM-DD'),
    });
    setShowModal(true);
  };

  const openEditModal = (index) => {
    const h = holidays[index];
    setEditingIndex(index);
    setFormData({
      startDate: h.startDate,
      endDate: h.endDate || h.startDate,
      name: h.name || '',
      type: h.type || 'national',
      applicableToAll: true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIndex(null);
    setFormData(EMPTY_FORM);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'startDate' && (!prev.endDate || prev.endDate < value)) {
        next.endDate = value;
      }
      return next;
    });
  };

  const handleSubmitHoliday = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Please enter a holiday name.');
      return;
    }
    if (!formData.startDate) {
      toast.error('Please select a start date.');
      return;
    }

    const newHoliday = {
      ...formData,
      endDate: formData.endDate || formData.startDate,
    };

    let updated;
    if (editingIndex !== null) {
      updated = holidays.map((h, i) => (i === editingIndex ? newHoliday : h));
    } else {
      updated = [...holidays, newHoliday];
    }

    const wasEdit = editingIndex !== null;
    setHolidays(updated);
    closeModal();
    saveHolidays(updated, wasEdit);
  };

  const saveHolidays = async (holidaysToSave, action = 'save') => {
    setIsLoading(true);
    try {
      await setHolidaysForYear(year, holidaysToSave);
      const messages = {
        add: 'Holiday added.',
        edit: 'Holiday updated.',
        remove: 'Holiday removed.',
        save: 'Calendar saved.',
      };
      toast.success(messages[action] || messages.save);
      fetchHolidays();
    } catch (error) {
      toast.error('Failed to save.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveHoliday = (index) => {
    if (window.confirm('Remove this holiday?')) {
      const updated = holidays.filter((_, i) => i !== index);
      setHolidays(updated);
      saveHolidays(updated, 'remove');
    }
  };

  const handleSaveAll = async () => {
    await saveHolidays(holidays, 'save');
  };

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value, 10));
  };

  const handleExcelFileChange = (e) => {
    setExcelFile(e.target.files[0]);
    setExcelUploadError('');
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setExcelUploadError('Please select an Excel file.');
      return;
    }

    setUploadingExcel(true);
    setExcelUploadError('');

    const formDataUpload = new FormData();
    formDataUpload.append('holidayFile', excelFile);

    try {
      const res = await uploadHolidayExcel(formDataUpload);
      if (res.success) {
        setExcelFile(null);
        e.target.reset();
        fetchHolidays();
        toast.success(res.message);
        setShowExcelSection(false);
      } else {
        setExcelUploadError(res.error || 'Upload failed.');
        toast.error(res.error || 'Upload failed.');
      }
    } catch (error) {
      setExcelUploadError(error.response?.data?.error || 'Upload failed.');
      toast.error(error.response?.data?.error || 'Upload failed.');
    } finally {
      setUploadingExcel(false);
    }
  };

  const canManageHolidays =
    user && ['HR Manager', 'Super Admin', 'Company Admin'].includes(user.role);

  const formatDate = (d) => (d ? moment(d).format('MMM D, YYYY') : '-');

  return (
    <div className="holiday-container">
      <div className="holiday-header">
        <div className="holiday-header-left">
          <h2 className="holiday-title">
            <Calendar size={28} strokeWidth={2} />
            Holiday Calendar
          </h2>
          <div className="holiday-year-wrap">
            <label htmlFor="year-select">Year</label>
            <select
              id="year-select"
              value={year}
              onChange={handleYearChange}
              className="holiday-select"
            >
              {Array.from({ length: 10 }, (_, i) => moment().year() - 5 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        {canManageHolidays && (
          <div className="holiday-actions">
            <button
              type="button"
              className="holiday-btn holiday-btn--primary"
              onClick={openCreateModal}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Holiday
            </button>
            <button
              type="button"
              className="holiday-btn holiday-btn--outline"
              onClick={() => setShowExcelSection(!showExcelSection)}
            >
              <Upload size={18} strokeWidth={2.5} />
              Upload Excel
            </button>
            {holidays.length > 0 && (
              <button
                type="button"
                className="holiday-btn holiday-btn--save"
                onClick={handleSaveAll}
                disabled={isLoading}
              >
                {isLoading ? 'Saving…' : 'Save All'}
              </button>
            )}
          </div>
        )}
      </div>

      {canManageHolidays && showExcelSection && (
        <div className="holiday-excel-card">
          <h3 className="holiday-excel-title">Upload via Excel</h3>
          <p className="holiday-excel-desc">
            Use columns: <strong>Date (YYYY-MM-DD)</strong>,{' '}
            <strong>End Date (optional)</strong>, <strong>Name</strong>,{' '}
            <strong>Type (national/religious, optional)</strong>. Uploading replaces existing
            holidays for the detected year.
          </p>
          <form onSubmit={handleExcelUpload} className="holiday-excel-form">
            <div className="holiday-excel-row">
              <input
                type="file"
                id="holidayFile"
                accept=".xlsx,.xls"
                onChange={handleExcelFileChange}
                className="holiday-file-input"
              />
              <button
                type="submit"
                className="holiday-btn holiday-btn--primary"
                disabled={uploadingExcel}
              >
                {uploadingExcel ? 'Uploading…' : 'Upload'}
              </button>
            </div>
            {excelUploadError && (
              <p className="holiday-error">{excelUploadError}</p>
            )}
          </form>
        </div>
      )}

      <div className="holiday-table-card">
        {isLoading ? (
          <div className="holiday-loading">Loading holidays…</div>
        ) : holidays.length === 0 ? (
          <div className="holiday-empty">
            <Calendar size={48} strokeWidth={1.5} />
            <p>No holidays for {year}</p>
            {canManageHolidays && (
              <button
                type="button"
                className="holiday-btn holiday-btn--primary"
                onClick={openCreateModal}
              >
                <Plus size={18} />
                Add First Holiday
              </button>
            )}
          </div>
        ) : (
          <div className="holiday-table-wrap">
            <table className="holiday-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Name</th>
                  <th>Type</th>
                  {canManageHolidays && <th className="holiday-th-actions">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {holidays.map((h, index) => (
                  <tr key={h._id || index}>
                    <td className="holiday-td-num">{index + 1}</td>
                    <td>{formatDate(h.startDate)}</td>
                    <td>{formatDate(h.endDate)}</td>
                    <td className="holiday-td-name">{h.name || '-'}</td>
                    <td>
                      <span
                        className={`holiday-badge holiday-badge--${h.type || 'national'}`}
                      >
                        {(h.type || 'national').charAt(0).toUpperCase() +
                          (h.type || 'national').slice(1)}
                      </span>
                    </td>
                    {canManageHolidays && (
                      <td className="holiday-td-actions">
                        <button
                          type="button"
                          className="holiday-action-btn holiday-action-btn--edit"
                          onClick={() => openEditModal(index)}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="holiday-action-btn holiday-action-btn--delete"
                          onClick={() => handleRemoveHoliday(index)}
                          title="Remove"
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
        )}
      </div>

      {showModal && (
        <div
          className="holiday-modal-backdrop"
          onClick={closeModal}
          onKeyDown={(e) => e.key === 'Escape' && closeModal()}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="holiday-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="holiday-modal-title"
          >
            <div className="holiday-modal-header">
              <h3 id="holiday-modal-title" className="holiday-modal-title">
                {editingIndex !== null ? 'Edit Holiday' : 'Add Holiday'}
              </h3>
              <button
                type="button"
                className="holiday-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSubmitHoliday} className="holiday-modal-form">
              <div className="holiday-form-grid">
                <div className="holiday-form-group">
                  <label htmlFor="holiday-name">Holiday Name *</label>
                  <input
                    id="holiday-name"
                    type="text"
                    className="holiday-input"
                    placeholder="e.g. New Year's Day"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="holiday-form-group">
                  <label htmlFor="holiday-type">Type</label>
                  <select
                    id="holiday-type"
                    className="holiday-input holiday-select"
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                  >
                    <option value="national">National</option>
                    <option value="religious">Religious</option>
                  </select>
                </div>
                <div className="holiday-form-group">
                  <label htmlFor="holiday-start">Start Date *</label>
                  <input
                    id="holiday-start"
                    type="date"
                    className="holiday-input"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="holiday-form-group">
                  <label htmlFor="holiday-end">End Date</label>
                  <input
                    id="holiday-end"
                    type="date"
                    className="holiday-input"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="holiday-modal-actions">
                <button
                  type="button"
                  className="holiday-btn holiday-btn--secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="holiday-btn holiday-btn--primary">
                  {editingIndex !== null ? 'Update' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;
