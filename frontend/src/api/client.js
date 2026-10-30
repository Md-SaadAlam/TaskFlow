import axios from 'axios';

// The backend URL comes from the VITE_API_URL environment variable (see frontend/.env.example).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const TOKEN_KEY = 'taskflow_token';

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, // free hosting can take ~1 minute to wake up
});

// Attach the login token to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the token is invalid/expired, log the user out.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Turns any Axios error into a message that is safe and helpful to show to the user.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error.request) return 'Cannot reach the server. Check your internet connection or try again in a moment.';
  return fallback;
}

export default client;
