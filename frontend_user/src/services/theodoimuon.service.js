import createApiClient from "./api.service";

class TheoDoiMuonService {
    constructor(baseUrl = "/api/theodoimuonsach") {
        this.api = createApiClient(baseUrl);
    }

    async getAll(params = {}) {
        return (await this.api.get("/", { params })).data;
    }

    async get(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async dangKyMuon(data) {
        return (await this.api.post("/", data)).data;
    }

    async huy(id) {
        return (await this.api.put(`/${id}/huy`)).data;
    }

    async giaHan(id) {
        return (await this.api.put(`/${id}/gia-han`)).data;
    }

    async baoMatDocGia(id, ghiChu) {
        return (await this.api.put(`/${id}/bao-mat-doc-gia`, { ghiChu })).data;
    }
}

export default new TheoDoiMuonService();
