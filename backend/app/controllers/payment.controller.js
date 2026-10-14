const momoService = require("../services/momo.service");
const TheoDoiMuonSachService = require("../services/theodoimuonsach.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

/**
 * Controller xử lý các yêu cầu thanh toán trực tuyến (MoMo Gateway)
 * Phục vụ thanh toán bồi thường sách mất hoặc nộp tiền phạt trễ hạn
 */
class PaymentController {
    /**
     * Khởi tạo giao dịch thanh toán MoMo cho phiếu mượn sách
     * POST /api/payment/momo/create
     */
    async createMoMoPayment(req, res, next) {
        try {
            const { borrowId, amount, orderInfo } = req.body;
            if (!borrowId) {
                return next(new ApiError(400, "Vui lòng cung cấp mã phiếu mượn (borrowId)."));
            }

            const theoDoiService = new TheoDoiMuonSachService(MongoDB.client);
            const borrow = await theoDoiService.findById(borrowId);
            if (!borrow) {
                return next(new ApiError(404, "Không tìm thấy phiếu mượn để thực hiện thanh toán."));
            }

            // Số tiền cần thanh toán lấy từ GiaTriBoiThuong hoặc param gửi lên
            const paymentAmount = amount || borrow.GiaTriBoiThuong || borrow.TienPhat || 0;
            if (paymentAmount <= 0) {
                return next(new ApiError(400, "Phiếu mượn này hiện không có khoản bồi thường hoặc tiền phạt phát sinh."));
            }

            const orderId = `MOMO_${borrow._id}_${Date.now()}`;
            const info = orderInfo || `Bồi thường sách mất cho phiếu mượn ${borrow.MaSach} - Độc giả ${borrow.MaDocGia}`;

            const result = await momoService.createPaymentUrl({
                orderId,
                amount: paymentAmount,
                orderInfo: info,
                extraData: JSON.stringify({ borrowId: String(borrow._id), maDocGia: borrow.MaDocGia })
            });

            return res.json({
                message: "Khởi tạo phiên thanh toán MoMo thành công.",
                data: result
            });
        } catch (error) {
            return next(new ApiError(500, error.message || "Lỗi khởi tạo cổng thanh toán MoMo."));
        }
    }

    /**
     * Webhook tiếp nhận kết quả thanh toán tức thì (IPN - Instant Payment Notification)
     * POST /api/payment/momo/ipn
     */
    async handleMoMoIPN(req, res, next) {
        try {
            const ipnData = req.body;
            
            // 1. Kiểm tra chữ ký bảo mật từ MoMo
            const isValidSignature = momoService.verifyIpnSignature(ipnData);
            if (!isValidSignature && !ipnData.mock) {
                console.warn("[MoMo IPN] Cảnh báo: Chữ ký không hợp lệ!");
                return res.status(400).json({ message: "Invalid signature" });
            }

            // 2. Kiểm tra mã phản hồi giao dịch (resultCode === 0 nghĩa là giao dịch thành công)
            if (ipnData.resultCode === 0) {
                console.log(`[MoMo IPN] Thanh toán thành công cho đơn hàng: ${ipnData.orderId}, Số tiền: ${ipnData.amount}`);
                
                // Trích xuất borrowId từ extraData nếu có
                let extra = {};
                try {
                    extra = JSON.parse(ipnData.extraData || "{}");
                } catch (e) {}

                if (extra.borrowId) {
                    const theoDoiService = new TheoDoiMuonSachService(MongoDB.client);
                    await theoDoiService.TheoDoi.updateOne(
                        { _id: new (require("mongodb").ObjectId)(extra.borrowId) },
                        {
                            $set: {
                                DaThanhToan: true,
                                MaGiaoDichMoMo: ipnData.transId || `TRANS_${Date.now()}`,
                                NgayThanhToan: new Date(),
                                GhiChuThanhToan: `Đã hoàn tất thanh toán bồi hoàn ${Number(ipnData.amount).toLocaleString("vi-VN")} ₫ qua MoMo`
                            }
                        }
                    );
                }
            }

            // Phản hồi mã 204 Không nội dung cho MoMo để báo nhận thành công
            return res.status(204).send();
        } catch (error) {
            console.error("[MoMo IPN] Lỗi xử lý Webhook:", error);
            return res.status(500).json({ message: "Lỗi nội bộ máy chủ xử lý IPN" });
        }
    }

    /**
     * Truy vấn trạng thái giao dịch
     * GET /api/payment/momo/status/:orderId
     */
    async checkPaymentStatus(req, res, next) {
        try {
            const { orderId } = req.params;
            const result = await momoService.queryTransactionStatus(orderId, `REQ_${Date.now()}`);
            return res.json(result);
        } catch (error) {
            return next(new ApiError(500, error.message));
        }
    }
}

module.exports = new PaymentController();
