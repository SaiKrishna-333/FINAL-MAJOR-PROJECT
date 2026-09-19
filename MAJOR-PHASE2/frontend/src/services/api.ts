import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("API Request:", config.method?.toUpperCase(), config.url);
  console.log("Token found:", token ? "YES" : "NO");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization header added:", `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.warn("NO TOKEN FOUND for request:", config.url);
  }
  return config;
}, (error) => {
  console.error("Request interceptor error:", error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 401) {
      console.error("Authentication failed - clearing token");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;