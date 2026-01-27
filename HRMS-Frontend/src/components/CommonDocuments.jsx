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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !description) {
      setUploadError('Please provide a file and a description.');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file);
    formData.append('description', description);
    formData.append('isCommon', 'true');
    formData.append('documentType', 'policy');
    formData.append('companyId', user.companyId);

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
        <div className="upload-form-container">
          <h3>Upload New Policy</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="file">Document File</label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                required
              />
            </div>
            {uploadError && <div className="employee-message employee-error">{uploadError}</div>}
            <button type="submit" className="employee-button" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'} 
            </button>
            
          </form>
        </div>
      )}<br/>

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
                const canDelete = user.role === 'Super Admin' || user.role === 'HR Manager' || user.role === "Company Admin" || (doc.uploadedBy && doc.uploadedBy._id === user._id);
                return (
                  <tr key={doc._id}>
                    <td>{doc.description || '-'}</td>
                    <td>{getUploaderName(doc.uploadedBy)}</td>
                    <td className="button-icon">
                      <a href={`${import.meta.env.VITE_API_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"  
                        className="employee-button download-button"
                        style={{ marginLeft: '8px' }}>
                         <Download className="button-icon" /> Download
                      </a>
                      {canDelete && (
                        <button onClick={() => handleDelete(doc._id)} className="employee-button delete-button" style={{ marginLeft: '8px' }}>
                          <Trash2 className="button-icon" />
                        </button>
                      )}
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
