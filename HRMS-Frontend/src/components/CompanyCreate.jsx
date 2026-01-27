import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany, getCompanies } from '../api/company';
import '../styles/CompanyCreate.css';

const CompanyCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    employeeIdBase: '',
    isActive: true,
  });
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 10;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getCompanies(token);
      if (data.success) {
        setCompanies(data.data);
        setFilteredCompanies(data.data);
      } else {
        setError(data.error || 'Failed to fetch companies');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [searchQuery, companies]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'employeeIdBase' ? parseInt(value, 10) : value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = await createCompany(formData, token);
      if (data.success) {
        setSuccess('Company created successfully!');
        setFormData({ name: '', isActive: true });
        await fetchCompanies();
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="company-container">
      <h2 className="company-title">Create Company</h2>
      <form onSubmit={handleSubmit} className="company-form">
        <div className="form-group">
          <label htmlFor="name">Company Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="company-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="abbreviation">Abbreviation</label>
          <input
            type="text"
            id="abbreviation"
            name="abbreviation"
            value={formData.abbreviation}
            onChange={handleChange}
            className="company-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="employeeIdBase">Company ID Base</label>
          <input
            type="number"
            id="employeeIdBase"
            name="employeeIdBase"
            value={formData.employeeIdBase}
            onChange={handleChange}
            className="company-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="isActive">Active</label>
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="company-checkbox"
          />
        </div>
        {error && <p className="company-message company-error">{error}</p>}
        {success && <p className="company-message company-success">{success}</p>}
        <button type="submit" className="company-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Company'}
        </button>
      </form>

      <div className="company-header">
        <h3 className="company-title">Company List</h3>
        <div className="company-controls">
          <input
            type="text"
            placeholder="Search by company name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input company-search"
          />
        </div>
      </div>

      {loadingCompanies ? (
        <div className="company-message">Loading companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="company-message">No companies found.</div>
      ) : (
        <>
          <div className="company-table-container">
            <table className="company-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Abbreviation</th>
                  <th>Company ID Base</th>
                  <th>Active</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {currentCompanies.map((company) => (
                  <tr key={company._id}>
                    <td>{company.name || '-'}</td>
                    <td>{company.abbreviation || '-'}</td>
                    <td>{company.employeeIdBase || '-'}</td>
                    <td>{company.isActive ? 'Yes' : 'No'}</td>
                    <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length > companiesPerPage && (
            <div className="pagination-controls">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">Page {currentPage} of {totalPages}</span>
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

export default CompanyCreate;