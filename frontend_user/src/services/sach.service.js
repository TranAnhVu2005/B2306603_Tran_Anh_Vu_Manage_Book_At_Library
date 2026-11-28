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
}

export default new SachService();
