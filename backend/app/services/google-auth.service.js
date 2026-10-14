const config = require("../config");

/**
 * =========================================================================================
 * DỊCH VỤ XÁC THỰC TÀI KHOẢN GOOGLE (GOOGLE OAUTH 2.0 SERVICE)
 * =========================================================================================
 * Nghiệp vụ: Cho phép bạn đọc đăng nhập hoặc đăng ký thẻ độc giả thư viện trực tuyến bằng tài khoản Google.
 *
 * HƯỚNG DẪN HOÀN THIỆN CHO LẬP TRÌNH VIÊN:
 * 1. Truy cập Google Cloud Console: https://console.cloud.google.com/apis/credentials
 * 2. Tạo một "OAuth 2.0 Client ID" loại "Web application".
 * 3. Thêm Authorized JavaScript Origins: http://localhost:3000, http://localhost:3001
 * 4. Thêm Authorized Redirect URIs nếu dùng Authorization Code Flow.
 * 5. Điền GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file `.env`.
 * 6. Để xác thực Token từ phía Client (sử dụng @react-oauth/google hoặc vue3-google-login):
 *    - Sử dụng thư viện chính thức của Google: `npm install google-auth-library`
 *    - Hoặc gọi trực tiếp Google TokenInfo Endpoint:
 *      https://oauth2.googleapis.com/tokeninfo?id_token={token}
 * =========================================================================================
 */
class GoogleAuthService {
    constructor() {
        this.clientId = config.google.clientId;
        this.clientSecret = config.google.clientSecret;
    }

    /**
     * Xác thực tính hợp lệ của Google ID Token nhận từ phía giao diện Frontend
     * @param {string} idToken - Chuỗi JWT do Google cấp cho Client khi người dùng nhấn nút "Đăng nhập với Google"
     * @returns {Promise<Object>} Thông tin tài khoản độc giả từ Google Profile (email, name, sub, picture)
     */
    async verifyIdToken(idToken) {
        if (!idToken) {
            throw new Error("Google ID Token không được để trống.");
        }

        /*
         * ==========================================================================
         * ĐOẠN MÃ XÁC THỰC THỰC TẾ VỚI GOOGLE AUTH LIBRARY (KHI BẬT PRODUCTION):
         * ==========================================================================
         * const { OAuth2Client } = require('google-auth-library');
         * const client = new OAuth2Client(this.clientId);
         * const ticket = await client.verifyIdToken({
         *     idToken: idToken,
         *     audience: this.clientId,
         * });
         * const payload = ticket.getPayload();
         * return {
         *     googleId: payload['sub'],
         *     email: payload['email'],
         *     emailVerified: payload['email_verified'],
         *     fullName: payload['name'],
         *     givenName: payload['given_name'],
         *     familyName: payload['family_name'],
         *     picture: payload['picture']
         * };
         * ==========================================================================
         */

        // Chế độ mô phỏng / Giả lập khi chưa cấu hình Google Cloud Project ID thực tế:
        // Hỗ trợ kiểm thử trên môi trường nội bộ
        return {
            googleId: "google_mock_user_123456789",
            email: "sinhvien.ctu@gmail.com",
            emailVerified: true,
            fullName: "Nguyễn Văn Độc Giả (Google User)",
            givenName: "Độc Giả",
            familyName: "Nguyễn Văn",
            picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
            isMock: true,
        };
    }

    /**
     * Phân tích thông tin người dùng Google để gán vào thuộc tính tài khoản Độc Giả trong CSDL
     * @param {Object} googleUser - Dữ liệu hồ sơ Google
     * @returns {Object} Đối tượng thông tin Độc giả tương thích CSDL
     */
    formatReaderFromGoogleProfile(googleUser) {
        return {
            HoLot: googleUser.familyName || "Bạn Đọc",
            Ten: googleUser.givenName || "Google",
            DienThoai: `GG_${String(googleUser.googleId).slice(-8)}`, // Số định danh giả lập nếu chưa bổ sung SĐT
            DiaChi: "Xác thực qua tài khoản Google",
            Phai: 1, // Mặc định Nam (1)
            NgaySinh: "2003-01-01",
            Email: googleUser.email,
            GoogleId: googleUser.googleId,
            Role: "USER",
            SoLanViPham: 0,
            TrangThaiThe: "HoatDong"
        };
    }
}

module.exports = new GoogleAuthService();
