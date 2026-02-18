import { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Dashboard.css";

const defaultMonthSummary = () => ({
  workingDays: 0,
  presentDays: 0,
  absentDays: 0,
  remoteDays: 0,
  leaveDays: 0,
  totalLateByMinutes: 0,
  totalOvertimeMinutes: 0,
  month: new Date().toISOString().slice(0, 7),
});

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [monthSummary, setMonthSummary] = useState(defaultMonthSummary);
  const [fetching, setFetching] = useState(true);

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

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const base = getApiBase();
      const api = (path) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const isSuperAdmin = user?.role === 'Super Admin';
        const [empRes, statsRes, monthRes] = await Promise.all([
          fetch(api('/api/dashboard'), authHeaders),
          isSuperAdmin
            ? fetch(api('/api/dashboard/dashboard-stats'), authHeaders)
            : Promise.resolve(null),
          fetch(api('/api/dashboard/month-summary'), authHeaders),
        ]);

        const empData = await safeJson(empRes);
        if (empData?.success) setEmployeeData(empData.data);

        if (isSuperAdmin && statsRes) {
          const statsData = await safeJson(statsRes);
          if (statsData) setStats(statsData);
        }

        let monthData = await safeJson(monthRes);
        if (monthData?.success && monthData.data) {
          setMonthSummary(monthData.data);
        } else {
          setMonthSummary(defaultMonthSummary());
          if (!monthRes?.ok && base) {
            const sameOriginRes = await fetch('/api/dashboard/month-summary', authHeaders);
            const retryData = await safeJson(sameOriginRes);
            if (retryData?.success && retryData.data) setMonthSummary(retryData.data);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setMonthSummary(defaultMonthSummary());
      } finally {
        setFetching(false);
      }
    };

    if (user) fetchDashboard();
  }, [user]);

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

      {monthSummary != null && (
        <section className="dashboard-stats-section" aria-label="This month summary">
          <h2 className="dashboard-section-title">Your attendance this month</h2>
          <div className="dashboard-stats">
          <div className="stat-card stat-card--total">
            <span className="stat-card__label">Working days this month</span>
            <span className="stat-card__value">{monthSummary.workingDays ?? 0}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--present">
            <span className="stat-card__label">Present this month</span>
            <span className="stat-card__value">{monthSummary.presentDays ?? 0}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--absent">
            <span className="stat-card__label">Absent this month</span>
            <span className="stat-card__value">{monthSummary.absentDays ?? 0}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--remote">
            <span className="stat-card__label">Remote this month</span>
            <span className="stat-card__value">{monthSummary.remoteDays ?? 0}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--leave">
            <span className="stat-card__label">Leave this month</span>
            <span className="stat-card__value">{monthSummary.leaveDays ?? 0}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--late">
            <span className="stat-card__label">Late by this month</span>
            <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.totalLateByMinutes ?? 0)}</span>
            <span className="stat-card__sublabel">total</span>
          </div>
          <div className="stat-card stat-card--overtime">
            <span className="stat-card__label">Overtime this month</span>
            <span className="stat-card__value">{formatMinutesToHoursMinutes(monthSummary.totalOvertimeMinutes ?? 0)}</span>
            <span className="stat-card__sublabel">total</span>
          </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Dashboard;
