import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const getAllShifts = async () => {
  return axios.get(`${API_URL}/api/shifts`, authHeaders());
};

export const getShiftById = async (id) => {
  return axios.get(`${API_URL}/api/shifts/${id}`, authHeaders());
};

export const createShift = async (shiftData) => {
  return axios.post(`${API_URL}/api/shifts`, shiftData, authHeaders());
};

export const updateShift = async (id, shiftData) => {
  return axios.patch(`${API_URL}/api/shifts/${id}`, shiftData, authHeaders());
};

export const deleteShift = async (id) => {
  return axios.delete(`${API_URL}/api/shifts/${id}`, authHeaders());
};

export const assignShiftToEmployees = async (shiftId, employeeIds, companyId) => {
  return axios.post(`${API_URL}/api/shifts/assign`, { shiftId, employeeIds, companyId }, authHeaders());
};

export const removeEmployeeFromShift = async (employeeId) => {
  return axios.delete(`${API_URL}/api/shifts/${employeeId}/remove`, authHeaders());
};

export const getEmployees = async (params) => {
  return axios.get(`${API_URL}/api/shifts/employees`, { ...authHeaders(), params });
};
