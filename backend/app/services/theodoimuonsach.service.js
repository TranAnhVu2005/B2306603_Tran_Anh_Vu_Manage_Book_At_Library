const { ObjectId } = require("mongodb");

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
 * Căn cứ thiết kế Cơ sở dữ liệu Báo cáo CT449 (Mục 2.5, Trang 25):
 * - Collection: 'theodoimuonsach'
 * - Cấu trúc trường:
 *   + _id: ObjectId
 *   + MaDocGia: String (Khóa ngoại tham chiếu docgia.MaDocGia)
 *   + MaSach: String (Khóa ngoại tham chiếu sach.MaSach)
 *   + NgayMuon: String / Date (Ngày độc giả gửi yêu cầu hoặc bắt đầu nhận sách)
 *   + MSNV: String (Khóa ngoại tham chiếu nhanvien.MSNV - Thủ thư phụ trách duyệt)
 *   + NgayHenTra: String / Date (Hạn trả dự kiến - Mặc định 14 ngày kể từ ngày duyệt)
 *   + NgayTra: String / Date (Ngày thực tế mang sách trả tại quầy - null nếu chưa trả)
 *   + TrangThai: String (ChoDuyet, DangMuon, DaTra, MatSach, TuChoi)
 *   + GiaTriBoiThuong: Double (Tiền bồi hoàn theo đơn giá nếu làm mất sách)
 *   + GhiChu: String (Lý do từ chối mượn hoặc ghi chú tình trạng sách lúc trả)
 * =========================================================================================
 */
class TheoDoiMuonSachService {
    constructor(client) {
        this.client = client;
        this.TheoDoi = client.db().collection("theodoimuonsach");
        this.Sach = client.db().collection("sach");
        this.DocGia = client.db().collection("docgia");
        this.NhanVien = client.db().collection("nhanvien");
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
        const sach = await this.Sach.findOne({ MaSach: maSach });
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
        return await this.findById(result.insertedId);
    }

    /**
     * Thủ thư phê duyệt phiếu mượn: Trừ tồn kho (-1), gán MSNV, hẹn ngày trả
     */
    async duyetMuon(id, msnv = "NV-0002") {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "ChoDuyet") {
            throw new Error(`Chỉ có thể duyệt các phiếu ở trạng thái 'ChoDuyet'. Phiếu này hiện là '${record.TrangThai}'.`);
        }

        // Kiểm tra lại tồn kho sách trước khi duyệt
        const sach = await this.Sach.findOne({ MaSach: record.MaSach });
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
                    MSNV: msnv,
                    NgayMuon: todayStr,
                    NgayHenTra: dueDateStr,
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );
        return result ? this.findById(String(record._id)) : null;
    }

    /**
     * Thủ thư từ chối yêu cầu mượn sách kèm lý do
     */
    async tuChoi(id, lyDo = "Thủ thư từ chối yêu cầu") {
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
                    GhiChu: lyDo,
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );
        return result ? this.findById(String(record._id)) : null;
    }

    /**
     * Xác nhận độc giả trả sách: Hoàn kho (+1), kiểm tra trễ hạn và tăng vi phạm nếu trễ
     */
    async xacNhanTra(id) {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "DangMuon") {
            throw new Error(`Chỉ có thể xác nhận trả sách cho phiếu đang ở trạng thái 'DangMuon'. Phiếu này hiện là '${record.TrangThai}'.`);
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const isLate = record.NgayHenTra && todayStr > record.NgayHenTra;

        // Cộng hoàn 1 cuốn về kho
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

        return result ? this.findById(String(record._id)) : null;
    }

    /**
     * Xử lý sự cố mất sách: Gán GiaTriBoiThuong = DonGia, không hoàn kho, tăng vi phạm
     */
    async baoMat(id, ghiChu = "Độc giả làm mất sách") {
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
                    GhiChu: `${ghiChu} (Tiền bồi thường: ${giaTriBoiThuong.toLocaleString("vi-VN")} ₫)`,
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

        return result ? this.findById(String(record._id)) : null;
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
    async delete(id) {
        if (!ObjectId.isValid(id)) return null;
        return await this.TheoDoi.findOneAndDelete({ _id: new ObjectId(id) });
    }
}

module.exports = TheoDoiMuonSachService;
