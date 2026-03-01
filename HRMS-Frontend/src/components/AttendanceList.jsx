import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getEmployeeAttendance } from "../api/attendance";
import { getEmployees } from "../api/employee";
import * as XLSX from "xlsx";
import "../styles/Dashboard.css";
import "../styles/Attendance.css";

const AttendanceList = () => {
  const { user } = useContext(AuthContext);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const allowedRoles = ["Super Admin", "C-Level Executive", "Company Admin", "HR Manager"];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Present':
        return 'status-present';
      case 'Absent':
        return 'status-absent';
      case 'Holiday':
        return 'status-holiday';
      case 'Leave':
        return 'status-leave';
      case 'Incomplete':
        return 'status-incomplete';
      case 'Weekend':
        return 'status-weekend';
      case 'Remote':
        return 'status-remote';
      default:
        return '';
    }
  };

  // Format total minutes as "Xh Ym" (e.g. 98 -> "1h 38m", 0 -> "0h 0m")
  const formatMinutesToHoursMinutes = (totalMinutes) => {
    const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Parse "Xh Ym" string to total minutes (for Excel/display normalization)
  const parseHoursMinutesToMinutes = (val) => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number' && !Number.isNaN(val)) return Math.round(val);
    if (typeof val === 'string') {
      const match = val.match(/(\d+)\s*h\s*(\d+)\s*m/i);
      if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return 0;
  };

  // Display late by: backend sends minutes (number). Show as "Xh Ym"
  const formatLateBy = (val) => formatMinutesToHoursMinutes(val);

  // Display overtime/shortfall: backend sends "Xh Ym" string. Normalize and show hours + minutes
  const formatOvertime = (val) => {
    if (val == null || val === '') return '0h 0m';
    if (typeof val === 'string' && /^\d+\s*h\s*\d+\s*m$/i.test(val.trim())) return val.trim();
    const mins = parseHoursMinutesToMinutes(val);
    return formatMinutesToHoursMinutes(mins);
  };

  // Check if time value is non-zero (has meaningful data to show)
  const hasTimeValue = (val, isMinutes = false) => {
    if (val == null || val === '') return false;
    const mins = isMinutes ? Math.round(Number(val) || 0) : parseHoursMinutesToMinutes(val);
    return mins > 0;
  };

  // Extract original time without timezone conversion
  const extractOriginalTime = (ts) => {
    if (!ts) return "-";
    const match = String(ts).match(/(\d{2}:\d{2})/);
    return match ? match[1] : "-";
  };

  const getDateKey = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const normalizeCheckInOut = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return { checkIn, checkOut };
    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();
    const inDateKey = getDateKey(checkIn);
    const outDateKey = getDateKey(checkOut);
    if (!Number.isNaN(inTime) && !Number.isNaN(outTime) && inTime > outTime && inDateKey === outDateKey) {
      return { checkIn: checkOut, checkOut: checkIn };
    }
    return { checkIn, checkOut };
  };

  // Format time as 12-hour with AM/PM (e.g. "09:36 AM", "08:18 PM")
  const formatTime12h = (ts) => {
    const timeStr = extractOriginalTime(ts);
    if (!timeStr || timeStr === "-") return "-";
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] != null ? String(parseInt(parts[1], 10) || 0).padStart(2, "0") : "00";
    if (Number.isNaN(hours)) return timeStr;
    const period = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${minutes} ${period}`;
  };

  // Fetch Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await getEmployees(token);
        if (res.success) setEmployees(res.data);
      } catch (err) {
        console.error("Error fetching employees", err);
      }
    };
    if (user && allowedRoles.includes(user.role)) fetchEmployees();
  }, [user]);

  // Date helpers
  const getMonthStart = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const getMonthEnd = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // Fetch Attendance + Sort by newest date first
  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const finalStart = startDate || getMonthStart();
      const finalEnd = endDate || getMonthEnd();
      const employeeToFetch = allowedRoles.includes(user.role)
        ? selectedEmployee || null
        : user.employeeId;

      const data = await getEmployeeAttendance(finalStart, finalEnd, employeeToFetch, token);

      if (data.success) {
        const rawData = data.data || [];

        // NEWEST DATE FIRST
        const sortedData = rawData.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });

        setAttendanceData(sortedData);
        setFilteredData(sortedData);
      } else {
        setError("Could not load attendance.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Search + Status filter (resets page)
  useEffect(() => {
    let filtered = attendanceData.filter((rec) =>
      (rec.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter) {
      filtered = filtered.filter((rec) => (rec.status || "") === statusFilter);
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, attendanceData]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchAttendance();
  };

  // Excel Export — hours and minutes (Xh Ym format)
  const exportToExcel = () => {
    const exportData = filteredData.map((record) => ({
      "Employee Name": record.fullName,
      "HRMS ID": record.employeeCode,
      Date: record.date,
      "Check In": extractOriginalTime(record.check_in),
      "Check Out": extractOriginalTime(record.check_out),
      "Work Hours": typeof record.work_hours === 'string' ? record.work_hours : (record.work_hours?.toFixed(2) || "0.00"),
      Status: record.status,
      "Late By": formatLateBy(record.lateBy),
      "Shortfall": formatOvertime(record.workShortfall),
      "Overtime": formatOvertime(record.overtimeHours),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${startDate || "start"}_${endDate || "end"}.xlsx`);
  };

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRecords = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;

  if (loading) return <div className="employee-message">Loading...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="attendance-container">
      <header className="dashboard-header" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <Link to="/dashboard" className="dashboard-card__link" style={{ fontSize: "0.875rem" }}>← Back to Dashboard</Link>
        <h1 className="dashboard-title" style={{ margin: 0 }}>Attendance</h1>
      </header>

      <div className="attendance-filters">
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" className="employee-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" className="employee-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="employee-input">
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Remote">Remote</option>
            <option value="Leave">Leave</option>
            <option value="Holiday">Holiday</option>
            <option value="Weekend">Weekend</option>
            <option value="Incomplete">Incomplete</option>
          </select>
        </div>

        {user && allowedRoles.includes(user.role) && (
          <>
            <div className="form-group">
              <label>Employee</label>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="employee-input">
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Search Name</label>
              <input
                type="text"
                className="employee-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
              />
            </div>
          </>
        )}

        <div className="filter-buttons">
          <button onClick={handleFilter} className="employee-button">Filter</button>
          <button onClick={exportToExcel} className="employee-button">Export to Excel</button>
        </div>
        
      </div>

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              {/* <th>HRMS ID</th> */}
              <th>Name</th>
              
              <th>Date</th>
              <th>Day</th>
              <th>In</th>
              <th>Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Late By</th>
              <th>Shortfall</th>
              <th>Overtime</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "20px" }}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              currentRecords.map((record, idx) => (
                <tr key={`${record.employeeId}-${record.date}-${idx}`}>
                  {/* <td>{record.employeeCode}</td> */}
                  <td>{record.fullName}</td>
                  
                  <td>{record.date}</td>
                  <td>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                  {(() => {
                    const { checkIn, checkOut } = normalizeCheckInOut(record.check_in, record.check_out);
                    return (
                      <>
                        <td>{formatTime12h(checkIn)}</td>
                        <td>{formatTime12h(checkOut)}</td>
                      </>
                    );
                  })()}
                  <td>{typeof record.work_hours === 'string' ? record.work_hours : (record.work_hours ? record.work_hours.toFixed(2) : "0.00")}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="attendance-time-cell">
                    {hasTimeValue(record.lateBy, true) ? (
                      <span className="time-badge time-badge--late">
                        {formatLateBy(record.lateBy)}
                      </span>
                    ) : (
                      <span className="attendance-empty">—</span>
                    )}
                  </td>
                  <td className="attendance-time-cell">
                    {hasTimeValue(record.workShortfall) ? (
                      <span className="time-badge time-badge--shortfall">
                        {formatOvertime(record.workShortfall)}
                      </span>
                    ) : (
                      <span className="attendance-empty">—</span>
                    )}
                  </td>
                  <td className="attendance-time-cell">
                    {hasTimeValue(record.overtimeHours) ? (
                      <span className="time-badge time-badge--overtime">
                        {formatOvertime(record.overtimeHours)}
                      </span>
                    ) : (
                      <span className="attendance-empty">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <div className="pagination-controls">
          <label htmlFor="rowsPerPageAttendance" className="rows-per-page-label">Rows per page</label>
          <select
            id="rowsPerPageAttendance"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="employee-input rows-per-page-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};


export default AttendanceList;