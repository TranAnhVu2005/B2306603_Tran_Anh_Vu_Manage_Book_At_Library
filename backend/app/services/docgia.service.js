const { ObjectId } = require("mongodb");
const PasswordUtil = require("../utils/password.util");

const publicFields = {
    _id: 1,
    MaDocGia: 1,
    HoLot: 1,
    Ten: 1,
    NgaySinh: 1,
    Phai: 1,
    DiaChi: 1,
    DienThoai: 1,
    VaiTro: 1,
    SoLanViPham: 1,
    TrangThaiThe: 1,
};

/**
 * =========================================================================================
 * SCHEMA MÔ TẢ DỮ LIỆU: ĐỘC GIẢ (DOCGIA COLLECTION)
 * =========================================================================================
 * | Thuộc tính     | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả                                       |
 * | :--------------| :----------- | :--------: | :--------: | :------------------------------------------ |
 * | `_id`          | ObjectId     |     x      |            | Định danh duy nhất tự sinh bởi MongoDB      |
 * | `MaDocGia`     | String       |            |            | Mã số định danh độc giả                     |
 * | `HoLot`        | String       |            |            | Họ và tên đệm của độc giả                   |
 * | `Ten`          | String       |            |            | Tên của độc giả                             |
 * | `NgaySinh`     | Date         |            |            | Ngày tháng năm sinh                         |
 * | `Phai`         | Integer      |            |            | Giới tính (Nam / Nữ)                        |
 * | `DiaChi`       | String       |            |            | Địa chỉ cư trú của độc giả                  |
 * | `DienThoai`    | String       |            |            | Số điện thoại liên hệ (Dùng để đăng nhập)   |
 * | `MatKhau`      | String       |            |            | Mật khẩu tài khoản (Đã mã hóa an toàn)      |
 * | `VaiTro`       | String       |            |            | Vai trò người dùng (USER, MANAGER, ADMIN)   |
 * | `SoLanViPham`  | Number       |            |            | Số lần vi phạm nội quy (trả trễ, mất sách)  |
 * | `TrangThaiThe` | String       |            |            | Trạng thái thẻ (HoatDong, Khoa, DanhSachDen)|
 * =========================================================================================
 */
class DocGiaService {

    //Trong service này có cả bảng docgia và theodoimuonsach - Completed
    constructor(client) {
        this.DocGia = client.db().collection("docgia");
        this.TheoDoi = client.db().collection("theodoimuonsach");
    }

    // Tự động tạo ra mã độc giả khi create, số thứ tự sẽ tăng lên - Completed
    async generateMaDocGia() {
        const last = await this.DocGia.find(
            { MaDocGia: { $regex: /^DG-\d{6}$/ } }, //Đúng mẫu
            { projection: { MaDocGia: 1 } } //Chỉ 1 trường, tăng tốc truy vấn
        ).sort({ MaDocGia: -1 }).limit(1).toArray(); //Sắp xếp ngược

        let nextNum = 1; //Mặc định không có last thì là số 1
        if (last.length > 0) {
            const lastNum = parseInt(last[0].MaDocGia.replace("DG-", ""), 10); //Bỏ DG-, chuyển về số
            if (!isNaN(lastNum)) { //Bắt buộc là số
                nextNum = lastNum + 1;
            }
        }
        return `DG-${String(nextNum).padStart(6, "0")}`; //Thêm padding cho đủ theo mẫu
    }

