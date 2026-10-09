import axios from "axios";

const commonConfig = {
    headers: {
        "Content-Type": "application/json", //Dữ liệu client gửi lên có định dạng là json
        Accept: "application/json",  // Phía client mong nhận về json từ server
    }
};

export default (baseURL) => {
    return axios.create({
        baseURL,
        ...commonConfig,
    });
}