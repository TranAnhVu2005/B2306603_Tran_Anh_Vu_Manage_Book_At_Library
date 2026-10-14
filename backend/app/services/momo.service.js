const crypto = require("crypto");
const config = require("../config");

/**
 * =========================================================================================
 * DỊCH VỤ TÍCH HỢP CỔNG THANH TOÁN MOMO (MOMO PAYMENT SERVICE)
 * =========================================================================================
 * Nghiệp vụ: Hỗ trợ độc giả thanh toán trực tuyến tiền bồi thường khi làm mất sách (GiaTriBoiThuong)
 * hoặc thanh toán tiền phạt quá hạn mượn thông qua ví điện tử MoMo (ATM / QR Code).
 *
 * HƯỚNG DẪN HOÀN THIỆN CHO LẬP TRÌNH VIÊN:
 * 1. Đăng ký tài khoản MoMo Test tại: https://business.momo.vn hoặc https://developers.momo.vn
 * 2. Lấy thông tin PARTNER_CODE, ACCESS_KEY, SECRET_KEY điền vào file `.env` hoặc `app/config/index.js`
 * 3. Khi môi trường thực tế sẵn sàng:
 *    - Sử dụng thư viện `axios` để gửi HTTP POST request đến MoMo Endpoint:
 *      const response = await axios.post(this.endpoint, requestBody, { headers: { 'Content-Type': 'application/json' } });
 *      return response.data.payUrl;
 *    - Cấu hình domain công khai (sử dụng ngrok khi chạy local) để MoMo gọi Webhook IPN về `notifyUrl`.
 * =========================================================================================
 */
class MoMoPaymentService {
    constructor() {
        this.partnerCode = config.momo.partnerCode;
        this.accessKey = config.momo.accessKey;
        this.secretKey = config.momo.secretKey;
        this.endpoint = config.momo.endpoint;
        this.returnUrl = config.momo.returnUrl;
        this.notifyUrl = config.momo.notifyUrl;
    }

    /**
     * Tạo chuỗi chữ ký điện tử HMAC-SHA256 để bảo mật giao dịch với MoMo
     * @param {string} rawSignature - Chuỗi dữ liệu thô theo quy chuẩn định dạng của MoMo
     * @returns {string} - Chuỗi chữ ký Hexadecimal mã hóa bởi secretKey
     */
    generateSignature(rawSignature) {
        return crypto
            .createHmac("sha256", this.secretKey)
            .update(rawSignature)
            .digest("hex");
    }

    /**
     * Khởi tạo giao dịch thanh toán MoMo cho phiếu mượn sách có phát sinh bồi thường
     * @param {Object} paymentInfo
     * @param {string} paymentInfo.orderId - Mã định danh giao dịch (VD: MM_BORROW_670...)
     * @param {number} paymentInfo.amount - Số tiền cần thanh toán (GiaTriBoiThuong)
     * @param {string} paymentInfo.orderInfo - Nội dung hiển thị tại cổng thanh toán MoMo
     * @param {string} [paymentInfo.extraData] - Dữ liệu mở rộng truyền kèm (VD: MaDocGia, MaSach)
     * @returns {Promise<Object>} Thông tin kết quả thanh toán kèm đường link thanh toán (payUrl)
     */
    async createPaymentUrl({ orderId, amount, orderInfo, extraData = "" }) {
        const requestId = `${orderId}_${Date.now()}`;
        const requestType = "captureWallet"; // Hoặc 'payWithMethod'
        const redirectUrl = this.returnUrl;
        const ipnUrl = this.notifyUrl;

        // Chuỗi dữ liệu thô sắp xếp theo thứ tự bảng chữ cái alphabet theo đặc tả của MoMo API v2:
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId
        // &orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = this.generateSignature(rawSignature);

        const requestBody = {
            partnerCode: this.partnerCode,
            accessKey: this.accessKey,
            requestId: requestId,
            amount: Number(amount),
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: "vi"
        };

        /*
         * ==========================================================================
         * ĐOẠN MÃ GỬI YÊU CẦU THỰC TẾ ĐẾN CỔNG MOMO (KHI ĐÃ CÓ TÀI KHOẢN MERCHAT CHÍNH THỨC):
         * ==========================================================================
         * const axios = require("axios");
         * const response = await axios.post(this.endpoint, requestBody, {
         *     headers: { "Content-Type": "application/json" }
         * });
         * return response.data;
         * ==========================================================================
         */

        // Môi trường Dev/Demo: Trả về kết quả mẫu chuẩn bị sẵn giúp giao diện kiểm thử mượt mà
        return {
            partnerCode: this.partnerCode,
            orderId: orderId,
            requestId: requestId,
            amount: amount,
            responseTime: Date.now(),
            message: "Khởi tạo yêu cầu thanh toán MoMo thành công (Chế độ mô phỏng / Mock Gateway)",
            resultCode: 0,
            payUrl: `https://test-payment.momo.vn/v2/gateway/pay?orderId=${orderId}&amount=${amount}&demo=true`,
            deeplink: `momo://app?action=payWithApp&orderId=${orderId}&amount=${amount}`,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=momo_demo_${orderId}`,
            mockMode: true,
            rawRequestBody: requestBody
        };
    }

    /**
     * Xác thực tính hợp lệ của Webhook IPN gửi về từ MoMo sau khi khách hàng thanh toán
     * @param {Object} ipnData - Payload mà máy chủ MoMo POST về `notifyUrl`
     * @returns {boolean} - true nếu chữ ký hợp lệ, false nếu bị giả mạo
     */
    verifyIpnSignature(ipnData) {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = ipnData;

        // Chuỗi ký MoMo IPN Response:
        const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const computedSignature = this.generateSignature(rawSignature);

        return signature === computedSignature;
    }

    /**
     * Truy vấn trạng thái giao dịch từ MoMo (Check Transaction Status)
     * @param {string} orderId 
     * @param {string} requestId 
     * @returns {Promise<Object>}
     */
    async queryTransactionStatus(orderId, requestId) {
        const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`;
        const signature = this.generateSignature(rawSignature);

        const requestBody = {
            partnerCode: this.partnerCode,
            accessKey: this.accessKey,
            requestId: requestId,
            orderId: orderId,
            signature: signature,
            lang: "vi"
        };

        // TODO: Gửi HTTP POST tới https://test-payment.momo.vn/v2/gateway/api/query
        return {
            orderId,
            requestId,
            resultCode: 0,
            message: "Giao dịch đã được thanh toán thành công (Mô phỏng)",
            amount: 0,
            status: "SUCCESS"
        };
    }
}

module.exports = new MoMoPaymentService();
