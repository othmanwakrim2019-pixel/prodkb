import axios from 'axios';

// Set base URL for API requests from environment variable
// If VITE_API_URL is not set, default to relative path (assuming reverse proxy)
// API v1 — all calls go through /api/v1 (backward compat on server still supports /api)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// ── Cookies are sent automatically ──
// httpOnly cookies (access_token, refresh_token) are sent by the browser
// on every request when withCredentials is true. No need to manually
// inject an Authorization header.
axios.defaults.withCredentials = true;

// Request interceptor to attach CSRF token
axios.interceptors.request.use(
    (config) => {
        const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
        if (match && match[1]) {
            config.headers['x-csrf-token'] = match[1];
        }
        return config;
    },
    (error) => Promise.reject(error)
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
            const sanitizedConfig = { ...error.config };
            if (sanitizedConfig.headers) {
                delete sanitizedConfig.headers.Authorization;
                delete sanitizedConfig.headers.authorization;
            }
            error.config = sanitizedConfig;
        }

        // Handle 401 Unauthorized - redirect to login (but not if already there)
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
