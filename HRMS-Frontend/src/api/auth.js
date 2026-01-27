import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const acceptInvitation = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/accept-invitation`, { token, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const changePassword = async (oldPassword, newPassword, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/change-password`,
      { oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const initialSetup = async (fullName, email, password, companyName) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/initial-setup`, { fullName, email, password, companyName });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const resendInvitation = async (email, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/resend-invitation`,
      { email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, error: 'Network error' };
  }
};

export const forceResendInvitation = async (email, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/force-resend-invitation`,
      { email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};