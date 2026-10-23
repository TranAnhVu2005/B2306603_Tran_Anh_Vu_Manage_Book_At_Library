import createApiClient from "./api.service";

class PaymentService {
    constructor(baseUrl = "/api/payment") {
        this.api = createApiClient(baseUrl);
    }

    /**
     * Khởi tạo giao dịch thanh toán MoMo cho tiền bồi hoàn hoặc phạt
     * @param {Object} payload { borrowId, amount, orderInfo }
     * @returns {Promise<Object>}
     */
    async createMoMoPayment(payload) {
        return (await this.api.post("/momo/create", payload)).data;
    }

    /**
     * Kiểm tra trạng thái giao dịch MoMo theo mã đơn hàng
     * @param {string} orderId 
     * @returns {Promise<Object>}
     */
    async checkPaymentStatus(orderId) {
        return (await this.api.get(`/momo/status/${orderId}`)).data;
    }
}

export default new PaymentService();
