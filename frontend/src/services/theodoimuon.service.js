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

    async duyet(id) {
        return (await this.api.put(`/${id}/duyet`)).data;
    }

    async tuChoi(id, lyDo) {
        return (await this.api.put(`/${id}/tu-choi`, { lyDo })).data;
    }

    async xacNhanTra(id) {
        return (await this.api.put(`/${id}/tra-sach`)).data;
    }

    async baoMat(id, ghiChu) {
        return (await this.api.put(`/${id}/bao-mat`, { ghiChu })).data;
    }

    async delete(id) {
        return (await this.api.delete(`/${id}`)).data;
    }
}

export default new TheoDoiMuonService();
