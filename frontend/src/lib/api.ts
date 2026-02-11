/**
 * Consolidated API client — re-exports the fully-configured axios instance
 * from utils/axios.ts which includes token injection, 401 redirect,
 * and header sanitization interceptors.
 */
import axios from '../utils/axios';

export const api = axios;
