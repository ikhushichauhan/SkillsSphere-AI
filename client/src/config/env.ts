const isProd = import.meta.env.PROD;

export const API_URL = import.meta.env.VITE_API_URL || (isProd ? "/api" : "http://localhost:5000");
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (isProd ? "" : "http://localhost:5000");
