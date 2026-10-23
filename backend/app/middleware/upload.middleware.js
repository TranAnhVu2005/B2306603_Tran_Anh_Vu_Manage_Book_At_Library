const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../api-error");
const fsPromises = fs.promises;

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
            const uniqueSuffix = require("crypto").randomBytes(18).toString("hex");
            cb(null, uniqueSuffix + (imageTypes[file.mimetype] || ".bin"));
        }
    });

    const fileFilter = (req, file, cb) => {
        if (imageTypes[file.mimetype]) {
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
            files: 1,
            fields: 12,
            parts: 13,
        }
    });
};

const validateImageUpload = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const contents = await fsPromises.readFile(req.file.path);
        if (!hasValidImageSignature(contents, req.file.mimetype)) {
            await fsPromises.unlink(req.file.path).catch(() => {});
            return next(new ApiError(400, "Nội dung tệp không khớp định dạng ảnh được phép (JPEG, PNG, WebP)."));
        }
        next();
    } catch (error) {
        await fsPromises.unlink(req.file.path).catch(() => {});
        next(new ApiError(400, "Không thể xác minh tệp ảnh đã tải lên."));
    }
};

module.exports = createUploader;
module.exports.validateImageUpload = validateImageUpload;
