import * as XLSX from 'xlsx';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { uploadRoster, generateRoster, listShifts, getEmployeeRoster, deleteRosterEntry } from '../../api/shiftManagement';
import { getEmployees } from '../../api/employee';
import { getDepartments } from '../../api/department';
import '../../styles/Roster.css';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, Search, Plus, Check, X } from 'lucide-react';

const RosterManagement = () => {
    const { user } = useContext(AuthContext);
    const [rosterFile, setRosterFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [nocDepartmentId, setNocDepartmentId] = useState(null);

    // Visual Planner State
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'week' or 'month'
    const [selectedShift, setSelectedShift] = useState('');
    const [newAssignments, setNewAssignments] = useState({}); // { 'empId-date': shiftId }
    const [existingAssignments, setExistingAssignments] = useState({}); // { 'empId-date': shiftId }
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedDates, setSelectedDates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 10;

    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'Manager'].includes(user?.role);
    const isRegularEmployee = !isAuthorized;

    // Fetch shifts and departments
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch shifts
                const shiftsRes = await listShifts();
                if (shiftsRes.status === 200) setShifts(shiftsRes.data || []);

                // Fetch departments to find NOC
                const deptRes = await getDepartments(token);
                if (deptRes.success && deptRes.data) {
                    const nocDept = deptRes.data.find(d => 
                        d.name && d.name.toLowerCase().includes('noc')
                    );
                    if (nocDept) {
                        setNocDepartmentId(nocDept._id);
                    }
                }
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError('Failed to load data');
            }
        };
        fetchInitialData();
    }, []);

    // Fetch employees when NOC department is found (for authorized users) or for regular employees
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (isAuthorized) {
                    // For authorized users: only fetch if NOC department is found
                    if (nocDepartmentId) {
                        // Use department query parameter to filter on server side
                        const empData = await getEmployees(token, nocDepartmentId);
                        const nocEmployees = (empData && empData.data) || empData || [];
                        setEmployees(nocEmployees);
                    }
                    // Don't fetch if NOC department not found yet - wait for it
                } else if (isRegularEmployee && user?.employeeId) {
                    // For regular employees: create employee object from user context (no API call needed)
                    // The user context already has fullName, employeeId, and department
                    const currentEmployee = {
                        _id: user.employeeId,
                        fullName: user.fullName || 'Employee',
                        name: user.fullName || 'Employee',
                        newEmployeeCode: user.employeeCode || '',
                        department: user.department || null
                    };
                    setEmployees([currentEmployee]);
                }
            } catch (err) {
                console.error('Error fetching employees:', err);
                // Only set error for authorized users, employees don't need API calls
                if (isAuthorized) {
                    setError('Failed to load employees');
                }
            }
        };
        fetchEmployees();
    }, [isAuthorized, isRegularEmployee, user?.employeeId, nocDepartmentId]);

    useEffect(() => {
        const fetchRoster = async () => {
            try {
                setLoading(true);
                // For authorized users: fetch all NOC employees' rosters
                // For regular employees: fetch only their own roster
                const employeeIdToFetch = isAuthorized ? 'all' : (user?.employeeId || 'all');
                const res = await getEmployeeRoster(employeeIdToFetch, month);
                if (res.data && res.data.success) {
                    const fetchedAssignments = res.data.data.reduce((acc, entry) => {
                        if (entry.employee) {
                            const dateStr = entry.date ? (typeof entry.date === 'string' 
                                ? entry.date.split('T')[0] 
                                : new Date(entry.date).toISOString().split('T')[0]) : '';
                            if (dateStr) {
                                const key = `${entry.employee._id}-${dateStr}`;
                                if(entry.shift) {
                                    acc[key] = entry.shift._id;
                                }
                            }
                        }
                        return acc;
                    }, {});
                    setExistingAssignments(fetchedAssignments);
                }
            } catch (err) {
                console.error('Error fetching roster:', err);
                setError('Failed to load roster data');
            } finally {
                setLoading(false);
            }
        };
        fetchRoster();
    }, [month, isAuthorized, user?.employeeId]);

    // Clear assignments when month changes
    useEffect(() => {
        setNewAssignments({});
        setBulkMode(false);
        setSelectedEmployees([]);
        setSelectedDates([]);
    }, [month]);
    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        const formatExportDate = (d) => {
            const day = d.getDate();
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const wsData = [
            ['Name', 'newEmployeeCode', ...displayDates.map(d => formatExportDate(d))],
            ...filteredEmployees.map(emp => [
                emp.fullName || emp.name,
                emp.newEmployeeCode,
                ...displayDates.map(d => {
                    const dateStr = formatDate(d);
                    const key = `${emp._id}-${dateStr}`;
                    const shiftId = allAssignments[key];
                    return shiftId ? getShiftCode(shiftId) : '-';
                })
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Roster');
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();
        XLSX.writeFile(wb, `Roster-${monthName}-${year}.xlsx`);
    };

    const handleFileChange = (e) => {
        setRosterFile(e.target.files[0]);
        setError('');
        setSuccess('');
    };

    const handleFileSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (!rosterFile) throw new Error('Select a file');

            const formData = new FormData();
            formData.append('rosterFile', rosterFile);
            const res = await uploadRoster(formData);
            if (res.status === 201) {
                setSuccess(`${res.data.message} (${res.data.entries} entries)`);
                setRosterFile(null);
                document.getElementById('rosterFile').value = '';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    // Calendar helpers
    const getDisplayDates = () => {
        if (viewMode === 'week') {
            const start = new Date(currentDate);
            const day = start.getDay();
            const diff = start.getDate() - day - 1; // 0 is Sunday, so if it's Sunday, go back 1 day to Saturday
            start.setDate(diff);
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return d;
            });
        } else {
            const [y, m] = month.split('-').map(Number);
            const first = new Date(y, m - 1, 1);
            const last = new Date(y, m, 0).getDate();
            return Array.from({ length: last }, (_, i) => new Date(y, m - 1, i + 1));
        }
    };

    const displayDates = getDisplayDates();

    // Format date to YYYY-MM-DD using local timezone (not UTC) to avoid timezone issues
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const formatHeader = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

    const navigate = (dir) => {
        if (viewMode === 'week') {
            const newD = new Date(currentDate);
            newD.setDate(newD.getDate() + dir * 7);
            setCurrentDate(newD);
        } else {
            const newD = new Date(currentDate);
            newD.setMonth(newD.getMonth() + dir);
            setCurrentDate(newD);
            setMonth(newD.toISOString().slice(0, 7));
        }
    };

    const toggleBulkEmployee = (empId) => {
        setSelectedEmployees(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
    };

    const toggleBulkDate = (dateStr) => {
        setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
    };

    const allAssignments = { ...existingAssignments, ...newAssignments };

    const handleDelete = async (empId, dateStr) => {
        if (window.confirm('Are you sure you want to remove this shift?')) {
            try {
                // Ensure date is in YYYY-MM-DD format
                const dateToDelete = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                await deleteRosterEntry(empId, dateToDelete);
                const key = `${empId}-${dateToDelete}`;
                setExistingAssignments(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                });
                // Also remove from newAssignments if it exists there
                setNewAssignments(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                });
                setSuccess('Shift removed successfully.');
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                console.error('Error deleting shift:', err);
                setError(err.response?.data?.message || 'Failed to remove shift.');
            }
        }
    };

    const assignShift = (empId, dateStr, shiftId = selectedShift) => {
        if (!shiftId) return;

        if (shiftId === '__CLEAR__') {
            const key = `${empId}-${dateStr}`;
            if (existingAssignments[key]) {
                handleDelete(empId, dateStr);
            } else if (newAssignments[key]) {
                setNewAssignments(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                });
            }
            return;
        }

        const key = `${empId}-${dateStr}`;
        setNewAssignments(prev => ({ ...prev, [key]: shiftId }));
    };

    const applyBulk = async () => {
        if (!selectedShift || selectedEmployees.length === 0 || selectedDates.length === 0) {
            setError('Please select a shift, at least one employee, and at least one date');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setError('');
        setLoading(true);
        
        try {
            const newAssign = { ...newAssignments };
            let appliedCount = 0;
            const deletionsToProcess = [];

            selectedEmployees.forEach(empId => {
                selectedDates.forEach(dateStr => {
                    const key = `${empId}-${dateStr}`;
                    if (selectedShift === '__CLEAR__') {
                        // Clear shift: remove from newAssignments if it exists there
                        if (newAssign[key]) {
                            delete newAssign[key];
                            appliedCount++;
                        }
                        // If it's an existing assignment, queue it for deletion
                        if (existingAssignments[key]) {
                            deletionsToProcess.push({ empId, dateStr });
                            appliedCount++;
                        }
                    } else {
                        // Assign shift (will update existing or create new)
                        newAssign[key] = selectedShift;
                        appliedCount++;
                    }
                });
            });

            // Process deletions for existing assignments
            if (deletionsToProcess.length > 0) {
                try {
                    await Promise.all(
                        deletionsToProcess.map(({ empId, dateStr }) => 
                            deleteRosterEntry(empId, dateStr).catch(err => {
                                console.error(`Failed to delete ${empId}-${dateStr}:`, err);
                            })
                        )
                    );
                    // Update existingAssignments after successful deletions
                    const updatedExisting = { ...existingAssignments };
                    deletionsToProcess.forEach(({ empId, dateStr }) => {
                        const key = `${empId}-${dateStr}`;
                        delete updatedExisting[key];
                    });
                    setExistingAssignments(updatedExisting);
                } catch (err) {
                    console.error('Error processing bulk deletions:', err);
                    // Continue even if some deletions fail
                }
            }

            setNewAssignments(newAssign);
            setSuccess(`Bulk operation applied to ${appliedCount} cell(s)`);
            setTimeout(() => setSuccess(''), 3000);
            
            // Reset bulk mode selections but keep bulk mode active
            setSelectedEmployees([]);
            setSelectedDates([]);
        } catch (err) {
            setError('Failed to apply bulk operation');
            console.error('Bulk operation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearAll = () => {
        setNewAssignments({});
        setSuccess('Cleared all pending changes.');
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleManualSubmit = async () => {
        setError('');
        setSuccess('');

        if (Object.keys(newAssignments).length === 0) {
            setError('No new changes to submit.');
            return;
        }

        setLoading(true);
        try {
            // Validate and format roster entries
            const rosters = Object.entries(newAssignments).map(([key, shiftId]) => {
                const parts = key.split('-');
                // Handle date format: employeeId-date (date might have dashes, so we need to reconstruct)
                // Format: empId-YYYY-MM-DD
                const employeeId = parts[0];
                const dateParts = parts.slice(1); // Get all parts after employeeId
                const dateStr = dateParts.join('-'); // Reconstruct date string
                
                // Validate date format (YYYY-MM-DD)
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(dateStr)) {
                    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
                }

                // Validate employee exists
                const employee = employees.find(emp => emp._id === employeeId);
                if (!employee) {
                    throw new Error(`Employee not found: ${employeeId}`);
                }

                return { 
                    employeeId, 
                    date: dateStr, 
                    shiftId: shiftId, 
                    isOff: false 
                };
            });

            const res = await generateRoster({ month, rosters });
            if (res.status === 201) {
                setSuccess('Roster updated successfully!');
                setNewAssignments({});
                
                // Re-fetch data after successful submission
                const employeeIdToFetch = isAuthorized ? 'all' : (user?.employeeId || 'all');
                const rosterRes = await getEmployeeRoster(employeeIdToFetch, month);
                if (rosterRes.data && rosterRes.data.success) {
                    const fetchedAssignments = rosterRes.data.data.reduce((acc, entry) => {
                        if (entry.employee && entry.shift) {
                            const dateStr = entry.date ? (typeof entry.date === 'string' 
                                ? entry.date.split('T')[0] 
                                : new Date(entry.date).toISOString().split('T')[0]) : '';
                            if (dateStr) {
                                const key = `${entry.employee._id}-${dateStr}`;
                                acc[key] = entry.shift._id;
                            }
                        }
                        return acc;
                    }, {});
                    setExistingAssignments(fetchedAssignments);
                }
            }
        } catch (err) {
            console.error('Error submitting roster:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update roster');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.fullName || emp.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
    const startIndex = (currentPage - 1) * employeesPerPage;
    const endIndex = startIndex + employeesPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getShiftDetails = (id) => shifts.find(s => s._id === id) || { name: '', color: '#00008B' };
    const getShiftCode = (id) => getShiftDetails(id).shiftCode || '-';

    // For regular employees, show a read-only view of their own roster
    if (isRegularEmployee && !user?.employeeId) {
        return <div className="roster-message roster-error">Employee information not found</div>;
    }

    return (
        <div className="roster-container" >
            {/* File Upload - Only for authorized users */}
            {isAuthorized && (
                <div className="roster-card">
                    <h3 className="roster-card-title">Upload Roster File</h3>
                    <form onSubmit={handleFileSubmit} className="file-upload-form">
                        <div style={{ flex: 1 }}>
                            <input type="file" id="rosterFile" onChange={handleFileChange} accept=".csv,.xlsx,.xls" className="file-upload-input" />
                        </div>
                        <button type="submit" disabled={loading || !rosterFile} className="file-upload-button">
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                    {success && <p className="roster-message roster-success">{success}</p>}
                    {error && <p className="roster-message roster-error">{error}</p>}
                </div>
            )}

            {/* Visual Planner */}
            <div className="roster-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className="roster-card-title">Visual Roster Planner</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isAuthorized && <button onClick={handleExport} className="view-mode-button">Export to Excel</button>}
                        <button onClick={() => setViewMode('week')} className={`view-mode-button ${viewMode === 'week' ? 'view-mode-button-active' : 'view-mode-button-inactive'}`}>Week</button>
                        <button onClick={() => setViewMode('month')} className={`view-mode-button ${viewMode === 'month' ? 'view-mode-button-active' : 'view-mode-button-inactive'}`}>Month</button>
                    </div>
                </div>

                {/* Controls */}
                <div className="planner-controls">
                    <div className="planner-control-group">
                        <label>Month</label>
                        <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setCurrentDate(new Date(e.target.value + '-01')); }} className="planner-control-input" />
                    </div>
                    {isAuthorized && (
                        <>
                            <div className="planner-control-group">
                                <label>Shift</label>
                                <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="planner-control-input planner-control-select">
                                    <option value="">Select Shift</option>
                                    <option value="__CLEAR__" style={{ color: 'red', fontWeight: 'bold' }}>Clear Shift</option>
                                    {shifts.map(s => <option key={s._id} value={s._id}>{s.name || s.shiftName}</option>)}
                                </select>
                            </div>
                            <button onClick={() => setBulkMode(!bulkMode)} className={`bulk-mode-button ${bulkMode ? 'bulk-mode-button-active' : 'bulk-mode-button-inactive'}`}>
                                {bulkMode ? <Check size={18} /> : <Plus size={18} />} Bulk Mode {bulkMode && `(Selected: ${selectedEmployees.length} emp × ${selectedDates.length} dates)`}
                            </button>
                            {bulkMode && <button onClick={applyBulk} className="apply-bulk-button">Apply Bulk</button>}
                        </>
                    )}
                </div>

                {/* Navigation & Legend */}
                <div className="planner-nav-legend">
                    <div className="planner-nav-buttons">
                        <button onClick={() => navigate(-1)} className="nav-button"><ChevronLeft size={20} /></button>
                        <span className="current-month-display">{currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => navigate(1)} className="nav-button"><ChevronRight size={20} /></button>
                    </div>

                </div>

                {/* Search */}
                <div className="employee-search-container">
                    <Search size={18} className="employee-search-icon" />
                    <input type="text" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="employee-search-input" />
                </div>

                {/* Grid */}
                <div className="roster-grid-wrapper">
                    <div className="roster-grid" style={{ gridTemplateColumns: `250px repeat(${displayDates.length}, 1fr)` }}>
                        {/* Headers */}
                        <div className="grid-header-cell">Employee</div>
                        {displayDates.map(d => (
                            <div
                                key={formatDate(d)}
                                onClick={() => bulkMode && toggleBulkDate(formatDate(d))}
                                className={`grid-date-header-cell ${bulkMode && selectedDates.includes(formatDate(d)) ? 'selected' : ''}`}
                            >
                                <div style={{ fontWeight: '600' }}>{formatHeader(d)}</div>
                            </div>
                        ))}

                        {/* Rows */}
                        {paginatedEmployees.map(emp => {
                            const empAssignments = displayDates.filter(d => allAssignments[`${emp._id}-${formatDate(d)}`]);
                            return (
                                <React.Fragment key={emp._id}>
                                    <div
                                        onClick={() => bulkMode && toggleBulkEmployee(emp._id)}
                                        className={`grid-employee-cell ${bulkMode && selectedEmployees.includes(emp._id) ? 'selected' : ''}`}
                                    >
                                        <div>
                                            <div className="grid-employee-name">{emp.fullName || emp.name}</div>
                                            <div className="grid-employee-assigned-count">Assigned: {empAssignments.length}</div>
                                        </div>
                                    </div>
                                    {displayDates.map(d => {
                                        const dateStr = formatDate(d);
                                        const key = `${emp._id}-${dateStr}`;
                                        const shiftId = allAssignments[key];
                                        const isNew = newAssignments[key];
                                        
                                        // REMOVED ALL INLINE STYLING FOR COLORS
                                        return (
                                            <div
                                                key={dateStr}
                                                onClick={() => isAuthorized && !bulkMode && selectedShift && assignShift(emp._id, dateStr)}
                                                className={`grid-assignment-cell ${shiftId ? 'assigned' : ''} ${!isAuthorized ? 'read-only' : ''}`}
                                                style={!isAuthorized ? { cursor: 'default' } : {}}
                                            >
                                                {shiftId ? getShiftCode(shiftId) : '-'}
                                                {isAuthorized && existingAssignments[key] && !isNew && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(emp._id, dateStr); }} 
                                                        className="delete-shift-button"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Actions - Only for authorized users */}
                {isAuthorized && (
                    <div className="planner-actions">
                        <button onClick={handleManualSubmit} disabled={loading || Object.keys(newAssignments).length === 0} className="submit-roster-button">
                            {loading ? 'Submitting...' : `Submit Roster (${Object.keys(newAssignments).length} assignments)`}
                        </button>
                        <button onClick={clearAll} disabled={Object.keys(newAssignments).length === 0} className="clear-all-button">
                            Clear All
                        </button>
                        {success && <div className="message-box success-message-box"><Check size={20} />{success}</div>}
                        {error && <div className="message-box error-message-box">{error}</div>}
                    </div>
                )}
                {isRegularEmployee && (
                    <div className="planner-actions">
                        <p style={{ color: '#666', fontStyle: 'italic' }}>View-only mode: You can view your roster but cannot make changes.</p>
                        {error && <div className="message-box error-message-box">{error}</div>}
                    </div>
                )}

                {/* Pagination */}
                {filteredEmployees.length > employeesPerPage && (
                    <div className="planner-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{ 
                                padding: '8px 16px', 
                                margin: '0 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                background: currentPage === 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                                color: '#fff',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                opacity: currentPage === 1 ? 0.5 : 1
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ 
                            padding: '8px 16px', 
                            color: '#fff',
                            fontWeight: '600'
                        }}>
                            Page {currentPage} of {totalPages} ({filteredEmployees.length} employees)
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{ 
                                padding: '8px 16px', 
                                margin: '0 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                                color: '#fff',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                opacity: currentPage === totalPages ? 0.5 : 1
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RosterManagement;
