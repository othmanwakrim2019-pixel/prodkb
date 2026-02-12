import axios from 'axios';

// Set base URL for API requests from environment variable
// If VITE_API_URL is not set, default to relative path (assuming reverse proxy)
// If you are running locally without Docker/Proxy, you might need http://localhost:3000
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Request interceptor to add auth token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors and unwrap data
axios.interceptors.response.use(
    (response) => {
        // If the response follows the standard ApiResponse format, unwrap the data
        if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'success')) {
            return {
                ...response,
                data: response.data.data
            };
        }
        return response;
    },
    (error) => {
        // Strip sensitive data from error before logging/throwing
        if (error.config) {
            // Remove authorization header from error config to prevent token exposure
            const sanitizedConfig = { ...error.config };
            if (sanitizedConfig.headers) {
                delete sanitizedConfig.headers.Authorization;
                delete sanitizedConfig.headers.authorization;
            }
            error.config = sanitizedConfig;
        }

        // Handle 401 Unauthorized - redirect to login (but not if already there)
        if (error.response?.status === 401) {
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
