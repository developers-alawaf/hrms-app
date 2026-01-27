import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { submitWFHRequest, updateWFHRequestStatus, getWFHRequests, listShifts, getAssignedShiftForDate } from '../../api/shiftManagement';
import '../../styles/WFH.css';

const WFHRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        wfhShiftId: ''
    });
    const [assignedShift, setAssignedShift] = useState(null);

    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'Manager', 'Employee'].includes(user?.role);

    const fetchWFHRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await getWFHRequests();
            // Handle both response formats: { success: true, data: [...] } or just array
            const requestsData = response.data?.data || response.data || [];
            setRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch (err) {
            setError('Failed to fetch WFH requests');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchShifts = async () => {
        try {
            const response = await listShifts();
            setShifts(response.data);
        } catch (err) {
            console.error('Failed to fetch shifts:', err);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchWFHRequests();
            fetchShifts();
        }
    }, [isAuthorized]);

    const handleFormChange = async (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // When date changes, fetch the assigned shift
        if (name === 'date' && value) {
            try {
                const response = await getAssignedShiftForDate(value);
                if (response.data?.success && response.data?.data?.shift) {
                    setAssignedShift(response.data.data.shift);
                    // Auto-select the WFH shift if available
                    if (response.data.data.shift.wfhStartTime && response.data.data.shift.wfhEndTime) {
                        setFormData(prev => ({ ...prev, wfhShiftId: response.data.data.shift._id }));
                    }
                } else {
                    setAssignedShift(null);
                    setFormData(prev => ({ ...prev, wfhShiftId: '' }));
                    setError('No shift assigned for this date. Please select a date with an assigned shift.');
                }
            } catch (err) {
                console.error('Error fetching assigned shift:', err);
                setAssignedShift(null);
                if (err.response?.data?.message) {
                    setError(err.response.data.message);
                }
            }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setLoading(true);

            if (!formData.date) {
                setError('Please select a date');
                setLoading(false);
                return;
            }

            const response = await submitWFHRequest({
                date: formData.date,
                wfhShiftId: formData.wfhShiftId || null
            });

            if (response.status === 201) {
                setSuccess('WFH request submitted successfully!');
                setFormData({ date: '', wfhShiftId: '' });
                setAssignedShift(null);
                setShowForm(false);
                fetchWFHRequests();
            }
        } catch (err) {
            console.error('Error submitting WFH request:', err);
            setError(err.response?.data?.message || 'Failed to submit WFH request');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            setLoading(true);
            const response = await updateWFHRequestStatus(id, status.toLowerCase());
            if (response.status === 200) {
                fetchWFHRequests();
                setSuccess(`Request ${status.toLowerCase()} successfully`);
            }
        } catch (err) {
            console.error('Error updating WFH request:', err);
            setError(err.response?.data?.message || 'Failed to update request status');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthorized) {
        return <div className="wfh-message wfh-error">Access Denied</div>;
    }

    return (
        <div className="wfh-container">
            <h3 className="wfh-title">Work From Home Requests</h3>

            <button
                className="wfh-button submit-button"
                onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) {
                        // Reset form when closing
                        setFormData({ date: '', wfhShiftId: '' });
                        setAssignedShift(null);
                        setError('');
                        setSuccess('');
                    }
                }}
                disabled={loading}
            >
                {showForm ? 'Cancel' : 'Submit WFH Request'}
            </button>

            {showForm && (
                <form onSubmit={handleFormSubmit} className="wfh-form">
                    <div className="form-group">
                        <label htmlFor="date">Date:</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleFormChange}
                            required
                        />
                        {assignedShift && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
                                <strong>Assigned Shift:</strong> {assignedShift.name} ({assignedShift.shiftCode})
                                {assignedShift.wfhStartTime && assignedShift.wfhEndTime && (
                                    <div style={{ marginTop: '5px' }}>
                                        <small>WFH Time: {assignedShift.wfhStartTime} - {assignedShift.wfhEndTime}</small>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* WFH Shift selection - commented out as per requirement */}
                    {/* <div className="form-group">
                        <label htmlFor="wfhShiftId">WFH Shift:</label>
                        <select
                            id="wfhShiftId"
                            name="wfhShiftId"
                            value={formData.wfhShiftId}
                            onChange={handleFormChange}
                            disabled={!assignedShift}
                        >
                            <option value="">Select a shift (optional)</option>
                            {assignedShift && assignedShift.wfhStartTime && assignedShift.wfhEndTime && (
                                <option value={assignedShift._id}>
                                    {assignedShift.name} ({assignedShift.wfhStartTime} - {assignedShift.wfhEndTime})
                                </option>
                            )}
                            {shifts.filter(shift => shift._id !== assignedShift?._id && shift.wfhStartTime && shift.wfhEndTime).map(shift => (
                                <option key={shift._id} value={shift._id}>
                                    {shift.name} ({shift.wfhStartTime} - {shift.wfhEndTime})
                                </option>
                            ))}
                        </select>
                    </div> */}
                    <button type="submit" disabled={loading} className="wfh-button submit-button">
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}

            {error && <p className="wfh-message wfh-error">{error}</p>}
            {success && <p className="wfh-message wfh-success">{success}</p>}

            {loading && !showForm ? (
                <p>Loading requests...</p>
            ) : requests.length > 0 ? (
                <table className="wfh-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req._id}>
                                <td>{req.employee?.fullName || 'N/A'}</td>
                                <td>{new Date(req.date).toLocaleDateString()}</td>
                                <td>{req.wfhShift?.name || 'N/A'}</td>
                                <td>{req.requestStatus || 'pending'}</td>
                                <td>
                                    {['HR Manager', 'Super Admin', 'Company Admin', 'Manager'].includes(user?.role) && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'approved')}
                                                className="wfh-button approve-button"
                                                disabled={loading || req.requestStatus !== 'pending'}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'rejected')}
                                                className="wfh-button deny-button"
                                                disabled={loading || req.requestStatus !== 'pending'}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="no-requests">No WFH requests found</p>
            )}
        </div>
    );
};

export default WFHRequests;