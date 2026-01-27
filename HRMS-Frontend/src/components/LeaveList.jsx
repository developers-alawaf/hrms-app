import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createLeaveRequest, getLeaveRequests, approveLeaveRequest, denyLeaveRequest, getLeaveSummary } from '../api/leave';
import '../styles/Leave.css';

const LeaveList = () => {
  const { user } = useContext(AuthContext);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'sick',
    isHalfDay: false,
    remarks: '',
  });
  const [leaveSummary, setLeaveSummary] = useState(null); // New state for leave summary
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  useEffect(() => {
    fetchLeaveRequests();
    fetchMyLeaveSummary(); // Fetch leave summary
  }, [user]);

  const fetchMyLeaveSummary = async () => {
    if (!user || !user.employeeId) {
      setError('User not logged in or user ID not available.');
      return;
    }
    const currentYear = new Date().getFullYear();
    try {
      const token = localStorage.getItem('token');
      const response = await getLeaveSummary(user.employeeId, currentYear, token);
      if (response.success) {
        setLeaveSummary(response.data);
      } else {
        setError(response.error || 'Failed to fetch leave summary.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching leave summary.');
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getLeaveRequests(token);
      if (data.success) {
        setLeaveRequests(data.data);
        setFilteredRequests(data.data);
      } else {
        setError(data.error || 'Failed to fetch leave requests');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = leaveRequests;

    if (searchQuery) {
      filtered = filtered.filter(request =>
        (request.employeeId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         request.employeeId?.newEmployeeCode?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchQuery, leaveRequests, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await createLeaveRequest(formData, token);
      if (data.success) {
        setSuccess('Leave request created successfully!');
        setFormData({ startDate: '', endDate: '', type: 'sick' });
        await fetchLeaveRequests();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await approveLeaveRequest(id, token);
      if (data.success) {
        setSuccess('Leave request approved successfully!');
        await fetchLeaveRequests();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async (id) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await denyLeaveRequest(id, token);
      if (data.success) {
        setSuccess('Leave request denied successfully!');
        await fetchLeaveRequests();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) return <div className="employee-message">Loading leave requests...</div>;

  return (
    <div className="leave-container">
      <h2 className="employee-title">Leave Requests</h2>
      <form onSubmit={handleSubmit} className="leave-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="employee-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="employee-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">Leave Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="employee-input"
              required
            >
              <option value="casual">Casual ({leaveSummary?.balance?.casual || 0} days)</option>
              <option value="sick">Sick ({leaveSummary?.balance?.sick || 0} days)</option>
              <option value="annual">Annual ({leaveSummary?.balance?.annual || 0} days)</option>
              <option value="maternity">Maternity ({leaveSummary?.balance?.maternity || 0} days)</option>
              {/* <option value="festive">Festive ({leaveSummary?.balance?.festive || 0} days)</option> */}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="isHalfDay">Half Day Leave</label>
            <input
              type="checkbox"
              id="isHalfDay"
              name="isHalfDay"
              checked={formData.isHalfDay}
              onChange={handleChange}
              className="employee-checkbox"
            />
          </div>
          <div className="form-group full-span">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="employee-input"
              rows="3"
            ></textarea>
          </div>
        </div>
        {error && <p className="employee-message employee-error">{error}</p>}
        {success && <p className="employee-message employee-success">{success}</p>}
        <button type="submit" className="employee-button" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>

      <div className="leave-header">
        <h3 className="employee-title">Leave History</h3>
        <div className="leave-controls">
          {(user?.role === 'HR Manager' || user?.role === 'Manager') && (
            <input
              type="text"
              placeholder="Search by employee name or code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="employee-input employee-search"
            />
          )}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="employee-message">No leave requests found.</div>
      ) : (
        <>
          <div className="leave-table-container">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>HRMS ID</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  {(user?.role === 'Super Admin' || user?.role === 'C-Level Executive' || user?.role === 'Company Admin' || user?.role === 'HR Manager' || user?.role === 'Manager') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((request) => {
                  const canApproveDeny = (
                    (user?.role === 'Manager' && request.status === 'pending') ||
                    ((user?.role === 'HR Manager' || user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'C-Level Executive') && request.status === 'pending')
                  );
                  return (
                    <tr key={request._id}>
                      <td>{request.employeeId?.fullName || '-'}</td>
                      <td>{request.employeeId?.newEmployeeCode || '-'}</td>
                      <td>{new Date(request.startDate).toLocaleDateString()}</td>
                      <td>{new Date(request.endDate).toLocaleDateString()}</td>
                      <td>{request.type.charAt(0).toUpperCase() + request.type.slice(1)} {request.isHalfDay ? '(Half Day)' : ''}</td>
                      <td>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</td>
                      {(user?.role === 'Super Admin' || user?.role === 'C-Level Executive' || user?.role === 'Company Admin' || user?.role === 'HR Manager' || user?.role === 'Manager') && (
                        <td>
                          {canApproveDeny && (
                            <>
                              <button onClick={() => handleApprove(request._id)} className="employee-button approve-button">Approve</button>
                              <button onClick={() => handleDeny(request._id)} className="employee-button deny-button">Deny</button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRequests.length > requestsPerPage && (
            <div className="pagination-controls">
              <button onClick={handlePrevious} disabled={currentPage === 1} className="pagination-button">Previous</button>
              <span className="pagination-info">Page {currentPage} of {totalPages}</span>
              <button onClick={handleNext} disabled={currentPage === totalPages} className="pagination-button">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaveList;
