const { ObjectId } = require("mongodb");
const AuditLogService = require("./audit-log.service");
const ThongBaoService = require("./thongbao.service");

const publicFields = {
    _id: 1,
    MaDocGia: 1,
    MaSach: 1,
    NgayMuon: 1,
    MSNV: 1,
    NgayHenTra: 1,
    NgayTra: 1,
    TrangThai: 1,
    GiaTriBoiThuong: 1,
    GhiChu: 1,
};

/**
 * =========================================================================================
 * SERVICE QUẢN LÝ THEO DÕI MƯỢN SÁCH (THEODOIMUONSACH SERVICE)
 * =========================================================================================
 */
class TheoDoiMuonSachService {
    constructor(client) {
        this.client = client;
        this.TheoDoi = client.db().collection("theodoimuonsach");
        this.Sach = client.db().collection("sach");
        this.DocGia = client.db().collection("docgia");
        this.NhanVien = client.db().collection("nhanvien");
        this.AuditLog = new AuditLogService(client);
        this.ThongBao = new ThongBaoService(client);
    }

    async notifyReader(maDocGia, type, title, message, reference) {
        const reader = await this.DocGia.findOne({ MaDocGia: maDocGia }, { projection: { _id: 1 } });
        if (!reader) return;
        await this.ThongBao.createSafely({
            recipientId: String(reader._id), recipientType: "docgia", type, title, message, reference,
        });
    }

    // Service đăng ký mượn sách - Completed
    async createDangKy(payload) {
        const maDocGia = String(payload.MaDocGia || "").trim();
        const maSach = String(payload.MaSach || "").trim();

        if (!maDocGia || !maSach) {
            throw new Error("Mã độc giả và mã sách không được để trống.");
        }

        // 1. Kiểm tra hồ sơ độc giả
        const docGia = await this.DocGia.findOne({
            $or: [{ MaDocGia: maDocGia }, { DienThoai: maDocGia }]
        });
        if (!docGia) {
            throw new Error(`Độc giả với mã/SĐT '${maDocGia}' không tồn tại trong hệ thống.`);
        }

        if (docGia.TrangThaiThe === "DanhSachDen") {
            const err = new Error("Thẻ của bạn đang ở Danh sách đen do vi phạm quy định mượn trả. Vui lòng liên hệ thủ thư!");
            err.statusCode = 403;
            throw err;
        }

        if (docGia.TrangThaiThe === "Khoa") {
            const err = new Error("Thẻ độc giả hiện đang bị khóa tạm thời. Vui lòng liên hệ thủ thư!");
            err.statusCode = 403;
            throw err;
        }

        // 2. Kiểm tra giới hạn mượn: tối đa 3 quyển đang lưu thông (ChoDuyet + DangMuon)
        const currentActiveCount = await this.TheoDoi.countDocuments({
            MaDocGia: docGia.MaDocGia,
            TrangThai: { $in: ["ChoDuyet", "DangMuon"] }
        });

        if (currentActiveCount >= 3) {
            const err = new Error("Đã đạt giới hạn mượn tối đa là 3 quyển, vui lòng trả ít nhất một quyển để có thể tiếp tục mượn sách.");
            err.statusCode = 400;
            throw err;
        }

        // 3. Kiểm tra sách và tồn kho
        const sach = await this.Sach.findOne({ MaSach: maSach, deleted: { $ne: true } });
        if (!sach) {
            throw new Error(`Cuốn sách với mã '${maSach}' không tồn tại.`);
        }

        if (sach.SoQuyen <= 0) {
            const err = new Error(`Cuốn sách '${sach.TenSach}' hiện đã hết trong kho thư viện.`);
            err.statusCode = 400;
            throw err;
        }

        // Kiểm tra độc giả có đang mượn chính cuốn sách này không
        const alreadyBorrowing = await this.TheoDoi.findOne({
            MaDocGia: docGia.MaDocGia,
            MaSach: maSach,
            TrangThai: { $in: ["ChoDuyet", "DangMuon"] }
        });
        if (alreadyBorrowing) {
            const err = new Error("Bạn đã đăng ký hoặc đang mượn cuốn sách này rồi.");
            err.statusCode = 400;
            throw err;
        }

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14); // Quy định thời hạn 14 ngày

        const todayStr = today.toISOString().split("T")[0]; // Chuyển giờ theo dạng ISO, cắt bỏ từ chữ T, bỏ giờ phút giây
        const dueDateStr = dueDate.toISOString().split("T")[0];

        const record = {
            MaDocGia: docGia.MaDocGia,
            MaSach: sach.MaSach,
            NgayMuon: todayStr,
            MSNV: null, // Sẽ được cập nhật khi Thủ thư phê duyệt
            NgayHenTra: dueDateStr,
            NgayTra: null,
            TrangThai: "ChoDuyet",
            GiaTriBoiThuong: 0,
            GhiChu: payload.GhiChu ? String(payload.GhiChu).trim() : "Độc giả đăng ký mượn trực tuyến",
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        };

