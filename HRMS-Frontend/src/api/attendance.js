import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getEmployeeAttendance = async (startDate, endDate, employeeId, token) => {
  try {
    const params = { startDate, endDate };
    if (employeeId) params.employeeId = employeeId;

    const response = await axios.get(`${API_URL}/api/attendance`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const createAdjustmentRequest = async (requestData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/attendance/adjustments`, requestData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getAdjustmentRequests = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/attendance/adjustments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const managerReviewAdjustment = async (id, reviewData, token) => {
  try {
    const response = await axios.patch(`${API_URL}/api/attendance/adjustments/${id}/manager-review`, reviewData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const hrReviewAdjustment = async (id, reviewData, token) => {
  try {
    const response = await axios.patch(`${API_URL}/api/attendance/adjustments/${id}/hr-review`, reviewData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};