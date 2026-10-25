import createApiClient from "./api.service";

class NhanVienService {
    constructor(baseUrl = "/api/nhanvien") {
        this.api = createApiClient(baseUrl);
    }

    async getAll(params = {}) {
        return (await this.api.get("/", { params })).data;
    }

    async update(id, data) {
        const isFormData = data instanceof FormData;
        return (await this.api.put(`/${id}`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        })).data;
    }

    async lockAccount(id, LyDo) {
        return (await this.api.put(`/${id}/lock`, { LyDo })).data;
    }

    async unlockAccount(id, LyDo) {
        return (await this.api.put(`/${id}/unlock`, { LyDo })).data;
    }
}

export default new NhanVienService();
