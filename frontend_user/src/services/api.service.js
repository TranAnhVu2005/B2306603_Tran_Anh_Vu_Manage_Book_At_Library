import axios from "axios";

const commonConfig = {
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
};

/**
 * Tạo Axios instance với baseURL và tự động gắn JWT Bearer token vào mọi request.
 * Token được đọc từ localStorage mỗi lần gửi request (request interceptor).
 */
export default (baseURL = "") => {
    const targetApiUrl = import.meta.env.VITE_API_URL?.trim();

    const base = targetApiUrl
        ? `${targetApiUrl.replace(/\/+$/, "")}/${baseURL.replace(/^\/+/, "")}`
        : baseURL;

    const instance = axios.create({
        baseURL: base,
        ...commonConfig,
    });

    // Request interceptor: tự động gắn Authorization header nếu có token
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("token");
            // Public catalogue reads must not inherit a stale/foreign session token.
            if (config.skipAuth) {
                delete config.headers.Authorization;
                delete config.headers.authorization;
                delete config.skipAuth;
            } else if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor: xử lý 401 toàn cục (token hết hạn)
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const authorization = error.config?.headers?.Authorization || error.config?.headers?.authorization;
            if (error.response?.status === 401 && authorization) {
                // Token hết hạn hoặc không hợp lệ → xóa dữ liệu phiên
                const isAuthRoute = error.config?.url?.includes("/auth/login") ||
                    error.config?.url?.includes("/auth/register") ||
                    error.config?.url?.includes("/auth/google");

                if (!isAuthRoute) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    // Chuyển về trang đăng nhập nếu đang ở route cần auth
                    if (window.location.pathname !== "/login") {
                        window.location.href = "/login?expired=1";
                    }
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
};
