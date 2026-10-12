import axios from "axios";

const commonConfig = {
    headers: {
        "Content-Type": "application/json", //Dữ liệu client gửi lên có định dạng là json
        Accept: "application/json",  // Phía client mong nhận về json từ server
    }
};

export default (baseURL = "") => {
    // Đặt link Render trực tiếp làm giá trị dự phòng nếu VITE_API_URL chưa kịp ăn trên cloud
    const fallbackApiUrl = "https://b2306603-tran-anh-vu-manage-book-at.onrender.com";
    const targetApiUrl = import.meta.env.VITE_API_URL || fallbackApiUrl;

    const base = targetApiUrl
        ? `${targetApiUrl.replace(/\/$/, "")}${baseURL}`
        : baseURL;

    return axios.create({
        baseURL: base,
        ...commonConfig,
    });
};