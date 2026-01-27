import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getEmployees } from '../../api/employee';
import { getEmployeeRoster } from '../../api/shiftManagement';
import '../../styles/Roster.css';

const EmployeeRoster = () => {
    const { user } = useContext(AuthContext);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [allRosters, setAllRosters] = useState([]); // Stores all fetched roster data
    const [filteredRoster, setFilteredRoster] = useState([]); // Stores roster data after applying filters
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin'].includes(user?.role);

    useEffect(() => {
        if (isAuthorized) {
            const fetchInitialRosters = async () => {
                setLoading(true);
                setError('');
                try {
                    const token = localStorage.getItem('token');
                    const employeesResponse = await getEmployees(token);
                    if (employeesResponse.success) {
                        setEmployees(employeesResponse.data);
                    }

                    const allRosterResponse = await getEmployeeRoster('all', selectedMonth);
                    const rosterData = allRosterResponse.data?.data || [];
                    
                    if (Array.isArray(rosterData)) {
                        setAllRosters(rosterData);
                        setFilteredRoster(rosterData);
                    }
                } catch (err) {
                    setError('Error fetching initial data: ' + (err.message || 'Unknown error'));
                } finally {
                    setLoading(false);
                }
            };
            fetchInitialRosters();
        }
    }, [isAuthorized, selectedMonth]); // Re-fetch all rosters when selectedMonth changes

    useEffect(() => {
        // Filter `allRosters` whenever `selectedEmployee` or `allRosters` changes
        if (selectedEmployee) {
            setFilteredRoster(allRosters.filter(rosterEntry => rosterEntry.employee === selectedEmployee));
        } else {
            setFilteredRoster(allRosters); // If "All Employees" is selected, show all
        }
    }, [selectedEmployee, allRosters]);

    return (
        <div className="roster-container">
            <h3 className="roster-title">View Employee Roster</h3>
            <div className="roster-form">
                <div className="form-group">
                    <label htmlFor="employee">Employee:</label>
                    <select id="employee" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="roster-input">
                        <option value="">All Employees</option>
                        {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>{employee.fullName}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="month">Month:</label>
                    <input type="month" id="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="roster-input" />
                </div>
                {error && <p className="roster-message roster-error">{error}</p>}
            </div>

            {loading ? (
                <p className="roster-message">Loading roster data...</p>
            ) : filteredRoster.length > 0 ? (
                <div className="roster-list">
                    <h4 className="roster-title">Roster for {selectedMonth}</h4>
                    <table className="roster-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Shift</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoster.map((entry) => (
                                <tr key={entry._id}>
                                    <td>{entry.employee ? entry.employee.fullName : 'Unknown Employee'}</td>
                                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                                    <td>{entry.shift ? entry.shift.shiftName : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="roster-message">No roster data found for the selected criteria.</p>
            )}
        </div>
    );
};

export default EmployeeRoster;
