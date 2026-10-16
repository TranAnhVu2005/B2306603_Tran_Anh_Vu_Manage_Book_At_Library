import createApiClient from "./api.service";

class NhanVienService {
    constructor(baseUrl = "/api/nhanvien") {
        this.api = createApiClient(baseUrl);
    }

    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }
}

export default new NhanVienService();
