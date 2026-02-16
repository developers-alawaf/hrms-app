import { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [presentTodayList, setPresentTodayList] = useState([]);
  const [remoteTodayList, setRemoteTodayList] = useState([]);
  const [leaveTodayList, setLeaveTodayList] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [empRes, statsRes, presentRes, remoteRes, leaveRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/present-today`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/remote-today`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/leave-today`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const empData = await empRes.json();
        const statsData = await statsRes.json();
        const presentData = await presentRes.json();
        const remoteData = await remoteRes.json();
        const leaveData = await leaveRes.json();

        if (empData.success) setEmployeeData(empData.data);
        if (statsData) setStats(statsData);
        if (presentData.success && Array.isArray(presentData.data)) setPresentTodayList(presentData.data);
        if (remoteData.success && Array.isArray(remoteData.data)) setRemoteTodayList(remoteData.data);
        if (leaveData.success && Array.isArray(leaveData.data)) setLeaveTodayList(leaveData.data);
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, <span className="dashboard-title-accent">{employeeData?.personalInfo?.fullName || "User"}</span></h1>
        <p className="dashboard-subtitle">{user.role} Dashboard</p>
        <p className="dashboard-date">{todayFormatted}</p>
      </header>

      {stats && (
        <section className="dashboard-stats" aria-label="Overview statistics">
          <div className="stat-card stat-card--total">
            <span className="stat-card__label">Total Employees</span>
            <span className="stat-card__value">{stats.totalEmployees}</span>
          </div>
          <div className="stat-card stat-card--present">
            <span className="stat-card__label">Present Today</span>
            <span className="stat-card__value">{stats.presentToday ?? 0}</span>
          </div>
          <div className="stat-card stat-card--remote">
            <span className="stat-card__label">Remote Today</span>
            <span className="stat-card__value">{stats.remoteToday ?? 0}</span>
          </div>
          <div className="stat-card stat-card--leave">
            <span className="stat-card__label">On Leave Today</span>
            <span className="stat-card__value">{stats.leaveToday ?? 0}</span>
          </div>
        </section>
      )}

      {(presentTodayList.length > 0 || employeeData || stats) && (
        <div className="dashboard-grid">
          <section className="dashboard-card dashboard-card--full">
            <div className="dashboard-card__head">
              <h2 className="dashboard-card__title">Present Today</h2>
              <Link to="/attendance" className="dashboard-card__link">View all attendance →</Link>
            </div>
            {presentTodayList.length > 0 ? (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Work Hrs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presentTodayList.map((p, i) => (
                      <tr key={i}>
                        <td>{p.fullName}</td>
                        <td>{p.employeeCode || "—"}</td>
                        <td>{p.department}</td>
                        <td>{p.designation}</td>
                        <td>{p.check_in || "—"}</td>
                        <td>{p.check_out || "—"}</td>
                        <td>{p.work_hours != null ? p.work_hours : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dashboard-empty-state">No one marked present yet today.</p>
            )}
          </section>

          <section className="dashboard-card dashboard-card--full">
            <div className="dashboard-card__head">
              <h2 className="dashboard-card__title">Remote Today</h2>
              <Link to="/remote" className="dashboard-card__link">View remote requests →</Link>
            </div>
            {remoteTodayList.length > 0 ? (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remoteTodayList.map((r, i) => (
                      <tr key={i}>
                        <td>{r.fullName}</td>
                        <td>{r.employeeCode || "—"}</td>
                        <td>{r.department}</td>
                        <td>{r.designation}</td>
                        <td>{r.startDate} – {r.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dashboard-empty-state">No one on remote today.</p>
            )}
          </section>

          <section className="dashboard-card dashboard-card--full">
            <div className="dashboard-card__head">
              <h2 className="dashboard-card__title">On Leave Today</h2>
              <Link to="/leave" className="dashboard-card__link">View leave requests →</Link>
            </div>
            {leaveTodayList.length > 0 ? (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Type</th>
                      <th>Period</th>
                      <th>Half Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTodayList.map((l, i) => (
                      <tr key={i}>
                        <td>{l.fullName}</td>
                        <td>{l.employeeCode || "—"}</td>
                        <td>{l.department}</td>
                        <td>{l.designation}</td>
                        <td><span className="dashboard-badge dashboard-badge--leave">{l.type}</span></td>
                        <td>{l.startDate} – {l.endDate}</td>
                        <td>{l.isHalfDay ? "Yes" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dashboard-empty-state">No one on leave today.</p>
            )}
          </section>

          {employeeData && (
          <>
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Personal Info</h2>
            <dl className="dashboard-info-list">
              <div className="dashboard-info-row"><dt>HRMS ID</dt><dd>{employeeData.personalInfo.employeeCode || "—"}</dd></div>
              <div className="dashboard-info-row"><dt>Designation</dt><dd>{employeeData.personalInfo.designation || "—"}</dd></div>
              <div className="dashboard-info-row"><dt>Department</dt><dd>{employeeData.personalInfo.department || "—"}</dd></div>
              <div className="dashboard-info-row"><dt>Joining Date</dt><dd>{employeeData.personalInfo.joiningDate || "—"}</dd></div>
              <div className="dashboard-info-row"><dt>Email</dt><dd>{employeeData.personalInfo.email || "—"}</dd></div>
              <div className="dashboard-info-row"><dt>Phone</dt><dd>{employeeData.personalInfo.phone || "—"}</dd></div>
            </dl>
          </section>

      {employeeData?.attendance?.length > 0 && (
          <section className="dashboard-card dashboard-card--full">
            <h2 className="dashboard-card__title">Attendance (Last 7 Days)</h2>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Work Hours</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.attendance.map((a, i) => (
                <tr key={i}>
                  <td>{a.date}</td>
                  <td>{a.check_in || "-"}</td>
                  <td>{a.check_out || "-"}</td>
                  <td><span className={`dashboard-badge dashboard-badge--${(a.status || "").toLowerCase()}`}>{a.status}</span></td>
                  <td>{a.work_hours || "-"}</td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </section>
        )}

      {employeeData?.payslips?.length > 0 && (
          <section className="dashboard-card dashboard-card--full">
            <h2 className="dashboard-card__title">Recent Payslips</h2>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Generated</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.payslips.map((p, i) => (
                <tr key={i}>
                  <td>{p.month}</td>
                  <td>{p.netPay}</td>
                  <td><span className="dashboard-badge dashboard-badge--neutral">{p.status}</span></td>
                  <td>{p.generatedDate}</td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      {employeeData?.holidays?.length > 0 && (
          <section className="dashboard-card dashboard-card--full">
            <h2 className="dashboard-card__title">Upcoming Holidays</h2>
            <ul className="dashboard-holiday-list">
              {employeeData.holidays.map((h, i) => (
                <li key={i} className="dashboard-holiday-item">
                  <span className="dashboard-holiday-date">{h.date}</span>
                  <span className="dashboard-holiday-name">{h.name} {h.type ? `(${h.type})` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
          </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
