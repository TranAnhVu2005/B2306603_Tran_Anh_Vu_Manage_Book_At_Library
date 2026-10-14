const bcrypt = require("bcryptjs");
const config = require("../config");

/**
 * Tiện ích mã hóa mật khẩu an toàn sử dụng thuật toán Bcrypt
 * Tuân thủ yêu cầu lưu trữ mật khẩu bảo mật trong Báo cáo thực tập CT449
 */
class PasswordUtil {
    /**
     * Mã hóa mật khẩu văn bản thô (Plain Text) sang chuỗi Hash Bcrypt
     * @param {string} plainPassword 
     * @returns {Promise<string>}
     */
    static async hash(plainPassword) {
        if (!plainPassword) return "";
        const salt = await bcrypt.genSalt(config.auth.bcryptSaltRounds);
        return await bcrypt.hash(String(plainPassword), salt);
    }

    /**
     * So sánh mật khẩu văn bản thô với mật khẩu đã băm (Bcrypt Hash)
     * Hỗ trợ cơ chế Fallback nếu dữ liệu trong DB tạm thời ở dạng thô
     * @param {string} plainPassword 
     * @param {string} hashedPassword 
     * @returns {Promise<boolean>}
     */
    static async compare(plainPassword, hashedPassword) {
        if (!plainPassword || !hashedPassword) return false;
        
        // Kiểm tra xem chuỗi có phải định dạng Bcrypt Hash hay không ($2a$, $2b$, $2y$)
        const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(hashedPassword);
        if (isBcrypt) {
            return await bcrypt.compare(String(plainPassword), hashedPassword);
        }

        // Fallback so sánh trực tiếp văn bản thô (backward-compatibility)
        return String(plainPassword) === String(hashedPassword);
    }
}

module.exports = PasswordUtil;
