import createApiClient from "./api.service";

class DocGiaService {
    constructor(baseUrl = "/api/docgia") {
        this.api = createApiClient(baseUrl);
    }

    async get(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async update(id, data) {
        const isFormData = data instanceof FormData;
        return (await this.api.put(`/${id}`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        })).data;
    }
}

export default new DocGiaService();
