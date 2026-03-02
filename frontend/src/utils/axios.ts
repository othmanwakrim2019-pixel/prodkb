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

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

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
    async (error) => {
        const originalRequest = error.config;

        // Strip sensitive data from error before logging/throwing
        if (error.config) {
            const sanitizedConfig = { ...error.config };
            if (sanitizedConfig.headers) {
                delete sanitizedConfig.headers.Authorization;
                delete sanitizedConfig.headers.authorization;
            }
            error.config = sanitizedConfig;
        }

        // Prevent infinite loops if the refresh endpoint itself returns 401
        if (originalRequest?.url?.includes('/auth/v1/refresh')) {
            // Already failed refresh, clean up queue
            processQueue(error);
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized via transparent refresh token
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            // If the original request was to the login endpoint, do NOT try to refresh
            if (originalRequest.url?.includes('/auth/v1/login') || originalRequest.url?.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, pause this request and queue it
                try {
                    await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                    // Retry original request once the token has been refreshed
                    return axios(originalRequest);
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh token endpoint (cookies sent automatically)
                await axios.post('/auth/v1/refresh');

                // Success: resolve queued requests
                processQueue(null);

                // Retry the original request that failed
                return axios(originalRequest);
            } catch (refreshError) {
                // Refresh failed (token expired or missing) - reject everything & redirect
                processQueue(refreshError);
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle hard 401s (no retry flag or exhausted retries) by redirecting
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
