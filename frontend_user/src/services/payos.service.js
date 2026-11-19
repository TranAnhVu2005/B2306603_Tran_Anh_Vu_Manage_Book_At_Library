import createApiClient from "./api.service";

class PayosService {
    constructor(baseUrl = "/api/payment/payos") {
        this.api = createApiClient(baseUrl);
    }

    async createPayment(payload) {
        return (await this.api.post("/create", payload)).data;
    }

    async getByBorrowId(borrowId) {
        return (await this.api.get(`/borrow/${borrowId}`)).data;
    }

    async confirmTransfer(borrowId, ghiChu = "") {
        const body = ghiChu ? { ghiChu } : {};
        return (await this.api.put(`/borrow/${borrowId}/confirm`, body)).data;
    }

    async syncOrder(orderCode) {
        return (await this.api.post(`/order/${orderCode}/sync`, {})).data;
    }

    async getTransactions(params = {}) {
        return (await this.api.get("/transactions", { params })).data;
    }
}

export default new PayosService();
