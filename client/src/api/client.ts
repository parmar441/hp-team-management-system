import axios from "axios";

// In development, Vite proxies /api → localhost:3000.
// In production on Render, VITE_API_URL is set to the backend service URL.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
