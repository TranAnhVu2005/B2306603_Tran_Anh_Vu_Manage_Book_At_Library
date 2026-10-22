const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Hàm tạo middleware upload theo từng thư mục mong muốn
const createUploader = (folderName) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, `../../public/uploads/${folderName}`);
            // Tự động tạo thư mục nếu chưa có
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    const fileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file định dạng hình ảnh (jpg, png, jpeg,...)!"), false);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // Giới hạn tối đa 5MB mỗi file
        }
    });
};

module.exports = createUploader;