    // Chuẩn hóa giới tính: 1 - Nam, 0 - Nữ, 2 - Khác - Completed
    // Chuẩn hóa + xử lý thêm nếu 1 thằng nào đó dùng postman nhập giới tính = 99 lên thì nổ cơ sở dữ liệu à! :<<
    normalizePhai(val) {
        if (val === undefined || val === null) return 1; // Mặc định Nam

        // Ép mọi thứ về chuỗi, loại bỏ khoảng trắng và chuyển về chữ thường
        const str = String(val).trim().toLowerCase();

        if (str === "nam" || str === "1") return 1;
        if (str === "nữ" || str === "nu" || str === "0") return 0;
        if (str === "khac" || str === "khác" || str === "2") return 2;

        // Nếu gửi lên một giá trị linh tinh khác, bạn có thể quăng lỗi hoặc trả về mặc định
        throw new Error("Giới tính không hợp lệ (chỉ chấp nhận Nam/Nữ/Khác.");
    }

    // Lọc và chuẩn hóa dữ liệu đầu vào - Completed
    async extractData(payload, isCreating = false) {
        const data = {};
        if (payload.HoLot !== undefined) data.HoLot = String(payload.HoLot).trim();
        if (payload.Ten !== undefined) data.Ten = String(payload.Ten).trim();
        if (payload.NgaySinh !== undefined) data.NgaySinh = String(payload.NgaySinh).trim();
        if (payload.Phai !== undefined) data.Phai = this.normalizePhai(payload.Phai);
        if (payload.DiaChi !== undefined) data.DiaChi = String(payload.DiaChi).trim();
        if (payload.DienThoai !== undefined) data.DienThoai = String(payload.DienThoai).trim();
        if (payload.VaiTro !== undefined) data.VaiTro = String(payload.VaiTro).trim();
        if (payload.SoLanViPham !== undefined) data.SoLanViPham = Number(payload.SoLanViPham);
        if (payload.TrangThaiThe !== undefined) data.TrangThaiThe = String(payload.TrangThaiThe).trim();

        // Xử lý mật khẩu
        const rawPassword = payload.MatKhau;
        if (rawPassword) {
            data.MatKhau = await PasswordUtil.hash(rawPassword);
        }

        // Giá trị mặc định khi tạo mới
        if (isCreating) {
            if (data.Phai === undefined) data.Phai = 1;
            if (data.VaiTro === undefined) data.VaiTro = "USER";
            if (data.SoLanViPham === undefined) data.SoLanViPham = 0;
            if (data.TrangThaiThe === undefined) data.TrangThaiThe = "HoatDong";
            if (data.DiaChi === undefined) data.DiaChi = "";
        }
        return data;
    }

    // Đăng ký thẻ bạn đọc - Completed
    async create(payload) {
        const data = await this.extractData(payload, true);
        if (!data.HoLot || !data.Ten || !data.DienThoai || !data.MatKhau) {
            throw new Error("Vui lòng điền đầy đủ các thông tin bắt buộc: Họ lót, Tên, Số điện thoại và Mật khẩu.");
        }

        // Kiểm tra định dạng số điện thoại và không phải đăng nhập bằng google
        const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
        if (!phoneRegex.test(data.DienThoai) && !data.DienThoai.startsWith("GG_")) {
            throw new Error("Số điện thoại không đúng định dạng chuẩn và không phải đăng nhập bằng Google.");
        }

        // Kiểm tra trùng số điện thoại
        const existingPhone = await this.DocGia.findOne({ DienThoai: data.DienThoai });
        if (existingPhone) {
            throw new Error(`Số điện thoại '${data.DienThoai}' đã được sử dụng để đăng ký.`);
        }

        // Tự động sinh mã độc giả
        data.MaDocGia = await this.generateMaDocGia();


        data.CreatedAt = new Date();
        data.UpdatedAt = new Date();

        const result = await this.DocGia.insertOne(data);

        //Trả về dữ liệu vừa thêm mới
        return await this.findById(result.insertedId);
    }

