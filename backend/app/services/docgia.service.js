const { ObjectId } = require("mongodb");
const PasswordUtil = require("../utils/password.util");

//Các trường được phép lấy ra, không thể nào đưa mật khẩu qua api được
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
    AnhDaiDien: 1.
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
 * | `VaiTro`       | String       |            |            | Vai trò độc giả (USER)                      |
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
        if (payload.SoLanViPham !== undefined) data.SoLanViPham = Number(payload.SoLanViPham);
        if (payload.TrangThaiThe !== undefined) {
            const trangThaiThe = String(payload.TrangThaiThe).trim();
            if (!["HoatDong", "Khoa", "DanhSachDen"].includes(trangThaiThe)) {
                throw new Error("Trạng thái thẻ không hợp lệ. Chỉ chấp nhận HoatDong, Khoa hoặc DanhSachDen.");
            }
            data.TrangThaiThe = trangThaiThe;
        }
        if (payload.AnhDaiDien !== undefined) data.AnhDaiDien = String(payload.AnhDaiDien).trim();


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

    // Tìm kiếm độc giả có thể có bộ lọc - Completed
    async find(filter = {}) {
        const query = {};
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ Ten: regex }, { HoLot: regex }, { MaDocGia: regex }, { DienThoai: regex }];
        }
        if (filter.trangThai && filter.trangThai !== "all") {
            query.TrangThaiThe = filter.trangThai;
        }

        const cursor = await this.DocGia.find(query, { projection: publicFields }).sort({ CreatedAt: -1, _id: -1 });
        const list = await cursor.toArray();
        return list.map((reader) => ({ ...reader, VaiTro: "USER" }));
    }

    // Tìm kiếm hồ sơ độc giả theo mã, id hoặc số điện thoại, chưa sử dụng trong đồ án - Completed
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }, { DienThoai: id }] };
        } else {
            query = { $or: [{ MaDocGia: id }, { DienThoai: id }] };
        }

        const reader = await this.DocGia.findOne(query, { projection: publicFields });
        return reader ? { ...reader, VaiTro: "USER" } : null;
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

    // Cho phép cập nhật thông tin cá nhân, dùng được cho mã và object id - Completed
    async update(id, payload) {
        const editableFields = ["HoLot", "Ten", "NgaySinh", "Phai", "DiaChi", "DienThoai", "AnhDaiDien"];
        const editablePayload = Object.fromEntries(
            editableFields
                .filter((field) => payload[field] !== undefined)
                .map((field) => [field, payload[field]])
        );
        if (Object.keys(editablePayload).length === 0) {
            throw new Error("Không có thông tin cá nhân hợp lệ để cập nhật.");
        }
        const data = await this.extractData(editablePayload, false);

        data.UpdatedAt = new Date();

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const current = await this.DocGia.findOne(filter, { projection: { _id: 1, DienThoai: 1 } });
        if (!current) return null;

        if (data.HoLot !== undefined && !data.HoLot) {
            throw new Error("Họ và tên đệm không được để trống.");
        }
        if (data.Ten !== undefined && !data.Ten) {
            throw new Error("Tên không được để trống.");
        }
        if (data.DienThoai !== undefined) {
            const phoneRegex = /^(0[35789])([0-9]{8})$/;
            if (data.DienThoai !== current.DienThoai && !phoneRegex.test(data.DienThoai)) {
                throw new Error("Số điện thoại không đúng định dạng chuẩn.");
            }
            const existingPhone = await this.DocGia.findOne({
                DienThoai: data.DienThoai,
                _id: { $ne: current._id },
            });
            if (existingPhone) {
                throw new Error(`Số điện thoại '${data.DienThoai}' đã được sử dụng để đăng ký.`);
            }
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    // Hàm này xử lý id cho mã hay cho object id (Dùng chung) - Completed
    buildIdFilter(id) {
        if (ObjectId.isValid(id)) {
            return { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        }
        return { MaDocGia: id };
    }

    // Khóa người dùng - Completed
    async lock(id) {
        const filter = this.buildIdFilter(id);
        const current = await this.DocGia.findOne(filter, {
            projection: { _id: 1, TrangThaiThe: 1 } //Lấy 2 trường id và trạng thái thẻ thôi
        });
        if (!current) return null;
        if (current.TrangThaiThe !== "HoatDong") {
            throw new Error("Chỉ có thể khóa thẻ đang hoạt động. Thẻ Khoa và DanhSachDen cần xử lý riêng.");
        }

        const result = await this.DocGia.findOneAndUpdate(
            { _id: current._id, TrangThaiThe: "HoatDong" },
            { $set: { TrangThaiThe: "Khoa", UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    // Mở khóa thẻ - Completed
    async unblock(id) {
        const filter = this.buildIdFilter(id);
        const current = await this.DocGia.findOne(filter, {
            projection: { _id: 1, SoLanViPham: 1, TrangThaiThe: 1 }
        });
        if (!current) return null;
        if (current.TrangThaiThe !== "Khoa") {
            throw new Error("Chỉ mở khóa khẩn cấp cho thẻ đang ở trạng thái Khoa. DanhSachDen phải được xử lý riêng.");
        }

        const trangThaiThe = (current.SoLanViPham || 0) >= 3 ? "DanhSachDen" : "HoatDong";
        const result = await this.DocGia.findOneAndUpdate(
            { _id: current._id, TrangThaiThe: "Khoa" },
            { $set: { TrangThaiThe: trangThaiThe, UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    // Admin xét gỡ khỏi danh sách đen: reset bộ đếm vi phạm của chu kỳ mới.
    async reinstate(id) {
        const filter = this.buildIdFilter(id);
        const result = await this.DocGia.findOneAndUpdate(
            { ...filter, TrangThaiThe: "DanhSachDen" },
            { $set: { TrangThaiThe: "HoatDong", SoLanViPham: 0, UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    // Tăng số lần vi phạm, từ 3 trở lên thì đổi trạng thái thẻ thành "DanhSachDen" - Completed
    async incrementViPham(maDocGia) {
        const user = await this.DocGia.findOne({ MaDocGia: maDocGia });
        if (!user) return null;

        const newCount = (user.SoLanViPham || 0) + 1;
        const newStatus = newCount >= 3 ? "DanhSachDen" : user.TrangThaiThe;

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

    //Hàm xóa hồ sơ độc giả, ràng buộc không xóa khi còn phiếu mượn - Completed
    // Xóa có thể dùng cả mã độc giả hoặc object id
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
