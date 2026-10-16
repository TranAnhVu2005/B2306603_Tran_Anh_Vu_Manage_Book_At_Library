const bcrypt = require("bcryptjs");
const config = require("../config");


// Lớp băm mật khẩu bằng Bcrypt
class PasswordUtil {
    static async hash(plainPassword) {
        if (!plainPassword) return "";
        const salt = await bcrypt.genSalt(config.auth.bcryptSaltRounds); //Số vòng tính toán, 2^x cho mỗi lần tạo salt
        return await bcrypt.hash(String(plainPassword), salt);
    }

    //So sánh mật khẩu người dùng với mật khẩu băm
    static async compare(plainPassword, hashedPassword) {
        if (!plainPassword || !hashedPassword) return false;

        // Kiểm tra xem chuỗi có phải định dạng Bcrypt Hash hay không ($2a$, $2b$, $2y$)
        const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(hashedPassword);
        if (isBcrypt) {
            return await bcrypt.compare(String(plainPassword), hashedPassword);
        }
    }
}

module.exports = PasswordUtil;
