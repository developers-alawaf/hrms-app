import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getShiftTemplates = async () => {
  const response = await axios.get(`${API_URL}/shifttemplates`, { headers: getAuthHeaders() });
  return response.data;
};

export const createShiftTemplate = async (templateData) => {
  const response = await axios.post(`${API_URL}/shifttemplates`, templateData, { headers: getAuthHeaders() });
  return response.data;
};

export const updateShiftTemplate = async (id, templateData) => {
  const response = await axios.put(`${API_URL}/shifttemplates/${id}`, templateData, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteShiftTemplate = async (id) => {
  const response = await axios.delete(`${API_URL}/shifttemplates/${id}`, { headers: getAuthHeaders() });
  return response.data;
};
