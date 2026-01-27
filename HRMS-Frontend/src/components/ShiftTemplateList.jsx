import React, { useState, useEffect, useCallback } from 'react';
import { getShiftTemplates, deleteShiftTemplate } from '../api/shiftTemplate';
import ShiftTemplateForm from './ShiftTemplateForm';
import toast from 'react-hot-toast';
import '../styles/Employee.css';

const ShiftTemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getShiftTemplates();
      setTemplates(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch shift templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteShiftTemplate(id);
        toast.success('Template deleted successfully.');
        fetchTemplates();
      } catch (error) {
        toast.error('Failed to delete template.');
      }
    }
  };

  const handleSave = () => {
    setIsModalOpen(false);
    fetchTemplates();
  };

  if (isLoading) {
    return <div className="employee-message">Loading...</div>;
  }

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h2 className="employee-title">Shift Roster Templates</h2>
        <button onClick={handleCreate} className="employee-button">
          Create Template
        </button>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Label</th>
              <th>On-Site Hours</th>
              <th>Remote Hours</th>
              <th>On-Site Shift</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template._id}>
                <td>{template.code}</td>
                <td>{template.label}</td>
                <td>{template.onSiteHours}</td>
                <td>{template.remoteHours}</td>
                <td>{template.onSiteShiftId ? `${template.onSiteShiftId.name} (${template.onSiteShiftId.startTime} - ${template.onSiteShiftId.endTime})` : 'N/A'}</td>
                <td>
                  <button onClick={() => handleEdit(template)} className="employee-button" style={{ marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDelete(template._id)} className="employee-button" style={{ backgroundColor: '#dc3545' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ShiftTemplateForm
          template={selectedTemplate}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ShiftTemplateList;
