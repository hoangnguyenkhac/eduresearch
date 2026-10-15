const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Đã có lỗi xảy ra');
  }
  return data;
};

// Auth API
export const authAPI = {
  login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/auth/me'),
  updateProfile: (data) => fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => fetchAPI('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => fetchAPI('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => fetchAPI('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => fetchAPI('/dashboard'),
};

// Surveys API
export const surveysAPI = {
  getAll: () => fetchAPI('/surveys'),
  getById: (id) => fetchAPI(`/surveys/${id}`),
  create: (data) => fetchAPI('/surveys', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/surveys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => fetchAPI(`/surveys/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  clone: (id) => fetchAPI(`/surveys/${id}/clone`, { method: 'POST' }),
  delete: (id) => fetchAPI(`/surveys/${id}`, { method: 'DELETE' }),
};

// Responses API
export const responsesAPI = {
  getBySurvey: (surveyId = '') => fetchAPI(`/responses?surveyId=${surveyId}`),
  getAll: (surveyId = '') => fetchAPI(`/responses?surveyId=${surveyId}`),
  create: (data) => fetchAPI('/responses', { method: 'POST', body: JSON.stringify(data) }),
  import: (data) => fetchAPI('/responses/import', { method: 'POST', body: JSON.stringify(data) }),
  bulkDelete: (ids, surveyId) => fetchAPI('/responses/bulk-delete', { method: 'POST', body: JSON.stringify({ ids, surveyId }) }),
  bulkStatus: (ids, status) => fetchAPI('/responses/bulk-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  delete: (id) => fetchAPI(`/responses/${id}`, { method: 'DELETE' }),
};

// Documents API
export const documentsAPI = {
  getAll: () => fetchAPI('/documents'),
  create: async (formData) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Đã có lỗi xảy ra');
    }
    return data;
  },
  download: async (id, fileName) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/documents/${id}/download`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tải file');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
  delete: (id) => fetchAPI(`/documents/${id}`, { method: 'DELETE' }),
};

// Users API
export const usersAPI = {
  getAll: () => fetchAPI('/users'),
  create: (data) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};
