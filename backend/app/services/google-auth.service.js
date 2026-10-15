const { OAuth2Client } = require("google-auth-library");
const config = require("../config");

/**
 * =========================================================================================
 * DỊCH VỤ XÁC THỰC TÀI KHOẢN GOOGLE (GOOGLE OAUTH 2.0 SERVICE)
 * =========================================================================================
 * Nghiệp vụ: Cho phép bạn đọc đăng nhập hoặc đăng ký thẻ độc giả thư viện bằng Google.
 *
 * Luồng hoạt động:
 *  1. Frontend dùng Google Identity Services (GSI) để lấy Google Credential (ID Token JWT).
 *  2. Frontend gửi ID Token lên POST /api/auth/google.
 *  3. Backend dùng google-auth-library để xác thực chữ ký và lấy payload người dùng.
 *  4. Nếu đã có tài khoản (theo GoogleId hoặc Email) → trả về thông tin phiên.
 *  5. Nếu chưa có → tự động đăng ký thẻ độc giả mới và trả về phiên.
 * =========================================================================================
 */
class GoogleAuthService {
    constructor() {
        this.clientId = config.google.clientId;
        this.oAuth2Client = new OAuth2Client(this.clientId);
    }

    /**
     * Xác thực tính hợp lệ của Google ID Token nhận từ phía giao diện Frontend.
     * Sử dụng thư viện chính thức google-auth-library để kiểm tra chữ ký JWT.
     *
     * @param {string} idToken - Chuỗi JWT (credential) do Google cấp qua GSI
     * @returns {Promise<Object>} Thông tin tài khoản Google đã xác thực
     */
    async verifyIdToken(idToken) {
        if (!idToken) {
            throw new Error("Google ID Token không được để trống.");
        }

        try {
            // Xác thực token với Google servers, truyền audience là clientId để chống giả mạo
            const ticket = await this.oAuth2Client.verifyIdToken({
                idToken: idToken,
                audience: this.clientId,
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error("Không thể đọc thông tin từ Google Token.");
            }

            // Kiểm tra email đã được Google xác minh
            if (!payload["email_verified"]) {
                throw new Error("Tài khoản Google chưa được xác minh email. Vui lòng xác minh email trước.");
            }

            return {
                googleId: payload["sub"],
                email: payload["email"],
                emailVerified: payload["email_verified"],
                fullName: payload["name"],
                givenName: payload["given_name"] || "",
                familyName: payload["family_name"] || "",
                picture: payload["picture"] || "",
            };
        } catch (error) {
            // Nếu lỗi là từ google-auth-library (token không hợp lệ/hết hạn)
            if (error.message && error.message.includes("Token used too late")) {
                throw new Error("Google ID Token đã hết hạn. Vui lòng thử đăng nhập lại.");
            }
            if (error.message && error.message.includes("Invalid token signature")) {
                throw new Error("Google ID Token không hợp lệ.");
            }
            // Re-throw lỗi đã được định dạng ở trên
            throw error;
        }
    }

    /**
     * Phân tích thông tin người dùng Google để gán vào thuộc tính tài khoản Độc Giả trong CSDL.
     * @param {Object} googleUser - Dữ liệu hồ sơ Google đã được xác thực
     * @returns {Object} Đối tượng thông tin Độc giả tương thích CSDL
     */
    formatReaderFromGoogleProfile(googleUser) {
        // Phân tách họ và tên từ fullName nếu givenName/familyName không có
        const parts = (googleUser.fullName || "Bạn Đọc Google").trim().split(" ");
        const ten = parts.pop() || "Google";
        const hoLot = parts.join(" ") || "Bạn Đọc";

        return {
            HoLot: googleUser.familyName || hoLot,
            Ten: googleUser.givenName || ten,
            // Số điện thoại giả định để không trùng với tài khoản thường - dùng 8 ký tự cuối sub
            DienThoai: `GG_${String(googleUser.googleId).slice(-8)}`,
            DiaChi: "Xác thực qua tài khoản Google",
            Phai: 1,                     // Mặc định Nam (1), người dùng có thể cập nhật sau
            NgaySinh: "2000-01-01",
            Email: googleUser.email,
            GoogleId: googleUser.googleId,
            AnhDaiDien: googleUser.picture || "",
            Role: "USER",
            SoLanViPham: 0,
            TrangThaiThe: "HoatDong",
        };
    }
}

module.exports = new GoogleAuthService();
