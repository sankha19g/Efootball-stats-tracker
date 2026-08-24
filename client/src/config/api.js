// Clean up the API URL to ensure no double slashes or trailing slashes
let API_URL = import.meta.env.VITE_API_URL || '';

// When running on localhost / development, target local backend server
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    API_URL = 'http://localhost:5001';
}

if (API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1);
}

export default API_URL;
