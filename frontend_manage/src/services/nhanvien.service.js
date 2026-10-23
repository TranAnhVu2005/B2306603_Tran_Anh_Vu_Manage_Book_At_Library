import createApiClient from "./api.service";

class NhanVienService {
    constructor(baseUrl = "/api/nhanvien") {
        this.api = createApiClient(baseUrl);
    }

    async update(id, data) {
        const isFormData = data instanceof FormData;
        return (await this.api.put(`/${id}`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        })).data;
    }
}

export default new NhanVienService();
