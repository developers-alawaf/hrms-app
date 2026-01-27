

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Failed to fetch profile' };
  }
};