const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const config = require("../config");
const AuditLogService = require("./audit-log.service");
const ThongBaoService = require("./thongbao.service");
const TheoDoiMuonSachService = require("./theodoimuonsach.service");

const PAYOS_API_BASE = "https://api-merchant.payos.vn/v2/payment-requests";

const transactionPublicFields = {
    _id: 1,
    MaPhieuMuon: 1,
    MaDocGia: 1,
    TenDocGia: 1,
    MaSach: 1,
    TenSach: 1,
    OrderCode: 1,
    PhuongThucDenBu: 1,
    SoTien: 1,
    NoiDungChuyenKhoan: 1,
    PaymentLinkId: 1,
    CheckoutUrl: 1,
    QrCode: 1,
    VietQrImageUrl: 1,
    QrFallbackImageUrl: 1,
    Bin: 1,
    AccountNumber: 1,
    AccountName: 1,
    TrangThaiPayOS: 1,
    TrangThaiDuyet: 1,
    XacMinhTuDong: 1,
    GhiChuDocGia: 1,
    NguoiDuyet: 1,
    LyDoTuChoi: 1,
    ThoiGianTao: 1,
    ThoiGianThanhToan: 1,
    ThoiGianDuyet: 1,
};

function getPayosCredentials() {
    const clientId = process.env.PAYOS_CLIENT_ID?.trim() || config.payos?.clientId;
    const apiKey = process.env.PAYOS_API_KEY?.trim() || config.payos?.apiKey;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim() || config.payos?.checksumKey;
    if (!clientId || !apiKey || !checksumKey) {
        const err = new Error("Cổng thanh toán PayOS chưa được cấu hình đầy đủ trên máy chủ.");
        err.statusCode = 503;
        throw err;
    }
    return { clientId, apiKey, checksumKey };
}

function getReaderAppOrigin() {
    const defaultOrigins = process.env.NODE_ENV === "production" ? "" : "http://localhost:3001,http://localhost:3002";
    const origins = (process.env.CORS_ALLOWED_ORIGINS || defaultOrigins)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    return (origins[0] || "http://localhost:3001").replace(/\/+$/, "");
}

function signPaymentRequest({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey) {
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return crypto.createHmac("sha256", checksumKey).update(raw).digest("hex");
}

function sortObjDataByKey(object) {
    return Object.keys(object)
        .sort()
        .reduce((acc, key) => {
            acc[key] = object[key];
            return acc;
        }, {});
}

function convertObjToQueryStr(object) {
    return Object.keys(object)
        .filter((key) => object[key] !== undefined)
        .map((key) => {
            let value = object[key];
            if (value && Array.isArray(value)) {
                value = JSON.stringify(value.map((val) => (val && typeof val === "object" ? sortObjDataByKey(val) : val)));
            } else if (value && typeof value === "object") {
                value = JSON.stringify(sortObjDataByKey(value));
            }
            if ([null, undefined, "undefined", "null"].includes(value)) {
                value = "";
            }
            return `${key}=${value}`;
        })
        .join("&");
}

function verifyWebhookSignature(webhookBody, checksumKey) {
    if (!webhookBody || typeof webhookBody !== "object" || !webhookBody.data || !webhookBody.signature) {
        return false;
    }
    const sortedData = sortObjDataByKey(webhookBody.data);
    const queryStr = convertObjToQueryStr(sortedData);
    const expectedSignature = crypto.createHmac("sha256", checksumKey).update(queryStr).digest("hex");
    const provided = String(webhookBody.signature).trim();
    if (expectedSignature.length !== provided.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expectedSignature, "utf8"), Buffer.from(provided, "utf8"));
}

function buildVietQrImageUrl({ bin, accountNumber, amount, description, accountName }) {
    if (!bin || !accountNumber) return "";
    const params = new URLSearchParams();
    if (amount) params.set("amount", String(amount));
    if (description) params.set("addInfo", String(description));
    if (accountName) params.set("accountName", String(accountName));
    return `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(accountNumber)}-compact2.png?${params.toString()}`;
}

