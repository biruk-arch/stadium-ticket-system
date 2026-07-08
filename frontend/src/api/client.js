import axios from 'axios';

// In dev, Vite proxies /api to the backend (see vite.config.js). In production,
// set VITE_API_BASE_URL to the deployed API origin, e.g. https://api.yourdomain.com/api
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('stadium_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('stadium_token');
      localStorage.removeItem('stadium_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;

export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback;
}
