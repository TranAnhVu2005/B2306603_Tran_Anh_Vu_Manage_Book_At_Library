const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function detectImageMime(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function prepareImageUpload(file) {
  if (!file || file.size === 0) throw new Error("Tệp ảnh đang trống hoặc không đọc được.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Ảnh không được vượt quá 5 MB.");

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const mimeType = detectImageMime(bytes);
  if (!mimeType) throw new Error("Tệp không phải ảnh JPEG, PNG hoặc WebP hợp lệ.");

  // Chuẩn hóa MIME theo nội dung thật để không phụ thuộc metadata trình duyệt gửi lên.
  const normalizedFile = new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });

  let bitmap;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(normalizedFile);
    } else {
      bitmap = await loadImageFallback(normalizedFile);
    }
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40_000_000) {
      throw new Error("Kích thước ảnh không hợp lệ hoặc vượt quá giới hạn xử lý.");
    }

    // Dùng preview raster nhỏ thay cho blob URL của tệp gốc để tránh lỗi giải mã lại trong thẻ img.
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể tạo ảnh xem trước trên trình duyệt này.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { file: normalizedFile, previewUrl: canvas.toDataURL("image/png") };
  } catch (error) {
    if (error.message === "Kích thước ảnh không hợp lệ hoặc vượt quá giới hạn xử lý.") throw error;
    throw new Error("Không thể giải mã ảnh. Hãy lưu lại ảnh dưới dạng JPEG, PNG hoặc WebP rồi thử lại.");
  } finally {
    bitmap?.close?.();
  }
}

function loadImageFallback(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không thể giải mã ảnh."));
    };
    image.src = objectUrl;
  });
}
