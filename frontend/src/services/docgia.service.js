import createApiClient from "./api.service";

class DocGiaService {
    constructor(baseUrl = "/api/docgia") {
        this.api = createApiClient(baseUrl);
    }

    async getAll(params = {}) {
        return (await this.api.get("/", { params })).data;
    }

    async get(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async create(data) {
        return (await this.api.post("/", data)).data;
    }

    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async updateRole(id, role) {
        return (await this.api.put(`/${id}/role`, { role })).data;
    }

    async unblock(id) {
        return (await this.api.put(`/${id}/unblock`)).data;
    }

    async delete(id) {
        return (await this.api.delete(`/${id}`)).data;
    }
}

export default new DocGiaService();
