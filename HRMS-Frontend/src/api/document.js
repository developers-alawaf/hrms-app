import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
export const getDocuments = async (token, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { success: false, error: error.message };
  }
};

export const getDocumentById = async (id, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return { success: false, error: error.message };
  }
};

export const uploadDocument = async (formData, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const uploadCommonDocument = async (formData, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/common`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCommonDocuments = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/documents/common`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};

export const deleteDocument = async (id, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete document');
    }
    return data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};