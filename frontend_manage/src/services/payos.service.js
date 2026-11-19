import createApiClient from "./api.service";

class PayosService {
    constructor(baseUrl = "/api/payment/payos") {
        this.api = createApiClient(baseUrl);
    }

    async getTransactions(params = {}) {
        return (await this.api.get("/transactions", { params })).data;
    }

    async getByBorrowId(borrowId) {
        return (await this.api.get(`/borrow/${borrowId}`)).data;
    }

    async approve(id) {
        return (await this.api.put(`/transactions/${id}/approve`, {})).data;
    }

    async reject(id, lyDo) {
        return (await this.api.put(`/transactions/${id}/reject`, { lyDo })).data;
    }
}

export default new PayosService();
