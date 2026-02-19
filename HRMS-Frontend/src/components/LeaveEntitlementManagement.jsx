import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  getLeaveEntitlement,
  updateLeaveEntitlement,
  generateMissingLeaveEntitlements,
} from '../api/leave';
import { getEmployees } from '../api/employee';
import { AuthContext } from '../context/AuthContext';
import { Gift, User, Calendar, Save, RefreshCw } from 'lucide-react';
import '../styles/Leave.css';
import '../styles/LeaveEntitlementManagement.css';

const LEAVE_TYPES = [
  { key: 'casual', label: 'Casual Leave', desc: 'Short-term personal leave' },
  { key: 'sick', label: 'Sick Leave', desc: 'Medical or health-related absence' },
  { key: 'annual', label: 'Annual Leave', desc: 'Vacation / yearly entitlement' },
  { key: 'maternity', label: 'Maternity Leave', desc: 'Parental leave entitlement' },
];

const LeaveEntitlementManagement = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [entitlement, setEntitlement] = useState(null);
  const [formData, setFormData] = useState({
    casual: 0,
    sick: 0,
    annual: 0,
    maternity: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isHRorAdmin = ['HR Manager', 'Super Admin', 'Company Admin'].includes(user?.role);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchEntitlement = useCallback(async (employeeIdToFetch, yearToFetch) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await getLeaveEntitlement(employeeIdToFetch, yearToFetch, token);
      if (data?.success) {
        const d = data.data || {};
        setEntitlement(data.data);
        setFormData({
          casual: d.casual ?? 0,
          sick: d.sick ?? 0,
          annual: d.annual ?? 0,
          maternity: d.maternity ?? 0,
        });
      } else {
        setError(data?.error || 'Failed to fetch leave entitlement.');
        setEntitlement(null);
      }
    } catch (err) {
      if (err?.error === 'Leave entitlement not found') {
        setEntitlement(null);
      } else {
        const errMsg = err?.error || err?.message || 'An unexpected error occurred.';
        setError(typeof errMsg === 'string' ? errMsg : 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        if (isHRorAdmin) {
          const token = localStorage.getItem('token');
          const data = await getEmployees(token);
          const list = data?.data || [];
          if (data?.success && Array.isArray(list)) {
            setEmployees(list);
            if (list.length > 0 && !selectedEmployeeId) {
              setSelectedEmployeeId(list[0]._id);
            }
          } else {
            setError(data?.error || 'Failed to fetch employees.');
          }
        } else if (user?.employeeId) {
          setSelectedEmployeeId(user.employeeId);
        }
      } catch (err) {
        const errMsg = err?.error || err?.message || 'An unexpected error occurred.';
        setError(typeof errMsg === 'string' ? errMsg : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, isHRorAdmin]);

  useEffect(() => {
    if (selectedEmployeeId && year) {
      fetchEntitlement(selectedEmployeeId, year);
    } else {
      setEntitlement(null);
      setFormData({ casual: 0, sick: 0, annual: 0, maternity: 0 });
    }
  }, [selectedEmployeeId, year, fetchEntitlement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const data = await updateLeaveEntitlement(
        selectedEmployeeId,
        { ...formData, year },
        token
      );
      if (data?.success) {
        setSuccess(data.message || 'Leave entitlement updated successfully!');
        fetchEntitlement(selectedEmployeeId, year);
      } else {
        setError(data?.error || 'Failed to update leave entitlement.');
      }
    } catch (err) {
      const errMsg = err?.error || err?.message || 'An unexpected error occurred.';
      setError(typeof errMsg === 'string' ? errMsg : 'Failed to update leave entitlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateMissing = async () => {
    setError('');
    setSuccess('');
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const data = await generateMissingLeaveEntitlements(token);
      if (data?.success) {
        setSuccess(data.message || 'Missing entitlements generated successfully!');
        const employeesData = await getEmployees(token);
        const list = employeesData?.data || [];
        if (employeesData?.success && Array.isArray(list) && list.length > 0) {
          setEmployees(list);
          setSelectedEmployeeId(list[0]._id);
          fetchEntitlement(list[0]._id, year);
        }
      } else {
        setError(data?.error || 'Failed to generate missing entitlements.');
      }
    } catch (err) {
      const errMsg = err?.error || err?.message || 'An unexpected error occurred.';
      setError(typeof errMsg === 'string' ? errMsg : 'Failed to generate missing entitlements.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="entitlement-container">
        <div className="entitlement-access-denied">Please log in to view entitlements.</div>
      </div>
    );
  }

  const selectedEmployee = employees.find((emp) => emp._id === selectedEmployeeId);
  const isMaleEmployee = selectedEmployee?.gender === 'Male';

  return (
    <div className="entitlement-container">
      <div className="entitlement-header">
        <h2 className="entitlement-title">
          <Gift size={26} strokeWidth={2} />
          Manage Leave Entitlements
        </h2>
      </div>

      <div className="entitlement-filters">
        {isHRorAdmin ? (
          <>
            <div className="entitlement-filter-group">
              <label htmlFor="employeeSelect">
                <User size={16} />
                Employee
              </label>
              <select
                id="employeeSelect"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="entitlement-select"
                disabled={loading}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.newEmployeeCode || '-'})
                  </option>
                ))}
              </select>
            </div>
            <div className="entitlement-filter-group">
              <label htmlFor="yearSelect">
                <Calendar size={16} />
                Year
              </label>
              <select
                id="yearSelect"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="entitlement-select"
                disabled={loading}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="entitlement-filter-actions">
              <button
                type="button"
                onClick={handleGenerateMissing}
                disabled={isGenerating}
                className="entitlement-btn entitlement-btn--outline"
              >
                <RefreshCw size={16} strokeWidth={2} />
                {isGenerating ? 'Generating...' : 'Generate Missing'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="entitlement-viewing-as">
              Viewing entitlement for: {user.fullName || user.email}
            </div>
            <div className="entitlement-filter-group">
              <label htmlFor="yearSelect">
                <Calendar size={16} />
                Year
              </label>
              <select
                id="yearSelect"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="entitlement-select"
                disabled={loading}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="entitlement-message entitlement-message--error">{error}</div>
      )}
      {success && (
        <div className="entitlement-message entitlement-message--success">{success}</div>
      )}

      {selectedEmployeeId && (
        <div className="entitlement-card">
          {loading ? (
            <div className="entitlement-loading">Loading entitlement...</div>
          ) : entitlement ? (
            <form onSubmit={handleSubmit} className="entitlement-form">
              <section className="entitlement-section">
                <h3 className="entitlement-section-title">Leave Days (days per year)</h3>
                <div className="entitlement-grid">
                  {LEAVE_TYPES.map(({ key, label, desc }) => {
                    const isMaternityDisabled = key === 'maternity' && isMaleEmployee;
                    return (
                      <div key={key} className="entitlement-field">
                        <label htmlFor={key}>{label}</label>
                        <span className="entitlement-field-desc">{desc}</span>
                        {isMaternityDisabled ? (
                          <div className="entitlement-input entitlement-input--disabled">
                            N/A
                          </div>
                        ) : (
                          <input
                            type="number"
                            id={key}
                            name={key}
                            value={formData[key]}
                            onChange={handleChange}
                            min="0"
                            required
                            className="entitlement-input"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              {isHRorAdmin && (
                <div className="entitlement-actions">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="entitlement-btn entitlement-btn--primary"
                  >
                    <Save size={18} strokeWidth={2.5} />
                    {isSubmitting ? 'Updating...' : 'Update Entitlement'}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="entitlement-empty">
              <Gift size={40} strokeWidth={1.5} />
              <p>No entitlement found for this employee and year.</p>
              {isHRorAdmin && (
                <p className="entitlement-empty-hint">
                  Click &quot;Generate Missing&quot; to create entitlements.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveEntitlementManagement;
