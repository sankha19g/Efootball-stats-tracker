// Use environment variable if available, otherwise default to empty for local proxy
const API_URL = import.meta.env.VITE_API_URL || '';

export default API_URL;
