import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getEmployeeProfile = async (employeeId, token) => {
  const response = await axios.get(`${API_URL}/api/employees/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getEmployees = async (token, departmentId = null) => {
  const params = departmentId ? { departments: departmentId } : {};
  const response = await axios.get(`${API_URL}/api/employees`, {
    headers: { Authorization: `Bearer ${token}` },
    params: params,
  });
  return response.data;
};

export const createEmployee = async (formData, token) => {
  const response = await axios.post(`${API_URL}/api/employees`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateEmployee = async (employeeId, formData, token) => {
  const response = await axios.patch(`${API_URL}/api/employees/${employeeId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMyAvatar = async (formData, token) => {
  const response = await axios.patch(`${API_URL}/api/employees/me/avatar`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteEmployee = async (employeeId, token) => {
  const response = await axios.delete(`${API_URL}/api/employees/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPotentialManagers = async (departmentId, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/employees/department/${departmentId}/managers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};