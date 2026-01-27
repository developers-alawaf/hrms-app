import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getShiftBasedAttendance } from '../../api/shiftManagement';
import '../../styles/Roster.css';
import '../../styles/ShiftAttendance.css';
import * as XLSX from 'xlsx';

const ShiftAttendance = () => {
    const { user } = useContext(AuthContext);
    const [attendanceData, setAttendanceData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 20;

    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'Manager', 'Employee'].includes(user?.role);

    // Get current month dates
    const getMonthStart = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    };

    const getMonthEnd = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = new Date(y, m, 0).getDate();
        return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const fetchAttendance = async () => {
        setLoading(true);
        setError('');
        try {
            const finalStart = startDate || getMonthStart();
            const finalEnd = endDate || getMonthEnd();
            
            const res = await getShiftBasedAttendance(finalStart, finalEnd);
            if (res.data && res.data.success) {
                setAttendanceData(res.data.data || []);
                setFilteredData(res.data.data || []);
            } else {
                setError('Failed to load attendance data');
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError(err.response?.data?.message || 'Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchAttendance();
        }
    }, [isAuthorized]);

    // Search filter
    useEffect(() => {
        const filtered = attendanceData.filter(record =>
            (record.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (record.employeeCode || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchQuery, attendanceData]);

    const handleFilter = () => {
        setCurrentPage(1);
        fetchAttendance();
    };

    const exportToExcel = () => {
        const exportData = filteredData.map(record => ({
            'Employee Code': record.employeeCode,
            'Employee Name': record.employeeName,
            'Date': record.date,
            'Shift Name': record.shiftName,
            'Shift Code': record.shiftCode,
            'Office Start Time': record.officeStartTime || '-',
            'Office End Time': record.officeEndTime || '-',
            'Office Hours': record.officeHours.toFixed(2),
            'WFH Status': record.wfhStatus ? 'Yes' : 'No',
            'WFH Start Time': record.wfhStartTime || '-',
            'WFH End Time': record.wfhEndTime || '-',
            'WFH Hours': record.wfhHours.toFixed(2),
            'Total Work Hours': record.totalWorkHours.toFixed(2),
            'Status': record.status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Shift Attendance');
        XLSX.writeFile(wb, `shift_attendance_${startDate || 'start'}_${endDate || 'end'}.xlsx`);
    };

    // Pagination
    const indexOfLast = currentPage * recordsPerPage;
    const indexOfFirst = indexOfLast - recordsPerPage;
    const currentRecords = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);

    const getStatusClass = (status) => {
        switch (status) {
            case 'Present':
                return 'status-present';
            case 'Absent':
                return 'status-absent';
            case 'Incomplete':
                return 'status-incomplete';
            case 'Holiday':
                return 'status-holiday';
            case 'Leave':
                return 'status-leave';
            case 'Weekend':
                return 'status-weekend';
            default:
                return '';
        }
    };

    if (!isAuthorized) {
        return <div className="roster-message roster-error">Access Denied</div>;
    }

    return (
        <div className="shift-attendance-container">
            <div className="roster-card">
                <h3 className="roster-card-title">Shift-Based Attendance (NOC Department)</h3>

                {/* Filters */}
                <div className="planner-controls">
                    <div className="planner-control-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="planner-control-input"
                        />
                    </div>
                    <div className="planner-control-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="planner-control-input"
                        />
                    </div>
                    <div className="planner-control-group">
                        <label>Search</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or code..."
                            className="planner-control-input"
                        />
                    </div>
                    <button onClick={handleFilter} className="submit-roster-button">
                        Filter
                    </button>
                    <button onClick={exportToExcel} className="submit-roster-button export-button">
                        Export to Excel
                    </button>
                </div>

                {error && <div className="message-box error-message-box">{error}</div>}

                {loading ? (
                    <div className="shift-attendance-message">Loading attendance data...</div>
                ) : (
                    <>
                        <div className="attendance-table-wrapper">
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Employee Code</th>
                                        <th>Employee Name</th>
                                        <th>Date</th>
                                        <th>Shift</th>
                                        <th>Office Start</th>
                                        <th>Office End</th>
                                        <th>Office Hours</th>
                                        <th>WFH</th>
                                        <th>WFH Start</th>
                                        <th>WFH End</th>
                                        <th>WFH Hours</th>
                                        <th>Outside Work</th>
                                        <th>Out Time</th>
                                        <th>Return Time</th>
                                        <th>Outside Work Hours</th>
                                        <th>Total Hours</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="17" style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentRecords.map((record, idx) => (
                                            <tr key={`${record.employeeId}-${record.date}-${idx}`}>
                                                <td>{record.employeeCode}</td>
                                                <td>{record.employeeName}</td>
                                                <td>{record.date}</td>
                                                <td>{record.shiftName}</td>
                                                <td>{record.officeStartTime || '-'}</td>
                                                <td>{record.officeEndTime || '-'}</td>
                                                <td>{record.officeHours?.toFixed(2) || '0.00'}</td>
                                                <td className={record.wfhStatus ? 'wfh-yes' : 'wfh-no'}>
                                                    {record.wfhStatus ? 'Yes' : 'No'}
                                                </td>
                                                <td>{record.wfhStartTime || '-'}</td>
                                                <td>{record.wfhEndTime || '-'}</td>
                                                <td>{record.wfhHours?.toFixed(2) || '0.00'}</td>
                                                <td className={record.outsideWorkStatus ? 'wfh-yes' : 'wfh-no'}>
                                                    {record.outsideWorkStatus ? 'Yes' : 'No'}
                                                </td>
                                                <td>{record.outsideWorkOutTime || '-'}</td>
                                                <td>{record.outsideWorkReturnTime || '-'}</td>
                                                <td>{record.outsideWorkHours?.toFixed(2) || '0.00'}</td>
                                                <td className="total-hours">
                                                    {record.totalWorkHours?.toFixed(2) || '0.00'}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${getStatusClass(record.status)}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredData.length > recordsPerPage && (
                            <div className="pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="pagination-button"
                                >
                                    Previous
                                </button>
                                <span style={{ margin: '0 15px', color: '#fff' }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
        </div>
    );
};

export default ShiftAttendance;