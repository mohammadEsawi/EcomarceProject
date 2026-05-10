import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token + fix multipart uploads ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // When sending FormData, remove the default Content-Type so the browser
    // sets it automatically with the correct multipart boundary.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: unwrap data, handle 401 ───────────────────────────
api.interceptors.response.use(
  (response) => {
    const d = response.data;
    // Server always returns { success, message, data }
    return d?.data !== undefined ? d.data : d;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    if (error.response?.status === 401) {
      // Clear stale tokens but don't navigate — let the component handle it
      localStorage.removeItem('authToken');
    }
    return Promise.reject(new Error(message));
  },
);

// Convenience helper for multipart uploads (images)
export function apiUpload(path, formData, token) {
  return api.post(path, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default api;
