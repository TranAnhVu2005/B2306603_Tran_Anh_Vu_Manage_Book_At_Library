const { ObjectId } = require("mongodb");

const publicFields = {
    _id: 1,
    MaSach: 1,
    TenSach: 1,
    DonGia: 1,
    SoQuyen: 1,
    NamXuatBan: 1,
    MaNXB: 1,
    TacGia: 1,
    HinhAnh: 1,
    MoTa: 1,
};

/**
 * =========================================================================================
 * SERVICE QUẢN LÝ KHO SÁCH (SACH SERVICE)
 * =========================================================================================
 * Căn cứ thiết kế Cơ sở dữ liệu Báo cáo CT449 (Mục 2.4, Trang 24-25):
 * - Collection: 'sach'
 * - Cấu trúc trường:
 *   + _id: ObjectId
 *   + MaSach: String (Mã định danh đầu sách, tự sinh SACH-000001)
 *   + TenSach: String (Tên tựa sách)
 *   + DonGia: Double (Đơn giá sách - Dùng tính tiền phạt nếu làm mất)
 *   + SoQuyen: Integer (Số lượng sách thực tế còn trong kho)
 *   + NamXuatBan: Integer (Năm xuất bản sách)
 *   + MaNXB: String (Tham chiếu đến nhaxuatban.MaNXB)
 *   + TacGia: String (Tên tác giả hoặc cơ quan biên soạn)
 *   + HinhAnh: String (Đường dẫn ảnh bìa sách)
 *   + MoTa: String (Tóm tắt nội dung sách)
 * =========================================================================================
 */
class SachService {
    constructor(client) {
        this.Sach = client.db().collection("sach");
        this.NhaXuatBan = client.db().collection("nhaxuatban");
        this.TheoDoi = client.db().collection("theodoimuonsach");
    }

    // Sinh mã sách tự động - Completed
    async generateMaSach() {
        const last = await this.Sach.find(
            { MaSach: { $regex: /^SACH-\d{6}$/ } },
            { projection: { MaSach: 1 } }
        ).sort({ MaSach: -1 }).limit(1).toArray();

        let nextNum = 1;
        if (last.length > 0) {
            const lastNum = parseInt(last[0].MaSach.replace("SACH-", ""), 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return `SACH-${String(nextNum).padStart(6, "0")}`;
    }

    // Chuẩn hóa dữ liệu đầu vào - Completed
    extractData(payload, isCreating = false) {
        const data = {};

        if (payload.TenSach !== undefined) data.TenSach = String(payload.TenSach).trim();
        if (payload.DonGia !== undefined) data.DonGia = Number(payload.DonGia);
        if (payload.SoQuyen !== undefined) data.SoQuyen = parseInt(payload.SoQuyen, 10);
        if (payload.NamXuatBan !== undefined) data.NamXuatBan = parseInt(payload.NamXuatBan, 10);
        if (payload.MaNXB !== undefined) data.MaNXB = String(payload.MaNXB).trim();
        if (payload.TacGia !== undefined) data.TacGia = String(payload.TacGia).trim();
        if (payload.HinhAnh !== undefined) data.HinhAnh = String(payload.HinhAnh).trim();
        if (payload.MoTa !== undefined) data.MoTa = String(payload.MoTa).trim();
        if (payload.NguonGoc !== undefined) data.NguonGoc = String(payload.NguonGoc).trim();

        if (isCreating) {
            if (data.HinhAnh === undefined) data.HinhAnh = "";
            if (data.MoTa === undefined) data.MoTa = "";
            if (data.NguonGoc === undefined) {
                data.NguonGoc = payload.NguonGoc ? String(payload.NguonGoc).trim() : "Không rõ";
            }
            if (payload.NamXuatBan !== undefined) {
                // Nếu người dùng để trống hoặc truyền giá trị rỗng, gán là "Không rõ"
                data.NamXuatBan = payload.NamXuatBan ? String(payload.NamXuatBan).trim() : "Không rõ";
            }
        }
        return data;
    }

    // Thêm sách mới - Completed
    async create(payload) {
        const data = this.extractData(payload, true);

        if (!data.TenSach || data.DonGia === undefined || data.SoQuyen === undefined || !data.MaNXB || !data.TacGia) {
            throw new Error("Vui lòng điền đầy đủ các thông tin: Tên sách, Đơn giá, Số quyển, Mã NXB và Tác giả.");
        }

        if (isNaN(data.DonGia) || data.DonGia < 0) {
            throw new Error("Đơn giá sách phải là số dương hoặc bằng 0.");
        }

        if (isNaN(data.SoQuyen) || data.SoQuyen < 0) {
            throw new Error("Số lượng sách tồn kho phải là số nguyên không âm (>= 0).");
        }

        // Kiểm tra tồn tại Nhà xuất bản
        const nxb = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
        if (!nxb) {
            throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' không tồn tại trong hệ thống.`);
        }

        data.MaSach = await this.generateMaSach();
        data.CreatedAt = new Date();
        data.UpdatedAt = new Date();

        const result = await this.Sach.insertOne(data);
        return await this.findById(result.insertedId);
    }

    // Tìm kiếm sách, bộ lọc và sắp xếp - Completed
    async find(filter = {}) {
        const query = {};
        if (filter.tenSach) {
            query.TenSach = { $regex: new RegExp(filter.tenSach, "i") };
        }
        if (filter.tacGia) {
            query.TacGia = { $regex: new RegExp(filter.tacGia, "i") };
        }
        if (filter.maNxb && filter.maNxb !== "all") {
            query.MaNXB = filter.maNxb;
        }
        if (filter.availableOnly === "true" || filter.availableOnly === true) {
            query.SoQuyen = { $gt: 0 };
        }
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ TenSach: regex }, { TacGia: regex }, { MaSach: regex }];
        }

        const cursor = await this.Sach.find(query, { projection: publicFields }).sort({ CreatedAt: -1, _id: -1 });
        return await cursor.toArray();
    }

    // Lấy chi tiết 1 quyển sách - Completed
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            query = { MaSach: id };
        }
        return await this.Sach.findOne(query, { projection: publicFields });
    }

    // Cập nhật thông tin sách - Completed
    async update(id, payload) {
        const data = this.extractData(payload, false);
        delete data.MaSach; // Không sửa MaSach

        if (data.DonGia !== undefined && (isNaN(data.DonGia) || data.DonGia < 0)) {
            throw new Error("Đơn giá không được âm.");
        }
        if (data.SoQuyen !== undefined && (isNaN(data.SoQuyen) || data.SoQuyen < 0)) {
            throw new Error("Số quyển tồn kho không được âm.");
        }

        if (data.MaNXB) {
            const nxb = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
            if (!nxb) {
                throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' không tồn tại.`);
            }
        }

        data.UpdatedAt = new Date();

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            filter = { MaSach: id };
        }

        const result = await this.Sach.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    // Xóa sách có ràng buộc không xóa nếu sách đang có người mượn - Completed
    async delete(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            filter = { MaSach: id };
        }

        const current = await this.Sach.findOne(filter);
        if (!current) return null;

        // Ràng buộc toàn vẹn: Không xóa nếu sách đang có người mượn hoặc chờ duyệt
        const borrowingCount = await this.TheoDoi.countDocuments({
            MaSach: current.MaSach,
            TrangThai: { $in: ["DangMuon", "ChoDuyet"] }
        });

        if (borrowingCount > 0) {
            throw new Error(`Không thể xóa cuốn sách '${current.TenSach}' vì đang có ${borrowingCount} phiếu mượn dở dang.`);
        }

        const result = await this.Sach.findOneAndDelete({ _id: current._id });
        return result;
    }

    // Cập nhật số quyển - Completed !!! Chưa được gọi ở bất kỳ đâu
    async changeSoQuyen(maSach, soLuong) {
        return await this.Sach.findOneAndUpdate(
            { MaSach: maSach },
            { $inc: { SoQuyen: soLuong }, $set: { UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
    }
}

module.exports = SachService;
