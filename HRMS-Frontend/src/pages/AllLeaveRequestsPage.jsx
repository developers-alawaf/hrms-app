import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLeaveRequests, approveLeaveRequest, denyLeaveRequest } from '../api/leave';
import '../styles/Leave.css';

const AllLeaveRequestsPage = () => {
  const { user } = useContext(AuthContext);
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getLeaveRequests(token);
      if (data.success) {
        setAllRequests(data.data);
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
    let filtered = allRequests;

    if (searchQuery) {
      filtered = filtered.filter(request =>
        (request.employeeId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         request.employeeId?.newEmployeeCode?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchQuery, allRequests]);

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await approveLeaveRequest(id, token);
      if (data.success) {
        setSuccess('Request approved successfully!');
        await fetchAllRequests();
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
        setSuccess('Request denied successfully!');
        await fetchAllRequests();
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

  if (loading) return <div className="employee-message">Loading requests...</div>;

  return (
    <div className="leave-container">
      <h2 className="employee-title">All Leave & Remote Requests</h2>
      
      {error && <p className="employee-message employee-error">{error}</p>}
      {success && <p className="employee-message employee-success">{success}</p>}

      <div className="leave-header">
        <h3 className="employee-title">Request History</h3>
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
        <div className="employee-message">No requests found.</div>
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
                  <th>Day Count</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((request) => {
                  const canApproveDeny = request.status === 'pending';
                  return (
                    <tr key={request._id}>
                      <td>{request.employeeId?.fullName || '-'}</td>
                      <td>{request.employeeId?.newEmployeeCode || '-'}</td>
                      <td>{new Date(request.startDate).toLocaleDateString()}</td>
                      <td>{new Date(request.endDate).toLocaleDateString()}</td>
                      <td>{request.isHalfDay ? 0.5 : ((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1}</td>
                      <td>{request.type.charAt(0).toUpperCase() + request.type.slice(1)} {request.isHalfDay ? '(Half Day)' : ''}</td>
                      <td>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</td>
                      <td>
                        {canApproveDeny && (
                          <>
                            <button onClick={() => handleApprove(request._id)} className="employee-button approve-button">Approve</button>
                            <button onClick={() => handleDeny(request._id)} className="employee-button deny-button">Deny</button>
                          </>
                        )}
                      </td>
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

export default AllLeaveRequestsPage;