    /**
     * Tìm kiếm và lọc danh sách độc giả (hỗ trợ Super Admin và Thủ thư)
     */
    async find(filter = {}) {
        const query = {};
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ Ten: regex }, { HoLot: regex }, { MaDocGia: regex }, { DienThoai: regex }];
        }
        if (filter.trangThai && filter.trangThai !== "all") {
            query.TrangThaiThe = filter.trangThai;
        }
        if (filter.role && filter.role !== "all") {
            query.VaiTro = filter.role;
        }

        const cursor = await this.DocGia.find(query, { projection: publicFields }).sort({ CreatedAt: -1, _id: -1 });
        const list = await cursor.toArray();

        return list;
    }

    /**
     * Tìm kiếm hồ sơ độc giả theo ID, MaDocGia hoặc DienThoai
     */
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }, { DienThoai: id }] };
        } else {
            query = { $or: [{ MaDocGia: id }, { DienThoai: id }] };
        }

        return await this.DocGia.findOne(query, { projection: publicFields });
    }

    //Đăng nhập của độc giả - Completed
    async login(identifier, password) {
        const accountIdentifier = String(identifier || "").trim();
        const user = await this.DocGia.findOne({
            $or: [{ DienThoai: accountIdentifier }, { MaDocGia: accountIdentifier }]
        });

        if (!user) return null; // Không thấy user :<<, trả về null thôi

        // Xác thực mật khẩu thông qua Bcrypt
        const passwordHash = user.MatKhau;
        const isValid = await PasswordUtil.compare(password, passwordHash);
        if (!isValid) return null;
        return user;
    }

    /**
     * Cập nhật thông tin hồ sơ độc giả
     */
    async update(id, payload) {
        const data = await this.extractData(payload, false);
        delete data.MaDocGia; // Không cho phép đổi mã định danh
        delete data.VaiTro;   // Không cập nhật quyền qua hàm thông thường

        data.UpdatedAt = new Date();

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    /**
     * Quản trị viên thay đổi vai trò (USER <-> MANAGER <-> ADMIN)
     */
    async updateRole(id, newRole) {
        if (!["USER", "MANAGER", "ADMIN"].includes(newRole)) {
            throw new Error("Vai trò không hợp lệ. Chỉ chấp nhận USER, MANAGER hoặc ADMIN.");
        }

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            { $set: { VaiTro: newRole, UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    /**
     * Mở khóa thẻ và reset số lần vi phạm về 0 cho độc giả bị Blacklist
     */
    async unblock(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            {
                $set: {
                    TrangThaiThe: "HoatDong",
                    SoLanViPham: 0,
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        return result ? this.findById(id) : null;
    }

    /**
     * Tăng số lần vi phạm và tự động khóa thẻ Blacklist nếu đạt ngưỡng 3 lần
     */
    async incrementViPham(maDocGia) {
        const user = await this.DocGia.findOne({ MaDocGia: maDocGia });
        if (!user) return null;

        const newCount = (user.SoLanViPham || 0) + 1;
        const newStatus = newCount >= 3 ? "Blacklist" : user.TrangThaiThe;

        const result = await this.DocGia.findOneAndUpdate(
            { MaDocGia: maDocGia },
            {
                $set: {
                    SoLanViPham: newCount,
                    TrangThaiThe: newStatus,
                    UpdatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        return result;
    }

    /**
     * Xóa hồ sơ độc giả (Kiểm tra ràng buộc: không xóa khi còn phiếu mượn dở dang)
     */
    async delete(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const current = await this.DocGia.findOne(filter);
        if (!current) {
            return null;
        }

        // Ràng buộc toàn vẹn: Không được xóa nếu còn đơn mượn đang xử lý hoặc đang mượn
        const activeBorrows = await this.TheoDoi.countDocuments({
            MaDocGia: current.MaDocGia,
            TrangThai: { $in: ["DangMuon", "ChoDuyet"] }
        });

        if (activeBorrows > 0) {
            throw new Error(`Không thể xóa độc giả '${current.MaDocGia}' vì đang có ${activeBorrows} phiếu mượn chưa hoàn tất.`);
        }

        const result = await this.DocGia.findOneAndDelete({ _id: current._id });
        return result;
    }
}

module.exports = DocGiaService;
