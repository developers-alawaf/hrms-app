import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getDepartments = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getDepartmentsByCompany = async (companyId, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/departments/company/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const createDepartment = async (departmentData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/departments`, departmentData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};