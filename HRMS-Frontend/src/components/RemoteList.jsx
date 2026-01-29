import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createLeaveRequest, getLeaveRequests, approveLeaveRequest, denyLeaveRequest } from '../api/leave';
import '../styles/Leave.css';

const RemoteList = () => {
  const { user } = useContext(AuthContext);
  const [remoteRequests, setRemoteRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'remote',
    isHalfDay: false,
    remarks: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  useEffect(() => {
    fetchRemoteRequests();
  }, []);

  const fetchRemoteRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getLeaveRequests(token);
      if (data.success) {
        const remoteOnly = data.data
          .filter(request => request.type === 'remote')
          .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
        setRemoteRequests(remoteOnly);
        setFilteredRequests(remoteOnly);
      } else {
        setError('Failed to fetch remote requests');
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...remoteRequests];

    if (searchQuery) {
      filtered = filtered.filter(request =>
        (request.employeeId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         request.employeeId?.newEmployeeCode?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Keep newest first (in case filter changed order)
    filtered.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchQuery, remoteRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        setSuccess('Remote request created successfully!');
        setFormData({ startDate: '', endDate: '', type: 'remote', isHalfDay: false });
        await fetchRemoteRequests();
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
        setSuccess('Remote request approved successfully!');
        await fetchRemoteRequests();
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
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
        setSuccess('Remote request denied successfully!');
        await fetchRemoteRequests();
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
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

  if (loading) return <div className="employee-message">Loading remote requests...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="leave-container">
      <h2 className="employee-title">Remote Work Requests</h2>
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
              placeholder="Select start date"
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
              placeholder="Select end date"
              required
            />
          </div>
          <div className="form-group form-group-checkbox">
            <label htmlFor="isHalfDay">Half Day</label>
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
          {loading ? 'Submitting...' : 'Submit Remote Request'}
        </button>
      </form>
      <div className="leave-header">
        <h3 className="employee-title">Remote Work History</h3>
        <div className="leave-controls">
          <input
            type="text"
            placeholder="Search by employee name or code"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="employee-input employee-search"
          />
        </div>
      </div>
      {filteredRequests.length === 0 ? (
        <div className="employee-message">No remote requests found.</div>
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
                  <th>Status</th>
                  <th>Half Day</th>
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
                      <td>{request.employeeId?.newEmployeeCode || '-'}
                      </td>
                      <td>{new Date(request.startDate).toLocaleDateString()}</td>
                      <td>{new Date(request.endDate).toLocaleDateString()}</td>
                      <td>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</td>
                      <td>{request.isHalfDay ? 'Yes' : 'No'}</td>
                      {(user?.role === 'Super Admin' || user?.role === 'C-Level Executive' || user?.role === 'Company Admin' || user?.role === 'HR Manager' || user?.role === 'Manager') && (
                        <td>
                          {canApproveDeny && (
                            <>
                              <button
                                onClick={() => handleApprove(request._id)}
                                className="employee-button approve-button"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeny(request._id)}
                                className="employee-button deny-button"
                              >
                                Deny
                              </button>
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
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
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
    </div>
  );
};

export default RemoteList;
