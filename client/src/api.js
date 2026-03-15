import axios from 'axios';

const baseURL = window.location.protocol === 'file:'
  ? 'http://localhost:3040/api'   // packaged Electron app
  : '/api';                        // dev mode (uses proxy)

const API = axios.create({ baseURL });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('rfi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
