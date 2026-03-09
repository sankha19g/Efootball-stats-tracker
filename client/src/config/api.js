// API Configuration
// Ensure no trailing slash to avoid double-slashes in URLs
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default API_URL;
