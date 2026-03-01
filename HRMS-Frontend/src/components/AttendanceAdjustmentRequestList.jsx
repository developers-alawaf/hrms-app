import React, { useState, useEffect, useContext } from 'react';
import { getAdjustmentRequests, managerReviewAdjustment, deleteAdjustmentRequest } from '../api/attendance';
import { AuthContext } from '../context/AuthContext';
import '../styles/Attendance.css';

const getExactTimeFromDatabaseString = (dateTimeString) => {
  if (!dateTimeString) {
    return '-';
  }
  const match = dateTimeString.match(/T(\d{2}:\d{2})/);
  if (match && match[1]) {
    const [hourStr, minuteStr] = match[1].split(':');
    const hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minuteStr} ${period}`;
  }
  console.warn(`Could not extract exact time from string: ${dateTimeString}`);
  return '-';
};

const shiftTimeByHours = (dateTimeString, hoursDelta) => {
  if (!dateTimeString) return dateTimeString;
  const d = new Date(dateTimeString);
  if (Number.isNaN(d.getTime())) return dateTimeString;
  const shifted = new Date(d.getTime() + hoursDelta * 60 * 60 * 1000);
  return shifted.toISOString();
};

const getDateKey = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const normalizeProposedTimes = (request) => {
  const proposedIn = request?.proposedCheckIn || null;
  const proposedOut = request?.proposedCheckOut || null;
  if (proposedIn && proposedOut) {
    const inTime = new Date(proposedIn).getTime();
    const outTime = new Date(proposedOut).getTime();
    const inDateKey = getDateKey(proposedIn);
    const outDateKey = getDateKey(proposedOut);
    if (!Number.isNaN(inTime) && !Number.isNaN(outTime) && inTime > outTime && inDateKey === outDateKey) {
      return { proposedCheckIn: proposedOut, proposedCheckOut: proposedIn };
    }
  }
  return { proposedCheckIn: proposedIn, proposedCheckOut: proposedOut };
};

const AttendanceAdjustmentRequestList = ({ refreshTrigger }) => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [managerComment, setManagerComment] = useState({});

  useEffect(() => {
    fetchRequests();
  }, [user, refreshTrigger]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await getAdjustmentRequests(token);
      if (data.success) {
        setRequests(data.data);
      } else {
        setError(data.error || 'Failed to fetch requests.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerReview = async (id, status) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const data = await managerReviewAdjustment(id, {
        status,
        managerComment: managerComment[id] || ''
      }, token);

      if (data.success) {
        setSuccess('Request processed successfully!');
        setRequests(prev => prev.map(req => {
          if (req._id === id) {
            return {
              ...req,
              status: status,
              managerComment: managerComment[id] || req.managerComment,
              managerApprovalDate: new Date().toISOString()
            };
          }
          return req;
        }));
        setManagerComment(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else {
        setError(data.error || 'Failed to process request.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this adjustment request? This cannot be undone.');
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const data = await deleteAdjustmentRequest(id, token);
      if (data.success) {
        setSuccess('Request deleted successfully!');
        setRequests(prev => prev.filter(req => req._id !== id));
      } else {
        setError(data.error || 'Failed to delete request.');
      }
    } catch (err) {
      setError(err.error || 'An unexpected error occurred.');
    }
  };

  if (loading) return <div className="employee-message">Loading requests...</div>;
  if (error) return <div className="employee-message employee-error">Error: {error}</div>;

  const isManager = user?.role === 'Manager';
  const isHR = user?.role === 'HR Manager';
  const isSuperAdmin = user?.role === 'Super Admin';
  const isCompanyAdmin = user?.role === 'Company Admin';
  const isCLevel = user?.role === 'C-Level Executive';
  const isAdmin = [isSuperAdmin, isCompanyAdmin, isCLevel].includes(true);

  // HR, Admins see ALL requests | Manager sees only his team | Employee sees only own
  const visibleRequests = requests.filter(request => {
    if (isHR || isAdmin) return true;
    if (isManager) return request.managerApproverId?._id === user?.employeeId;
    if (user?.role === 'Employee') return request.employeeId?._id === user?.employeeId;
    return false;
  });

  const isPendingForThisManager = (request) => {
    return request.status === 'pending_manager_approval' &&
           request.managerApproverId?._id === user?.employeeId;
  };

  const canManagerReview = (request) => {
    if (request.status !== 'pending_manager_approval') return false;
    if (isAdmin || isHR) return true;
    return isPendingForThisManager(request);
  };

  const canDeleteRequest = (request) => {
    if (isAdmin || isHR) return true;
    if (isManager && request.managerApproverId?._id === user?.employeeId) {
      return request.status === 'pending_manager_approval';
    }
    if (user?.role === 'Employee' && request.employeeId?._id === user?.employeeId) {
      return request.status === 'pending_manager_approval';
    }
    return false;
  };

  const getStatusDisplay = (request) => {
    if (request.status === 'pending_manager_approval') return 'Pending Approval';
    if (request.status === 'approved') return 'Approved';
    if (request.status === 'denied_by_manager') return 'Denied';
    if (request.status === 'denied_by_hr') return 'Denied by HR';
    return request.status.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusClass = (status) => {
    if (status.includes('approved')) return 'status-approved';
    if (status.includes('denied') || status.includes('rejected')) return 'status-denied';
    if (status.includes('pending')) return 'status-pending';
    return 'status-default';
  };

  const sortedRequests = [...visibleRequests].sort((a, b) => {
    const aPending = a.status === 'pending_manager_approval';
    const bPending = b.status === 'pending_manager_approval';
    if (aPending !== bPending) return aPending ? -1 : 1;
    const aDate = new Date(a.attendanceDate).getTime();
    const bDate = new Date(b.attendanceDate).getTime();
    return bDate - aDate; // newest first
  });

  return (
    <div className="attendance-container">
      <h3 className="employee-title">Attendance Manual Requests</h3>
      
      {success && <div className="employee-message employee-success">{success}</div>}
      {error && <div className="employee-message employee-error">{error}</div>}

      {visibleRequests.length === 0 ? (
        <p className="employee-message">No Manual requests found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Original In</th>
                <th>Original Out</th>
                <th>Proposed In</th>
                <th>Proposed Out</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Manager Comment</th>
                <th>Approved On</th>
                {(isManager || isAdmin || isHR || user?.role === 'Employee') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map(request => (
                <tr key={request._id}>
                  <td>{request.employeeId?.fullName} ({request.employeeId?.newEmployeeCode})</td>
                  <td>{new Date(request.attendanceDate).toLocaleDateString()}</td>
                  <td>{getExactTimeFromDatabaseString(shiftTimeByHours(request.originalCheckIn, 6))}</td>
                  <td>{getExactTimeFromDatabaseString(shiftTimeByHours(request.originalCheckOut, 6))}</td>
                  {(() => {
                    const { proposedCheckIn, proposedCheckOut } = normalizeProposedTimes(request);
                    return (
                      <>
                        <td>{getExactTimeFromDatabaseString(shiftTimeByHours(proposedCheckIn, 6))}</td>
                        <td>{getExactTimeFromDatabaseString(shiftTimeByHours(proposedCheckOut, 6))}</td>
                      </>
                    );
                  })()}
                  <td>{request.reason}</td>
                  
                  <td className={getStatusClass(request.status)}>
                    <strong>{getStatusDisplay(request)}</strong>
                  </td>
                  
                  <td>{request.managerApproverId?.fullName || 'N/A'}</td>
                  
                  <td>
                    {request.managerComment ? (
                      <div className="comment-box" title={request.managerComment}>
                        {request.managerComment.length > 40 
                          ? request.managerComment.substring(0, 40) + '...' 
                          : request.managerComment}
                      </div>
                    ) : '-'}
                  </td>
                  
                  <td>
                    {request.managerApprovalDate ? (
                      <small>{new Date(request.managerApprovalDate).toLocaleDateString()}</small>
                    ) : '-'}
                  </td>

                  {/* Actions */}
                  {(isManager || isAdmin || isHR || user?.role === 'Employee') && (
                    <td>
                      {canManagerReview(request) && (
                        <div className="review-actions">
                          <div className="action-buttons">
                            <button
                              onClick={() => handleManagerReview(request._id, 'approved')}
                              className="employee-button approve-button"
                            >
                              Approve
                            </button> <br/>
                            <button
                              onClick={() => handleManagerReview(request._id, 'denied_by_manager')}
                              className="employee-button deny-button"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      )}

                      {canDeleteRequest(request) && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleDelete(request._id)}
                            className="employee-button deny-button"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {!canManagerReview(request) && !canDeleteRequest(request) && (
                        <span className="completed-status">
                          {['approved', 'denied_by_manager', 'denied_by_hr'].includes(request.status)
                            ? 'Completed'
                            : 'No Actions'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
    </div>
  );
};

export default AttendanceAdjustmentRequestList;