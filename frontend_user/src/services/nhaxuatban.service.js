import createApiClient from "./api.service";

class NhaXuatBanService {
    constructor(baseUrl = "/api/nhaxuatban") {
        this.api = createApiClient(baseUrl);
    }

    async getAll(params = {}) {
        return (await this.api.get("/", { params, skipAuth: true })).data;
    }

    async get(id) {
        return (await this.api.get(`/${id}`, { skipAuth: true })).data;
    }
}

export default new NhaXuatBanService();
