import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const getConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getCompanies = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/company`, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getCompanyById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/company/${id}`, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const createCompany = async (companyData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/company`, companyData, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const updateCompany = async (id, companyData, token) => {
  try {
    const response = await axios.put(`${API_URL}/api/company/${id}`, companyData, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getScheduleOverrides = async (companyId, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/company/${companyId}/schedule-overrides`, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const createScheduleOverride = async (companyId, overrideData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/company/${companyId}/schedule-overrides`, overrideData, getConfig(token));
    return response.data;
  } catch (error) {
    throw error; // Preserve axios error so caller can read err.response?.data?.error
  }
};

export const updateScheduleOverride = async (overrideId, overrideData, token) => {
  try {
    const response = await axios.put(`${API_URL}/api/company/schedule-overrides/${overrideId}`, overrideData, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const deleteScheduleOverride = async (overrideId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/api/company/schedule-overrides/${overrideId}`, getConfig(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};