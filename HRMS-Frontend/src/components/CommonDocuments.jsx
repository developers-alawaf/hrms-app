import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCommonDocuments, uploadCommonDocument, deleteDocument } from '../api/document';
import '../styles/Employee.css';
// import { Trash2 } from 'lucide-react';
import { Eye, Download, Trash2 } from 'lucide-react';
import '../styles/Employee.css';
const CommonDocuments = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await getCommonDocuments(token);
      if (data.success) {
        setDocuments(data.data);
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Get a valid MongoDB ObjectId string from user (handles string or populated object)
  const getValidCompanyId = () => {
    const raw = user?.companyId;
    if (raw == null) return null;
    const id = typeof raw === 'object' && raw !== null && raw._id != null ? raw._id : raw;
    const str = String(id).trim();
    return /^[a-fA-F0-9]{24}$/.test(str) ? str : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !description) {
      setUploadError('Please provide a file and a description.');
      return;
    }

    const companyId = getValidCompanyId();
    if (!companyId) {
      setUploadError('Your account is not linked to a company, or the company ID is invalid. Please contact your administrator.');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file);
    formData.append('description', description);
    formData.append('isCommon', 'true');
    formData.append('documentType', 'policy');
    formData.append('companyId', companyId);

    setUploading(true);
    setUploadError('');

    try {
      const result = await uploadCommonDocument(formData, token);
      if (result.success) {
        setFile(null);
        setDescription('');
        e.target.reset(); // Reset the form fields
        await fetchDocuments(); // Refresh the list
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const getUploaderName = (uploadedBy) => {
    if (!uploadedBy) return '-';

    if (typeof uploadedBy === 'object' && uploadedBy.employeeId && uploadedBy.employeeId.fullName) {
      return uploadedBy.employeeId.fullName;
    }

    if (typeof uploadedBy === 'object' && uploadedBy !== null) {
      return uploadedBy.fullName || uploadedBy.email || 'Unknown User';
    }
    
    return '-';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      await deleteDocument(id, token);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const canUpload = user && ['HR Manager', 'Super Admin', 'Company Admin'].includes(user.role);

  if (loading) return <div className="employee-message">Loading documents...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="employee-container">
      <h2 className="employee-title">Company Policies</h2>

      {canUpload && (
        <div className="section-card common-docs-upload-section">
          <div className="section-header">
            <h3>Upload New Policy</h3>
          </div>
          <div className="section-body">
            <form onSubmit={handleSubmit} className="employee-form common-docs-upload-form">
              <div className="common-docs-upload-row">
                <div className="form-group common-docs-upload-desc">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="employee-input"
                    placeholder="e.g. Leave Policy 2024"
                    required
                  />
                </div>
                <div className="form-group common-docs-upload-file">
                  <label htmlFor="file">Document File</label>
                  <input
                    type="file"
                    id="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="employee-input employee-file-input"
                    required
                  />
                  {file && <span className="common-docs-file-name">{file.name}</span>}
                </div>
                <div className="form-group common-docs-upload-btn">
                  <label>&nbsp;</label>
                  <button
                    type="submit"
                    className="employee-button employee-btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
              {uploadError && (
                <div className="employee-message employee-error" role="alert">
                  {uploadError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="employee-message">No company policies found.</div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const canDelete = user.role === 'Super Admin';
                return (
                  <tr key={doc._id}>
                    <td>{doc.description || '-'}</td>
                    <td>{getUploaderName(doc.uploadedBy)}</td>
                    <td>
                      <div className="employee-actions">
                        <a
                          href={`${import.meta.env.VITE_API_URL}${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="employee-button employee-action-btn download-button"
                          title="Download document"
                        >
                          <Download className="employee-action-icon" size={16} />
                          Download
                        </a>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc._id)}
                            className="employee-button employee-action-btn delete-button"
                            title="Delete document"
                            aria-label="Delete document"
                          >
                            <Trash2 className="employee-action-icon" size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommonDocuments;
