import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Response interceptor：如果通行證失效（401）→ 自動登出
http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    // 401 = 沒帶 token / token 壞掉 / token 過期
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("me");

      // 避免你卡在 /admin 或 /me 還繼續打 API
      if (location.pathname !== "/login") {
        location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
