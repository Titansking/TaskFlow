import axios from 'axios';

// Represents the standard format for responses we get back from the backend API.
export interface ApiResponse<T = any> {
  status: number;      // HTTP status code (e.g. 200, 400, 500)
  success: boolean;    // true if the request succeeded, false otherwise
  data: T;             // The actual content/payload returned by the API
  message?: string;    // An optional text message (e.g., "Registration successful")
}

// Create an instance of Axios with default settings (base URL and JSON content header)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Before any request is sent to the backend,
// this function automatically grabs the saved login token from localStorage 
// and adds it to the Authorization header so the server knows who we are.
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Add token to HTTP header
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling API responses and errors.
api.interceptors.response.use(
  // If the request was successful, just return the response directly
  (response) => response,
  
  // If the request failed, handle errors here
  (error) => {
    // If the server returns a 401 Unauthorized status (meaning the token is expired or missing)
    if (error.response && error.response.status === 401) {
      // 1. Clear session keys from browser localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      // 2. Redirect the user back to the login page if they are not already on the login or register pages
      if (
        typeof window !== 'undefined' && 
        !window.location.pathname.startsWith('/login') && 
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
    }
    
    // Pass the error along so components can catch it too
    return Promise.reject(error);
  }
);

export default api;
