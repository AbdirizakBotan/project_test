import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Add a request interceptor to handle content type
api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if not on login page and not during login attempt
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/admin/login');
    const isOnSignInPage = window.location.pathname === '/signin';
    if (error.response && error.response.status === 401 && !isLoginRequest && !isOnSignInPage) {
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;