function buildQrFallbackImageUrl(qrCode) {
    if (!qrCode) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(qrCode)}`;
}

class PayosService {
    constructor(client) {
        this.client = client;
        this.db = client.db();
        this.GiaoDich = this.db.collection("giaodichboithuong");
        this.TheoDoi = this.db.collection("theodoimuonsach");
        this.Sach = this.db.collection("sach");
        this.DocGia = this.db.collection("docgia");
        this.NhanVien = this.db.collection("nhanvien");
        this.AuditLog = new AuditLogService(client);
        this.ThongBao = new ThongBaoService(client);
        this.BorrowService = new TheoDoiMuonSachService(client);
    }

    generateOrderCode() {
        const timePart = String(Date.now()).slice(-9);
        const randomPart = String(Math.floor(100 + Math.random() * 900));
        return Number(`${timePart}${randomPart}`);
    }

    async notifyAllStaffAndAdmins(type, title, message, reference) {
        const staffList = await this.NhanVien.find(
            { deleted: { $ne: true }, TrangThaiThe: { $ne: "Khoa" }, ChucVu: { $in: ["ADMIN", "STAFF"] } },
            { projection: { MSNV: 1 } }
        ).toArray();

        await Promise.all(
            staffList.map((staff) =>
                this.ThongBao.createSafely({
                    recipientCode: staff.MSNV,
                    recipientType: "nhanvien",
                    type,
                    title,
                    message,
                    reference,
                })
            )
        );
    }

    async callPayosCreateLink({ orderCode, amount, description, returnUrl, cancelUrl }) {
        const { clientId, apiKey, checksumKey } = getPayosCredentials();
        const signature = signPaymentRequest({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey);
        const payload = {
            orderCode,
            amount,
            description,
            cancelUrl,
            returnUrl,
            signature,
        };

        const response = await fetch(PAYOS_API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": clientId,
                "x-api-key": apiKey,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20_000),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.code !== "00" || !result.data) {
            const err = new Error(
                result.desc
                    ? `Không thể khởi tạo mã thanh toán PayOS (${result.desc}).`
                    : "Cổng thanh toán PayOS tạm thời không phản hồi. Vui lòng thử lại sau."
            );
            err.statusCode = response.status >= 500 ? 502 : 400;
            throw err;
        }
        return result.data;
    }

    async callPayosGetLink(orderCode) {
        const { clientId, apiKey } = getPayosCredentials();
        const response = await fetch(`${PAYOS_API_BASE}/${encodeURIComponent(orderCode)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": clientId,
                "x-api-key": apiKey,
            },
            signal: AbortSignal.timeout(15_000),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.code !== "00" || !result.data) {
            return null;
        }
        return result.data;
    }

    async syncTransactionWithPayos(tx) {
        if (!tx || tx.PhuongThucDenBu === "TrucTiep" || !tx.OrderCode || tx.TrangThaiPayOS === "PAID") return tx;

        try {
            const remote = await this.callPayosGetLink(tx.OrderCode);
            if (!remote || !remote.status) return tx;

            const remoteStatus = String(remote.status).toUpperCase();
            if (remoteStatus === tx.TrangThaiPayOS) return tx;

            const updates = {
                TrangThaiPayOS: remoteStatus,
                UpdatedAt: new Date(),
            };

            if (remoteStatus === "PAID") {
                updates.XacMinhTuDong = true;
                updates.ThoiGianThanhToan = tx.ThoiGianThanhToan || new Date();
                if (tx.TrangThaiDuyet === "ChoChuyenKhoan") {
                    updates.TrangThaiDuyet = "ChoDuyet";
                }
            }

            await this.GiaoDich.updateOne({ _id: tx._id }, { $set: updates });
            const updated = await this.GiaoDich.findOne({ _id: tx._id }, { projection: transactionPublicFields });

            if (remoteStatus === "PAID" && tx.TrangThaiDuyet === "ChoChuyenKhoan") {
                await this.TheoDoi.updateOne(
                    { _id: new ObjectId(tx.MaPhieuMuon) },
                    {
                        $set: {
                            GhiChu: `Đã thanh toán đền bù qua PayOS (#${tx.OrderCode}: ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫) — Chờ quản trị viên duyệt`,
                            UpdatedAt: new Date(),
                        },
                    }
                );
                await this.notifyAllStaffAndAdmins(
                    "DEN_BU_PAYOS_CHO_DUYET",
                    "Có giao dịch đền bù mất sách mới qua PayOS",
                    `Độc giả ${tx.TenDocGia || tx.MaDocGia} đã thanh toán ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫ (Mã đơn #${tx.OrderCode}) đền bù sách “${tx.TenSach || tx.MaSach}”. Vui lòng kiểm tra và duyệt.`,
                    tx.MaPhieuMuon
                );
            }

            return updated || { ...tx, ...updates };
        } catch {
            return tx;
        }
    }

    async reportLostAndCreatePayment(borrowId, maDocGia, payload = {}) {
        if (!ObjectId.isValid(borrowId)) {
            const err = new Error("Mã phiếu mượn không hợp lệ.");
            err.statusCode = 400;
            throw err;
        }

        let borrowRecord = await this.TheoDoi.findOne({ _id: new ObjectId(borrowId) });
        if (!borrowRecord) {
            const err = new Error("Không tìm thấy phiếu mượn.");
            err.statusCode = 404;
            throw err;
        }

        if (borrowRecord.MaDocGia !== String(maDocGia)) {
            const err = new Error("Bạn chỉ có thể báo mất và đền bù cho phiếu mượn của chính mình.");
            err.statusCode = 403;
            throw err;
        }

        const phuongThuc = payload.phuongThuc === "TrucTiep" ? "TrucTiep" : "PayOS";
        const ghiChu = payload.ghiChu && String(payload.ghiChu).trim()
            ? String(payload.ghiChu).trim().slice(0, 500)
            : phuongThuc === "TrucTiep"
            ? "Độc giả báo mất sách và đăng ký đền bù trực tiếp tại quầy thư viện"
            : "Độc giả báo mất sách và đền bù trực tuyến qua PayOS";

        // Nếu phiếu đang ở trạng thái DangMuon, tự động chuyển sang MatSach trước khi khởi tạo giao dịch đền bù
        if (borrowRecord.TrangThai === "DangMuon") {
            await this.BorrowService.baoMatDocGia(borrowId, ghiChu, maDocGia);
            borrowRecord = await this.TheoDoi.findOne({ _id: new ObjectId(borrowId) });
        } else if (borrowRecord.TrangThai !== "MatSach") {
            const err = new Error("Chỉ có thể tạo giao dịch đền bù cho sách đang mượn hoặc đã ghi nhận mất sách.");
            err.statusCode = 409;
            throw err;
        }

        // Kiểm tra giao dịch hiện có của phiếu mượn này
        const existing = await this.GiaoDich.findOne(
            { MaPhieuMuon: String(borrowRecord._id) },
            { sort: { ThoiGianTao: -1, _id: -1 } }
        );

        if (existing) {
            if (existing.TrangThaiDuyet === "DaDuyet") {
                const err = new Error("Phiếu mất sách này đã hoàn tất đền bù và được quản trị viên duyệt.");
                err.statusCode = 409;
                throw err;
            }
            const existingMethod = existing.PhuongThucDenBu || "PayOS";
            if (!payload.forceNew && existingMethod === phuongThuc) {
                if (existing.TrangThaiDuyet === "ChoDuyet") {
                    const synced = await this.syncTransactionWithPayos(existing);
                    return await this.findById(synced._id);
                }
                if (existing.TrangThaiDuyet === "ChoChuyenKhoan") {
                    const synced = await this.syncTransactionWithPayos(existing);
                    if (synced.TrangThaiPayOS === "PENDING" || synced.TrangThaiPayOS === "PAID") {
                        return await this.findById(synced._id);
                    }
                }
            }
        }

        const [sach, docGia] = await Promise.all([
            this.Sach.findOne({ MaSach: borrowRecord.MaSach }),
            this.DocGia.findOne({ MaDocGia: borrowRecord.MaDocGia }),
        ]);

        const soTien = Math.max(Number(borrowRecord.GiaTriBoiThuong || sach?.DonGia || 0), 2000);
        const orderCode = this.generateOrderCode();
        const readerName = [docGia?.HoLot, docGia?.Ten].filter(Boolean).join(" ") || borrowRecord.MaDocGia;
        const now = new Date();

        // Phương thức 1: Đền bù trực tiếp tại quầy thư viện (chờ thủ thư / quản trị viên duyệt khi nhận tiền mặt)
        if (phuongThuc === "TrucTiep") {
            const directDoc = {
                MaPhieuMuon: String(borrowRecord._id),
                MaDocGia: borrowRecord.MaDocGia,
                TenDocGia: readerName,
                MaSach: borrowRecord.MaSach,
                TenSach: sach?.TenSach || borrowRecord.MaSach,
                OrderCode: orderCode,
                PhuongThucDenBu: "TrucTiep",
                SoTien: Number(borrowRecord.GiaTriBoiThuong || sach?.DonGia || 0),
                NoiDungChuyenKhoan: `TRUCTIEP-${String(orderCode).slice(-6)}`,
                PaymentLinkId: null,
                CheckoutUrl: null,
                QrCode: null,
                VietQrImageUrl: null,
                QrFallbackImageUrl: null,
                Bin: null,
                AccountNumber: null,
                AccountName: null,
                TrangThaiPayOS: "DIRECT_COUNTER",
                TrangThaiDuyet: "ChoDuyet",
                XacMinhTuDong: false,
                GhiChuDocGia: ghiChu,
                NguoiDuyet: null,
                LyDoTuChoi: null,
                ThoiGianTao: now,
                ThoiGianThanhToan: null,
                ThoiGianDuyet: null,
                UpdatedAt: now,
            };

            const insertResult = await this.GiaoDich.insertOne(directDoc);

            await this.TheoDoi.updateOne(
                { _id: borrowRecord._id },
                {
                    $set: {
                        GhiChu: `${ghiChu} (Đăng ký đền bù trực tiếp tại quầy #${orderCode}: ${directDoc.SoTien.toLocaleString("vi-VN")} ₫ — Chờ thủ thư/quản trị viên duyệt)`,
                        UpdatedAt: now,
                    },
                }
            );

            await this.AuditLog.record({
                action: "DIRECT_COMPENSATION_REQUESTED",
                entityType: "borrow",
                entityId: String(borrowRecord._id),
                MaSach: borrowRecord.MaSach,
                TenSach: directDoc.TenSach,
                MaDocGia: borrowRecord.MaDocGia,
                TenDocGia: readerName,
                actorType: "reader",
                actorId: borrowRecord.MaDocGia,
                Details: {
                    OrderCode: directDoc.OrderCode,
                    PhuongThucDenBu: "TrucTiep",
                    compensation: directDoc.SoTien,
                    TrangThaiDuyet: "ChoDuyet",
                    GhiChuDocGia: ghiChu,
                },
            });

            await this.notifyAllStaffAndAdmins(
                "DEN_BU_TRUC_TIEP_CHO_DUYET",
                "Độc giả đăng ký đền bù mất sách trực tiếp tại quầy",
                `Độc giả ${readerName} (${borrowRecord.MaDocGia}) đã báo mất cuốn “${directDoc.TenSach}” và chọn đền bù trực tiếp tại quầy (${directDoc.SoTien.toLocaleString("vi-VN")} ₫, Mã phiếu #${orderCode}). Vui lòng duyệt khi nhận đủ tiền.`,
                String(borrowRecord._id)
            );

            await this.ThongBao.createSafely({
                recipientCode: borrowRecord.MaDocGia,
                recipientType: "docgia",
                type: "DEN_BU_TRUC_TIEP_DA_DANG_KY",
                title: "Đã đăng ký đền bù trực tiếp tại quầy",
                message: `Bạn đã chọn đền bù trực tiếp tại quầy cho cuốn “${directDoc.TenSach}” (Số tiền: ${directDoc.SoTien.toLocaleString("vi-VN")} ₫, Mã #${orderCode}). Vui lòng đến quầy thư viện để hoàn tất và chờ thủ thư/quản trị viên duyệt.`,
                reference: borrowRecord.MaSach,
            });

            return await this.findById(insertResult.insertedId);
        }

        // Phương thức 2: Chuyển khoản trực tuyến qua PayOS
        const cleanBookCode = String(borrowRecord.MaSach || "SACH").replace(/[^A-Z0-9]/gi, "").slice(-10);
        const description = `DENBU ${cleanBookCode} ${String(orderCode).slice(-5)}`.slice(0, 25);
        const readerOrigin = getReaderAppOrigin();
        const returnUrl = `${readerOrigin}/profile?payos=paid&orderCode=${orderCode}`;
        const cancelUrl = `${readerOrigin}/profile?payos=cancelled&orderCode=${orderCode}`;

        const payosData = await this.callPayosCreateLink({
            orderCode,
            amount: soTien,
            description,
            returnUrl,
            cancelUrl,
        });

        const vietQrImageUrl = buildVietQrImageUrl({
            bin: payosData.bin,
            accountNumber: payosData.accountNumber,
            amount: payosData.amount || soTien,
            description: payosData.description || description,
            accountName: payosData.accountName,
        });
        const qrFallbackImageUrl = buildQrFallbackImageUrl(payosData.qrCode);

        const doc = {
            MaPhieuMuon: String(borrowRecord._id),
            MaDocGia: borrowRecord.MaDocGia,
            TenDocGia: readerName,
            MaSach: borrowRecord.MaSach,
            TenSach: sach?.TenSach || borrowRecord.MaSach,
            OrderCode: Number(payosData.orderCode || orderCode),
            PhuongThucDenBu: "PayOS",
            SoTien: Number(payosData.amount || soTien),
            NoiDungChuyenKhoan: String(payosData.description || description),
            PaymentLinkId: payosData.paymentLinkId || null,
            CheckoutUrl: payosData.checkoutUrl || null,
            QrCode: payosData.qrCode || null,
            VietQrImageUrl: vietQrImageUrl || qrFallbackImageUrl || null,
            QrFallbackImageUrl: qrFallbackImageUrl || null,
            Bin: payosData.bin || null,
            AccountNumber: payosData.accountNumber || null,
            AccountName: payosData.accountName || null,
            TrangThaiPayOS: String(payosData.status || "PENDING").toUpperCase(),
            TrangThaiDuyet: "ChoChuyenKhoan",
            XacMinhTuDong: false,
            GhiChuDocGia: ghiChu,
            NguoiDuyet: null,
            LyDoTuChoi: null,
            ThoiGianTao: now,
            ThoiGianThanhToan: null,
            ThoiGianDuyet: null,
            UpdatedAt: now,
        };

        const insertResult = await this.GiaoDich.insertOne(doc);
        await this.AuditLog.record({
            action: "PAYOS_COMPENSATION_CREATED",
            entityType: "borrow",
            entityId: String(borrowRecord._id),
            MaSach: borrowRecord.MaSach,
            TenSach: doc.TenSach,
            MaDocGia: borrowRecord.MaDocGia,
            TenDocGia: readerName,
            actorType: "reader",
            actorId: borrowRecord.MaDocGia,
            Details: {
                OrderCode: doc.OrderCode,
                compensation: doc.SoTien,
                TrangThaiDuyet: "ChoChuyenKhoan",
                GhiChuDocGia: ghiChu,
            },
        });

        return await this.findById(insertResult.insertedId);
    }

    async findById(id) {
        if (!ObjectId.isValid(id)) return null;
        return await this.GiaoDich.findOne({ _id: new ObjectId(id) }, { projection: transactionPublicFields });
    }

    async getLatestByBorrowId(borrowId, user) {
        if (!ObjectId.isValid(borrowId)) return null;
        const borrowRecord = await this.TheoDoi.findOne({ _id: new ObjectId(borrowId) });
        if (!borrowRecord) return null;

        if (user?.type === "reader" && borrowRecord.MaDocGia !== user.username) {
            const err = new Error("Bạn không có quyền xem giao dịch đền bù của độc giả khác.");
            err.statusCode = 403;
            throw err;
        }

        const tx = await this.GiaoDich.findOne(
            { MaPhieuMuon: String(borrowRecord._id) },
            { sort: { ThoiGianTao: -1, _id: -1 }, projection: transactionPublicFields }
        );
        if (!tx) return null;
        return await this.syncTransactionWithPayos(tx);
    }

    async confirmTransferByReader(borrowId, maDocGia, payload = {}) {
        if (!ObjectId.isValid(borrowId)) {
            const err = new Error("Mã phiếu mượn không hợp lệ.");
            err.statusCode = 400;
            throw err;
        }

        const borrowRecord = await this.TheoDoi.findOne({ _id: new ObjectId(borrowId) });
        if (!borrowRecord) {
            const err = new Error("Không tìm thấy phiếu mượn.");
            err.statusCode = 404;
            throw err;
        }
        if (borrowRecord.MaDocGia !== String(maDocGia)) {
            const err = new Error("Bạn không có quyền xác nhận giao dịch của độc giả khác.");
            err.statusCode = 403;
            throw err;
        }

        let tx = await this.GiaoDich.findOne(
            { MaPhieuMuon: String(borrowRecord._id) },
            { sort: { ThoiGianTao: -1, _id: -1 } }
        );
        if (!tx) {
            const err = new Error("Chưa tìm thấy mã thanh toán PayOS cho phiếu mượn này. Vui lòng tạo mã thanh toán trước.");
            err.statusCode = 404;
            throw err;
        }

        if (tx.TrangThaiDuyet === "DaDuyet") {
            return await this.findById(tx._id);
        }

        tx = await this.syncTransactionWithPayos(tx);

        const now = new Date();
        const extraNote = payload.ghiChu && String(payload.ghiChu).trim()
            ? String(payload.ghiChu).trim().slice(0, 500)
            : tx.GhiChuDocGia;

        await this.GiaoDich.updateOne(
            { _id: tx._id },
            {
                $set: {
                    TrangThaiDuyet: "ChoDuyet",
                    GhiChuDocGia: extraNote,
                    ThoiGianThanhToan: tx.ThoiGianThanhToan || now,
                    UpdatedAt: now,
                },
            }
        );

        const payosVerifiedNote = tx.TrangThaiPayOS === "PAID"
            ? "Đã thanh toán trên PayOS"
            : "Độc giả xác nhận đã chuyển khoản";

        await this.TheoDoi.updateOne(
            { _id: borrowRecord._id },
            {
                $set: {
                    GhiChu: `${extraNote || "Báo mất sách"} (${payosVerifiedNote} #${tx.OrderCode}: ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫ — Đang chờ quản trị viên duyệt)`,
                    UpdatedAt: now,
                },
            }
        );

        await this.AuditLog.record({
            action: "PAYOS_COMPENSATION_SUBMITTED",
            entityType: "borrow",
            entityId: String(borrowRecord._id),
            MaSach: tx.MaSach,
            TenSach: tx.TenSach,
            MaDocGia: tx.MaDocGia,
            TenDocGia: tx.TenDocGia,
            actorType: "reader",
            actorId: String(maDocGia),
            Details: {
                OrderCode: tx.OrderCode,
                compensation: tx.SoTien,
                TrangThaiPayOS: tx.TrangThaiPayOS,
                TrangThaiDuyet: "ChoDuyet",
            },
        });

        await this.notifyAllStaffAndAdmins(
            "DEN_BU_PAYOS_CHO_DUYET",
            "Yêu cầu duyệt đền bù mất sách qua PayOS",
            `Độc giả ${tx.TenDocGia || tx.MaDocGia} đã xác nhận chuyển khoản ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫ (Mã đơn #${tx.OrderCode}) đền bù cuốn “${tx.TenSach || tx.MaSach}”. Vui lòng kiểm tra và xét duyệt.`,
            String(borrowRecord._id)
        );

        await this.ThongBao.createSafely({
            recipientCode: tx.MaDocGia,
            recipientType: "docgia",
            type: "DEN_BU_PAYOS_DA_GUI",
            title: "Đã gửi xác nhận đền bù mất sách",
            message: `Yêu cầu xác nhận chuyển khoản đền bù cuốn “${tx.TenSach || tx.MaSach}” (Mã đơn #${tx.OrderCode} - ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫) đã được gửi. Vui lòng đợi quản trị viên xét duyệt.`,
            reference: tx.MaSach,
        });

        return await this.findById(tx._id);
    }

    async syncOrderByOrderCode(orderCode, maDocGia) {
        const numericCode = Number(orderCode);
        if (!Number.isInteger(numericCode) || numericCode <= 0) {
            const err = new Error("Mã đơn hàng PayOS không hợp lệ.");
            err.statusCode = 400;
            throw err;
        }

        const tx = await this.GiaoDich.findOne({ OrderCode: numericCode });
        if (!tx) {
            const err = new Error("Không tìm thấy giao dịch đền bù tương ứng với mã đơn PayOS.");
            err.statusCode = 404;
            throw err;
        }
        if (maDocGia && tx.MaDocGia !== String(maDocGia)) {
            const err = new Error("Bạn không có quyền truy cập giao dịch này.");
            err.statusCode = 403;
            throw err;
        }

        const synced = await this.syncTransactionWithPayos(tx);
        if (synced.TrangThaiDuyet === "ChoChuyenKhoan") {
            return await this.confirmTransferByReader(tx.MaPhieuMuon, tx.MaDocGia, {});
        }
        return await this.findById(synced._id);
    }

    async handleWebhook(webhookBody) {
        const { checksumKey } = getPayosCredentials();
        if (!verifyWebhookSignature(webhookBody, checksumKey)) {
            const err = new Error("Chữ ký Webhook PayOS không hợp lệ.");
            err.statusCode = 400;
            throw err;
        }

        const data = webhookBody.data || {};
        const orderCode = Number(data.orderCode);
        if (!Number.isInteger(orderCode) || orderCode <= 0) {
            return { acknowledged: true };
        }

        const tx = await this.GiaoDich.findOne({ OrderCode: orderCode });
        if (!tx) {
            return { acknowledged: true };
        }

        const isPaid = webhookBody.code === "00" || data.code === "00";
        if (isPaid && tx.TrangThaiPayOS !== "PAID") {
            const now = new Date();
            const nextReviewState = tx.TrangThaiDuyet === "DaDuyet" ? "DaDuyet" : "ChoDuyet";
            await this.GiaoDich.updateOne(
                { _id: tx._id },
                {
                    $set: {
                        TrangThaiPayOS: "PAID",
                        XacMinhTuDong: true,
                        TrangThaiDuyet: nextReviewState,
                        ThoiGianThanhToan: tx.ThoiGianThanhToan || now,
                        UpdatedAt: now,
                    },
                }
            );

            if (ObjectId.isValid(tx.MaPhieuMuon)) {
                await this.TheoDoi.updateOne(
                    { _id: new ObjectId(tx.MaPhieuMuon) },
                    {
                        $set: {
                            GhiChu: `Đã thanh toán đền bù qua PayOS (#${tx.OrderCode}: ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫) — Chờ quản trị viên duyệt`,
                            UpdatedAt: now,
                        },
                    }
                );
            }

            await this.notifyAllStaffAndAdmins(
                "DEN_BU_PAYOS_CHO_DUYET",
                "PayOS xác nhận thanh toán đền bù mất sách",
                `Hệ thống PayOS đã xác nhận thanh toán ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫ (Mã đơn #${tx.OrderCode}) từ độc giả ${tx.TenDocGia || tx.MaDocGia} cho sách “${tx.TenSach || tx.MaSach}”. Đang chờ duyệt.`,
                tx.MaPhieuMuon
            );
        }

        return { acknowledged: true, orderCode };
    }

    async findAll(filters = {}, user = null) {
        const query = {};
        if (user?.type === "reader") {
            query.MaDocGia = user.username;
        } else if (filters.maDocGia) {
            query.MaDocGia = String(filters.maDocGia).trim();
        }
        if (filters.maPhieuMuon) {
            query.MaPhieuMuon = String(filters.maPhieuMuon).trim();
        }
        if (filters.trangThaiDuyet && filters.trangThaiDuyet !== "all") {
            query.TrangThaiDuyet = String(filters.trangThaiDuyet).trim();
        }

        const list = await this.GiaoDich.find(query, { projection: transactionPublicFields })
            .sort({ ThoiGianTao: -1, _id: -1 })
            .limit(200)
            .toArray();

        // Chỉ trả về giao dịch mới nhất cho mỗi phiếu mượn nếu có tham số latestPerBorrow
        if (filters.latestPerBorrow === "true" || filters.latestPerBorrow === true) {
            const seen = new Set();
            return list.filter((item) => {
                if (seen.has(item.MaPhieuMuon)) return false;
                seen.add(item.MaPhieuMuon);
                return true;
            });
        }
        return list;
    }

    async approveTransaction(id, staffUser) {
        if (!ObjectId.isValid(id)) {
            const err = new Error("Mã giao dịch đền bù không hợp lệ.");
            err.statusCode = 400;
            throw err;
        }

        let tx = await this.GiaoDich.findOne({ _id: new ObjectId(id) });
        if (!tx) {
            // Cho phép truyền MaPhieuMuon nếu cần
            tx = await this.GiaoDich.findOne(
                { MaPhieuMuon: String(id) },
                { sort: { ThoiGianTao: -1, _id: -1 } }
            );
        }
        if (!tx) {
            const err = new Error("Không tìm thấy giao dịch đền bù mất sách.");
            err.statusCode = 404;
            throw err;
        }

        if (tx.TrangThaiDuyet === "DaDuyet") {
            const err = new Error("Giao dịch đền bù này đã được duyệt trước đó.");
            err.statusCode = 409;
            throw err;
        }

        tx = await this.syncTransactionWithPayos(tx);

        const msnv = String(staffUser?.username || "").trim();
        const now = new Date();
        await this.GiaoDich.updateOne(
            { _id: tx._id },
            {
                $set: {
                    TrangThaiDuyet: "DaDuyet",
                    NguoiDuyet: msnv,
                    LyDoTuChoi: null,
                    ThoiGianDuyet: now,
                    UpdatedAt: now,
                },
            }
        );

        const isDirect = tx.PhuongThucDenBu === "TrucTiep";
        const methodText = isDirect ? "trực tiếp tại quầy" : "chuyển khoản qua PayOS";

        if (ObjectId.isValid(tx.MaPhieuMuon)) {
            await this.TheoDoi.updateOne(
                { _id: new ObjectId(tx.MaPhieuMuon) },
                {
                    $set: {
                        GhiChu: `Đã hoàn tất đền bù mất sách ${methodText} (Mã #${tx.OrderCode}: ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫ — Đã duyệt bởi ${msnv})`,
                        UpdatedAt: now,
                    },
                }
            );
        }

        await this.AuditLog.record({
            action: "PAYOS_COMPENSATION_APPROVED",
            entityType: "borrow",
            entityId: String(tx.MaPhieuMuon),
            MaSach: tx.MaSach,
            TenSach: tx.TenSach,
            MaDocGia: tx.MaDocGia,
            TenDocGia: tx.TenDocGia,
            actorType: "staff",
            actorId: msnv,
            Details: {
                from: tx.TrangThaiDuyet,
                to: "DaDuyet",
                PhuongThucDenBu: tx.PhuongThucDenBu || "PayOS",
                OrderCode: tx.OrderCode,
                compensation: tx.SoTien,
            },
        });

        await this.ThongBao.createSafely({
            recipientCode: tx.MaDocGia,
            recipientType: "docgia",
            type: "DEN_BU_MAT_SACH_DA_DUYET",
            title: isDirect ? "Đã duyệt đền bù mất sách tại quầy" : "Đã duyệt đền bù mất sách qua PayOS",
            message: `Thư viện đã xác nhận và duyệt khoản đền bù ${methodText} ${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫ (Mã #${tx.OrderCode}) cho cuốn “${tx.TenSach || tx.MaSach}”. Cảm ơn bạn đã hoàn tất nghĩa vụ bồi hoàn!`,
            reference: tx.MaSach,
        });

        return await this.findById(tx._id);
    }

    async rejectTransaction(id, staffUser, lyDo) {
        const cleanReason = String(lyDo || "").trim();
        if (!cleanReason || cleanReason.length > 500) {
            const err = new Error("Vui lòng nhập lý do từ chối hợp lệ (tối đa 500 ký tự).");
            err.statusCode = 400;
            throw err;
        }

        if (!ObjectId.isValid(id)) {
            const err = new Error("Mã giao dịch đền bù không hợp lệ.");
            err.statusCode = 400;
            throw err;
        }

        let tx = await this.GiaoDich.findOne({ _id: new ObjectId(id) });
        if (!tx) {
            tx = await this.GiaoDich.findOne(
                { MaPhieuMuon: String(id) },
                { sort: { ThoiGianTao: -1, _id: -1 } }
            );
        }
        if (!tx) {
            const err = new Error("Không tìm thấy giao dịch đền bù mất sách.");
            err.statusCode = 404;
            throw err;
        }

        if (tx.TrangThaiDuyet === "DaDuyet") {
            const err = new Error("Không thể từ chối giao dịch đã được duyệt hoàn tất.");
            err.statusCode = 409;
            throw err;
        }

        const msnv = String(staffUser?.username || "").trim();
        const now = new Date();
        await this.GiaoDich.updateOne(
            { _id: tx._id },
            {
                $set: {
                    TrangThaiDuyet: "TuChoi",
                    NguoiDuyet: msnv,
                    LyDoTuChoi: cleanReason,
                    ThoiGianDuyet: now,
                    UpdatedAt: now,
                },
            }
        );

        const isDirect = tx.PhuongThucDenBu === "TrucTiep";
        const methodText = isDirect ? "trực tiếp tại quầy" : "qua PayOS";

        if (ObjectId.isValid(tx.MaPhieuMuon)) {
            await this.TheoDoi.updateOne(
                { _id: new ObjectId(tx.MaPhieuMuon) },
                {
                    $set: {
                        GhiChu: `Yêu cầu đền bù ${methodText} (#${tx.OrderCode}) bị từ chối: ${cleanReason}`,
                        UpdatedAt: now,
                    },
                }
            );
        }

        await this.AuditLog.record({
            action: "PAYOS_COMPENSATION_REJECTED",
            entityType: "borrow",
            entityId: String(tx.MaPhieuMuon),
            MaSach: tx.MaSach,
            TenSach: tx.TenSach,
            MaDocGia: tx.MaDocGia,
            TenDocGia: tx.TenDocGia,
            actorType: "staff",
            actorId: msnv,
            Details: {
                from: tx.TrangThaiDuyet,
                to: "TuChoi",
                PhuongThucDenBu: tx.PhuongThucDenBu || "PayOS",
                OrderCode: tx.OrderCode,
                compensation: tx.SoTien,
                reason: cleanReason,
            },
        });

        await this.ThongBao.createSafely({
            recipientCode: tx.MaDocGia,
            recipientType: "docgia",
            type: "DEN_BU_MAT_SACH_TU_CHOI",
            title: "Yêu cầu đền bù mất sách chưa được duyệt",
            message: `Yêu cầu đền bù ${methodText} cho cuốn “${tx.TenSach || tx.MaSach}” (Mã #${tx.OrderCode}) bị từ chối. Lý do: ${cleanReason}. Bạn có thể chọn lại phương thức đền bù trong mục Hồ sơ cá nhân.`,
            reference: tx.MaSach,
        });

        return await this.findById(tx._id);
    }
}

module.exports = PayosService;
