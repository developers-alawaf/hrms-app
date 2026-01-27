// // import { useState, useEffect, useContext } from 'react';
// // import { AuthContext } from '../context/AuthContext';
// // import { getLeaveSummary } from '../api/leave';
// // import '../styles/Employee.css'; // Using employee styles for consistency

// // const MyLeaveBalance = () => {
// //   const { user } = useContext(AuthContext);
// //   const [leaveSummary, setLeaveSummary] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');

// //   useEffect(() => {
// //     const fetchMyLeaveBalance = async () => {
// //       if (!user || !user.employeeId) {
// //         setError('User not logged in or user ID not available.');
// //         setLoading(false);
// //         return;
// //       }

// //       const currentYear = new Date().getFullYear();

// //       try {
// //         const token = localStorage.getItem('token');
// //         const response = await getLeaveSummary(user.employeeId, currentYear, token);
// //         if (response.success) {
// //           setLeaveSummary(response.data);
// //         } else {
// //           setError(response.error || 'Failed to fetch leave summary.');
// //         }
// //       } catch (err) {
// //         setError(err.message || 'An error occurred while fetching leave summary.');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchMyLeaveBalance();
// //   }, [user]);

// //   if (loading) {
// //     return <div className="employee-message">Loading leave balance...</div>;
// //   }

// //   if (error) {
// //     return <div className="employee-message employee-error">{error}</div>;
// //   }

// //   if (!leaveSummary || !leaveSummary.entitlement || !leaveSummary.taken || !leaveSummary.balance) {
// //     return <div className="employee-message">No leave summary data available.</div>;
// //   }

// //   const leaveTypes = ['casual', 'sick', 'annual', 'maternity', 'festive'];

// //   return (
// //     <div className="employee-container">
// //       <div className="employee-header">
// //         <h2 className="employee-title">My Leave Balance</h2>
// //       </div>
// //       <div className="employee-table-container">
// //         <table className="employee-table">
// //           <thead>
// //             <tr>
// //               <th>Leave Type</th>
// //               <th>Entitlement (days)</th>
// //               <th>Taken (days)</th>
// //               <th>Balance (days)</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {leaveTypes.map(type => (
// //               <tr key={type}>
// //                 <td>{type.charAt(0).toUpperCase() + type.slice(1)}</td>
// //                 <td>{leaveSummary.entitlement[type] || 0}</td>
// //                 <td>{leaveSummary.taken[type] || 0}</td>
// //                 <td>{leaveSummary.balance[type] || 0}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>
// //     </div>
// //   );
// // };

// // export default MyLeaveBalance;


// import { useState, useEffect, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { getLeaveSummary } from '../api/leave';
// import '../styles/Employee.css';

// const MyLeaveBalance = () => {
//   const { user } = useContext(AuthContext);
//   const [leaveSummary, setLeaveSummary] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const fetchMyLeaveBalance = async () => {
//       if (!user || !user.employeeId) {
//         setError('User not authenticated.');
//         setLoading(false);
//         return;
//       }

//       const currentYear = new Date().getFullYear();

//       try {
//         const token = localStorage.getItem('token');
//         const response = await getLeaveSummary(user.employeeId, currentYear, token);

//         if (response.success && response.data) {
//           setLeaveSummary(response.data);
//         } else {
//           setError(response.error || 'Failed to load leave balance.');
//         }
//       } catch (err) {
//         setError(err.message || 'Network error. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMyLeaveBalance();
//   }, [user]);

//   // Loading state
//   if (loading) {
//     return <div className="employee-message">Loading your leave balance...</div>;
//   }

//   // Error state
//   if (error) {
//     return <div className="employee-message employee-error">{error}</div>;
//   }

//   // No data
//   if (!leaveSummary) {
//     return <div className="employee-message">No leave data available for this year.</div>;
//   }

//   const { entitlement = {}, taken = {}, balance = {}, gender } = leaveSummary;

//   // Safe access with fallbacks
//   const safeValue = (val) => (val === 'N/A' ? 'N/A' : (val || 0));

//   const leaveTypes = [
//     { key: 'casual', label: 'Casual Leave' },
//     { key: 'sick', label: 'Sick Leave' },
//     { key: 'annual', label: 'Annual Leave' },
//     { key: 'maternity', label: 'Maternity Leave' },
//     { key: 'festive', label: 'Festive Leave' },
//   ];

