import { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [empRes, statsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const empData = await empRes.json();
        const statsData = await statsRes.json();

        if (empData.success) setEmployeeData(empData.data);
        if (statsData) setStats(statsData);
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

      {stats && (
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
