const { OAuth2Client } = require("google-auth-library");
const config = require("../config");

class GoogleAuthService {
    async verifyIdToken(idToken) {
        if (!config.google.clientId) {
            const error = new Error("Đăng nhập Google chưa được cấu hình trên máy chủ.");
            error.statusCode = 503;
            throw error;
        }
        if (typeof idToken !== "string" || !idToken.trim() || idToken.length > 10000) {
            const error = new Error("Google ID Token không hợp lệ.");
            error.statusCode = 400;
            throw error;
        }

        const client = new OAuth2Client(config.google.clientId);
        let ticket;
        try {
            ticket = await client.verifyIdToken({ idToken, audience: config.google.clientId });
        } catch (_) {
            const error = new Error("Google ID Token không hợp lệ hoặc đã hết hạn.");
            error.statusCode = 401;
            throw error;
        }
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            const error = new Error("Tài khoản Google cần có email đã xác minh.");
            error.statusCode = 401;
            throw error;
        }
        return {
            googleId: String(payload.sub),
            email: String(payload.email).trim().toLowerCase(),
            fullName: String(payload.name || "").trim(),
            picture: typeof payload.picture === "string" ? payload.picture : "",
        };
    }
}

module.exports = new GoogleAuthService();
