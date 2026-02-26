import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  getRosterDutyShifts,
  getRosterDutyNocEmployees,
  getRosterDutySchedules,
  upsertRosterDutySchedule,
  deleteRosterDutySchedule,
  generateRosterFromDuty,
} from '../../api/shiftManagement';
import '../../styles/Roster.css';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Save, Users, Calendar, Clock } from 'lucide-react';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  const isInNoc = user?.department?.name?.toLowerCase?.().includes('noc');
  const canEdit =
    user?.role === 'Super Admin' ||
    (user?.role === 'Manager' && isInNoc);
  const isAuthorized =
    canEdit || (user?.role === 'Employee' && isInNoc);

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

  const getShiftName = (shiftId) => {
    if (!shiftId) return '-';
    const s = shifts.find((x) => x._id === shiftId);
    return s?.name || '-';
  };

  // Only NOC department employees (employees list is already NOC-only from API)
  const nocEmployeeIds = new Set(employees.map((e) => e._id?.toString?.() || e._id));
  const schedulesToDisplay = Object.entries(employeeSchedules).filter(([empId]) =>
    nocEmployeeIds.has(empId?.toString?.() || empId)
  );
  const availableToAdd = employees.filter((e) => !employeeSchedules[e._id]);

  if (!isAuthorized) {
    return (
      <div className="roster-container">
        <div className="roster-card">
          <p className="roster-message roster-error">
            Access denied. Only Super Admin, NOC Manager, or NOC Employee can access.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="roster-container">
        <p className="roster-message">Loading...</p>
      </div>
    );
  }

  return (
    <div className="roster-container">
      <div className="roster-duty-page-header">
        <div className="roster-duty-header">
          <Users size={28} aria-hidden />
          <h2 className="roster-title">Employee Weekly Schedule</h2>
        </div>
        {canEdit && (
          <Link to="/shift-management/roster-duty/shifts" className="roster-duty-btn-secondary roster-duty-btn-sm">
            <Clock size={18} aria-hidden />
            Shift Definitions
          </Link>
        )}
      </div>

      <div className="roster-duty-messages">
        {error && <p className="roster-message roster-error">{error}</p>}
        {success && <p className="roster-message roster-success">{success}</p>}
      </div>

      <div className="roster-card">
        {canEdit && (
          <>
            <div className="roster-duty-section-header">
              <h3 className="roster-card-title">
                <Calendar size={20} aria-hidden />
                Generate Roster
              </h3>
              <div className="roster-duty-generate-bar">
                <label htmlFor="generate-month">Generate roster for:</label>
                <input
                  id="generate-month"
                  type="month"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  className="roster-input"
                />
                <button
                  type="button"
                  className="roster-duty-btn-violet roster-duty-btn-sm"
                  onClick={handleGenerateRoster}
                  disabled={generating || schedulesToDisplay.length === 0}
                >
                  {generating ? 'Generating...' : 'Generate Roster'}
                </button>
              </div>
            </div>

            <div className="roster-duty-add-employee-bar">
          <div className="form-group">
            <label htmlFor="add-employee">Add Employee</label>
            <select
              id="add-employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="roster-input"
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
            className="roster-duty-btn-success"
            onClick={handleAddEmployee}
            disabled={!selectedEmployeeId}
          >
            <Plus size={18} aria-hidden />
            Add Employee
          </button>
        </div>
          </>
        )}

        {employees.length === 0 ? (
          <p className="roster-message">No NOC employees found.</p>
        ) : schedulesToDisplay.length === 0 ? (
          <p className="roster-message">
            {canEdit ? 'Add NOC employees above to set their weekly shifts.' : 'No schedule data available.'}
          </p>
        ) : (
          <div className="roster-duty-table-wrapper">
            <table className="roster-duty-employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  {DAY_LABELS.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {schedulesToDisplay.map(([empId, sched]) => (
                  <tr key={empId}>
                    <td>{getEmpName(empId)}</td>
                    {DAYS.map((day) => (
                      <td key={day} className="day-cell">
                        {canEdit ? (
                          <select
                            value={sched[day] || ''}
                            onChange={(e) => handleDayChange(empId, day, e.target.value)}
                            aria-label={`${day} shift for ${getEmpName(empId)}`}
                          >
                            <option value="">-</option>
                            {shifts.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{getShiftName(sched[day])}</span>
                        )}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="roster-duty-btn-primary roster-duty-btn-sm"
                          onClick={() => handleSaveSchedule(empId)}
                          disabled={savingEmployeeId === empId}
                        >
                          <Save size={14} aria-hidden />
                          {savingEmployeeId === empId ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="roster-duty-btn-icon roster-duty-btn-danger"
                          onClick={() => handleDeleteSchedule(empId)}
                          title="Remove schedule"
                          aria-label="Remove schedule"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeWeeklySchedulePage;
