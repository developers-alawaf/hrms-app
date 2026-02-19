import React, { useState, useEffect, useContext, useCallback } from 'react';
import { getLeavePolicy, updateLeavePolicy } from '../api/leave';
import { getCompanies } from '../api/company';
import { AuthContext } from '../context/AuthContext';
import { Settings2, Building2, Calendar, Save } from 'lucide-react';
import '../styles/Leave.css';
import '../styles/LeavePolicyForm.css';

const LEAVE_TYPES = [
  { key: 'casual', label: 'Casual Leave', desc: 'Short-term personal leave' },
  { key: 'sick', label: 'Sick Leave', desc: 'Medical or health-related absence' },
  { key: 'annual', label: 'Annual Leave', desc: 'Vacation / yearly entitlement' },
  { key: 'maternity', label: 'Maternity Leave', desc: 'Parental leave entitlement' },
];

const LeavePolicyForm = () => {
  const { user } = useContext(AuthContext);
  const [policy, setPolicy] = useState({
    casual: 0,
    sick: 0,
    annual: 0,
    annualAccrualDays: 18,
    maternity: 0,
  });
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(user?.companyId || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin', 'C-Level Executive'].includes(user?.role);
  const isSuperAdmin = user?.role === 'Super Admin';

  const fetchPolicy = useCallback(async (companyIdToFetch, yearToFetch) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await getLeavePolicy(token, companyIdToFetch, yearToFetch);
      if (data?.success) {
        const p = data.data || {};
        setPolicy({
          casual: p.casual ?? 0,
          sick: p.sick ?? 0,
          annual: p.annual ?? 0,
          annualAccrualDays: p.annualAccrualDays ?? 18,
          maternity: p.maternity ?? 0,
        });
      } else {
        setError(data?.error || 'Failed to fetch leave policy.');
      }
    } catch (err) {
      const errMsg = err?.error || err?.message || 'An unexpected error occurred.';
      setError(typeof errMsg === 'string' ? errMsg : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;

    const init = async () => {
      setLoading(true);
      setError('');
      try {
        if (isSuperAdmin) {
          const token = localStorage.getItem('token');
          const companiesData = await getCompanies(token);
          const list = companiesData?.data || [];
          if (companiesData?.success) {
            setCompanies(Array.isArray(list) ? list : []);
            if (Array.isArray(list) && list.length > 0 && !selectedCompanyId) {
              setSelectedCompanyId(list[0]._id);
            }
          }
        } else {
          if (user?.companyId) {
            setSelectedCompanyId(user.companyId);
          } else {
            setError('User is not associated with a company.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        const errMsg = err?.error || err?.message || 'An unexpected error occurred during initialization.';
        setError(typeof errMsg === 'string' ? errMsg : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isAuthorized, isSuperAdmin, user?.companyId]);

  useEffect(() => {
    if (!isAuthorized || !selectedCompanyId || !selectedYear) return;
    fetchPolicy(selectedCompanyId, selectedYear);
  }, [isAuthorized, selectedCompanyId, selectedYear, fetchPolicy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let num = parseInt(value, 10);
    if (name === 'annualAccrualDays') {
      num = Math.max(1, num || 18);
    } else {
      num = num || 0;
    }
    setPolicy((prev) => ({ ...prev, [name]: num }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const data = await updateLeavePolicy(
        selectedCompanyId,
        { ...policy, year: selectedYear },
        token
      );
      if (data.success) {
        setSuccess(data.message || 'Leave policy updated successfully!');
      } else {
        setError(data.error || 'Failed to update leave policy.');
      }
    } catch (err) {
      const errMsg = err?.error || err?.message || 'An unexpected error occurred.';
      setError(typeof errMsg === 'string' ? errMsg : 'Failed to update leave policy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="leave-policy-container">
        <div className="leave-policy-access-denied">Access Denied</div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="leave-policy-container">
      <div className="leave-policy-header">
        <h2 className="leave-policy-title">
          <Settings2 size={26} strokeWidth={2} />
          Manage Leave Policy
        </h2>
      </div>

      {isSuperAdmin && (
        <div className="leave-policy-filters">
          <div className="leave-policy-filter-group">
            <label htmlFor="companySelect">
              <Building2 size={16} />
              Company
            </label>
            <select
              id="companySelect"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="leave-policy-select"
              disabled={loading}
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="leave-policy-filter-group">
            <label htmlFor="yearSelect">
              <Calendar size={16} />
              Year
            </label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="leave-policy-select"
              disabled={loading || !selectedCompanyId}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!selectedCompanyId && isSuperAdmin && !loading && (
        <div className="leave-policy-message leave-policy-message--error">
          Please select a company to manage its leave policy.
        </div>
      )}

      {error && (
        <div className="leave-policy-message leave-policy-message--error">{error}</div>
      )}
      {success && (
        <div className="leave-policy-message leave-policy-message--success">{success}</div>
      )}

      {(selectedCompanyId || !isSuperAdmin) && (
        <div className="leave-policy-card">
          {loading ? (
            <div className="leave-policy-loading">Loading leave policy...</div>
          ) : (
            <form onSubmit={handleSubmit} className="leave-policy-form">
              <section className="leave-policy-section">
                <h3 className="leave-policy-section-title">Leave Entitlements (days per year)</h3>
                <div className="leave-policy-grid">
                  {LEAVE_TYPES.map(({ key, label, desc }) => (
                    <div key={key} className="leave-policy-field">
                      <label htmlFor={key}>{label}</label>
                      <span className="leave-policy-field-desc">{desc}</span>
                      <input
                        type="number"
                        id={key}
                        name={key}
                        value={policy[key]}
                        onChange={handleChange}
                        min="0"
                        required
                        className="leave-policy-input"
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="leave-policy-section leave-policy-section--accent">
                <h3 className="leave-policy-section-title">Annual Leave Accrual</h3>
                <div className="leave-policy-field leave-policy-field--full">
                  <label htmlFor="annualAccrualDays">Days of service per 1 annual leave</label>
                  <span className="leave-policy-field-desc">
                    After the first year, employees earn 1 annual leave day per this many days of
                    service. Cap = Annual Leave.
                  </span>
                  <input
                    type="number"
                    id="annualAccrualDays"
                    name="annualAccrualDays"
                    value={policy.annualAccrualDays ?? 18}
                    onChange={handleChange}
                    min="1"
                    required
                    className="leave-policy-input leave-policy-input--accent"
                    title="1 leave day earned per every X days after 1st year"
                  />
                  <small className="leave-policy-hint">
                    1 leave day per every {policy.annualAccrualDays ?? 18} days (after 365 days)
                  </small>
                </div>
              </section>

              <div className="leave-policy-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="leave-policy-btn leave-policy-btn--primary"
                >
                  <Save size={18} strokeWidth={2.5} />
                  {isSubmitting ? 'Updating...' : 'Update Policy'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default LeavePolicyForm;
