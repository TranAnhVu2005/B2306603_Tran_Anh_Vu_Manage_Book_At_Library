const { OAuth2Client } = require("google-auth-library");
const config = require("../config");

// Lớp hỗ trợ đăng nhập bằng google, trả về thông tin từ google - Completed 
class GoogleAuthService {
    constructor() {
        this.clientId = config.google.clientId;
        this.oAuth2Client = new OAuth2Client(this.clientId);
    }

    // Xác thực idToken bằng clientID của mình
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

    // Thông tin từ google => Thông tin trong cơ sở dữ liệu - Completed
    formatReaderFromGoogleProfile(googleUser) {
        return {
            HoLot: "",
            Ten: googleUser.fullName,
            // Số điện thoại giả định để không trùng với tài khoản thường - dùng 8 ký tự cuối sub
            DienThoai: `GG_${String(googleUser.googleId).slice(-8)}`,
            DiaChi: "",
            Phai: 1,                     // Mặc định Nam (1), người dùng có thể cập nhật sau
            NgaySinh: "",
            Email: googleUser.email,
            GoogleId: googleUser.googleId,
            AnhDaiDien: googleUser.picture || "",
            VaiTro: "USER",
            SoLanViPham: 0,
            TrangThaiThe: "HoatDong",
        };
    }
}

module.exports = new GoogleAuthService();
