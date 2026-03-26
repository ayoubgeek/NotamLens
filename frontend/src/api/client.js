import axios from 'axios';

// Singleton Axios instance
const apiClient = axios.create({
  // Assumes relative routing with reverse proxy
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Extended timeout for external FAA dependency
});

// Global response interceptor for normalized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'Network Error: Cannot reach Mission Control.';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;