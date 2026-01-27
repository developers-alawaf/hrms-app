import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLeaveRequests } from '../api/leave';
import '../styles/Employee.css';

const AllLeaveHistory = () => {
  const { user } = useContext(AuthContext);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await getLeaveRequests(token);
        if (data.success) {
          setLeaveRequests(data.data);
        } else {
          setError(data.error || 'Failed to fetch leave history');
        }
      } catch (err) {
        setError(err.error || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'HR Manager' || user?.role === 'Super Admin') {
      fetchLeaveHistory();
    }
  }, [user]);

  if (user?.role !== 'HR Manager' && user?.role !== 'Super Admin') {
    return <div className="employee-message">Access Denied</div>;
  }

  if (loading) return <div className="employee-message">Loading leave history...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="employee-container">
      <h2 className="employee-title">All Leave History</h2>
      {leaveRequests.length === 0 ? (
        <div className="employee-message">No leave requests found.</div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Day Count</th>
                <th>Type</th>
                <th>Status</th>
                <th>Approver</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.employeeId?.fullName || '-'}</td>
                  <td>{new Date(request.startDate).toLocaleDateString()}</td>
                  <td>{new Date(request.endDate).toLocaleDateString()}</td>
                  <td>{((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1}</td>
                  <td>{request.type}</td>
                  <td>{request.status}</td>
                  <td>{request.approverId?.fullName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllLeaveHistory;