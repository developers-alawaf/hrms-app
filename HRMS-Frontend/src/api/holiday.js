
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getHolidaysForYear = async (year) => {
  const response = await axios.get(`${API_URL}/api/holidays`, {
    params: { year },
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const setHolidaysForYear = async (year, holidays) => {
  const response = await axios.post(`${API_URL}/api/holidays`, {
    year,
    holidays,
  }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const uploadHolidayExcel = async (formData) => {
  const response = await axios.post(`${API_URL}/api/holidays/upload-excel`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data', // Important for file uploads
    },
  });
  return response.data;
};
