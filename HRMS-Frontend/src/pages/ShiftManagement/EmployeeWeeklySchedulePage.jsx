import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  getRosterDutyShifts,
  getRosterDutyNocEmployees,
  getRosterDutySchedules,
  upsertRosterDutySchedule,
  deleteRosterDutySchedule,
  generateRosterFromDuty,
} from '../../api/shiftManagement';
import '../../styles/CompanyCreate.css';
import { Plus, Trash2, Save, Users, Calendar, Clock } from 'lucide-react';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const to12Hour = (time) => {
  if (!time) return '';
  const [h, m] = String(time).split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${String(m || 0).padStart(2, '0')} ${ampm}`;
};

const getShiftOptionLabel = (s) => {
  if (s.isOffDay || (!s.officeStartTime && !s.officeEndTime)) {
    return s.name ? `${s.name} (Off Day)` : 'Off Day';
  }
  const start = to12Hour(s.officeStartTime);
  const end = to12Hour(s.officeEndTime);
  return start && end ? `${s.name} (${start} - ${end})` : s.name || '-';
};

const EmployeeWeeklySchedulePage = () => {
  const { user } = useContext(AuthContext);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeSchedules, setEmployeeSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [savingEmployeeId, setSavingEmployeeId] = useState(null);
  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthorized =
    user?.role === 'Super Admin' ||
    (user?.role === 'Manager' && user?.department?.name?.toLowerCase().includes('noc'));

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [shiftsRes, empRes, schedRes] = await Promise.all([
        getRosterDutyShifts(),
        getRosterDutyNocEmployees(),
        getRosterDutySchedules(),
      ]);
      if (shiftsRes.status === 200) setShifts(shiftsRes.data || []);
      if (empRes.status === 200) setEmployees(empRes.data || []);
      if (schedRes.status === 200) {
        const list = schedRes.data || [];
        const map = {};
        list.forEach((s) => {
          if (s.employee?._id) {
            map[s.employee._id] = {
              sunday: s.sunday?._id || '',
              monday: s.monday?._id || '',
              tuesday: s.tuesday?._id || '',
              wednesday: s.wednesday?._id || '',
              thursday: s.thursday?._id || '',
              friday: s.friday?._id || '',
              saturday: s.saturday?._id || '',
            };
          }
        });
        setEmployeeSchedules(map);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchData();
  }, [isAuthorized]);

  const handleAddEmployee = () => {
    if (!selectedEmployeeId) return;
    if (employeeSchedules[selectedEmployeeId]) {
      setError('This employee already has a schedule.');
      return;
    }
    setEmployeeSchedules((prev) => ({
      ...prev,
      [selectedEmployeeId]: {
        sunday: '',
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
      },
    }));
    setSelectedEmployeeId('');
    setSuccess('Employee added. Set shifts for each day and click Save.');
  };

  const handleDayChange = (empId, day, shiftId) => {
    setEmployeeSchedules((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [day]: shiftId,
      },
    }));
  };

  const handleSaveSchedule = async (empId) => {
    setError('');
    setSuccess('');
    setSavingEmployeeId(empId);
    try {
      const sched = employeeSchedules[empId] || {};
      await upsertRosterDutySchedule({
        employeeId: empId,
        sunday: sched.sunday || null,
        monday: sched.monday || null,
        tuesday: sched.tuesday || null,
        wednesday: sched.wednesday || null,
        thursday: sched.thursday || null,
        friday: sched.friday || null,
        saturday: sched.saturday || null,
      });
      setSuccess('Schedule saved successfully.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule.');
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const handleGenerateRoster = async () => {
    setError('');
    setSuccess('');
    setGenerating(true);
    try {
      const res = await generateRosterFromDuty(generateMonth);
      setSuccess(res.data?.message || `Generated ${res.data?.generated || 0} roster entries.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate roster.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSchedule = async (empId) => {
    if (!window.confirm("Delete this employee's roster duty schedule?")) return;
    setError('');
    setSuccess('');
    try {
      await deleteRosterDutySchedule(empId);
      setSuccess('Schedule removed.');
      setEmployeeSchedules((prev) => {
        const next = { ...prev };
        delete next[empId];
        return next;
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule.');
    }
  };

  const getEmpName = (empId) => {
    const e = employees.find((x) => x._id === empId);
    return e?.fullName || 'Unknown';
  };

  const availableToAdd = employees.filter((e) => !employeeSchedules[e._id]);

  const scheduleEntries = Object.entries(employeeSchedules);
  const filteredEntries = searchQuery.trim()
    ? scheduleEntries.filter(([empId]) =>
        getEmpName(empId).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scheduleEntries;

  if (!isAuthorized) {
    return (
      <div className="company-container">
        <p className="company-message company-error">
          Access denied. Only Super Admin or Manager in NOC department can access.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="company-container">
        <div className="company-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="company-container">
      <div className="company-header company-header--main">
        <h2 className="company-page-title">Employee Weekly Schedule</h2>
        <Link
          to="/shift-management/roster-duty/shifts"
          className="company-button company-button--secondary"
          style={{ textDecoration: 'none' }}
        >
          <Clock size={18} aria-hidden />
          Shift Definitions
        </Link>
      </div>

      {success && (
        <p className="company-message company-success company-message--inline">{success}</p>
      )}

      <div className="company-header">
        <h3 className="company-section-title">Generate Roster</h3>
        <div className="company-controls" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label htmlFor="generate-month" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--app-text-muted)' }}>
            Month:
          </label>
          <input
            id="generate-month"
            type="month"
            value={generateMonth}
            onChange={(e) => setGenerateMonth(e.target.value)}
            className="company-input"
            style={{ width: 'auto', minWidth: '160px' }}
          />
          <button
            type="button"
            className="company-button"
            onClick={handleGenerateRoster}
            disabled={generating || scheduleEntries.length === 0}
          >
            {generating ? 'Generating...' : 'Generate Roster'}
          </button>
        </div>
      </div>

      <div className="company-header">
        <h3 className="company-section-title">Add Employee</h3>
        <div className="company-controls" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '220px' }}>
            <label htmlFor="add-employee" style={{ marginBottom: '0.375rem' }}>Employee</label>
            <select
              id="add-employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="company-input company-schedule-select"
            >
              <option value="">Select employee...</option>
              {availableToAdd.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.fullName} ({e.newEmployeeCode || '-'})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="company-button company-button--create"
            onClick={handleAddEmployee}
            disabled={!selectedEmployeeId}
          >
            <Plus size={18} aria-hidden />
            Add Employee
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="company-message">No NOC employees found.</div>
      ) : scheduleEntries.length === 0 ? (
        <div className="company-message">Add employees above to set their weekly shifts.</div>
      ) : (
        <>
          <div className="company-header">
            <h3 className="company-section-title">Schedule Table</h3>
            <div className="company-controls">
              <input
                type="text"
                placeholder="Search by employee name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="company-input company-search"
              />
            </div>
          </div>

          <div className="company-table-container company-schedule-table-container">
            <table className="company-table company-schedule-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Employee</th>
                  {DAY_LABELS.map((d) => (
                    <th key={d} className="company-schedule-day-header">
                      {d}
                    </th>
                  ))}
                  <th style={{ minWidth: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map(([empId, sched]) => (
                  <tr key={empId}>
                    <td>{getEmpName(empId)}</td>
                    {DAYS.map((day) => (
                      <td key={day} className="company-schedule-day-cell">
                        <select
                          value={sched[day] || ''}
                          onChange={(e) => handleDayChange(empId, day, e.target.value)}
                          className="company-input company-schedule-select"
                          aria-label={`${day} shift for ${getEmpName(empId)}`}
                          title={sched[day] ? getShiftOptionLabel(shifts.find((x) => x._id === sched[day]) || {}) : 'Select shift'}
                        >
                          <option value="">—</option>
                          {shifts.map((s) => (
                            <option key={s._id} value={s._id} title={getShiftOptionLabel(s)}>
                              {getShiftOptionLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="company-button company-button--small"
                        onClick={() => handleSaveSchedule(empId)}
                        disabled={savingEmployeeId === empId}
                      >
                        <Save size={14} aria-hidden />
                        {savingEmployeeId === empId ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="company-button company-button--danger company-button--small"
                        onClick={() => handleDeleteSchedule(empId)}
                        title="Remove schedule"
                        aria-label="Remove schedule"
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && searchQuery.trim() && (
            <div className="company-message">No employees match your search.</div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeWeeklySchedulePage;
