import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getDesignations = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/designations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const getDesignationsByDepartment = async (departmentId, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/designations/department/${departmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const createDesignation = async (designationData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/designations`, designationData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};