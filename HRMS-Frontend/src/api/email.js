import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Send email to selected employees
 * @param {Object} payload
 * @param {string[]} payload.employeeIds - Array of employee IDs
 * @param {string} payload.subject - Email subject
 * @param {string} payload.message - Email body/message
 * @param {string} token - JWT token
 */
export const sendEmailToEmployees = async (payload, token) => {
  const response = await axios.post(`${API_URL}/api/email/send`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};
