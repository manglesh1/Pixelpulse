const axios = require("axios");

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }
  return config;
});

module.exports = api;
