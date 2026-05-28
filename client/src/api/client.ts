import axios from "axios";

// In development, Vite proxies /api → localhost:3000.
// In production, Express serves the React app, so /api is same-origin.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default api;