        const result = await this.TheoDoi.insertOne(record);
        await this.AuditLog.record({
            action: "BORROW_REQUESTED", entityType: "borrow", entityId: String(result.insertedId),
            MaSach: sach.MaSach, TenSach: sach.TenSach, MaDocGia: docGia.MaDocGia,
            TenDocGia: [docGia.HoLot, docGia.Ten].filter(Boolean).join(" "),
            actorType: "reader", actorId: docGia.MaDocGia,
            Details: { from: null, to: "ChoDuyet" },
        });
        return await this.findById(result.insertedId);
    }

    // Duyệt mượn - Completed
    async duyetMuon(id, msnv) {
        if (!msnv || String(msnv).trim() === "") {
            throw new Error("Mã số nhân viên (MSNV) là bắt buộc để thực hiện duyệt phiếu mượn.");
        }

        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "ChoDuyet") {
            throw new Error(`Chỉ có thể duyệt các phiếu ở trạng thái 'ChoDuyet'. Phiếu này hiện là '${record.TrangThai}'.`);
        }

        // Kiểm tra lại tồn kho sách trước khi duyệt
        const sach = await this.Sach.findOne({ MaSach: record.MaSach, deleted: { $ne: true } });
        if (!sach || sach.SoQuyen <= 0) {
            throw new Error(`Sách '${record.MaSach}' đã hết trong kho, không thể duyệt.`);
        }

        // Trừ 1 cuốn trong kho
        await this.Sach.updateOne({ MaSach: record.MaSach }, { $inc: { SoQuyen: -1 }, $set: { UpdatedAt: new Date() } });

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14); // 14 ngày kể từ ngày duyệt

        const todayStr = today.toISOString().split("T")[0];
        const dueDateStr = dueDate.toISOString().split("T")[0];

        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "DangMuon",
                    MSNV: String(msnv).trim(),
                    NgayMuon: todayStr,
                    NgayHenTra: dueDateStr,
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );
        const updatedRecord = result ? await this.findById(String(record._id)) : null;
        if (updatedRecord) {
            const reader = await this.DocGia.findOne({ MaDocGia: record.MaDocGia }, { projection: { _id: 1, HoLot: 1, Ten: 1 } });
            await this.AuditLog.record({
                action: "BORROW_APPROVED", entityType: "borrow", entityId: String(record._id),
                MaSach: record.MaSach, TenSach: sach.TenSach, MaDocGia: record.MaDocGia,
                TenDocGia: [reader?.HoLot, reader?.Ten].filter(Boolean).join(" "),
                actorType: "staff", actorId: msnv,
                Details: { from: "ChoDuyet", to: "DangMuon" },
            });
            await this.ThongBao.createSafely({
                recipientId: String(reader?._id || ""), recipientType: "docgia", type: "PHIEU_DUYET_MUON",
                title: "Yêu cầu mượn sách đã được duyệt",
                message: `Yêu cầu mượn “${sach.TenSach}” đã được duyệt. Hạn trả dự kiến: ${updatedRecord.NgayHenTra}.`,
                reference: record.MaSach,
            });
        }
        return updatedRecord;
    }

    // Từ chối kèm lý do - Completed
    async tuChoi(id, lyDo, msnv) {
        if (!lyDo || String(lyDo).trim() === "") {
            throw new Error("Vui lòng cung cấp lý do từ chối phiếu mượn.");
        }

        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "ChoDuyet") {
            throw new Error(`Chỉ có thể từ chối các phiếu đang ở trạng thái 'ChoDuyet'.`);
        }

        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "TuChoi",
                    GhiChu: String(lyDo).trim(),
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );
        const updatedRecord = result ? await this.findById(String(record._id)) : null;
        if (updatedRecord) {
            const [sach, reader] = await Promise.all([
                this.Sach.findOne({ MaSach: record.MaSach }, { projection: { TenSach: 1 } }),
                this.DocGia.findOne({ MaDocGia: record.MaDocGia }, { projection: { _id: 1, HoLot: 1, Ten: 1 } }),
            ]);
            await this.AuditLog.record({
                action: "BORROW_REJECTED", entityType: "borrow", entityId: String(record._id),
                MaSach: record.MaSach, TenSach: sach?.TenSach, MaDocGia: record.MaDocGia,
                TenDocGia: [reader?.HoLot, reader?.Ten].filter(Boolean).join(" "),
                actorType: "staff", actorId: msnv, Details: { from: "ChoDuyet", to: "TuChoi", reason: String(lyDo).trim() },
            });
            await this.ThongBao.createSafely({
                recipientId: String(reader?._id || ""), recipientType: "docgia", type: "PHIEU_TU_CHOI_MUON",
                title: "Yêu cầu mượn sách chưa được duyệt",
                message: `Yêu cầu mượn “${sach?.TenSach || record.MaSach}” bị từ chối. Lý do: ${String(lyDo).trim()}`,
                reference: record.MaSach,
            });
        }
        return updatedRecord;
    }

    // Xác nhận trả sách có check có trễ hay không - Completed
    async xacNhanTra(id, msnv) {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "DangMuon") {
            throw new Error(`Chỉ có thể xác nhận trả sách cho phiếu đang ở trạng thái 'DangMuon'. Phiếu này hiện là '${record.TrangThai}'.`);
        }

        const todayStr = new Date().toISOString().split("T")[0];

        // record.NgayHenTra nếu bằng null thì trả về false liền
        const isLate = record.NgayHenTra && todayStr > record.NgayHenTra;

        // Cộng hoàn 1 cuốn về kho
        const sach = await this.Sach.findOne({ MaSach: record.MaSach }, { projection: { TenSach: 1 } });
        await this.Sach.updateOne({ MaSach: record.MaSach }, { $inc: { SoQuyen: 1 }, $set: { UpdatedAt: new Date() } });

        // Cập nhật phiếu mượn
        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "DaTra",
                    NgayTra: todayStr,
                    GhiChu: isLate ? "Đã trả (Quá hạn mượn quy định)" : "Đã hoàn trả đúng hạn",
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        // Nếu trả trễ hạn: Tự động tăng SoLanViPham, đưa vào DanhSachDen nếu đạt 3 lần
        if (isLate) {
            const docGia = await this.DocGia.findOne({ MaDocGia: record.MaDocGia });
            if (docGia) {
                const newViPham = (docGia.SoLanViPham || 0) + 1;
                const newStatus = newViPham >= 3 ? "DanhSachDen" : docGia.TrangThaiThe;
                await this.DocGia.updateOne(
                    { MaDocGia: record.MaDocGia },
                    { $set: { SoLanViPham: newViPham, TrangThaiThe: newStatus, UpdatedAt: new Date() } }
                );
            }
        }

        const updatedRecord = result ? await this.findById(String(record._id)) : null;
        if (updatedRecord) {
            const reader = await this.DocGia.findOne({ MaDocGia: record.MaDocGia }, { projection: { HoLot: 1, Ten: 1 } });
            await this.AuditLog.record({
                action: "BOOK_RETURNED", entityType: "borrow", entityId: String(record._id),
                MaSach: record.MaSach, TenSach: sach?.TenSach, MaDocGia: record.MaDocGia,
                TenDocGia: [reader?.HoLot, reader?.Ten].filter(Boolean).join(" "),
                actorType: "staff", actorId: msnv,
                Details: { from: "DangMuon", to: "DaTra", overdue: Boolean(isLate) },
            });
            await this.notifyReader(record.MaDocGia, "PHIEU_TRA_SACH", "Đã xác nhận trả sách", `Thư viện đã xác nhận bạn trả “${sach?.TenSach || record.MaSach}”.`, record.MaSach);
            if (isLate) {
                const readerState = await this.DocGia.findOne({ MaDocGia: record.MaDocGia }, { projection: { SoLanViPham: 1, TrangThaiThe: 1 } });
                if (readerState?.TrangThaiThe === "DanhSachDen") {
                    await this.notifyReader(record.MaDocGia, "THE_VAO_DANH_SACH_DEN", "Thẻ đã vào Danh sách đen", "Thẻ của bạn đã đạt ngưỡng vi phạm. Hệ thống tạm dừng đăng ký mượn; vui lòng liên hệ thư viện để được hướng dẫn.", record.MaDocGia);
                } else {
                    await this.notifyReader(record.MaDocGia, "VI_PHAM_TRA_TRE", "Phiếu trả sách ghi nhận quá hạn", `Lần trả “${sach?.TenSach || record.MaSach}” được ghi nhận quá hạn. Số lần vi phạm hiện tại: ${readerState?.SoLanViPham || 0}.`, record.MaSach);
                }
            }
        }
        return updatedRecord;
    }

    // Do thủ thư thực hiện - Completed
    async baoMat(id, ghiChu, msnv) {
        if (!ghiChu || String(ghiChu).trim() === "") {
            throw new Error("Vui lòng cung cấp biên bản hoặc ghi chú lý do báo mất sách.");
        }

        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "DangMuon") {
            throw new Error(`Chỉ có thể báo mất sách khi phiếu đang ở trạng thái 'DangMuon'.`);
        }

        // Lấy đơn giá sách để tính giá trị bồi thường
        const sach = await this.Sach.findOne({ MaSach: record.MaSach });
        const giaTriBoiThuong = sach ? sach.DonGia : 0;

        // KHÔNG cộng lại tồn kho vì sách đã mất thật sự
        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "MatSach",
                    NgayTra: new Date().toISOString().split("T")[0],
                    GiaTriBoiThuong: giaTriBoiThuong,
                    GhiChu: `${String(ghiChu).trim()} (Tiền bồi thường: ${giaTriBoiThuong.toLocaleString("vi-VN")} ₫)`,
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        // Tăng số lần vi phạm của độc giả và đưa vào DanhSachDen nếu đạt 3 lần
        const docGia = await this.DocGia.findOne({ MaDocGia: record.MaDocGia });
        if (docGia) {
            const newViPham = (docGia.SoLanViPham || 0) + 1;
            const newStatus = newViPham >= 3 ? "DanhSachDen" : docGia.TrangThaiThe;
            await this.DocGia.updateOne(
                { MaDocGia: record.MaDocGia },
                { $set: { SoLanViPham: newViPham, TrangThaiThe: newStatus, UpdatedAt: new Date() } }
            );
        }

        const updatedRecord = result ? await this.findById(String(record._id)) : null;
        if (updatedRecord) {
            const reader = await this.DocGia.findOne({ MaDocGia: record.MaDocGia }, { projection: { HoLot: 1, Ten: 1 } });
            await this.AuditLog.record({
                action: "BOOK_REPORTED_LOST", entityType: "borrow", entityId: String(record._id),
                MaSach: record.MaSach, TenSach: sach?.TenSach, MaDocGia: record.MaDocGia,
                TenDocGia: [reader?.HoLot, reader?.Ten].filter(Boolean).join(" "),
                actorType: "staff", actorId: msnv,
                Details: { from: "DangMuon", to: "MatSach", compensation: giaTriBoiThuong },
            });
            await this.notifyReader(record.MaDocGia, "PHIEU_BAO_MAT_SACH", "Đã ghi nhận báo mất sách", `Thư viện đã ghi nhận “${sach?.TenSach || record.MaSach}” bị mất. Giá trị bồi thường được ghi nhận: ${giaTriBoiThuong.toLocaleString("vi-VN")} ₫.`, record.MaSach);
            if (docGia?.TrangThaiThe === "DanhSachDen") {
                await this.notifyReader(record.MaDocGia, "THE_VAO_DANH_SACH_DEN", "Thẻ đã vào Danh sách đen", "Thẻ của bạn đã đạt ngưỡng vi phạm. Hệ thống tạm dừng đăng ký mượn; vui lòng liên hệ thư viện để được hướng dẫn.", record.MaDocGia);
            }
        }
        return updatedRecord;
    }

    // Tìm theo mã độc giả, mã sách và trạng thái - Completed
    async find(filter = {}) {
        const query = {};
        if (filter.maDocGia) {
            query.MaDocGia = filter.maDocGia;
        }
        if (filter.maSach) {
            query.MaSach = filter.maSach;
        }
        if (filter.trangThai && filter.trangThai !== "all") {
            query.TrangThai = filter.trangThai;
        }

        return await this.TheoDoi.find(query, { projection: publicFields }).sort({ CreatedAt: -1, _id: -1 }).toArray();
    }

    // Tìm phiếu mượn theo object id, các trường khác không đủ xác định tính duy nhất - Completed
    async findById(id) {
        if (!ObjectId.isValid(id)) return null;
        return await this.TheoDoi.findOne({ _id: new ObjectId(id) }, { projection: publicFields });
    }

    // Xóa phiếu mượn - Completed
    async delete(id, msnv) {
        if (!ObjectId.isValid(id)) return null;
        const current = await this.TheoDoi.findOne({ _id: new ObjectId(id) });
        if (!current) return null;
        const [sach, docGia] = await Promise.all([
            this.Sach.findOne({ MaSach: current.MaSach }, { projection: { TenSach: 1 } }),
            this.DocGia.findOne({ MaDocGia: current.MaDocGia }, { projection: { HoLot: 1, Ten: 1 } }),
        ]);
        const result = await this.TheoDoi.findOneAndDelete({ _id: current._id });
        if (result) {
            await this.AuditLog.record({
                action: "BORROW_RECORD_DELETED", entityType: "borrow", entityId: String(current._id),
                MaSach: current.MaSach, TenSach: sach?.TenSach,
                MaDocGia: current.MaDocGia, TenDocGia: [docGia?.HoLot, docGia?.Ten].filter(Boolean).join(" "),
                actorType: "staff", actorId: msnv, Details: { from: current.TrangThai, to: null },
            });
        }
        return result;
    }
}

module.exports = TheoDoiMuonSachService;
