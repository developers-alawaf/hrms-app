// // import { useState, useEffect, useContext } from 'react';
// // import { AuthContext } from '../context/AuthContext';
// // import { getEmployees } from '../api/employee';
// // import { getCompanies } from '../api/company';
// // import { getDocuments, getDocumentById, uploadDocument } from '../api/document';
// // import '../styles/Employee.css';
// // import { Eye, Download } from 'lucide-react';

// // const DocumentList = () => {
// //   const { user } = useContext(AuthContext);
// //   const [documents, setDocuments] = useState([]);
// //   const [employees, setEmployees] = useState([]);
// //   const [companies, setCompanies] = useState([]);
// //   const [error, setError] = useState('');
// //   const [success, setSuccess] = useState('');
// //   const [loading, setLoading] = useState(true);
// //   const [showModal, setShowModal] = useState(false);
// //   const [selectedDocument, setSelectedDocument] = useState(null);

// //   const authorized =
// //     user?.role === 'Super Admin' ||
// //     user?.role === 'HR Manager' ||
// //     user?.role === 'Company Admin' ||
// //     user?.role === 'C-Level Executive';

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try {
// //         const token = localStorage.getItem('token');
// //         const [docResponse, empResponse, compResponse] = await Promise.all([
// //           getDocuments(token),
// //           getEmployees(token),
// //           getCompanies(token),
// //         ]);

// //         if (docResponse.success && empResponse.success && compResponse.success) {
// //           setDocuments(docResponse.data);
// //           setEmployees(empResponse.data);
// //           setCompanies(compResponse.data);
// //         } else {
// //           setError(docResponse.error || empResponse.error || compResponse.error || 'Failed to fetch data');
// //         }
// //       } catch (err) {
// //         setError(err.message || 'Something went wrong');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchData();
// //   }, []);

// //   // === Helper Functions ===
// //   const getEmployeeName = (employeeId) => {
// //     if (!employeeId) return '-';
// //     if (typeof employeeId === 'object' && employeeId.fullName) {
// //       return employeeId.fullName;
// //     }
// //     const employee = employees.find(emp => emp._id === employeeId);
// //     return employee ? employee.fullName : '-';
// //   };

// //   const getCompanyName = (companyId) => {
// //     if (!companyId) return '-';
// //     if (typeof companyId === 'object' && companyId.name) {
// //       return companyId.name;
// //     }
// //     const company = companies.find(c => c._id === companyId);
// //     return company ? company.name : '-';
// //   };

// //   const getUploaderName = (uploadedBy) => {
// //     if (!uploadedBy) return '-';
// //     if (typeof uploadedBy === 'object') {
// //       return uploadedBy.fullName || '-';   // <-- uses populated fullName
// //     }
// //     return '-';
// //   };

// //   const handleView = async (id) => {
// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await getDocumentById(id, token);

// //       if (response.success) {
// //         setSelectedDocument(response.data);
// //         setShowModal(true);
// //       } else {
// //         setError(response.error || 'Failed to fetch document details');
// //       }
// //     } catch (err) {
// //       setError(err.message || 'Failed to fetch document details');
// //     }
// //   };

// //   const [formData, setFormData] = useState({
// //     documentType: '',
// //     description: '',
// //     document: null,
// //   });

// //   const handleChange = (e) => {
// //     const { name, value, files } = e.target;
// //     setFormData({
// //       ...formData,
// //       [name]: files ? files[0] : value,
// //     });
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setError('');
// //     setSuccess('');
// //     setLoading(true);

// //     try {
// //       const token = localStorage.getItem('token');
// //       if (!token) throw new Error('Authentication token missing');

// //       if (!user?.employeeId || !user?.companyId) {
// //         throw new Error('User profile incomplete. Missing employeeId or companyId.');
// //       }

// //       if (!formData.documentType) {
// //         setError('Please select a document type');
// //         setLoading(false);
// //         return;
// //       }

// //       if (!formData.document) {
// //         setError('Please select a file');
// //         setLoading(false);
// //         return;
// //       }

// //       const formDataToSend = new FormData();
// //       formDataToSend.append('employeeId', user.employeeId);
// //       formDataToSend.append('companyId', user.companyId);
// //       formDataToSend.append('documentType', formData.documentType);
// //       formDataToSend.append('description', formData.description || '');
// //       formDataToSend.append('document', formData.document);

// //       const response = await uploadDocument(formDataToSend, token);

// //       if (response.success) {
// //         setSuccess('Document uploaded successfully!');
// //         setDocuments(prev => [...prev, ...response.data]);
// //         setFormData({ documentType: '', description: '', document: null });
// //         e.target.reset();
// //         window.location.reload();   // <-- page reload after upload
// //       } else {
// //         setError(response.error || 'Failed to upload document');
// //       }
// //     } catch (err) {
// //       setError(err.message || 'Something went wrong');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   if (loading) return <div className="employee-message">Loading documents...</div>;
// //   if (error) return <div className="employee-message employee-error">{error}</div>;

// //   return (
// //     <div className="employee-container">
// //       <div className="employee-header">
// //         <h2 className="employee-title">Documents</h2>
// //       </div>

// //       {authorized && (
// //         <form onSubmit={handleSubmit} className="employee-form" encType="multipart/form-data">
// //           <div className="form-grid">
// //             <div className="form-group">
// //               <label htmlFor="documentType">Document Type *</label>
// //               <select
// //                 id="documentType"
// //                 name="documentType"
// //                 value={formData.documentType}
// //                 onChange={handleChange}
// //                 className="employee-input"
// //                 required
// //               >
// //                 <option value="">Select Document Type</option>
// //                 <option value="contract">Contract</option>
// //                 <option value="offer_letter">Offer Letter</option>
// //                 <option value="id_proof">ID Proof</option>
// //                 <option value="certificate">Certificate</option>
// //                 <option value="other">Other</option>
// //               </select>
// //             </div>
// //             <div className="form-group">
// //               <label htmlFor="description">Description</label>
// //               <input
// //                 type="text"
// //                 id="description"
// //                 name="description"
// //                 value={formData.description}
// //                 onChange={handleChange}
// //                 className="employee-input"
// //               />
// //             </div>
// //             <div className="form-group">
// //               <label htmlFor="document">Document File *</label>
// //               <input
// //                 type="file"
// //                 id="document"
// //                 name="document"
// //                 accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
// //                 onChange={handleChange}
// //                 className="employee-input"
// //                 required
// //               />
// //             </div>
// //           </div>
// //           {success && <p className="employee-message employee-success">{success}</p>}
// //           <button type="submit" className="employee-button" disabled={loading}>
// //             {loading ? 'Uploading...' : 'Upload Document'}
// //           </button>
// //         </form>
// //       )}

// //       {documents.length === 0 ? (
// //         <div className="employee-message">No documents found.</div>
// //       ) : (
// //         <div className="employee-table-container">
// //           <table className="employee-table">
// //             <thead>
// //               <tr>
// //                 <th>Uploaded By</th>
// //                 <th>Company</th>
// //                 <th>Document Type</th>
// //                 <th>Description</th>
// //                 <th>Actions</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {documents.map((doc) => (
// //                 <tr key={doc._id}>
// //                   <td>{getUploaderName(doc.uploadedBy)}</td>
// //                   <td>{getCompanyName(doc.companyId)}</td>
// //                   <td>{doc.documentType || '-'}</td>
// //                   <td>{doc.description || '-'}</td>
// //                   <td>
// //                     <button onClick={() => handleView(doc._id)} className="employee-button view-button">
// //                       <Eye className="button-icon" /> View
// //                     </button>
// //                     <a
// //                       href={`${import.meta.env.VITE_API_URL}${doc.fileUrl}`}
// //                       target="_blank"
// //                       rel="noopener noreferrer"
// //                       className="employee-button download-button"
// //                     >
// //                       <Download className="button-icon" /> Download
// //                     </a>
// //                   </td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         </div>
// //       )}

// //       {showModal && selectedDocument && (
// //         <div className="modal-overlay" onClick={() => setShowModal(false)}>
// //           <div className="modal-content employee-modal-content" onClick={(e) => e.stopPropagation()}>
// //             <h3 className="modal-title">Document Details</h3>
// //             <div className="modal-details">
// //               <div className="modal-detail-item">
// //                 <strong>Employee:</strong> <span>{getEmployeeName(selectedDocument.employeeId)}</span>
// //               </div>
// //               <div className="modal-detail-item">
// //                 <strong>Company:</strong> <span>{getCompanyName(selectedDocument.companyId)}</span>
// //               </div>
// //               <div className="modal-detail-item">
// //                 <strong>Document Type:</strong> <span>{selectedDocument.documentType || '-'}</span>
// //               </div>
// //               <div className="modal-detail-item">
// //                 <strong>File Name:</strong> <span>{selectedDocument.fileName || '-'}</span>
// //               </div>
// //               <div className="modal-detail-item">
// //                 <strong>Description:</strong> <span>{selectedDocument.description || '-'}</span>
// //               </div>
// //               <div className="modal-detail-item">
// //                 <strong>Uploaded By:</strong> <span>{getUploaderName(selectedDocument.uploadedBy)}</span>
// //               </div>
// //               <div className="modal-detail-item">
// //                 <strong>File Size:</strong> <span>{(selectedDocument.size / 1024).toFixed(2)} KB</span>
// //               </div>
// //               <div className="modal-documents">
// //                 <a
// //                   href={`${import.meta.env.VITE_API_URL}${selectedDocument.fileUrl}`}
// //                   target="_blank"
// //                   rel="noopener noreferrer"
// //                   className="modal-document-link"
// //                 >
// //                   Download Document
// //                 </a>
// //               </div>
// //             </div>
// //             <div className="modal-actions">
// //               <button onClick={() => setShowModal(false)} className="employee-button modal-button">
// //                 Close
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default DocumentList;


// import { useState, useEffect, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { getEmployees } from '../api/employee';
// import { getCompanies } from '../api/company';
// import { getDocuments, getDocumentById, uploadDocument } from '../api/document';
// import '../styles/Employee.css';
// import { Eye, Download } from 'lucide-react';

// const DocumentList = () => {
//   const { user } = useContext(AuthContext);
//   const [documents, setDocuments] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [companies, setCompanies] = useState([]);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedDocument, setSelectedDocument] = useState(null);

//   const authorized =
//     user?.role === 'Super Admin' ||
//     user?.role === 'HR Manager' ||
//     user?.role === 'Company Admin' ||
//     user?.role === 'C-Level Executive';

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const [docResponse, empResponse, compResponse] = await Promise.all([
//           getDocuments(token),
//           getEmployees(token),
//           getCompanies(token),
//         ]);

//         if (docResponse.success && empResponse.success && compResponse.success) {
//           setDocuments(docResponse.data);
//           setEmployees(empResponse.data);
//           setCompanies(compResponse.data);
//         } else {
//           setError(docResponse.error || empResponse.error || compResponse.error || 'Failed to fetch data');
//         }
//       } catch (err) {
//         setError(err.message || 'Something went wrong');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // === Helper Functions ===
//   const getEmployeeName = (employeeId) => {
//     if (!employeeId) return '-';
//     if (typeof employeeId === 'object' && employeeId.fullName) {
//       return employeeId.fullName;
//     }
//     const employee = employees.find(emp => emp._id === employeeId);
//     return employee ? employee.fullName : '-';
//   };

//   const getCompanyName = (companyId) => {
//     if (!companyId) return '-';
//     if (typeof companyId === 'object' && companyId.name) {
//       return companyId.name;
//     }
//     const company = companies.find(c => c._id === companyId);
//     return company ? company.name : '-';
//   };

//   const getUploaderName = (uploadedBy) => {
//     if (!uploadedBy) return '-';
//     if (typeof uploadedBy === 'object') {
//       // return uploadedBy.fullName || '-';   // <-- uses populated fullName
//       return uploadedBy.fullName || uploadedBy.email || '-';
//     }
//     return '-';
//   };

//   const handleView = async (id) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await getDocumentById(id, token);

//       if (response.success) {
//         setSelectedDocument(response.data);
//         setShowModal(true);
//       } else {
//         setError(response.error || 'Failed to fetch document details');
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to fetch document details');
//     }
//   };

//   const [formData, setFormData] = useState({
//     documentType: '',
//     description: '',
//     document: null,
//   });

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     setFormData({
//       ...formData,
//       [name]: files ? files[0] : value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     setLoading(true);

//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('Authentication token missing');

//       if (!user?.employeeId || !user?.companyId) {
//         throw new Error('User profile incomplete. Missing employeeId or companyId.');
//       }

//       if (!formData.documentType) {
//         setError('Please select a document type');
//         setLoading(false);
//         return;
//       }

//       if (!formData.document) {
//         setError('Please select a file');
//         setLoading(false);
//         return;
//       }

//       const formDataToSend = new FormData();
//       formDataToSend.append('employeeId', user.employeeId);
//       formDataToSend.append('companyId', user.companyId);
//       formDataToSend.append('documentType', formData.documentType);
//       formDataToSend.append('description', formData.description || '');
//       formDataToSend.append('document', formData.document);

//       const response = await uploadDocument(formDataToSend, token);

//       if (response.success) {
//         setSuccess('Document uploaded successfully!');
//         setDocuments(prev => [...prev, ...response.data]);
//         setFormData({ documentType: '', description: '', document: null });
//         e.target.reset();
//         window.location.reload();   // <-- page reload after upload
//       } else {
//         setError(response.error || 'Failed to upload document');
//       }
//     } catch (err) {
//       setError(err.message || 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="employee-message">Loading documents...</div>;
//   if (error) return <div className="employee-message employee-error">{error}</div>;

//   return (
//     <div className="employee-container">
//       <div className="employee-header">
//         <h2 className="employee-title">Documents</h2>
//       </div>

//       {authorized && (
//         <form onSubmit={handleSubmit} className="employee-form" encType="multipart/form-data">
//           <div className="form-grid">
//             <div className="form-group">
//               <label htmlFor="documentType">Document Type *</label>
//               <select
//                 id="documentType"
//                 name="documentType"
//                 value={formData.documentType}
//                 onChange={handleChange}
//                 className="employee-input"
//                 required
//               >
//                 <option value="">Select Document Type</option>
//                 <option value="contract">Contract</option>
//                 <option value="offer_letter">Offer Letter</option>
//                 <option value="id_proof">ID Proof</option>
//                 <option value="certificate">Certificate</option>
//                 {/* <option value="other">Other</option> */}
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="description">Description</label>
//               <input
//                 type="text"
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 className="employee-input"
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="document">Document File *</label>
//               <input
//                 type="file"
//                 id="document"
//                 name="document"
//                 accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//                 onChange={handleChange}
//                 className="employee-input"
//                 required
//               />
//             </div>
//           </div>
//           {success && <p className="employee-message employee-success">{success}</p>}
//           <button type="submit" className="employee-button" disabled={loading}>
//             {loading ? 'Uploading...' : 'Upload Document'}
//           </button>
//         </form>
//       )}

//       {documents.length === 0 ? (
//         <div className="employee-message">No documents found.</div>
//       ) : (
//         <div className="employee-table-container">
//           <table className="employee-table">
//             <thead>
//               <tr>
//                 <th>Uploaded By</th>
//                 <th>Company</th>
//                 <th>Document Type</th>
//                 <th>Description</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {documents.map((doc) => (
//                 <tr key={doc._id}>
//                   <td>{getUploaderName(doc.uploadedBy)}</td>
//                   <td>{getCompanyName(doc.companyId)}</td>
//                   <td>{doc.documentType || '-'}</td>
//                   <td>{doc.description || '-'}</td>
//                   <td>
//                     <button onClick={() => handleView(doc._id)} className="employee-button view-button">
//                       <Eye className="button-icon" /> View
//                     </button>
//                     <a
//                       href={`${import.meta.env.VITE_API_URL}${doc.fileUrl}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="employee-button download-button"
//                     >
//                       <Download className="button-icon" /> Download
//                     </a>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {showModal && selectedDocument && (
//         <div className="modal-overlay" onClick={() => setShowModal(false)}>
//           <div className="modal-content employee-modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3 className="modal-title">Document Details</h3>
//             <div className="modal-details">
//               <div className="modal-detail-item">
//                 <strong>Employee:</strong> <span>{getEmployeeName(selectedDocument.employeeId)}</span>
//               </div>
//               <div className="modal-detail-item">
//                 <strong>Company:</strong> <span>{getCompanyName(selectedDocument.companyId)}</span>
//               </div>
//               <div className="modal-detail-item">
//                 <strong>Document Type:</strong> <span>{selectedDocument.documentType || '-'}</span>
//               </div>
//               <div className="modal-detail-item">
//                 <strong>File Name:</strong> <span>{selectedDocument.fileName || '-'}</span>
//               </div>
//               <div className="modal-detail-item">
//                 <strong>Description:</strong> <span>{selectedDocument.description || '-'}</span>
//               </div>
//               <div className="modal-detail-item">
//                 <strong>Uploaded By:</strong> <span>{getUploaderName(selectedDocument.uploadedBy)}</span>
//               </div>
//               <div className="modal-detail-item">
//                 <strong>File Size:</strong> <span>{(selectedDocument.size / 1024).toFixed(2)} KB</span>
//               </div>
//               <div className="modal-documents">
//                 <a
//                   href={`${import.meta.env.VITE_API_URL}${selectedDocument.fileUrl}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="modal-document-link"
//                 >
//                   Download Document
//                 </a>
//               </div>
//             </div>
//             <div className="modal-actions">
//               <button onClick={() => setShowModal(false)} className="employee-button modal-button">
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DocumentList;



import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getEmployees } from '../api/employee';
import { getCompanies } from '../api/company';
import { getDocuments, getDocumentById, uploadDocument, deleteDocument } from '../api/document';
import '../styles/Employee.css';
import { Eye, Download, Trash2 } from 'lucide-react';

const DocumentList = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const authorized =
    user?.role === 'Super Admin' ||
    user?.role === 'HR Manager' ||
    user?.role === 'Company Admin' ||
    user?.role === 'C-Level Executive';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [docResponse, empResponse, compResponse] = await Promise.all([
          getDocuments(token),
          getEmployees(token),
          getCompanies(token),
        ]);

        if (docResponse.success && empResponse.success && compResponse.success) {
          setDocuments(docResponse.data || []);
          setEmployees(empResponse.data || []);
          setCompanies(compResponse.data || []);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUploaderName = (uploadedBy) => {
    if (!uploadedBy) return '-';

    // Case 1: deeply populated structure
    if (typeof uploadedBy === 'object' && uploadedBy.employeeId && uploadedBy.employeeId.fullName) {
      return uploadedBy.employeeId.fullName;
    }

    // Case 2: regular populated user object (fallback)
    if (typeof uploadedBy === 'object' && uploadedBy !== null) {
      return uploadedBy.fullName || uploadedBy.email || 'Unknown User';
    }

    // Case 3: only user ID is stored (legacy)
    if (typeof uploadedBy === 'string') {
      const uploader = employees.find(emp => emp._id === uploadedBy);
      return uploader ? uploader.fullName || uploader.email || 'Unknown User' : 'Unknown User';
    }

    return '-';
  };

  const handleView = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await getDocumentById(id, token);

      if (response.success) {
        setSelectedDocument(response.data);
        setShowModal(true);
      } else {
        setError('Failed to fetch document');
      }
    } catch (err) {
      setError('Failed to load document details');
    }
  };

  const [formData, setFormData] = useState({
    description: '',
    document: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      if (!user?.employeeId || !user?.companyId) {
        throw new Error('User profile incomplete');
      }

      if (!formData.document) {
        setError('Please select a file');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('employeeId', user.employeeId);
      formDataToSend.append('companyId', user.companyId);
      formDataToSend.append('documentType', 'other'); // Auto-set
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('document', formData.document);

      const response = await uploadDocument(formDataToSend, token);

      if (response.success) {
        setSuccess('Document uploaded successfully!');
        // Add new document(s) to list without full reload
        setDocuments(prev => [...prev, ...(response.data || [])]);
        setFormData({ description: '', document: null });
        e.target.reset();
      } else {
        setError(response.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Upload error');
    } finally {
      setLoading(false);
    }
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

  if (loading && documents.length === 0) return <div className="employee-message">Loading documents...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h2 className="employee-title">Documents</h2>
      </div>

      {/* Upload Form */}
      {authorized && (
        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="employee-input"
                placeholder="e.g. Salary Slip - Jan 2025"
              />
            </div>
            <div className="form-group">
              <label htmlFor="document">Upload File *</label>
              <input
                type="file"
                id="document"
                name="document"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleChange}
                className="employee-input"
                required
              />
            </div>
          </div>

          {success && <p className="employee-message employee-success">{success}</p>}
          {error && <p className="employee-message employee-error">{error}</p>}

          <button type="submit" className="employee-button" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="employee-message">No documents uploaded yet.</div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Uploaded By</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const canDelete = user.role === 'Super Admin' || user.role === 'HR Manager' || user.role === "Company Admin" || (doc.uploadedBy && doc.uploadedBy._id === user._id);
                return (
                  <tr key={doc._id}>
                    <td>
                      <strong>{getUploaderName(doc.uploadedBy)}</strong>
                    </td>
                    <td>{doc.description || <em>No description</em>}</td>
                    <td>
                      <button onClick={() => handleView(doc._id)} className="employee-button view-button">
                        <Eye className="button-icon" /> View
                      </button>
                      <a
                        href={`${import.meta.env.VITE_API_URL}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="employee-button download-button"
                        style={{ marginLeft: '8px' }}
                      >
                        <Download className="button-icon" /> Download
                      </a>
                      {canDelete && (
                        <button onClick={() => handleDelete(doc._id)} className="employee-button delete-button" style={{ marginLeft: '8px' }}>
                          <Trash2 className="button-icon" /> Delete
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

      {/* View Modal */}
      {showModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content employee-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Document Details</h3>
            <div className="modal-details">
              <div className="modal-detail-item">
                <strong>Uploaded By:</strong> <span>{getUploaderName(selectedDocument.uploadedBy)}</span>
              </div>
              <div className="modal-detail-item">
                <strong>Description:</strong> <span>{selectedDocument.description || 'No description'}</span>
              </div>

              <div className="modal-detail-item">
                <strong>Uploaded On:</strong> <span>{new Date(selectedDocument.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="modal-documents">
                <a
                  href={`${import.meta.env.VITE_API_URL}${selectedDocument.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-document-link"
                >
                  Download Document
                </a>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="employee-button modal-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;