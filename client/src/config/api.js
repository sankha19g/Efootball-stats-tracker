// Clean up the API URL to ensure no double slashes or trailing slashes
let API_URL = import.meta.env.VITE_API_URL || '';

if (API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1);
}

export default API_URL;