//   return (
//     <div className="employee-container">
//       <div className="employee-header">
//         <h2 className="employee-title">
//           My Leave Balance - {leaveSummary.year || new Date().getFullYear()}
//         </h2>
//         {leaveSummary.employeeName && (
//           <p className="text-sm text-gray-600">Employee: {leaveSummary.employeeName}</p>
//         )}
//       </div>

//       <div className="employee-table-container">
//         <table className="employee-table">
//           <thead>
//             <tr>
//               <th>Leave Type</th>
//               <th>Entitled</th>
//               <th>Taken</th>
//               <th>Remaining</th>
//             </tr>
//           </thead>
//           <tbody>
//             {leaveTypes.map(({ key, label }) => {
//               const isMaternity = key === 'maternity';
//               const showNA = isMaternity && gender !== 'Female';

//               return (
//                 <tr key={key}>
//                   <td>{label}</td>
//                   <td>{showNA ? 'N/A' : safeValue(entitlement[key])}</td>
//                   <td>{showNA ? '–' : safeValue(taken[key])}</td>
//                   <td className={showNA ? 'text-gray-500' : (balance[key] <= 2 ? 'text-red-600 font-bold' : '')}>
//                     {showNA ? 'Not Eligible' : safeValue(balance[key])}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {/* Optional: Legend for low balance */}
//         {/* <div className="mt-4 text-sm text-gray-600">
//           <p>
//             <span className="inline-block w-3 h-3 bg-red-600 rounded mr-2"></span>
//             Less than or equal to 2 days remaining
//           </p>
//         </div> */}
//       </div>
//     </div>
//   );
// };

// export default MyLeaveBalance;


import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLeaveSummary } from '../api/leave';
import '../styles/Employee.css';

const MyLeaveBalance = () => {
  const { user } = useContext(AuthContext);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add a refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to fetch leave balance
  const fetchMyLeaveBalance = async () => {
    if (!user || !user.employeeId) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    const currentYear = new Date().getFullYear();

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await getLeaveSummary(
        user.employeeId,
        currentYear,
        token
      );

      if (response.success && response.data) {
        setLeaveSummary(response.data);
        setError('');
      } else {
        setError(response.error || 'Failed to load leave balance.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount + when refreshKey changes
  useEffect(() => {
    fetchMyLeaveBalance();
  }, [user, refreshKey]);

  // Expose refresh function to parent components
  useEffect(() => {
    // Make refresh function globally available (optional)
    window.refreshLeaveBalance = () => {
      setRefreshKey(prev => prev + 1);
    };
  }, []);

  // Loading / Error / Empty states
  if (loading) {
    return <div className="employee-message">Loading your leave balance...</div>;
  }

  if (error) {
    return (
      <div className="employee-message employee-error">
        {error}{' '}
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)} 
          className="underline text-blue-600 ml-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!leaveSummary) {
    return <div className="employee-message">No leave data available.</div>;
  }

  const { entitlement = {}, taken = {}, balance = {}, gender, year = new Date().getFullYear() } = leaveSummary;

  const safeValue = (val) => (val === 'N/A' ? 'N/A' : (val ?? 0));

  const leaveTypes = [
    { key: 'casual', label: 'Casual Leave' },
    { key: 'sick', label: 'Sick Leave' },
    { key: 'annual', label: 'Annual Leave' },
    { key: 'maternity', label: 'Maternity Leave' },
    // { key: 'festive', label: 'Festive Leave' },
  ];

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h2 className="employee-title">
          My Leave Balance - {year}
        </h2>
        {leaveSummary.employeeName && (
          <p className="text-sm text-gray-600">Employee: {leaveSummary.employeeName}</p>
        )}
        <div className="mt-2">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Refresh Balance
          </button>
        </div>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Entitled</th>
              <th>Taken</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.map(({ key, label }) => {
              const isMaternity = key === 'maternity';
              const showNA = isMaternity && gender !== 'Female';

              return (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{showNA ? 'N/A' : safeValue(entitlement[key])}</td>
                  <td>{showNA ? '–' : safeValue(taken[key])}</td>
                  <td className={showNA ? 'text-gray-500' : (balance[key] <= 2 ? 'text-red-600 font-bold' : '')}>
                    {showNA ? 'Not Eligible' : safeValue(balance[key])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyLeaveBalance;