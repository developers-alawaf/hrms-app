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


import { useState, useEffect, useContext, useMemo } from 'react';
import Select from 'react-select';
import { AuthContext } from '../context/AuthContext';
import { getLeaveSummary } from '../api/leave';
import { getEmployees } from '../api/employee';
import '../styles/Employee.css';

const leaveTypes = [
  { key: 'casual', label: 'Casual Leave' },
  { key: 'sick', label: 'Sick Leave' },
  { key: 'annual', label: 'Annual Leave' },
  { key: 'maternity', label: 'Maternity Leave' },
];

const safeValue = (val) => (val === 'N/A' ? 'N/A' : (val ?? 0));

const LeaveBalanceTable = ({ leaveSummary, onRefresh }) => {
  if (!leaveSummary) return null;
  const { entitlement = {}, taken = {}, balance = {}, gender, year = new Date().getFullYear() } = leaveSummary;

  return (
    <>
      <div className="employee-header">
        <h2 className="employee-title">
          Leave Balance - {year}
        </h2>
        {leaveSummary.employeeName && (
          <p className="leave-balance-employee-name">Employee: {leaveSummary.employeeName}</p>
        )}
        {onRefresh && (
          <div className="leave-balance-refresh-wrap">
            <button
              type="button"
              onClick={onRefresh}
              className="employee-button leave-balance-refresh-btn"
              aria-label="Refresh leave balance"
            >
              Refresh Balance
            </button>
          </div>
        )}
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
    </>
  );
};

const MyLeaveBalance = () => {
  const { user } = useContext(AuthContext);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Super Admin: employee search
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployeeLeaveSummary, setSelectedEmployeeLeaveSummary] = useState(null);
  const [loadingEmployeeSummary, setLoadingEmployeeSummary] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isSuperAdmin = user?.role === 'Super Admin';

  // Fetch own leave balance (for non-Super Admin)
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
      const response = await getLeaveSummary(user.employeeId, currentYear, token);

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

  // Super Admin: fetch employees list
  useEffect(() => {
    if (!isSuperAdmin) return;
    const loadEmployees = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await getEmployees(token);
        if (res?.success && Array.isArray(res.data)) {
          setEmployees(
            res.data
              .filter((e) => e._id && (e.fullName || e.newEmployeeCode))
              .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
          );
        }
      } catch (err) {
        console.error('Error fetching employees for selector:', err);
      }
    };
    loadEmployees();
  }, [isSuperAdmin]);

  // Super Admin: fetch leave summary when employee selected
  useEffect(() => {
    if (!isSuperAdmin || !selectedEmployeeId) {
      setSelectedEmployeeLeaveSummary(null);
      return;
    }
    let cancelled = false;
    setLoadingEmployeeSummary(true);
    setSelectedEmployeeLeaveSummary(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingEmployeeSummary(false);
      return;
    }

    getLeaveSummary(selectedEmployeeId, selectedYear, token)
      .then((res) => {
        if (!cancelled && res?.success && res.data) {
          setSelectedEmployeeLeaveSummary(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Error fetching employee leave summary:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployeeSummary(false);
      });

    return () => { cancelled = true; };
  }, [isSuperAdmin, selectedEmployeeId, selectedYear]);

  // Regular user: fetch own balance
  useEffect(() => {
    if (isSuperAdmin) return;
    fetchMyLeaveBalance();
  }, [user, refreshKey, isSuperAdmin]);

  useEffect(() => {
    window.refreshLeaveBalance = () => setRefreshKey((prev) => prev + 1);
    return () => { delete window.refreshLeaveBalance; };
  }, []);

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp._id,
        label: `${emp.fullName || 'Unnamed'}${emp.newEmployeeCode ? ` (${emp.newEmployeeCode})` : ''}`.trim(),
      })),
    [employees]
  );

  const selectedOption = useMemo(
    () => employeeOptions.find((o) => o.value === selectedEmployeeId) ?? null,
    [employeeOptions, selectedEmployeeId]
  );

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [
      { value: current, label: String(current) },
      { value: current - 1, label: String(current - 1) },
      { value: current - 2, label: String(current - 2) },
    ];
  }, []);

  // Loading / Error for regular user (non-Super Admin)
  if (!isSuperAdmin) {
    if (loading) {
      return <div className="employee-message">Loading your leave balance...</div>;
    }
    if (error) {
      return (
        <div className="employee-message employee-error">
          {error}{' '}
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
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

    return (
      <div className="employee-container">
        <LeaveBalanceTable leaveSummary={leaveSummary} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
      </div>
    );
  }

  // Super Admin view
  return (
    <div className="employee-container">
      <section className="leave-balance-admin-section" aria-label="Employee leave balance">
        <div className="leave-balance-section-head">
          <h2 className="leave-balance-section-title">Employee leave balance</h2>
          <div className="leave-balance-controls">
            <Select
              className="leave-balance-employee-select"
              classNamePrefix="leave-balance-select"
              options={employeeOptions}
              value={selectedOption}
              onChange={(opt) => setSelectedEmployeeId(opt?.value ?? '')}
              placeholder="Search and select employee..."
              isClearable
              isSearchable
              aria-label="Select employee"
              styles={{
                control: (base) => ({
                  ...base,
                  minWidth: 260,
                  background: 'var(--app-surface)',
                  borderColor: 'var(--app-border)',
                  '&:hover': { borderColor: 'var(--app-accent)' },
                }),
                menu: (base) => ({
                  ...base,
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? 'var(--app-accent-soft)' : 'transparent',
                  color: 'var(--app-text)',
                }),
                singleValue: (base) => ({ ...base, color: 'var(--app-text)' }),
                input: (base) => ({ ...base, color: 'var(--app-text)' }),
                placeholder: (base) => ({ ...base, color: 'var(--app-text-muted)' }),
              }}
            />
            <select
              className="leave-balance-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select year"
            >
              {yearOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEmployeeId && (
          loadingEmployeeSummary ? (
            <div className="leave-balance-loading-inline">
              <div className="leave-balance-loading-spinner" aria-hidden="true" />
              <span>Loading leave balance...</span>
            </div>
          ) : selectedEmployeeLeaveSummary != null ? (
            <LeaveBalanceTable leaveSummary={selectedEmployeeLeaveSummary} />
          ) : null
        )}

        {selectedEmployeeId && !loadingEmployeeSummary && selectedEmployeeLeaveSummary == null && (
          <p className="leave-balance-empty-state">No leave data available for this employee.</p>
        )}

        {!selectedEmployeeId && (
          <p className="leave-balance-empty-state">Search and select an employee to view their leave balance.</p>
        )}
      </section>
    </div>
  );
};

export default MyLeaveBalance;