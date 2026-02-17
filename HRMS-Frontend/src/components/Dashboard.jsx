import { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const isSuperAdmin = user?.role === 'Super Admin';
        const [empRes, statsRes, monthRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          isSuperAdmin
            ? fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/dashboard-stats`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/month-summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const empData = await empRes.json();
        if (empData.success) setEmployeeData(empData.data);

        if (isSuperAdmin && statsRes) {
          const statsData = await statsRes.json();
          if (statsData) setStats(statsData);
        }

        const monthData = await monthRes.json();
        if (monthData.success && monthData.data) setMonthSummary(monthData.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
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
        <h1 className="dashboard-title">Welcome back, <span className="dashboard-title-accent">{employeeData?.personalInfo?.fullName || "User"}</span></h1>
        <p className="dashboard-subtitle">{user.role} Dashboard</p>
        <p className="dashboard-date">{todayFormatted}</p>
      </header>

      {monthSummary && (
        <section className="dashboard-stats" aria-label="This month summary">
          <div className="stat-card stat-card--total">
            <span className="stat-card__label">Working days this month</span>
            <span className="stat-card__value">{monthSummary.workingDays}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--present">
            <span className="stat-card__label">Present this month</span>
            <span className="stat-card__value">{monthSummary.presentDays}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--absent">
            <span className="stat-card__label">Absent this month</span>
            <span className="stat-card__value">{monthSummary.absentDays}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--remote">
            <span className="stat-card__label">Remote this month</span>
            <span className="stat-card__value">{monthSummary.remoteDays}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
          <div className="stat-card stat-card--leave">
            <span className="stat-card__label">Leave this month</span>
            <span className="stat-card__value">{monthSummary.leaveDays}</span>
            <span className="stat-card__sublabel">days</span>
          </div>
        </section>
      )}

      {stats && user.role === 'Super Admin' && (
        <section className="dashboard-stats" aria-label="Overview statistics">
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
        </section>
      )}

    </div>
  );
};

export default Dashboard;
