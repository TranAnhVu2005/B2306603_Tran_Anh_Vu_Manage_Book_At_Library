import createApiClient from "./api.service";

class SachService {
    constructor(baseUrl = "/api/sach") {
        this.api = createApiClient(baseUrl);
    }

    async getAll(params = {}) {
        return (await this.api.get("/", { params, skipAuth: true })).data;
    }

    async get(id) {
        return (await this.api.get(`/${id}`, { skipAuth: true })).data;
    }

    async create(data) {
        const isFormData = data instanceof FormData;
        return (await this.api.post("/", data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        })).data;
    }

    async update(id, data) {
        const isFormData = data instanceof FormData;
        return (await this.api.put(`/${id}`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        })).data;
    }

    async delete(id) {
        return (await this.api.delete(`/${id}`)).data;
    }
}

export default new SachService();
