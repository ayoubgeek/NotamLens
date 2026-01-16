import axios from 'axios';

// Create a single instance for all API calls
const apiClient = axios.create({
  // The base URL is a relative path. 
  // Vite's proxy (configured earlier) will forward '/api' to Python on port 8000.
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout for slow FAA scraping
});

// Response Interceptor: Handles global errors (like 404s or 500s)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend is dead or network is down
    const message = error.response?.data?.detail || 'Network Error: Cannot reach Mission Control.';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;