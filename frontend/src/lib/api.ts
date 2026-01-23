import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * ✅ Main API Engine (Axios Instance)
 * Enhanced to be compatible with TypeScript and Django standards
 */
const api: AxiosInstance = axios.create({
    // Base server URL
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    // Important: needed if using cookies or sessions with Django
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * ✅ Automatically add Auth Token
 * Using "Token" prefix as it's the default in Django Token Authentication
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token && config.headers) {
                // Configure header as expected by Django
                config.headers.Authorization = `Token ${token}`;
            }
        }
        
        // 🛠️ Enhancement: Ensure trailing slash at end of URLs (Django Trailing Slash)
        if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
            config.url += '/';
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * ✅ Handle server responses
 * Handle expiration (401) and intelligent redirection
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if error is 401 (Unauthorized)
        if (error.response?.status === 401) {
            
            // 🛑 New step: Check if the URL is "users/me"?
            // If it is, it's just a routine check from the header for a visitor, so don't redirect
            const isCheckUserRequest = error.config && error.config.url && error.config.url.includes('users/me');

            if (isCheckUserRequest) {
                // Quietly reject the request so React Query in the header knows there's no user and shows "Login" button
                return Promise.reject(error);
            }

            // ✅ In any other case (e.g. trying to save CV while not logged in), redirect to login page
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                
                // Avoid infinite redirect if user is already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;