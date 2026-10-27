const multer = require("multer");
const ApiError = require("../api-error");

const imageTypes = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

function hasValidImageSignature(buffer, mimeType) {
    if (mimeType === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (mimeType === "image/webp") return buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    return false;
}

// Giữ tệp trong bộ nhớ để kiểm tra chữ ký rồi chuyển thẳng lên Cloudinary.
const createUploader = () => {
    const fileFilter = (req, file, cb) => {
        if (imageTypes[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file định dạng hình ảnh (jpg, png, jpeg,...)!"), false);
        }
    };

    return multer({
        storage: multer.memoryStorage(),
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // Giới hạn tối đa 5MB mỗi file
            files: 1,
            fields: 12,
            parts: 13,
        }
    });
};

const validateImageUpload = (req, res, next) => {
    if (!req.file) return next();
    if (!Buffer.isBuffer(req.file.buffer) || !hasValidImageSignature(req.file.buffer, req.file.mimetype)) {
        return next(new ApiError(400, "Nội dung tệp không khớp định dạng ảnh được phép (JPEG, PNG, WebP)."));
    }
    next();
};

module.exports = createUploader;
module.exports.validateImageUpload = validateImageUpload;
