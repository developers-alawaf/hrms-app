import React, { useState, useEffect, useContext } from 'react';
import { getAdjustmentRequests, managerReviewAdjustment } from '../api/attendance';
import { AuthContext } from '../context/AuthContext';
import '../styles/Attendance.css';

const getExactTimeFromDatabaseString = (dateTimeString) => {
  if (!dateTimeString) {
    return '-';
  }
  const match = dateTimeString.match(/T(\d{2}:\d{2})/);
  if (match && match[1]) {
    return match[1];
  }
  console.warn(`Could not extract exact time from string: ${dateTimeString}`);
  return '-';
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

  if (loading) return <div className="employee-message">Loading requests...</div>;
  if (error) return <div className="employee-message employee-error">Error: {error}</div>;

  const isManager = user?.role === 'Manager';
  const isHR = user?.role === 'HR Manager';
  const isAdmin = ['Super Admin', 'Company Admin', 'C-Level Executive'].includes(user?.role);

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

  const getStatusDisplay = (request) => {
    if (request.status === 'pending_manager_approval') return 'Pending Approval';
    if (request.status === 'approved') return 'Approved';
    if (request.status === 'denied_by_manager') return 'Denied';
    return request.status.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusClass = (status) => {
    if (status.includes('approved')) return 'status-approved';
    if (status.includes('denied') || status.includes('rejected')) return 'status-denied';
    if (status.includes('pending')) return 'status-pending';
    return 'status-default';
  };

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
                {(isManager || isAdmin) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map(request => (
                <tr key={request._id}>
                  <td>{request.employeeId?.fullName} ({request.employeeId?.newEmployeeCode})</td>
                  <td>{new Date(request.attendanceDate).toLocaleDateString()}</td>
                  <td>{getExactTimeFromDatabaseString(request.originalCheckIn)}</td>
                  <td>{getExactTimeFromDatabaseString(request.originalCheckOut)}</td>
                  <td>{getExactTimeFromDatabaseString(request.proposedCheckIn)}</td>
                  <td>{getExactTimeFromDatabaseString(request.proposedCheckOut)}</td>
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

                  {/* Actions: Only show for pending + correct manager */}
                  {(isManager || isAdmin) && (
                    <td>
                      {isPendingForThisManager(request) ? (
                        <div className="review-actions">
                          <textarea
                            placeholder="Add comment (optional)"
                            value={managerComment[request._id] || ''}
                            onChange={(e) => setManagerComment({...managerComment, [request._id]: e.target.value})}
                            className="employee-input"
                            rows="2"
                          />
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
                      ) : (
                        <span className="completed-status">
                          {request.status === 'approved' || request.status === 'denied_by_manager' 
                            ? 'Completed' 
                            : 'Not Your Request'}
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