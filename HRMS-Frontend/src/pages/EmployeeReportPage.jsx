import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getEmployees } from "../api/employee";
import { getEmployeeAttendance } from "../api/attendance";
import "../styles/EmployeeReport.css";

const formatMinutesToHoursMinutes = (totalMinutes) => {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const parseHoursMinutesToMinutes = (val) => {
  if (val == null || val === "") return 0;
  if (typeof val === "number" && !Number.isNaN(val)) {
    // Backend sometimes returns work_hours as decimal hours
    return Math.round(val * 60);
  }
  if (typeof val === "string") {
    const match = val.match(/(\d+)\s*h\s*(\d+)\s*m/i);
    if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return 0;
};

const extractOriginalTime = (ts) => {
  if (!ts) return "-";
  const match = String(ts).match(/(\d{2}:\d{2})/);
  return match ? match[1] : "-";
};

const formatTime12h = (ts) => {
  const timeStr = extractOriginalTime(ts);
  if (!timeStr || timeStr === "-") return "-";
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] != null ? String(parseInt(parts[1], 10) || 0).padStart(2, "0") : "00";
  if (Number.isNaN(hours)) return timeStr;
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${minutes} ${period}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const formatDayName = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

const formatWorkHours = (val) => {
  if (val == null || val === "") return "0.00";
  if (typeof val === "string") return val;
  if (typeof val === "number" && !Number.isNaN(val)) return val.toFixed(2);
  return String(val);
};

const getMonthRange = (month) => {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    startDate: `${year}-${pad(monthIndex + 1)}-01`,
    endDate: `${year}-${pad(monthIndex + 1)}-${pad(end.getDate())}`,
    label: start.toLocaleString("default", { month: "long", year: "numeric" }),
  };
};

const EmployeeReportPage = () => {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const reportRef = useRef(null);

  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      if (!employeeId || !month) {
        setError("Missing report parameters.");
        setLoading(false);
        return;
      }

      const range = getMonthRange(month);
      if (!range) {
        setError("Invalid month format.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required.");
          setLoading(false);
          return;
        }

        const [employeeRes, attendanceRes] = await Promise.all([
          getEmployees(token),
          getEmployeeAttendance(range.startDate, range.endDate, employeeId, token),
        ]);

        if (employeeRes?.success && Array.isArray(employeeRes.data)) {
          const matched = employeeRes.data.find((emp) => emp?._id === employeeId);
          setEmployee(matched || null);
        }

        if (attendanceRes?.success) {
          const rows = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
          rows.sort((a, b) => new Date(a.date) - new Date(b.date));
          setAttendance(rows);
        } else {
          setError(attendanceRes?.error || "Failed to load attendance.");
        }
      } catch (err) {
        setError(err?.message || "Failed to load report.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [employeeId, month]);

  const summary = useMemo(() => {
    const counts = {
      total: attendance.length,
      present: 0,
      absent: 0,
      remote: 0,
      leave: 0,
      holiday: 0,
      weekend: 0,
      incomplete: 0,
      other: 0,
      totalWorkMinutes: 0,
      totalOvertimeMinutes: 0,
      totalShortfallMinutes: 0,
    };

    attendance.forEach((rec) => {
      const status = String(rec?.status || "").toLowerCase().trim();
      if (status === "present") counts.present += 1;
      else if (status === "absent") counts.absent += 1;
      else if (status === "remote") counts.remote += 1;
      else if (status === "leave") counts.leave += 1;
      else if (status.includes("holiday")) counts.holiday += 1;
      else if (status.includes("weekend")) counts.weekend += 1;
      else if (status === "incomplete") counts.incomplete += 1;
      else counts.other += 1;

      counts.totalWorkMinutes += parseHoursMinutesToMinutes(rec?.work_hours);
      counts.totalOvertimeMinutes += parseHoursMinutesToMinutes(rec?.overtimeHours);
      counts.totalShortfallMinutes += parseHoursMinutesToMinutes(rec?.workShortfall);
    });

    const expectedWorkingDays = Math.max(0, counts.total - counts.weekend - counts.holiday);
    const expectedWorkMinutes = Math.max(0, counts.totalWorkMinutes + counts.totalShortfallMinutes);
    const netOvertimeMinutes = Math.max(0, counts.totalWorkMinutes - expectedWorkMinutes);
    const netShortfallMinutes = Math.max(0, expectedWorkMinutes - counts.totalWorkMinutes);

    return {
      ...counts,
      expectedWorkingDays,
      expectedWorkMinutes,
      totalWorkHoursLabel: formatMinutesToHoursMinutes(counts.totalWorkMinutes),
      expectedWorkHoursLabel: formatMinutesToHoursMinutes(expectedWorkMinutes),
      overtimeHoursLabel: formatMinutesToHoursMinutes(netOvertimeMinutes),
      shortfallHoursLabel: formatMinutesToHoursMinutes(netShortfallMinutes),
      netOvertimeMinutes,
      netShortfallMinutes,
    };
  }, [attendance]);

  const monthLabel = useMemo(() => {
    const range = getMonthRange(month);
    return range?.label || "-";
  }, [month]);

  const employeeCode = employee?.newEmployeeCode || employee?.employeeCode || "-";
  const employeeName = employee?.fullName || "-";
  const employeeDept = employee?.department?.name || "-";
  const employeeDesig = employee?.designation?.name || "-";
  const employeeEmail = employee?.email || "-";

  const handlePrint = () => {
    window.print();
  };

  const loadExternalScript = (src, globalKey) =>
    new Promise((resolve, reject) => {
      if (globalKey && window[globalKey]) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await loadExternalScript(
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
        "html2canvas"
      );
      await loadExternalScript(
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
        "jspdf"
      );

      const target = reportRef.current;
      if (!target || !window.html2canvas || !window.jspdf?.jsPDF) {
        throw new Error("PDF library not available.");
      }

      const canvas = await window.html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      let imgWidth = pageWidth;
      let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
      }
      const x = (pageWidth - imgWidth) / 2;
      pdf.addImage(imgData, "JPEG", x, 0, imgWidth, imgHeight);

      const safeName = String(employeeName).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
      const safeMonth = (month || "").replace(/[^0-9-]/g, "");
      pdf.save(`employee_report_${safeName}_${safeMonth || "month"}.pdf`);
    } catch (err) {
      console.error(err);
      window.alert("Unable to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="employee-report-message">Loading report...</div>;
  if (error) return <div className="employee-report-message error">{error}</div>;

  return (
    <div className="employee-report-page">
      <div className="employee-report-actions">
        <button
          type="button"
          className="employee-report-btn"
          onClick={handleDownloadPdf}
          disabled={downloading}
        >
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
        <button type="button" className="employee-report-btn secondary" onClick={handlePrint}>
          Print
        </button>
      </div>

      <section className="employee-report-sheet" ref={reportRef}>
        <header className="employee-report-header">
          <div>
            <h1 className="employee-report-title">Employee Monthly Report</h1>
            <p className="employee-report-subtitle">{monthLabel}</p>
          </div>
          <div className="employee-report-meta">
            <div>
              <span className="label">Generated:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <span className="label">Report ID:</span>
              <span>{employeeCode}</span>
            </div>
          </div>
        </header>

        <section className="employee-report-section">
          <h2 className="employee-report-section-title">Employee Information</h2>
          <div className="employee-report-grid">
            <div>
              <span className="label">Name : {employeeName}</span>
            </div>
            <div>
              <span className="label">Department : {employeeDept}</span>
            </div>
            <div>
              <span className="label">Designation : {employeeDesig}</span>
            </div>
          </div>
        </section>

        <section className="employee-report-section">
          <h2 className="employee-report-section-title">Summary</h2>
          <div className="employee-report-summary">
            <div>
              <span className="label">Total Days : {summary.total}</span>
            </div>
            <div>
              <span className="label">Expected Working Days : {summary.expectedWorkingDays}</span>
            </div>
            <div>
              <span className="label">Present : {summary.present}</span>
            </div>
            <div>
              <span className="label">Absent : {summary.absent}</span>
            </div>
            <div>
              <span className="label">Remote : {summary.remote}</span>
            </div>
            <div>
              <span className="label">Leave : {summary.leave}</span>
            </div>
            <div>
              <span className="label">Holiday : {summary.holiday}</span>
            </div>
            <div>
              <span className="label">Weekend : {summary.weekend}</span>
            </div>
            <div>
              <span className="label">Expected Work Hours : {summary.expectedWorkHoursLabel}</span>
            </div>
            <div>
              <span className="label">Total Work Hours : {summary.totalWorkHoursLabel}</span>
            </div>
            <div>
              <span className="label">
                {summary.netOvertimeMinutes > 0 ? "Overtime Hours" : "Shortfall Hours"} :{" "}
                {summary.netOvertimeMinutes > 0
                  ? summary.overtimeHoursLabel
                  : summary.shortfallHoursLabel}
              </span>
            </div>
          </div>
        </section>

        <section className="employee-report-section">
          <h2 className="employee-report-section-title">Attendance Details</h2>
          <div className="employee-report-table-wrapper">
            <table className="employee-report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Shortfall</th>
                  <th>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="employee-report-empty">
                      No attendance data for this month.
                    </td>
                  </tr>
                ) : (
                  attendance.map((rec) => (
                    <tr key={`${rec._id || rec.date}-${rec.status || "row"}`}>
                      <td>{formatDate(rec.date)}</td>
                      <td>{formatDayName(rec.date)}</td>
                      <td>{rec.status || "-"}</td>
                      <td>{formatTime12h(rec.check_in)}</td>
                      <td>{formatTime12h(rec.check_out)}</td>
                      <td>{formatWorkHours(rec.work_hours)}</td>
                      <td>{rec.workShortfall || "0h 0m"}</td>
                      <td>{rec.overtimeHours || "0h 0m"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
};

export default EmployeeReportPage;
