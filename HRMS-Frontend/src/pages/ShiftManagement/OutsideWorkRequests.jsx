import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { submitOutsideWorkRequest, updateOutsideWorkRequestStatus, getOutsideWorkRequests, listShifts, getAssignedShiftForDate } from '../../api/shiftManagement';
import '../../styles/OutsideWork.css';

const OutsideWorkRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        officeShiftId: '',
        reason: ''
    });
    const [assignedShift, setAssignedShift] = useState(null);

    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'Manager', 'Employee'].includes(user?.role);

    const fetchOutsideWorkRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await getOutsideWorkRequests();
            // Handle both response formats: { success: true, data: [...] } or just array
            const requestsData = response.data?.data || response.data || [];
            setRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch (err) {
            setError('Failed to fetch Outside Work requests');
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
            fetchOutsideWorkRequests();
            fetchShifts();
        }
    }, [isAuthorized]);

    const handleFormChange = async (e) => {
        const { name, value } = e.target;
        
        // When date changes, fetch the assigned shift and auto-fill times
        if (name === 'date' && value) {
            try {
                const response = await getAssignedShiftForDate(value);
                if (response.data?.success && response.data?.data?.shift) {
                    const shift = response.data.data.shift;
                    setAssignedShift(shift);
                    // Auto-fill shift ID (times will be sent from shift data on submit)
                    setFormData(prev => ({
                        ...prev,
                        date: value,
                        officeShiftId: shift._id
                    }));
                    setError('');
                } else {
                    setAssignedShift(null);
                    setError('No shift assigned for this date. Please select a date with an assigned shift.');
                    setFormData(prev => ({
                        ...prev,
                        date: value,
                        officeShiftId: ''
                    }));
                }
            } catch (err) {
                console.error('Error fetching assigned shift:', err);
                setAssignedShift(null);
                if (err.response?.data?.message) {
                    setError(err.response.data.message);
                }
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setLoading(true);

            if (!formData.date || !assignedShift) {
                setError('Please select a date with an assigned shift');
                setLoading(false);
                return;
            }

            // Use shift times for outTime and expectedReturnTime
            const submitData = {
                ...formData,
                outTime: assignedShift.officeStartTime,
                expectedReturnTime: assignedShift.officeEndTime
            };

            const response = await submitOutsideWorkRequest(submitData);

            if (response.status === 201) {
                setSuccess('Outside Work request submitted successfully!');
                setFormData({
                    date: '',
                    officeShiftId: '',
                    reason: ''
                });
                setAssignedShift(null);
                setShowForm(false);
                fetchOutsideWorkRequests();
            }
        } catch (err) {
            console.error('Error submitting Outside Work request:', err);
            setError(err.response?.data?.message || 'Failed to submit Outside Work request');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            setLoading(true);
            const response = await updateOutsideWorkRequestStatus(id, status.toLowerCase());
            if (response.status === 200) {
                fetchOutsideWorkRequests();
                setSuccess(`Request ${status.toLowerCase()} successfully`);
            }
        } catch (err) {
            console.error('Error updating Outside Work request:', err);
            setError(err.response?.data?.message || 'Failed to update request status');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthorized) {
        return <div className="outside-work-message outside-work-error">Access Denied</div>;
    }

    return (
        <div className="outside-work-container">
            <h3 className="outside-work-title">Outside Work Requests</h3>

            <button
                className="outside-work-button submit-button"
                onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) {
                        // Reset form when closing
                        setFormData({
                    date: '',
                    officeShiftId: '',
                    reason: ''
                });
                        setAssignedShift(null);
                        setError('');
                        setSuccess('');
                    }
                }}
                disabled={loading}
            >
                {showForm ? 'Cancel' : 'Submit Outside Work Request'}
            </button>

            {showForm && (
                <form onSubmit={handleFormSubmit} className="outside-work-form">
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
                            <div className="form-group" style={{ marginTop: '10px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
                                <strong style={{ display: 'block', marginBottom: '10px', color: '#fff' }}>Assigned Shift Information:</strong>
                                <div style={{ color: '#ccc', lineHeight: '1.8' }}>
                                    <div><strong>Shift Name:</strong> {assignedShift.name} ({assignedShift.shiftCode})</div>
                                    <div><strong>Office Time:</strong> {assignedShift.officeStartTime} - {assignedShift.officeEndTime}</div>
                                    {assignedShift.wfhStartTime && assignedShift.wfhEndTime && (
                                        <div><strong>WFH Time:</strong> {assignedShift.wfhStartTime} - {assignedShift.wfhEndTime}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="reason">Reason: <span style={{ color: '#999', fontSize: '0.9em' }}>(Optional)</span></label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleFormChange}
                            placeholder="Enter reason for outside work (optional)"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="outside-work-button submit-button">
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}

            {error && <p className="outside-work-message outside-work-error">{error}</p>}
            {success && <p className="outside-work-message outside-work-success">{success}</p>}

            {loading && !showForm ? (
                <p>Loading requests...</p>
            ) : requests.length > 0 ? (
                <table className="outside-work-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Out Time</th>
                            <th>Return Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req._id}>
                                <td>{req.employee?.fullName || 'N/A'}</td>
                                <td>{new Date(req.date).toLocaleDateString()}</td>
                                <td>{req.officeShift?.name || 'N/A'}</td>
                                <td>{req.outTime}</td>
                                <td>{req.expectedReturnTime}</td>
                                <td>{req.reason}</td>
                                <td>{req.requestStatus || 'pending'}</td>
                                <td>
                                    {['HR Manager', 'Super Admin', 'Company Admin', 'Manager'].includes(user?.role) && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'approved')}
                                                className="outside-work-button approve-button"
                                                disabled={loading || req.requestStatus !== 'pending'}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'rejected')}
                                                className="outside-work-button deny-button"
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
                <p className="no-requests">No Outside Work requests found</p>
            )}
        </div>
    );
};

export default OutsideWorkRequests;