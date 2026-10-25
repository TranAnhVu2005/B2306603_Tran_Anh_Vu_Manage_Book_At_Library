import createApiClient from "./api.service";

/**
 * =========================================================================================
 * SERVICE XÁC THỰC FRONTEND (AUTH SERVICE)
 * =========================================================================================
 * Quản lý toàn bộ vòng đời phiên đăng nhập phía Client:
 *  - Gọi API đăng nhập / đăng ký / Google OAuth
 *  - Lưu JWT token vào localStorage
 *  - Cung cấp helpers: getUser(), isLoggedIn(), isStaffOrAdmin(),...
 * =========================================================================================
 */
class AuthService {
    constructor(baseUrl = "/api/auth") {
        this.api = createApiClient(baseUrl);
    }

    /**
     * Đăng nhập bằng số điện thoại / MSNV và mật khẩu.
     * Lưu JWT token và thông tin user vào localStorage.
     */
    async login(identifier, password) {
        const response = await this.api.post("/login", { identifier, password });
        if (response.data) {
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            }
            if (response.data.data) {
                this.setUser(response.data.data);
            }
        }
        return response.data;
    }

    /**
     * Đăng ký thẻ độc giả mới trực tuyến.
     */
    async register(data) {
        return (await this.api.post("/register", data)).data;
    }

    /**
     * Đăng nhập bằng Google - gửi credential (ID Token JWT) từ GSI lên backend.
     * @param {string} credential - Chuỗi JWT credential do Google Identity Services trả về
     */
    async loginWithGoogle(credential) {
        if (!credential) {
            throw new Error("Thiếu Google credential. Vui lòng thử đăng nhập lại.");
        }
        const response = await this.api.post("/google", { idToken: credential });
        if (response.data) {
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            }
            if (response.data.data) {
                this.setUser(response.data.data);
            }
        }
        return response.data;
    }

    /**
     * Đăng xuất: xóa token và thông tin user khỏi localStorage.
     */
    async logout() {
        try {
            if (this.getToken()) await this.api.post("/logout");
        } catch (_) {
            // Local sign-out must still complete when the API is unavailable.
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new CustomEvent("auth-user-updated", { detail: null }));
        }
    }

    /**
     * Lấy thông tin user đang đăng nhập từ localStorage.
     * @returns {Object|null} Dữ liệu user hoặc null nếu chưa đăng nhập
     */
    getUser() {
        try {
            const data = localStorage.getItem("user");
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    getDisplayName(user = this.getUser()) {
        if (!user) return "";
        return user.HoTenNV ||
            [user.HoLot, user.Ten].filter(Boolean).join(" ") ||
            user.MSNV ||
            user.MaDocGia ||
            "";
    }

    getIdentifier(user = this.getUser()) {
        return user?.MSNV || user?.MaDocGia || user?.DienThoai || user?.SoDienThoai || "";
    }

    getRole(user = this.getUser()) {
        if (!user) return null;
        if (user.ChucVu === "ADMIN") return "ADMIN";
        if (["STAFF", "THUTHU", "MANAGER"].includes(user.ChucVu)) return "STAFF";
        if (user.ChucVu) return null;
        return "USER";
    }

    getPhone(user = this.getUser()) {
        return user?.DienThoai || user?.SoDienThoai || "";
    }

    setUser(user) {
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new CustomEvent("auth-user-updated", { detail: user }));
    }

    isReader(user = this.getUser()) {
        return Boolean(user?.MaDocGia);
    }

    /**
     * Lấy JWT token hiện tại từ localStorage.
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem("token") || null;
    }

    /**
     * Kiểm tra xem người dùng đã đăng nhập chưa (có cả token lẫn user data).
     */
    isLoggedIn() {
        return !!(this.getToken() && this.getUser());
    }

    /**
     * Kiểm tra người dùng có phải Nhân viên hoặc Admin không.
     */
    isStaffOrAdmin(user = this.getUser()) {
        // The manage portal authenticates employee records, not reader VaiTro values.
        return Boolean(user?.ChucVu);
    }

    /**
     * Kiểm tra người dùng có phải Admin không.
     */
    isAdmin(user = this.getUser()) {
        return user?.ChucVu === "ADMIN";
    }

    /**
     * Gọi API GET /api/auth/me để lấy thông tin user mới nhất từ server (dùng JWT).
     * Dùng khi cần đồng bộ lại dữ liệu user sau khi có thay đổi.
     */
    async fetchMe() {
        const response = await this.api.get("/me");
        if (response.data?.data) {
            this.setUser(response.data.data);
        }
        return response.data?.data || null;
    }
}

export default new AuthService();
