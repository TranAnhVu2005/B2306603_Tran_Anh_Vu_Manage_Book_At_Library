import createApiClient from "./api.service";

class StaffApplicationService {
    constructor() { this.api = createApiClient("/api/yeu-cau-nhan-vien"); }
    async getAll() { return (await this.api.get("/")).data?.data || []; }
    async approve(id) { return (await this.api.put(`/${id}/approve`)).data; }
    async reject(id, LyDoTuChoi) { return (await this.api.put(`/${id}/reject`, { LyDoTuChoi })).data; }
}

export default new StaffApplicationService();
