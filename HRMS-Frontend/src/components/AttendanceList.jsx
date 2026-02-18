import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getEmployeeAttendance } from "../api/attendance";
import { getEmployees } from "../api/employee";
import * as XLSX from "xlsx";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
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

  // Show only in minutes (e.g., 98 minutes)
  const formatToMinutesOnly = (value, unit = "minutes") => {
    if (!value || value <= 0) return "0 minutes";

    const totalMinutes =
      unit === "minutes"
        ? Math.round(value)
        : Math.round(value * 60);

    const mins = Math.round(totalMinutes);
    return `${mins} minute${mins !== 1 ? "s" : ""}`;
  };

  // Extract original time (no timezone conversion)
  const extractOriginalTime = (ts) => {
    if (!ts) return "-";
    const match = ts.match(/(\d{2}:\d{2})/);
    return match ? match[1] : "-";
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

  // Search filter (resets page)
  useEffect(() => {
    const filtered = attendanceData.filter((rec) =>
      (rec.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchQuery, attendanceData]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchAttendance();
  };

  // Excel Export — minutes only
  const exportToExcel = () => {
    const exportData = filteredData.map((record) => ({
      "Employee Name": record.fullName,
      "HRMS ID": record.employeeCode,
      Date: record.date,
      "Check In": extractOriginalTime(record.check_in),
      "Check Out": extractOriginalTime(record.check_out),
      "Work Hours": typeof record.work_hours === 'string' ? record.work_hours : (record.work_hours?.toFixed(2) || "0.00"),
      Status: record.status,
      "Late By": formatToMinutesOnly(record.lateBy, "minutes"),
      "Overtime": typeof record.overtimeHours === 'string' ? record.overtimeHours : formatToMinutesOnly(record.overtimeHours, "hours"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${startDate || "start"}_${endDate || "end"}.xlsx`);
  };

  // Pagination
  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  if (loading) return <div className="employee-message">Loading...</div>;
  if (error) return <div className="employee-message employee-error">{error}</div>;

  return (
    <div className="attendance-container">
      <h2 className="employee-title">Attendance</h2>

      <div className="attendance-filters">
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" className="employee-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" className="employee-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
              <th>HRMS ID</th>
              <th>Name</th>
              
              <th>Date</th>
              <th>Day</th>
              <th>In</th>
              <th>Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Late By</th>
              <th>Overtime</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              currentRecords.map((record, idx) => (
                <tr key={`${record.employeeId}-${record.date}-${idx}`}>
                  <td>{record.employeeCode}</td>
                  <td>{record.fullName}</td>
                  
                  <td>{record.date}</td>
                  <td>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                  <td>{formatTime12h(record.check_in)}</td>
                  <td>{formatTime12h(record.check_out)}</td>
                  <td>{typeof record.work_hours === 'string' ? record.work_hours : (record.work_hours ? record.work_hours.toFixed(2) : "0.00")}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{formatToMinutesOnly(record.lateBy, "minutes")}</td>
                  <td>{typeof record.overtimeHours === 'string' ? record.overtimeHours : formatToMinutesOnly(record.overtimeHours, "hours")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > recordsPerPage && (
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
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