// // import React, { useState, useEffect } from 'react';
// // import { getCompanies } from '../api/company';
// // import '../styles/ShiftForm.css'; // Import the new CSS file

// // const ShiftForm = ({ shift, onClose, onSave }) => {
// //   const [formData, setFormData] = useState({
// //     name: '',
// //     startTime: '',
// //     endTime: '',
// //     gracePeriod: '',
// //     overtimeThreshold: '',
// //     companyId: '',
// //   });

// //   const [companies, setCompanies] = useState([]);

// //   useEffect(() => {
// //     const fetchCompanies = async () => {
// //       try {
// //         const token = localStorage.getItem('token');
// //         const response = await getCompanies(token);
// //         if (response.success) {
// //           setCompanies(response.data);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching companies:', error);
// //       }
// //     };
// //     fetchCompanies();
// //   }, []);

// //   useEffect(() => {
// //     if (shift) {
// //       setFormData({
// //         name: shift.name,
// //         startTime: shift.startTime,
// //         endTime: shift.endTime,
// //         gracePeriod: shift.gracePeriod || '',
// //         overtimeThreshold: shift.overtimeThreshold || '',
// //         companyId: shift.companyId?._id || shift.companyId || '',
// //       });
// //     } else {
// //       setFormData({
// //         name: '',
// //         startTime: '',
// //         endTime: '',
// //         gracePeriod: '',
// //         overtimeThreshold: '',
// //         companyId: '',
// //       });
// //     }
// //   }, [shift]);

// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData({ ...formData, [name]: value });
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     const dataToSave = {
// //       ...formData,
// //       gracePeriod: parseInt(formData.gracePeriod, 10) || 0,
// //       overtimeThreshold: parseInt(formData.overtimeThreshold, 10) || 0,
// //     };
// //     onSave(dataToSave);
// //   };

// //   return (
// //     <div className="shift-form-modal">
// //       <div className="shift-form-container">
// //         <div className="mt-3 text-center">
// //           <h3 className="shift-form-title">{shift ? 'Edit Shift' : 'Add Shift'}</h3>
// //           <form onSubmit={handleSubmit} className="mt-2">
// //             <div className="shift-form-group">
// //               <label htmlFor="companyId">Company</label>
// //               <select
// //                 name="companyId"
// //                 value={formData.companyId}
// //                 onChange={handleChange}
// //                 required
// //                 disabled={!!shift}
// //               >
// //                 <option value="">Select Company</option>
// //                 {companies.map(company => (
// //                   <option key={company._id} value={company._id}>{company.name}</option>
// //                 ))}
// //               </select>
// //             </div>
// //             <div className="shift-form-group">
// //               <label htmlFor="name">Name</label>
// //               <input
// //                 type="text"
// //                 name="name"
// //                 value={formData.name}
// //                 onChange={handleChange}
// //                 required
// //                 disabled={!!shift}
// //               />
// //             </div>
// //             <div className="shift-form-group">
// //               <label htmlFor="startTime">Start Time</label>
// //               <input
// //                 type="time"
// //                 name="startTime"
// //                 value={formData.startTime}
// //                 onChange={handleChange}
// //                 required
// //               />
// //             </div>
// //             <div className="shift-form-group">
// //               <label htmlFor="endTime">End Time</label>
// //               <input
// //                 type="time"
// //                 name="endTime"
// //                 value={formData.endTime}
// //                 onChange={handleChange}
// //                 required
// //               />
// //             </div>
// //             <div className="shift-form-group">
// //               <label htmlFor="gracePeriod">Grace Period (minutes)</label>
// //               <input
// //                 type="number"
// //                 name="gracePeriod"
// //                 value={formData.gracePeriod}
// //                 onChange={handleChange}
// //               />
// //             </div>
// //             <div className="shift-form-group">
// //               <label htmlFor="overtimeThreshold">Overtime Threshold (minutes)</label>
// //               <input
// //                 type="number"
// //                 name="overtimeThreshold"
// //                 value={formData.overtimeThreshold}
// //                 onChange={handleChange}
// //               />
// //             </div>
// //             <div className="shift-form-actions">
// //               <button
// //                 type="submit"
// //                 className="shift-form-submit-button"
// //               >
// //                 Save
// //               </button>
// //               <button
// //                 type="button"
// //                 onClick={onClose}
// //                 className="shift-form-cancel-button"
// //               >
// //                 Cancel
// //               </button>
// //             </div>
// //           </form>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default ShiftForm;



// import React, { useState, useEffect } from 'react';
// import { getCompanies } from '../api/company';
// import '../styles/ShiftForm.css';

// const ShiftForm = ({ shift, onClose, onSave }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     startTime: '',
//     endTime: '',
//     gracePeriod: '',
//     overtimeThreshold: '', // in MINUTES
//     companyId: '',
//   });

//   const [companies, setCompanies] = useState([]);
//   const [errors, setErrors] = useState({});

//   useEffect(() => {
//     const fetchCompanies = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const response = await getCompanies(token);
//         if (response.success) {
//           setCompanies(response.data);
//         }
//       } catch (error) {
//         console.error('Error fetching companies:', error);
//       }
//     };
//     fetchCompanies();
//   }, []);

//   useEffect(() => {
//     if (shift) {
//       setFormData({
//         name: shift.name || '',
//         startTime: shift.startTime || '',
//         endTime: shift.endTime || '',
//         gracePeriod: shift.gracePeriod || '',
//         overtimeThreshold: shift.overtimeThreshold || '', // It's already in minutes
//         companyId: shift.companyId?._id || shift.companyId || '',
//       });
//     } else {
//       setFormData({
//         name: '',
//         startTime: '',
//         endTime: '',
//         gracePeriod: '',
//         overtimeThreshold: '',
//         companyId: '',
//       });
//     }
//     setErrors({});
//   }, [shift]);

//   const validate = () => {
//     const newErrors = {};

//     if (!formData.companyId) newErrors.companyId = 'Company is required';
//     if (!formData.name) newErrors.name = 'Name is required';
//     if (!formData.startTime) newErrors.startTime = 'Start time is required';
//     if (!formData.endTime) newErrors.endTime = 'End time is required';

//     const grace = parseInt(formData.gracePeriod, 10);
//     if (isNaN(grace) || grace < 0 || grace > 120) {
//       newErrors.gracePeriod = 'Grace period must be 0–120 minutes';
//     }

//     const ot = parseInt(formData.overtimeThreshold, 10);
//     if (isNaN(ot) || ot < 0 || ot > 240) {
//       newErrors.overtimeThreshold = 'Overtime threshold must be 0–240 minutes';
//     }

//     // Validate start < end (unless full day)
//     const [sh, sm] = formData.startTime.split(':').map(Number);
//     const [eh, em] = formData.endTime.split(':').map(Number);
//     const startMin = sh * 60 + sm;
//     const endMin = eh * 60 + em;
//     const diff = endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
//     if (diff < 60) {
//       newErrors.timeRange = 'Shift must be at least 1 hour';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//     setErrors({ ...errors, [name]: '' });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     const graceMins = parseInt(formData.gracePeriod, 10) || 0;
//     const otMins = parseInt(formData.overtimeThreshold, 10) || 0;

//     const dataToSave = {
//       ...formData,
//       gracePeriod: graceMins,
//       overtimeThreshold: otMins, // Send as minutes to backend
//     };

//     onSave(dataToSave);
//   };

//   return (
//     <div className="shift-form-modal">
//       <div className="shift-form-container">
//         <div className="mt-3 text-center">
//           <h3 className="shift-form-title">{shift ? 'Edit Shift' : 'Add Shift'}</h3>
//           <form onSubmit={handleSubmit} className="mt-2">

//             {/* COMPANY */}
//             <div className="shift-form-group">
//               <label htmlFor="companyId">Company *</label>
//               <select
//                 name="companyId"
//                 value={formData.companyId}
//                 onChange={handleChange}
//                 required
//                 disabled={!!shift}
//                 className={errors.companyId ? 'error' : ''}
//               >
//                 <option value="">Select Company</option>
//                 {companies.map(company => (
//                   <option key={company._id} value={company._id}>{company.name}</option>
//                 ))}
//               </select>
//               {errors.companyId && <span className="error-text">{errors.companyId}</span>}
//             </div>

//             {/* NAME */}
//             <div className="shift-form-group">
//               <label htmlFor="name">Name *</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//                 disabled={!!shift}
//                 className={errors.name ? 'error' : ''}
//               />
//               {errors.name && <span className="error-text">{errors.name}</span>}
//             </div>

//             {/* TIME */}
//             <div className="shift-form-group">
//               <label htmlFor="startTime">Start Time *</label>
//               <input
//                 type="time"
//                 name="startTime"
//                 value={formData.startTime}
//                 onChange={handleChange}
//                 required
//                 className={errors.startTime ? 'error' : ''}
//               />
//               {errors.startTime && <span className="error-text">{errors.startTime}</span>}
//             </div>

//             <div className="shift-form-group">
//               <label htmlFor="endTime">End Time *</label>
//               <input
//                 type="time"
//                 name="endTime"
//                 value={formData.endTime}
//                 onChange={handleChange}
//                 required
//                 className={errors.endTime ? 'error' : ''}
//               />
//               {errors.endTime && <span className="error-text">{errors.endTime}</span>}
//               {errors.timeRange && <span className="error-text">{errors.timeRange}</span>}
//             </div>

//             {/* GRACE PERIOD */}
//             <div className="shift-form-group">
//               <label htmlFor="gracePeriod">Grace Period (minutes)</label>
//               <input
//                 type="number"
//                 name="gracePeriod"
//                 value={formData.gracePeriod}
//                 onChange={handleChange}
//                 min="0"
//                 max="120"
//                 placeholder="e.g. 15"
//                 className={errors.gracePeriod ? 'error' : ''}
//               />
//               {errors.gracePeriod && <span className="error-text">{errors.gracePeriod}</span>}
//             </div>

//             {/* OVERTIME THRESHOLD */}
//             <div className="shift-form-group">
//               <label htmlFor="overtimeThreshold">Overtime Threshold (minutes)</label>
//               <input
//                 type="number"
//                 name="overtimeThreshold"
//                 value={formData.overtimeThreshold}
//                 onChange={handleChange}
//                 min="0"
//                 max="240"
//                 placeholder="e.g. 30"
//                 className={errors.overtimeThreshold ? 'error' : ''}
//               />
//               <small className="help-text">Overtime starts after working hours + this threshold</small>
//               {errors.overtimeThreshold && <span className="error-text">{errors.overtimeThreshold}</span>}
//             </div>

//             {/* ACTIONS */}
//             <div className="shift-form-actions">
//               <button type="submit" className="shift-form-submit-button">
//                 {shift ? 'Update' : 'Create'}
//               </button>
//               <button type="button" onClick={onClose} className="shift-form-cancel-button">
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShiftForm;



import React, { useState, useEffect } from 'react';
import { getCompanies } from '../api/company';
import '../styles/ShiftForm.css';

const ShiftForm = ({ shift, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    gracePeriod: '',
    overtimeThreshold: '', // in MINUTES
    companyId: '',
    weekendDays: [5, 6] // Default: Friday & Saturday
  });

  const [companies, setCompanies] = useState([]);
  const [errors, setErrors] = useState({});
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await getCompanies(token);
        if (response.success) {
          setCompanies(response.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name || '',
        startTime: shift.startTime || '',
        endTime: shift.endTime || '',
        gracePeriod: shift.gracePeriod || '',
        overtimeThreshold: shift.overtimeThreshold || '', // It's already in minutes
        companyId: shift.companyId?._id || shift.companyId || '',
        weekendDays: shift.weekendDays || [5, 6]
      });
    } else {
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
        gracePeriod: '',
        overtimeThreshold: '',
        companyId: '',
        weekendDays: [5, 6]
      });
    }
    setErrors({});
  }, [shift]);

  const validate = () => {
    const newErrors = {};

    if (!formData.companyId) newErrors.companyId = 'Company is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    const grace = parseInt(formData.gracePeriod, 10);
    if (isNaN(grace) || grace < 0 || grace > 120) {
      newErrors.gracePeriod = 'Grace period must be 0–120 minutes';
    }

    const ot = parseInt(formData.overtimeThreshold, 10);
    if (isNaN(ot) || ot < 0 || ot > 240) {
      newErrors.overtimeThreshold = 'Overtime threshold must be 0–240 minutes';
    }

    // Validate start < end (unless full day)
    const [sh, sm] = formData.startTime.split(':').map(Number);
    const [eh, em] = formData.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const diff = endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
    if (diff < 60) {
      newErrors.timeRange = 'Shift must be at least 1 hour';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleWeekendChange = (dayIndex) => {
    const weekendDays = formData.weekendDays || [];
    if (weekendDays.includes(dayIndex)) {
      setFormData({
        ...formData,
        weekendDays: weekendDays.filter(d => d !== dayIndex)
      });
    } else {
      setFormData({
        ...formData,
        weekendDays: [...weekendDays, dayIndex]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const graceMins = parseInt(formData.gracePeriod, 10) || 0;
    const otMins = parseInt(formData.overtimeThreshold, 10) || 0;

    const dataToSave = {
      ...formData,
      gracePeriod: graceMins,
      overtimeThreshold: otMins, // Send as minutes to backend
      weekendDays: formData.weekendDays || [5, 6]
    };

    onSave(dataToSave);
  };

  return (
    <div className="shift-form-modal">
      <div className="shift-form-container">
        <div className="mt-3 text-center">
          <h3 className="shift-form-title">{shift ? 'Edit Shift' : 'Add Shift'}</h3>
          <form onSubmit={handleSubmit} className="mt-2">

            {/* COMPANY */}
            <div className="shift-form-group">
              <label htmlFor="companyId">Company *</label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                required
                disabled={!!shift}
                className={errors.companyId ? 'error' : ''}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>{company.name}</option>
                ))}
              </select>
              {errors.companyId && <span className="error-text">{errors.companyId}</span>}
            </div>

            {/* NAME */}
            <div className="shift-form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={!!shift}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* TIME */}
            <div className="shift-form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className={errors.startTime ? 'error' : ''}
              />
              {errors.startTime && <span className="error-text">{errors.startTime}</span>}
            </div>

            <div className="shift-form-group">
              <label htmlFor="endTime">End Time *</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className={errors.endTime ? 'error' : ''}
              />
              {errors.endTime && <span className="error-text">{errors.endTime}</span>}
              {errors.timeRange && <span className="error-text">{errors.timeRange}</span>}
            </div>

            {/* GRACE PERIOD */}
            <div className="shift-form-group">
              <label htmlFor="gracePeriod">Grace Period (minutes)</label>
              <input
                type="number"
                name="gracePeriod"
                value={formData.gracePeriod}
                onChange={handleChange}
                min="0"
                max="120"
                placeholder="e.g. 15"
                className={errors.gracePeriod ? 'error' : ''}
              />
              {errors.gracePeriod && <span className="error-text">{errors.gracePeriod}</span>}
            </div>

            {/* OVERTIME THRESHOLD */}
            <div className="shift-form-group">
              <label htmlFor="overtimeThreshold">Overtime Threshold (minutes)</label>
              <input
                type="number"
                name="overtimeThreshold"
                value={formData.overtimeThreshold}
                onChange={handleChange}
                min="0"
                max="240"
                placeholder="e.g. 30"
                className={errors.overtimeThreshold ? 'error' : ''}
              />
              <small className="help-text">Overtime starts after working hours + this threshold</small>
              {errors.overtimeThreshold && <span className="error-text">{errors.overtimeThreshold}</span>}
            </div>

            {/* WEEKEND DAYS */}
            <div className="shift-form-group">
              <label>Weekend Days</label>
              <div className="weekend-days-container">
                {dayNames.map((day, index) => (
                  <label key={index} className="weekend-day-label">
                    <input
                      type="checkbox"
                      checked={(formData.weekendDays || []).includes(index)}
                      onChange={() => handleWeekendChange(index)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="shift-form-actions">
              <button type="submit" className="shift-form-submit-button">
                {shift ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={onClose} className="shift-form-cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShiftForm;