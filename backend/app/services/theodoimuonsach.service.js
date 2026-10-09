const { ObjectId } = require("mongodb");

class TheoDoiMuonSachService {
    constructor(client) {
        this.client = client;
        this.TheoDoi = client.db().collection("theodoimuonsach");
        this.Sach = client.db().collection("sach");
        this.DocGia = client.db().collection("docgia");
    }

    async createDangKy(payload) {
        const maDocGia = String(payload.MaDocGia || "").trim();
        const maSach = String(payload.MaSach || "").trim();

        if (!maDocGia || !maSach) {
            throw new Error("Mã độc giả và mã sách là bắt buộc.");
        }

        // 1. Kiểm tra độc giả
        const docGia = await this.DocGia.findOne({
            $or: [{ MaDocGia: maDocGia }, { DienThoai: maDocGia }]
        });
        if (!docGia) {
            throw new Error(`Độc giả với mã/SĐT '${maDocGia}' không tồn tại.`);
        }

        if (docGia.TrangThaiThe === "Blacklist") {
            const err = new Error("Tài khoản của bạn đã bị đưa vào Danh sách đen (Blacklist) do vi phạm quy định mượn trả. Vui lòng liên hệ thủ thư!");
            err.statusCode = 403;
            throw err;
        }

        if (docGia.TrangThaiThe === "Khoa") {
            const err = new Error("Thẻ độc giả hiện đang bị khóa tạm thời. Vui lòng liên hệ thủ thư!");
            err.statusCode = 403;
            throw err;
        }

        // 2. Kiểm tra giới hạn mượn: tối đa 3 cuốn đang mượn hoặc chờ duyệt
        const currentActiveCount = await this.TheoDoi.countDocuments({
            MaDocGia: docGia.MaDocGia,
            TrangThai: { $in: ["ChoDuyet", "DangMuon"] }
        });

        if (currentActiveCount >= 3) {
            const err = new Error(`Bạn đã đạt hạn mức mượn tối đa (3 cuốn đang xử lý/mượn). Vui lòng hoàn trả sách trước khi mượn thêm.`);
            err.statusCode = 400;
            throw err;
        }

        // 3. Kiểm tra sách có tồn tại và còn trong kho không
        const sach = await this.Sach.findOne({ MaSach: maSach });
        if (!sach) {
            throw new Error(`Cuốn sách với mã '${maSach}' không tồn tại.`);
        }

        if (sach.SoQuyen <= 0) {
            const err = new Error(`Cuốn sách '${sach.TenSach}' hiện đã hết trong kho thư viện.`);
            err.statusCode = 400;
            throw err;
        }

        // Kiểm tra độc giả có đang mượn chính cuốn này mà chưa trả không
        const alreadyBorrowingThisBook = await this.TheoDoi.findOne({
            MaDocGia: docGia.MaDocGia,
            MaSach: maSach,
            TrangThai: { $in: ["ChoDuyet", "DangMuon"] }
        });
        if (alreadyBorrowingThisBook) {
            const err = new Error(`Bạn đã đăng ký hoặc đang mượn cuốn sách này rồi.`);
            err.statusCode = 400;
            throw err;
        }

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14); // 14 ngày

        const record = {
            MaDocGia: docGia.MaDocGia,
            MaSach: sach.MaSach,
            NgayMuon: today.toISOString().split("T")[0],
            NgayHenTra: dueDate.toISOString().split("T")[0],
            NgayTra: null,
            TrangThai: "ChoDuyet", // Chờ thủ thư duyệt
            TienPhat: 0,
            GhiChu: payload.GhiChu ? String(payload.GhiChu).trim() : "Độc giả đăng ký trực tuyến",
            CreatedAt: new Date(),
        };

        const result = await this.TheoDoi.insertOne(record);
        return await this.findById(result.insertedId);
    }

    async duyetMuon(id) {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "ChoDuyet") {
            throw new Error(`Chỉ có thể duyệt các phiếu ở trạng thái 'ChoDuyet'. Phiếu này hiện là '${record.TrangThai}'.`);
        }

        // Kiểm tra lại tồn kho sách
        const sach = await this.Sach.findOne({ MaSach: record.MaSach });
        if (!sach || sach.SoQuyen <= 0) {
            throw new Error(`Sách '${record.MaSach}' đã hết trong kho, không thể duyệt.`);
        }

        // Trừ 1 cuốn trong kho
        await this.Sach.updateOne({ MaSach: record.MaSach }, { $inc: { SoQuyen: -1 } });

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14);

        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "DangMuon",
                    NgayMuon: today.toISOString().split("T")[0],
                    NgayHenTra: dueDate.toISOString().split("T")[0],
                }
            },
            { returnDocument: "after" }
        );
        return result;
    }

    async tuChoi(id, lyDo = "Thủ thư từ chối yêu cầu") {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "ChoDuyet") {
            throw new Error(`Chỉ có thể từ chối các phiếu đang 'ChoDuyet'.`);
        }

        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "TuChoi",
                    GhiChu: lyDo,
                }
            },
            { returnDocument: "after" }
        );
        return result;
    }

    async xacNhanTra(id) {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "DangMuon") {
            throw new Error(`Chỉ có thể trả sách cho phiếu đang ở trạng thái 'DangMuon'. Phiếu này hiện là '${record.TrangThai}'.`);
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const isLate = record.NgayHenTra && todayStr > record.NgayHenTra;

        // Hoàn trả 1 cuốn về kho
        await this.Sach.updateOne({ MaSach: record.MaSach }, { $inc: { SoQuyen: 1 } });

        // Cập nhật phiếu mượn
        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "DaTra",
                    NgayTra: todayStr,
                    GhiChu: isLate ? "Trả trễ hạn" : "Đã trả đúng hạn",
                }
            },
            { returnDocument: "after" }
        );

        // Nếu trễ hạn -> tăng số lần vi phạm của độc giả
        if (isLate) {
            const docGia = await this.DocGia.findOne({ MaDocGia: record.MaDocGia });
            if (docGia) {
                const newViPham = (docGia.SoLanViPham || 0) + 1;
                const newStatus = newViPham >= 3 ? "Blacklist" : docGia.TrangThaiThe;
                await this.DocGia.updateOne(
                    { MaDocGia: record.MaDocGia },
                    { $set: { SoLanViPham: newViPham, TrangThaiThe: newStatus } }
                );
            }
        }

        return result;
    }

    async baoMat(id, ghiChu = "Độc giả báo mất sách") {
        const record = await this.findById(id);
        if (!record) {
            throw new Error("Không tìm thấy phiếu mượn.");
        }

        if (record.TrangThai !== "DangMuon") {
            throw new Error(`Chỉ có thể báo mất sách khi phiếu đang ở trạng thái 'DangMuon'.`);
        }

        // Lấy đơn giá sách để tính tiền bồi hoàn
        const sach = await this.Sach.findOne({ MaSach: record.MaSach });
        const tienPhat = sach ? sach.DonGia : 0;

        // KHÔNG hoàn trả tồn kho vì sách bị mất thật sự
        const result = await this.TheoDoi.findOneAndUpdate(
            { _id: record._id },
            {
                $set: {
                    TrangThai: "MatSach",
                    NgayTra: new Date().toISOString().split("T")[0],
                    TienPhat: tienPhat,
                    GhiChu: `${ghiChu} (Phạt bồi hoàn: ${tienPhat.toLocaleString("vi-VN")} ₫)`,
                }
            },
            { returnDocument: "after" }
        );

        // Tăng số lần vi phạm của độc giả
        const docGia = await this.DocGia.findOne({ MaDocGia: record.MaDocGia });
        if (docGia) {
            const newViPham = (docGia.SoLanViPham || 0) + 1;
            const newStatus = newViPham >= 3 ? "Blacklist" : docGia.TrangThaiThe;
            await this.DocGia.updateOne(
                { MaDocGia: record.MaDocGia },
                { $set: { SoLanViPham: newViPham, TrangThaiThe: newStatus } }
            );
        }

        return result;
    }

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

        // Sử dụng aggregation lookup để kèm thông tin chi tiết Sách và Độc giả
        const pipeline = [
            { $match: query },
            { $sort: { CreatedAt: -1, _id: -1 } },
            {
                $lookup: {
                    from: "sach",
                    localField: "MaSach",
                    foreignField: "MaSach",
                    as: "sachInfo"
                }
            },
            {
                $lookup: {
                    from: "docgia",
                    localField: "MaDocGia",
                    foreignField: "MaDocGia",
                    as: "docGiaInfo"
                }
            },
            {
                $unwind: {
                    path: "$sachInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$docGiaInfo",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        return await this.TheoDoi.aggregate(pipeline).toArray();
    }

    async findById(id) {
        if (!ObjectId.isValid(id)) {
            return null;
        }
        return await this.TheoDoi.findOne({ _id: new ObjectId(id) });
    }

    async delete(id) {
        if (!ObjectId.isValid(id)) return null;
        return await this.TheoDoi.findOneAndDelete({ _id: new ObjectId(id) });
    }
}

module.exports = TheoDoiMuonSachService;
