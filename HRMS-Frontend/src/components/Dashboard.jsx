import { useContext, useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import Select from "react-select";
import { AuthContext } from "../context/AuthContext";
import { getEmployees } from "../api/employee";
import "../styles/Dashboard.css";

const defaultMonthSummary = () => ({
  workingDays: 0,
  presentDays: 0,
  absentDays: 0,
  remoteDays: 0,
  leaveDays: 0,
  monthWorkMinutes: 0,
  expectedWorkMinutes: 0,
  totalArrivalLateMinutes: 0,
  totalShortfallMinutes: 0,
  totalOvertimeMinutes: 0,
  month: new Date().toISOString().slice(0, 7),
});

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [monthSummary, setMonthSummary] = useState(defaultMonthSummary);
  const [fetching, setFetching] = useState(true);
  // Super Admin: employee selector and selected employee's month report
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeMonthSummary, setSelectedEmployeeMonthSummary] = useState(null);
  const [loadingEmployeeSummary, setLoadingEmployeeSummary] = useState(false);

  // API base: use VITE_API_URL when set; otherwise '' for same-origin (production proxy /api -> backend)
  const getApiBase = () => {
    const url = import.meta.env.VITE_API_URL ?? '';
    return typeof url === 'string' ? url.replace(/\/$/, '') : '';
  };

  // Safe parse: production may return HTML (404/502) instead of JSON
  const safeJson = (res) =>
    res.text().then((text) => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    });

  // Normalize stats so all counts are numbers (avoids undefined in UI when API fails or returns partial data)
  const normalizeStats = (data) =>
    data
      ? {
          totalEmployees: Number(data.totalEmployees) || 0,
          activeEmployees: Number(data.activeEmployees) ?? 0,
          inactiveEmployees: Number(data.inactiveEmployees) ?? 0,
          presentToday: Number(data.presentToday) || 0,
          absentToday: Number(data.absentToday) || 0,
          remoteToday: Number(data.remoteToday) || 0,
          leaveToday: Number(data.leaveToday) || 0,
        }
      : null;

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const base = getApiBase();
      const api = (path) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const isSuperAdmin = user?.role === 'Super Admin';

        // 1. Try combined endpoint first (single request, no nested routes)
        let allData = null;
        const combinedRes = await fetch(api('/api/dashboard-all'), authHeaders);
        const combinedJson = await safeJson(combinedRes);
        if (combinedJson?.success && combinedJson.data) allData = combinedJson.data;
        if (!allData && base) {
          const sameOriginRes = await fetch('/api/dashboard-all', authHeaders);
          const sameOriginJson = await safeJson(sameOriginRes);
          if (sameOriginJson?.success && sameOriginJson.data) allData = sameOriginJson.data;
        }

        if (allData) {
          setEmployeeData(allData.employeeData || null);
          if (allData.stats) setStats(normalizeStats(allData.stats));
          setMonthSummary(allData.monthSummary || defaultMonthSummary());
          setFetching(false);
          return;
        }

        // 2. Fallback: individual endpoints
        const [empRes, statsRes, monthRes] = await Promise.all([
          fetch(api('/api/dashboard'), authHeaders),
          isSuperAdmin ? fetch(api('/api/dashboard/dashboard-stats'), authHeaders) : Promise.resolve(null),
          fetch(api('/api/month-summary'), authHeaders),
        ]);

        let empData = await safeJson(empRes);
        if (empData?.success) setEmployeeData(empData.data);
        else if (!empRes.ok && base) {
          empData = await safeJson(await fetch('/api/dashboard', authHeaders));
          if (empData?.success) setEmployeeData(empData.data);
        }

        if (isSuperAdmin && statsRes) {
          let statsData = await safeJson(statsRes);
          if (statsData && statsRes.ok) setStats(normalizeStats(statsData));
          else if (!statsRes?.ok) {
            statsData = await safeJson(await fetch('/api/dashboard/dashboard-stats', authHeaders));
            if (statsData) setStats(normalizeStats(statsData));
          }
        }

        let monthData = await safeJson(monthRes);
        if (monthData?.success && monthData.data) setMonthSummary(monthData.data);
        else {
          for (const path of ['/api/month-summary', '/api/dashboard/month-summary']) {
            const retryData = await safeJson(await fetch(path, authHeaders));
            if (retryData?.success && retryData.data) {
              setMonthSummary(retryData.data);
              break;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setFetching(false);
      }
    };

    if (user) fetchDashboard();
  }, [user]);

  // Super Admin: fetch employees list for selector
  useEffect(() => {
    if (user?.role !== "Super Admin") return;
    const loadEmployees = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await getEmployees(token);
        if (res?.success && Array.isArray(res.data)) {
          setEmployees(
            res.data
              .filter((e) => e._id && (e.fullName || e.newEmployeeCode))
              .sort((a, b) =>
                (a.fullName || "").localeCompare(b.fullName || "")
              )
          );
        }
      } catch (err) {
        console.error("Error fetching employees for selector:", err);
      }
    };
    loadEmployees();
  }, [user?.role]);

  // Super Admin: fetch month summary when employee selected
  useEffect(() => {
    if (user?.role !== "Super Admin" || !selectedEmployeeId) {
      setSelectedEmployeeMonthSummary(null);
      return;
    }
    const base =
      typeof import.meta.env.VITE_API_URL === "string"
        ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
        : "";
    const api = (path) =>
      `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const authHeaders = {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    };
    const safeJson = (res) =>
      res.text().then((text) => {
        try {
          return text ? JSON.parse(text) : null;
        } catch {
          return null;
        }
      });

    let cancelled = false;
    setLoadingEmployeeSummary(true);
    setSelectedEmployeeMonthSummary(null);
    fetch(
      api(`/api/month-summary?employeeId=${encodeURIComponent(selectedEmployeeId)}`),
      authHeaders
    )
      .then(safeJson)
      .then((json) => {
        if (!cancelled && json?.success && json.data) {
          setSelectedEmployeeMonthSummary(json.data);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching employee month summary:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployeeSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role, selectedEmployeeId]);

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp._id,
        label: `${emp.fullName || "Unnamed"}${emp.newEmployeeCode ? ` (${emp.newEmployeeCode})` : ""}`.trim(),
      })),
    [employees]
  );

  const selectedOption = useMemo(
    () => employeeOptions.find((o) => o.value === selectedEmployeeId) ?? null,
    [employeeOptions, selectedEmployeeId]
  );

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Format total minutes as "Xh Ym" (e.g. 90 → "1h 30m", 0 → "0h 0m")
  const formatMinutesToHoursMinutes = (totalMinutes) => {
    const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (loading || fetching) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner" aria-hidden="true" />
          <p className="dashboard-loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  // Absent count from dashboard-stats API (derived from attendance/leave data)
  const absentToday = stats?.absentToday != null && !Number.isNaN(Number(stats.absentToday))
    ? Number(stats.absentToday)
    : 0;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, <span className="dashboard-title-accent">{employeeData?.personalInfo?.fullName || user?.fullName || user?.email || "User"}</span></h1>
        <p className="dashboard-subtitle">{user?.role || "Employee"} Dashboard</p>
        <p className="dashboard-date">{todayFormatted}</p>
      </header>

      {stats && user.role === 'Super Admin' && (
        <section className="dashboard-stats-section" aria-label="Overview statistics">
          <h2 className="dashboard-section-title">Organization overview - Today&apos;s</h2>
          <div className="dashboard-stats">
          <Link to="/employees" className="stat-card stat-card--total stat-card--link">
            <span className="stat-card__label">Total Employees</span>
            <span className="stat-card__value">{stats.totalEmployees}</span>
          </Link>
          <div className="stat-card stat-card--active">
            <span className="stat-card__label">Active Employees</span>
            <span className="stat-card__value">{stats.activeEmployees ?? 0}</span>
          </div>
          <div className="stat-card stat-card--inactive">
            <span className="stat-card__label">Inactive Employees</span>
            <span className="stat-card__value">{stats.inactiveEmployees ?? 0}</span>
          </div>
          <Link to="/dashboard/present-today" className="stat-card stat-card--present stat-card--link">
            <span className="stat-card__label">Present Today</span>
            <span className="stat-card__value">{stats.presentToday ?? 0}</span>
          </Link>
          <Link to="/dashboard/absent-today" className="stat-card stat-card--absent stat-card--link">
            <span className="stat-card__label">Absent Today</span>
            <span className="stat-card__value">{absentToday}</span>
          </Link>
          <Link to="/dashboard/remote-today" className="stat-card stat-card--remote stat-card--link">
            <span className="stat-card__label">Remote Today</span>
            <span className="stat-card__value">{stats.remoteToday ?? 0}</span>
          </Link>
          <Link to="/dashboard/leave-today" className="stat-card stat-card--leave stat-card--link">
            <span className="stat-card__label">On Leave Today</span>
            <span className="stat-card__value">{stats.leaveToday ?? 0}</span>
          </Link>
          </div>
        </section>
      )}

      {/* Super Admin: Employee selector + monthly attendance report */}
      {user.role === "Super Admin" && (
        <section className="dashboard-stats-section" aria-label="Employee monthly report">
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title">Employee attendance this month</h2>
            <Select
              className="dashboard-employee-select"
              classNamePrefix="dashboard-select"
              options={employeeOptions}
              value={selectedOption}
              onChange={(opt) => setSelectedEmployeeId(opt?.value ?? "")}
              placeholder="Search and select employee..."
              isClearable
              isSearchable
              aria-label="Select employee"
              styles={{
                control: (base) => ({
                  ...base,
                  minWidth: 260,
                  background: "var(--dash-surface)",
                  borderColor: "var(--dash-border)",
                  "&:hover": { borderColor: "var(--dash-accent)" },
                }),
                menu: (base) => ({
                  ...base,
                  background: "var(--dash-surface)",
                  border: "1px solid var(--dash-border)",
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? "var(--dash-accent-soft)" : "transparent",
                  color: "var(--dash-text)",
                }),
                singleValue: (base) => ({ ...base, color: "var(--dash-text)" }),
                input: (base) => ({ ...base, color: "var(--dash-text)" }),
                placeholder: (base) => ({ ...base, color: "var(--dash-text-muted)" }),
              }}
            />
          </div>
          {selectedEmployeeId && (
            loadingEmployeeSummary ? (
              <div className="dashboard-loading-inline">
                <div className="dashboard-loading-spinner" aria-hidden="true" />
                <span>Loading report...</span>
              </div>
            ) : selectedEmployeeMonthSummary != null ? (
              <>
                <div className="dashboard-stats">
                  <Link to="/attendance" className="stat-card stat-card--total stat-card--link">
                    <span className="stat-card__label">Working days this month</span>
                    <span className="stat-card__value">{selectedEmployeeMonthSummary.workingDays ?? 0}</span>
                    <span className="stat-card__sublabel">days</span>
                  </Link>
                  <Link to="/attendance" className="stat-card stat-card--present stat-card--link">
                    <span className="stat-card__label">Present this month</span>
                    <span className="stat-card__value">{selectedEmployeeMonthSummary.presentDays ?? 0}</span>
                    <span className="stat-card__sublabel">days</span>
                  </Link>
                  <Link to="/attendance" className="stat-card stat-card--absent stat-card--link">
                    <span className="stat-card__label">Absent this month</span>
                    <span className="stat-card__value">{selectedEmployeeMonthSummary.absentDays ?? 0}</span>
                    <span className="stat-card__sublabel">days</span>
                  </Link>
                  <Link to="/attendance" className="stat-card stat-card--remote stat-card--link">
                    <span className="stat-card__label">Remote this month</span>
                    <span className="stat-card__value">{selectedEmployeeMonthSummary.remoteDays ?? 0}</span>
                    <span className="stat-card__sublabel">days</span>
                  </Link>
                  <Link to="/attendance" className="stat-card stat-card--leave stat-card--link">
                    <span className="stat-card__label">Leave this month</span>
                    <span className="stat-card__value">{selectedEmployeeMonthSummary.leaveDays ?? 0}</span>
                    <span className="stat-card__sublabel">days</span>
                  </Link>
                </div>
                <h3 className="dashboard-stats-subtitle">Work hours (1st – today)</h3>
                <div className="dashboard-stats">
                  <Link to="/attendance" className="stat-card stat-card--expected stat-card--link">
                    <span className="stat-card__label">Expected hours</span>
                    <span className="stat-card__value">{formatMinutesToHoursMinutes(selectedEmployeeMonthSummary.expectedWorkMinutes ?? 0)}</span>
                    <span className="stat-card__sublabel">should work this month</span>
                  </Link>
                  <Link to="/attendance" className="stat-card stat-card--work stat-card--link">
                    <span className="stat-card__label">Hours worked</span>
                    <span className="stat-card__value">{formatMinutesToHoursMinutes(selectedEmployeeMonthSummary.monthWorkMinutes ?? 0)}</span>
                    <span className="stat-card__sublabel">total office time</span>
                  </Link>
                  {(selectedEmployeeMonthSummary.totalOvertimeMinutes ?? 0) > 0 ? (
                    <Link to="/attendance" className="stat-card stat-card--overtime stat-card--link">
                      <span className="stat-card__label">Overtime</span>
                      <span className="stat-card__value">{formatMinutesToHoursMinutes(selectedEmployeeMonthSummary.totalOvertimeMinutes ?? 0)}</span>
                      <span className="stat-card__sublabel">extra hours worked</span>
                    </Link>
                  ) : (selectedEmployeeMonthSummary.totalShortfallMinutes ?? 0) > 0 ? (
                    <>
                      {((selectedEmployeeMonthSummary.totalArrivalLateMinutes ?? 0) > 0) && (
                        <Link to="/attendance" className="stat-card stat-card--late stat-card--link">
                          <span className="stat-card__label">Arrival late</span>
                          <span className="stat-card__value">{formatMinutesToHoursMinutes(selectedEmployeeMonthSummary.totalArrivalLateMinutes ?? 0)}</span>
                          <span className="stat-card__sublabel">total late check-ins</span>
                        </Link>
                      )}
                      <Link to="/attendance" className="stat-card stat-card--shortfall stat-card--link">
                        <span className="stat-card__label">Shortfall</span>
                        <span className="stat-card__value">{formatMinutesToHoursMinutes(selectedEmployeeMonthSummary.totalShortfallMinutes ?? 0)}</span>
                        <span className="stat-card__sublabel">deficit vs expected</span>
                      </Link>
                    </>
                  ) : ((selectedEmployeeMonthSummary.totalArrivalLateMinutes ?? 0) > 0) ? (
                    <Link to="/attendance" className="stat-card stat-card--late stat-card--link">
                      <span className="stat-card__label">Arrival late</span>
                      <span className="stat-card__value">{formatMinutesToHoursMinutes(selectedEmployeeMonthSummary.totalArrivalLateMinutes ?? 0)}</span>
                      <span className="stat-card__sublabel">total late check-ins</span>
                    </Link>
                  ) : null}
                </div>
              </>
            ) : null
          )}
          {selectedEmployeeId && !loadingEmployeeSummary && selectedEmployeeMonthSummary == null && (
            <p className="dashboard-empty-state">No attendance data available for this employee.</p>
          )}
        </section>
      )}

      {/* Regular users: own attendance this month */}
      {user.role !== "Super Admin" && monthSummary != null && (
        <>
        <section className="dashboard-stats-section" aria-label="This month summary">
          <h2 className="dashboard-section-title">Your attendance this month</h2>
          <div className="dashboard-stats">
            <Link to="/attendance" className="stat-card stat-card--total stat-card--link">
              <span className="stat-card__label">Working days this month</span>
              <span className="stat-card__value">{monthSummary.workingDays ?? 0}</span>
              <span className="stat-card__sublabel">days</span>
            </Link>
            <Link to="/attendance" className="stat-card stat-card--present stat-card--link">
              <span className="stat-card__label">Present this month</span>
              <span className="stat-card__value">{monthSummary.presentDays ?? 0}</span>
              <span className="stat-card__sublabel">days</span>
            </Link>
            <Link to="/attendance" className="stat-card stat-card--absent stat-card--link">
              <span className="stat-card__label">Absent this month</span>
              <span className="stat-card__value">{monthSummary.absentDays ?? 0}</span>
              <span className="stat-card__sublabel">days</span>
            </Link>
            <Link to="/attendance" className="stat-card stat-card--remote stat-card--link">
              <span className="stat-card__label">Remote this month</span>
              <span className="stat-card__value">{monthSummary.remoteDays ?? 0}</span>
              <span className="stat-card__sublabel">days</span>
            </Link>
            <Link to="/attendance" className="stat-card stat-card--leave stat-card--link">
              <span className="stat-card__label">Leave this month</span>
              <span className="stat-card__value">{monthSummary.leaveDays ?? 0}</span>
              <span className="stat-card__sublabel">days</span>
            </Link>
          </div>
        </section>
        <section className="dashboard-stats-section" aria-label="My work overview">
          <h2 className="dashboard-section-title">My work overview this month</h2>
          <p className="dashboard-section-desc">Clear breakdown of hours worked, late arrivals, shortfall, and overtime (1st – today)</p>
          <div className="dashboard-stats dashboard-stats--overview">
            <Link to="/attendance" className="stat-card stat-card--expected stat-card--link">
              <span className="stat-card__label">Expected hours</span>
              <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.expectedWorkMinutes ?? 0)}</span>
              <span className="stat-card__sublabel">should work this month</span>
            </Link>
            <Link to="/attendance" className="stat-card stat-card--work stat-card--link">
              <span className="stat-card__label">Hours worked</span>
              <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.monthWorkMinutes ?? 0)}</span>
              <span className="stat-card__sublabel">total office time</span>
            </Link>
            {(monthSummary.totalOvertimeMinutes ?? 0) > 0 ? (
              <Link to="/attendance" className="stat-card stat-card--overtime stat-card--link">
                <span className="stat-card__label">Overtime</span>
                <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.totalOvertimeMinutes ?? 0)}</span>
                <span className="stat-card__sublabel">extra hours worked</span>
              </Link>
            ) : (monthSummary.totalShortfallMinutes ?? 0) > 0 ? (
              <>
                {((monthSummary.totalArrivalLateMinutes ?? 0) > 0) && (
                  <Link to="/attendance" className="stat-card stat-card--late stat-card--link">
                    <span className="stat-card__label">Arrival late</span>
                    <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.totalArrivalLateMinutes ?? 0)}</span>
                    <span className="stat-card__sublabel">total late check-ins</span>
                  </Link>
                )}
                <Link to="/attendance" className="stat-card stat-card--shortfall stat-card--link">
                  <span className="stat-card__label">Shortfall</span>
                  <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.totalShortfallMinutes ?? 0)}</span>
                  <span className="stat-card__sublabel">deficit vs expected</span>
                </Link>
              </>
            ) : ((monthSummary.totalArrivalLateMinutes ?? 0) > 0) ? (
              <Link to="/attendance" className="stat-card stat-card--late stat-card--link">
                <span className="stat-card__label">Arrival late</span>
                <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.totalArrivalLateMinutes ?? 0)}</span>
                <span className="stat-card__sublabel">total late check-ins</span>
              </Link>
            ) : null}
          </div>
        </section>
        </>
      )}

    </div>
  );
};

export default Dashboard;
