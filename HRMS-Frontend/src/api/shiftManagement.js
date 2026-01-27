import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api/shift-management`;

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

const fileHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// ==================== SHIFT MANAGEMENT ====================

/**
 * POST /shift-management/shifts
 * Create a new shift
 */
export const createShift = async (shiftData) => {
  return axios.post(`${API_URL}/shifts`, shiftData, authHeaders());
};

/**
 * GET /shift-management/shifts
 * List all shifts
 */
export const listShifts = async () => {
  return axios.get(`${API_URL}/shifts`, authHeaders());
};

/**
 * PUT /shift-management/shifts/:id
 * Update a shift
 */
export const updateShift = async (id, shiftData) => {
  return axios.put(`${API_URL}/shifts/${id}`, shiftData, authHeaders());
};

// ==================== ROSTER MANAGEMENT ====================

/**
 * POST /shift-management/roster
 * Generate roster with array of assignments
 */
export const generateRoster = async (rosterData) => {
  return axios.post(`${API_URL}/roster`, rosterData, authHeaders());
};

/**
 * POST /shift-management/roster/upload
 * Upload roster from Excel file
 * Expected field name: 'rosterFile'
 */
export const uploadRoster = async (formData) => {
  return axios.post(`${API_URL}/roster/upload`, formData, fileHeaders());
};

/**
 * GET /shift-management/roster/:employeeId?month=YYYY-MM
 * Get employee roster for a specific month
 */
export const getEmployeeRoster = async (employeeId, month) => {
  return axios.get(`${API_URL}/roster/${employeeId}?month=${month}`, authHeaders());
};

/**
 * GET /shift-management/roster/assigned-shift?date=YYYY-MM-DD
 * Get assigned shift for a specific date (for current employee)
 */
export const getAssignedShiftForDate = async (date) => {
  return axios.get(`${API_URL}/roster/assigned-shift?date=${date}`, authHeaders());
};

/**
 * DELETE /shift-management/roster?employeeId=...&date=...
 * Delete a specific roster entry
 */
export const deleteRosterEntry = async (employeeId, date) => {
  return axios.delete(`${API_URL}/roster?employeeId=${employeeId}&date=${date}`, authHeaders());
};

// ==================== WFH REQUESTS ====================

/**
 * POST /shift-management/wfh-requests
 * Submit WFH request (employee context from auth token)
 */
export const submitWFHRequest = async (requestData) => {
  return axios.post(`${API_URL}/wfh-requests`, requestData, authHeaders());
};

/**
 * PUT /shift-management/wfh-requests/:id/status
 * Update WFH request status (approve/reject)
 */
export const updateWFHRequestStatus = async (id, status) => {
  return axios.put(`${API_URL}/wfh-requests/${id}/status`, { status }, authHeaders());
};

/**
 * GET /shift-management/wfh-requests
 * Get all WFH requests
 */
export const getWFHRequests = async () => {
  return axios.get(`${API_URL}/wfh-requests`, authHeaders());
};

// ==================== OUTSIDE WORK REQUESTS ====================

/**
 * POST /shift-management/outside-work-requests
 * Submit outside work request
 */
export const submitOutsideWorkRequest = async (requestData) => {
  return axios.post(`${API_URL}/outside-work-requests`, requestData, authHeaders());
};

/**
 * PUT /shift-management/outside-work-requests/:id/status
 * Update outside work request status (approve/reject)
 */
export const updateOutsideWorkRequestStatus = async (id, status) => {
  return axios.put(`${API_URL}/outside-work-requests/${id}/status`, { status }, authHeaders());
};

/**
 * GET /shift-management/outside-work-requests
 * Get all outside work requests
 */
export const getOutsideWorkRequests = async () => {
  return axios.get(`${API_URL}/outside-work-requests`, authHeaders());
};

// ==================== SHIFT-BASED ATTENDANCE ====================

/**
 * GET /shift-management/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&employeeId=...
 * Get shift-based attendance for NOC department employees
 */
export const getShiftBasedAttendance = async (startDate, endDate, employeeId = null) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (employeeId) params.employeeId = employeeId;
  return axios.get(`${API_URL}/attendance`, { 
    ...authHeaders(), 
    params 
  });
};