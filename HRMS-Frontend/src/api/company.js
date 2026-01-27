import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getCompanies = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const createCompany = async (companyData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/company`, companyData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};