import axios from 'axios';

// Always call Render directly — no proxy needed
const API = axios.create({ 
  baseURL: 'https://attendx-backend-217u.onrender.com/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

// Ping backend every 14 minutes to prevent Render sleeping
const BACKEND_URL = '/api/health';
setInterval(async () => {
  try { await fetch(BACKEND_URL); } catch {}
}, 14 * 60 * 1000);
