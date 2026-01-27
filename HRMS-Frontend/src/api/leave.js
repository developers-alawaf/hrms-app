import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const createLeaveRequest = async (leaveData, token) => {
  const response = await axios.post(`${API_URL}/api/leave`, leaveData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getLeaveRequests = async (token) => {
  const response = await axios.get(`${API_URL}/api/leave`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const approveLeaveRequest = async (id, token) => {
  const response = await axios.post(`${API_URL}/api/leave/${id}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const denyLeaveRequest = async (id, token) => {
  const response = await axios.post(`${API_URL}/api/leave/${id}/deny`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getLeavePolicy = async (token, companyId, year) => {
  try {
    const response = await axios.get(`${API_URL}/api/leave/policy`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { companyId, year }, // Pass companyId and year as query parameters
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const updateLeavePolicy = async (companyId, policyData, token) => {
  try {
    const response = await axios.patch(`${API_URL}/api/leave/policy/${companyId}`, policyData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getLeaveEntitlement = async (employeeId, year, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/leave/entitlement/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { year },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const updateLeaveEntitlement = async (employeeId, entitlementData, token) => {
  try {
    const response = await axios.patch(`${API_URL}/api/leave/entitlement/${employeeId}`, entitlementData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const generateMissingLeaveEntitlements = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/api/leave/generate-entitlements`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getLeaveSummary = async (employeeId, year, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/leave/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { year, employeeId },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};