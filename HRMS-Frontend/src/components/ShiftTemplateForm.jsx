import React, { useState, useEffect } from 'react';
import { createShiftTemplate, updateShiftTemplate } from '../api/shiftTemplate';
import { getAllShifts } from '../api/shift';
import toast from 'react-hot-toast';
import '../styles/Employee.css';

const ShiftTemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    onSiteHours: 0,
    remoteHours: 0,
    onSiteShiftId: '',
    description: '',
    isOff: false,
  });
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    if (template) {
      setFormData({
        code: template.code || '',
        label: template.label || '',
        onSiteHours: template.onSiteHours || 0,
        remoteHours: template.remoteHours || 0,
        onSiteShiftId: template.onSiteShiftId?._id || '',
        description: template.description || '',
        isOff: template.isOff || false,
      });
    }
  }, [template]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await getAllShifts();
        // The shift API returns response.data directly, but template API returns response.data.data
        setShifts(res.data.data || res.data); 
      } catch (error) {
        toast.error('Failed to fetch on-site shifts.');
      }
    };
    fetchShifts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saveData = { ...formData };
      if (!saveData.onSiteShiftId) {
        delete saveData.onSiteShiftId; // Don't send empty string
      }

      if (template) {
        await updateShiftTemplate(template._id, saveData);
        toast.success('Shift template updated!');
      } else {
        await createShiftTemplate(saveData);
        toast.success('Shift template created!');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save template.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="employee-modal-content">
        <h2 className="modal-title">{template ? 'Edit' : 'Create'} Shift Template</h2>
        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-grid two-columns">
            <div className="form-group">
              <label>Code (e.g., M, E, O)</label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} className="employee-input" required />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input type="text" name="label" value={formData.label} onChange={handleChange} className="employee-input" required />
            </div>
            <div className="form-group">
              <label>On-Site Hours</label>
              <input type="number" name="onSiteHours" value={formData.onSiteHours} onChange={handleChange} className="employee-input" />
            </div>
            <div className="form-group">
              <label>Remote Hours</label>
              <input type="number" name="remoteHours" value={formData.remoteHours} onChange={handleChange} className="employee-input" />
            </div>
            <div className="form-group">
              <label>On-Site Shift (for ZKTeco matching)</label>
              <select name="onSiteShiftId" value={formData.onSiteShiftId} onChange={handleChange} className="employee-input">
                <option value="">None</option>
                {shifts.map(shift => (
                  <option key={shift._id} value={shift._id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Is this an Off-Day?</label>
              <input type="checkbox" name="isOff" checked={formData.isOff} onChange={handleChange} />
            </div>
            <div className="form-group full-span">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="employee-input" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="employee-button" style={{ backgroundColor: '#6c757d' }}>Cancel</button>
            <button type="submit" className="employee-button">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftTemplateForm;
