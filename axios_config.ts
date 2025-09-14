import axios from "axios";

// You can load from env or use defaults
const api = axios.create({
  baseURL: process.env.API_URL || "http://localhost:3000/",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
