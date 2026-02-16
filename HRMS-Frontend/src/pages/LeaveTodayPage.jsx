import { useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Search } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../styles/Dashboard.css";
import "../styles/Employee.css";

const LeaveTodayPage = () => {
  const { user, loading } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetching, setFetching] = useState(true);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter(
      (l) =>
        (l.fullName || "").toLowerCase().includes(q) ||
        (l.employeeCode || "").toLowerCase().includes(q) ||
        (l.department || "").toLowerCase().includes(q) ||
        (l.designation || "").toLowerCase().includes(q) ||
        (l.type || "").toLowerCase().includes(q)
    );
  }, [list, searchQuery]);

  useEffect(() => {
    const fetchList = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/leave-today`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setList(data.data);
      } catch (err) {
        console.error("Error fetching leave today:", err);
      } finally {
        setFetching(false);
      }
    };
    if (user) fetchList();
  }, [user]);

  if (loading) return <div className="dashboard-container"><div className="dashboard-loading"><div className="dashboard-loading-spinner" aria-hidden="true" /><p className="dashboard-loading-text">Loading...</p></div></div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <Link to="/dashboard" className="dashboard-card__link" style={{ fontSize: "0.875rem" }}>← Back to Dashboard</Link>
        <h1 className="dashboard-title" style={{ margin: 0 }}>On Leave Today</h1>
      </header>

      <section className="dashboard-card dashboard-card--full" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {fetching ? (
          <div className="dashboard-loading" style={{ minHeight: "200px" }}>
            <div className="dashboard-loading-spinner" aria-hidden="true" />
            <p className="dashboard-loading-text">Loading...</p>
          </div>
        ) : list.length > 0 ? (
          <>
            <div className="employee-search-wrap" style={{ marginBottom: "1rem", maxWidth: "320px" }}>
              <Search size={18} className="employee-search-icon" aria-hidden />
              <input
                type="text"
                placeholder="Search by name, code, department, designation, or type"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="employee-input employee-search"
                aria-label="Search employees on leave"
              />
            </div>
            {filteredList.length > 0 ? (
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
                    {filteredList.map((l, i) => (
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
              <p className="dashboard-empty-state">No matches for your search.</p>
            )}
          </>
        ) : (
          <p className="dashboard-empty-state">No one on leave today.</p>
        )}
      </section>
    </div>
  );
};

export default LeaveTodayPage;
