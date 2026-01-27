import { useState, useEffect } from 'react';
import { getDesignations } from '../api/designation';
import { Link } from 'react-router-dom';
import '../styles/Employee.css';

const DesignationList = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await getDesignations(token);
        if (response.success) {
          setDesignations(response.data);
        } else {
          setError(response.error || 'Failed to fetch designations');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching designations.');
      } finally {
        setLoading(false);
      }
    };

    fetchDesignations();
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
        <h2 className="employee-title">Designations</h2>
        <Link to="/designations/create" className="employee-button">
          Create Designation
        </Link>
      </div>
      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Designation</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {designations.map((desig) => (
              <tr key={desig._id}>
                <td>{desig.name}</td>
                <td>{desig.department?.name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DesignationList;