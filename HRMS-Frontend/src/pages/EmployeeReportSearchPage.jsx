import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import { getEmployees } from "../api/employee";
import "../styles/Dashboard.css";
import "../styles/Employee.css";

const EmployeeReportSearchPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await getEmployees(token);
        if (res?.success && Array.isArray(res.data)) {
          setEmployees(
            res.data
              .filter((emp) => emp?._id && (emp.fullName || emp.newEmployeeCode))
              .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
          );
        } else {
          setError(res?.error || "Failed to load employees.");
        }
      } catch (err) {
        setError(err?.message || "Failed to load employees.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp._id,
        label: `${emp.fullName || "Unknown"} (${emp.newEmployeeCode || emp.employeeCode || "-"})`,
      })),
    [employees]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!month) {
      setError("Please select a month.");
      return;
    }
    if (!selectedEmployee?.value) {
      setError("Please select an employee.");
      return;
    }

    const url = `/reports/employee/view?employeeId=${encodeURIComponent(
      selectedEmployee.value
    )}&month=${encodeURIComponent(month)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="employee-container">
      <header
        className="dashboard-header"
        style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
      >
        <Link to="/dashboard" className="dashboard-card__link" style={{ fontSize: "0.875rem" }}>
          ← Back to Dashboard
        </Link>
        <h1 className="dashboard-title" style={{ margin: 0 }}>
          Employee Report
        </h1>
      </header>

      <div className="section-card" style={{ maxWidth: "720px" }}>
        <div className="section-header">
          <h3>Report Filters</h3>
        </div>
        <div className="section-body">
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="month">Month & Year</label>
                <input
                  id="month"
                  type="month"
                  className="employee-input"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="employee">Employee</label>
                <Select
                  inputId="employee"
                  className="employee-select"
                  classNamePrefix="react-select"
                  options={employeeOptions}
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  isLoading={loading}
                  placeholder={loading ? "Loading employees..." : "Search employee"}
                  isClearable
                />
              </div>
            </div>

            {error && <p className="employee-message employee-error">{error}</p>}

            <button type="submit" className="employee-button" disabled={loading}>
              Open Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReportSearchPage;
