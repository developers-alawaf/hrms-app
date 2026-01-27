import { useState, useEffect } from 'react';
import { getDepartments } from '../api/department';
import { Link } from 'react-router-dom';
import '../styles/Employee.css';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await getDepartments(token);
        if (response.success) {
          setDepartments(response.data);
        } else {
          setError(response.error || 'Failed to fetch departments');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching departments.');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h2 className="employee-title">Departments</h2>
        <Link to="/departments/create" className="employee-button">
          Create Department
        </Link>
      </div>
      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Company</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept._id}>
                <td>{dept.name}</td>
                <td>{dept.company?.name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentList;