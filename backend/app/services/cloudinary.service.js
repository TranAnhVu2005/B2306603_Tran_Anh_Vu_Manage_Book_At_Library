const crypto = require("crypto");

function getConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || "manage_book_at_library";
    if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
        const error = new Error("Tính năng tải ảnh chưa được cấu hình đầy đủ trên máy chủ.");
        error.statusCode = 503;
        throw error;
    }
    return { cloudName, apiKey, apiSecret, uploadPreset };
}

function signParameters(params, apiSecret) {
    const canonical = Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    return crypto.createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

async function parseResponse(response) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        // Cloudinary errors may echo account/request details; keep API error generic.
        const error = new Error("Cloudinary không thể xử lý ảnh tải lên. Vui lòng thử lại.");
        error.statusCode = response.status >= 500 ? 502 : 400;
        throw error;
    }
    return result;
}

async function uploadImage(file, folder) {
    if (!file?.buffer || !file.mimetype) throw new Error("Thiếu tệp ảnh hợp lệ.");
    const { cloudName, apiKey, apiSecret, uploadPreset } = getConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${crypto.randomBytes(18).toString("hex")}`;
    const signedParams = { folder, public_id: publicId, timestamp, upload_preset: uploadPreset };
    const signature = signParameters(signedParams, apiSecret);
    const form = new FormData();
    form.set("file", new Blob([file.buffer], { type: file.mimetype }), "upload");
    form.set("api_key", apiKey);
    form.set("timestamp", String(timestamp));
    form.set("upload_preset", uploadPreset);
    form.set("folder", folder);
    form.set("public_id", publicId);
    form.set("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
    });
    const result = await parseResponse(response);
    if (!result.secure_url || !result.public_id) {
        throw new Error("Cloudinary trả về kết quả tải ảnh không hợp lệ.");
    }
    return { secureUrl: result.secure_url, publicId: result.public_id };
}

async function deleteImage(publicId) {
    if (!publicId) return;
    const { cloudName, apiKey, apiSecret } = getConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signParameters({ public_id: publicId, timestamp }, apiSecret);
    const form = new FormData();
    form.set("public_id", publicId);
    form.set("timestamp", String(timestamp));
    form.set("api_key", apiKey);
    form.set("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(15_000),
    });
    await parseResponse(response);
}

module.exports = { uploadImage, deleteImage };
