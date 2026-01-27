import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { createShift, listShifts, updateShift } from '../../api/shiftManagement';
import '../../styles/Shift.css';

const ShiftManagement = () => {
    const { user } = useContext(AuthContext);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        shiftCode: '',
        officeStartTime: '',
        officeEndTime: '',
        wfhStartTime: '',
        wfhEndTime: '',
        isFingerprintRequired: false,
        isApprovalRequired: false,
        isOffDay: false
    });

    const canEdit = ['HR Manager', 'Super Admin', 'Company Admin'].includes(user?.role);
    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'Manager', 'Employee'].includes(user?.role);

    // Fetch shifts
    const fetchShifts = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await listShifts();
            if (response.status === 200) {
                setShifts(response.data || []);
            }
        } catch (err) {
            console.error('Error fetching shifts:', err);
            setError(err.response?.data?.message || 'Failed to fetch shifts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!canEdit) {
            setError('You are not authorized to perform this action.');
            return;
        }

        try {
            setLoading(true);
            let response;
            if (editingId) {
                response = await updateShift(editingId, formData);
                if (response.status === 200) {
                    setSuccess('Shift updated successfully!');
                }
            } else {
                response = await createShift(formData);
                if (response.status === 201) {
                    setSuccess('Shift created successfully!');
                }
            }

            setFormData({
                name: '',
                shiftCode: '',
                officeStartTime: '',
                officeEndTime: '',
                wfhStartTime: '',
                wfhEndTime: '',
                isFingerprintRequired: false,
                isApprovalRequired: false,
                isOffDay: false
            });
            setEditingId(null);
            setShowForm(false);
            fetchShifts();
        } catch (err) {
            console.error('Error saving shift:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save shift');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (shift) => {
        setFormData({
            name: shift.name,
            shiftCode: shift.shiftCode,
            officeStartTime: shift.officeStartTime,
            officeEndTime: shift.officeEndTime,
            wfhStartTime: shift.wfhStartTime || '',
            wfhEndTime: shift.wfhEndTime || '',
            isFingerprintRequired: shift.isFingerprintRequired || false,
            isApprovalRequired: shift.isApprovalRequired || false,
            isOffDay: shift.isOffDay || false
        });
        setEditingId(shift._id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            shiftCode: '',
            officeStartTime: '',
            officeEndTime: '',
            wfhStartTime: '',
            wfhEndTime: '',
            isFingerprintRequired: false,
            isApprovalRequired: false,
            isOffDay: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (!isAuthorized) {
        return <div className="shift-message shift-error">Access Denied</div>;
    }

    return (
        <div className="shift-container">
            <h3 className="shift-title">Manage Shifts</h3>

            {canEdit && (
                <button
                    className="shift-button submit-button"
                    onClick={() => setShowForm(!showForm)}
                    disabled={loading}
                >
                    {showForm ? 'Cancel' : 'Create New Shift'}
                </button>
            )}

            {canEdit && showForm && (
                <form onSubmit={handleFormSubmit} className="shift-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Shift Name: *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="e.g., Morning Shift"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="shiftCode">Shift Code: *</label>
                            <input
                                type="text"
                                id="shiftCode"
                                name="shiftCode"
                                value={formData.shiftCode}
                                onChange={handleFormChange}
                                placeholder="e.g., MS001"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="officeStartTime">Office Start Time: *</label>
                            <input
                                type="time"
                                id="officeStartTime"
                                name="officeStartTime"
                                value={formData.officeStartTime}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="officeEndTime">Office End Time: *</label>
                            <input
                                type="time"
                                id="officeEndTime"
                                name="officeEndTime"
                                value={formData.officeEndTime}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="wfhStartTime">WFH Start Time:</label>
                            <input
                                type="time"
                                id="wfhStartTime"
                                name="wfhStartTime"
                                value={formData.wfhStartTime}
                                onChange={handleFormChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="wfhEndTime">WFH End Time:</label>
                            <input
                                type="time"
                                id="wfhEndTime"
                                name="wfhEndTime"
                                value={formData.wfhEndTime}
                                onChange={handleFormChange}
                            />
                        </div>
                    </div>

                    <div className="form-row checkbox-row">
                        <div className="form-group checkbox">
                            <input
                                type="checkbox"
                                id="isFingerprintRequired"
                                name="isFingerprintRequired"
                                checked={formData.isFingerprintRequired}
                                onChange={handleFormChange}
                            />
                            <label htmlFor="isFingerprintRequired">Fingerprint Required</label>
                        </div>
                        <div className="form-group checkbox">
                            <input
                                type="checkbox"
                                id="isApprovalRequired"
                                name="isApprovalRequired"
                                checked={formData.isApprovalRequired}
                                onChange={handleFormChange}
                            />
                            <label htmlFor="isApprovalRequired">Approval Required</label>
                        </div>
                        <div className="form-group checkbox">
                            <input
                                type="checkbox"
                                id="isOffDay"
                                name="isOffDay"
                                checked={formData.isOffDay}
                                onChange={handleFormChange}
                            />
                            <label htmlFor="isOffDay">Off Day</label>
                        </div>
                    </div>

                    {error && <p className="shift-message shift-error">{error}</p>}
                    {success && <p className="shift-message shift-success">{success}</p>}

                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="shift-button submit-button">
                            {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Shift' : 'Create Shift')}
                        </button>
                        <button type="button" onClick={handleCancel} className="shift-button cancel-button">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {error && !showForm && <p className="shift-message shift-error">{error}</p>}
            {success && !showForm && <p className="shift-message shift-success">{success}</p>}

            <div className="shift-list">
                <h4 className="shift-list-title">Existing Shifts</h4>
                {loading ? (
                    <p>Loading shifts...</p>
                ) : shifts.length > 0 ? (
                    <table className="shift-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Office Hours</th>
                                <th>WFH Hours</th>
                                <th>Fingerprint</th>
                                <th>Approval</th>
                                <th>Off Day</th>
                                {canEdit && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.map((shift) => (
                                <tr key={shift._id}>
                                    <td>{shift.name}</td>
                                    <td>{shift.shiftCode}</td>
                                    <td>{shift.officeStartTime} - {shift.officeEndTime}</td>
                                    <td>{shift.wfhStartTime ? `${shift.wfhStartTime} - ${shift.wfhEndTime}` : '-'}</td>
                                    <td>{shift.isFingerprintRequired ? '✓' : '✗'}</td>
                                    <td>{shift.isApprovalRequired ? '✓' : '✗'}</td>
                                    <td>{shift.isOffDay ? '✓' : '✗'}</td>
                                    {canEdit && (
                                    <td>
                                        <button
                                            onClick={() => handleEdit(shift)}
                                            className="shift-button edit-button"
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-shifts">No shifts found. Create your first shift!</p>
                )}
            </div>
        </div>
    );
};

export default ShiftManagement;
