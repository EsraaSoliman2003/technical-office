import axios from "axios";
import { getCookie } from "cookies-next";

const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const instance = axios.create({
  baseURL: `${base}/api/v1/`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = getCookie("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default instance;