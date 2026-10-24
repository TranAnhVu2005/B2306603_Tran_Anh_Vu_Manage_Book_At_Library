const http = require("http");
const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");
const JwtUtil = require("./app/utils/jwt.util");
const DocGiaService = require("./app/services/docgia.service");
const NhanVienService = require("./app/services/nhanvien.service");
const ThongBaoService = require("./app/services/thongbao.service");

let server = null;

function hasOnlyFields(value, allowedFields) {
    return value && Object.keys(value).every(field => allowedFields.includes(field));
}

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const dataString = body ? JSON.stringify(body) : null;
        const options = {
            hostname: "127.0.0.1",
            port: config.app.port,
            path: path,
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            }
        };
        if (dataString) {
            options.headers["Content-Length"] = Buffer.byteLength(dataString);
        }

        const req = http.request(options, (res) => {
            let resBody = "";
            res.on("data", chunk => resBody += chunk);
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resBody);
                } catch (e) {
                    parsed = resBody;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", err => reject(err));
        if (dataString) {
            req.write(dataString);
        }
        req.end();
    });
}

async function runTests() {
    console.log("=========================================================================");
    console.log("BẮT ĐẦU CHẠY BỘ KIỂM THỬ BACKEND API TOÀN DIỆN (docs/06_TESTING.md)");
    console.log("=========================================================================\n");

    // Khởi động kết nối MongoDB và máy chủ kiểm thử nếu chưa chạy
    await MongoDB.connect(config.db.uri);
    server = await new Promise((resolve) => {
        const s = app.listen(config.app.port, () => resolve(s));
    });

    let passed = 0;
    let failed = 0;
    let temporaryReaderId = null;
    let temporaryReaderObjectId = null;
    let temporaryReaderPhone = null;
    let temporaryReaderToken = null;
    let temporaryStaffId = null;
    let createdNotificationStaffId = null;
    let temporaryStaffCode = null;
    let temporaryStaffPhone = null;
    let temporaryStaffToken = null;
    let temporaryAdminId = null;
    let temporaryAdminPhone = null;
    let temporaryAdminToken = null;
    let temporaryNotificationId = null;
    let testBookCode = null;
    let zeroStockBookCode = null;

    async function assert(name, fn) {
        try {
            await fn();
            console.log(`✅ [PASSED] ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ [FAILED] ${name}: ${err.message}`);
            failed++;
        }
    }

    // TC-AUTH-01: Đăng nhập nhân viên thành công
    await assert("TC-AUTH-01: Đăng nhập nhân viên thành công", async () => {
        const staff = await new NhanVienService(MongoDB.client).create({
            HoTenNV: "Nhân viên kiểm thử",
            ChucVu: "THUTHU",
            SoDienThoai: `09${String(Date.now()).slice(-8)}`,
            MatKhau: "staff_test_password"
        });
        temporaryStaffId = String(staff._id);
        temporaryStaffCode = staff.MSNV;
        temporaryStaffPhone = staff.SoDienThoai;

        const res = await request("POST", "/api/auth/login", { identifier: temporaryStaffPhone, password: "staff_test_password" });
        temporaryStaffToken = res.data.token;
        if (
            res.status !== 200 ||
            res.data.data.ChucVu !== "THUTHU" ||
            !hasOnlyFields(res.data.data, ["_id", "MSNV", "HoTenNV", "ChucVu", "SoDienThoai", "DiaChi"])
        ) {
            throw new Error(`Kỳ vọng HTTP 200, chỉ trả trường ChucVu theo lược đồ nhân viên, nhận status=${res.status}`);
        }
        const codeLogin = await request("POST", "/api/auth/login", { identifier: temporaryStaffCode, password: "staff_test_password" });
        if (codeLogin.status !== 401) throw new Error("Đăng nhập nhân viên bằng mã MSNV vẫn được chấp nhận.");
    });

    // TC-AUTH-02: Đăng nhập sai mật khẩu bị chặn
    await assert("TC-AUTH-02: Đăng nhập sai mật khẩu (Báo lỗi 401)", async () => {
        const res = await request("POST", "/api/auth/login", { identifier: temporaryStaffPhone, password: "wrong_password" });
        if (res.status !== 401) {
            throw new Error(`Kỳ vọng HTTP 401, nhận status=${res.status}`);
        }
    });

    // TC-AUTH-03: Đăng nhập Độc giả bằng số điện thoại
    await assert("TC-AUTH-03: Độc giả đăng nhập bằng SĐT", async () => {
        const reader = await new DocGiaService(MongoDB.client).create({
            HoLot: "Kiểm thử",
            Ten: "Đăng nhập",
            NgaySinh: "2000-01-01",
            Phai: 1,
            DienThoai: `09${String(Date.now()).slice(-8)}`,
            MatKhau: "reader_test_password"
        });
        temporaryReaderId = reader.MaDocGia;
        temporaryReaderPhone = reader.DienThoai;

        const res = await request("POST", "/api/auth/login", {
            identifier: reader.DienThoai,
            password: "reader_test_password"
        });
        if (
            res.status !== 200 ||
            res.data.data.MaDocGia !== temporaryReaderId ||
            res.data.data.VaiTro !== "USER" ||
            !hasOnlyFields(res.data.data, ["_id", "MaDocGia", "HoLot", "Ten", "NgaySinh", "Phai", "DiaChi", "DienThoai", "VaiTro", "SoLanViPham", "TrangThaiThe"])
        ) {
            throw new Error(`Kỳ vọng HTTP 200, MaDocGia và VaiTro USER, nhận status=${res.status}`);
        }
        temporaryReaderObjectId = res.data.data._id;
        temporaryReaderToken = res.data.token;
    });

    await assert("TC-NOTIFICATION-01: Người dùng chỉ xem và đánh dấu đã đọc thông báo của chính mình", async () => {
        const notifications = new ThongBaoService(MongoDB.client);
        const created = await notifications.create({
            recipientId: temporaryReaderObjectId,
            recipientType: "docgia",
            type: "KIEM_THU",
            title: "Thông báo kiểm thử",
            message: "Nội dung dành riêng cho độc giả kiểm thử.",
        });
        temporaryNotificationId = String(created._id);
        const unauthorized = await request("GET", "/api/thongbao");
        const own = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        const staff = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryStaffToken}` });
        const otherRecipient = await request("PUT", `/api/thongbao/${temporaryNotificationId}/read`, null, { Authorization: `Bearer ${temporaryStaffToken}` });
        const markOwn = await request("PUT", `/api/thongbao/${temporaryNotificationId}/read`, null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (
            unauthorized.status !== 401 ||
            own.status !== 200 || own.data.unreadCount < 1 || !own.data.data.some((item) => item._id === temporaryNotificationId) ||
            staff.status !== 200 || staff.data.data.some((item) => item._id === temporaryNotificationId) ||
            otherRecipient.status !== 404 || markOwn.status !== 200
        ) {
            throw new Error(`Sai quyền/dữ liệu thông báo: GET unauth=${unauthorized.status}, reader=${own.status}, staff=${staff.status}, read other=${otherRecipient.status}, read own=${markOwn.status}`);
        }
        const allRead = await request("PUT", "/api/thongbao/read-all", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        const afterReadAll = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (allRead.status !== 200 || afterReadAll.status !== 200 || afterReadAll.data.unreadCount !== 0) {
            throw new Error(`Không đánh dấu được toàn bộ thông báo, nhận HTTP ${allRead.status}`);
        }
    });

    await assert("TC-STATUS-01: Từ chối trạng thái thẻ không chuẩn", async () => {
        const res = await request("POST", "/api/auth/register", {
            HoLot: "Kiểm thử",
            Ten: "Trạng thái",
            NgaySinh: "2000-01-01",
            Phai: 1,
            DienThoai: `09${String(Date.now() + 5000).slice(-8)}`,
            MatKhau: "reader_test_password",
            TrangThaiThe: "Blacklist"
        });
        if (res.status !== 400) {
            throw new Error(`Kỳ vọng HTTP 400 khi gửi trạng thái thẻ không hợp lệ, nhận status=${res.status}`);
        }
    });

    // TC-PROFILE-01: Chỉ chủ hồ sơ đã đăng nhập được cập nhật thông tin cá nhân
    await assert("TC-PROFILE-01: Độc giả cập nhật hồ sơ của chính mình", async () => {
        const unauthorized = await request(
            "PUT",
            `/api/docgia/${temporaryReaderObjectId}`,
            { HoLot: "Không được phép" }
        );
        if (unauthorized.status !== 401) {
            throw new Error(`Kỳ vọng HTTP 401 khi thiếu token, nhận status=${unauthorized.status}`);
        }

        const staffUpdate = await request(
            "PUT",
            `/api/docgia/${temporaryReaderObjectId}`,
            { HoLot: "Không được phép" },
            { Authorization: `Bearer ${temporaryStaffToken}` }
        );
        if (staffUpdate.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 403 khi nhân viên sửa hồ sơ độc giả, nhận status=${staffUpdate.status}`);
        }

        const blockedUpdate = await request(
            "PUT",
            `/api/docgia/${temporaryReaderObjectId}`,
            {
                HoLot: "Hồ sơ",
                Ten: "Đã cập nhật",
                DienThoai: temporaryReaderPhone,
                Phai: 0,
                DiaChi: "Cần Thơ",
                VaiTro: "ADMIN",
                SoLanViPham: 99,
                TrangThaiThe: "DanhSachDen",
                MatKhau: "attacker_password"
            },
            { Authorization: `Bearer ${temporaryReaderToken}` }
        );
        if (blockedUpdate.status !== 400) {
            throw new Error(`Kỳ vọng từ chối trường hồ sơ bị cấm, nhận status=${blockedUpdate.status}`);
        }
        const updated = await request(
            "PUT",
            `/api/docgia/${temporaryReaderObjectId}`,
            { HoLot: "Hồ sơ", Ten: "Đã cập nhật", DienThoai: temporaryReaderPhone, Phai: 0, DiaChi: "Cần Thơ" },
            { Authorization: `Bearer ${temporaryReaderToken}` }
        );
        if (
            updated.status !== 200 ||
            updated.data.data.HoLot !== "Hồ sơ" ||
            updated.data.data.Ten !== "Đã cập nhật" ||
            updated.data.data.Phai !== 0 ||
            updated.data.data.DiaChi !== "Cần Thơ" ||
            updated.data.data.VaiTro !== "USER" ||
            updated.data.data.SoLanViPham !== 0 ||
            updated.data.data.TrangThaiThe !== "HoatDong" ||
            Object.prototype.hasOwnProperty.call(updated.data.data, "MatKhau")
        ) {
            throw new Error(`Kỳ vọng chỉ cập nhật trường cá nhân, nhận status=${updated.status}`);
        }

        const oldPasswordLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryReaderPhone,
            password: "reader_test_password"
        });
        const injectedPasswordLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryReaderPhone,
            password: "attacker_password"
        });
        if (oldPasswordLogin.status !== 200 || injectedPasswordLogin.status !== 401) {
            throw new Error("Thông tin mật khẩu bị thay đổi ngoài ý muốn khi cập nhật hồ sơ.");
        }
    });

    // TC-PROFILE-02: Nhân viên và Admin chỉ có thể cập nhật thông tin cá nhân của mình
    await assert("TC-PROFILE-02: Admin cập nhật hồ sơ nhân viên của chính mình", async () => {
        const admin = await new NhanVienService(MongoDB.client).create({
            HoTenNV: "Quản trị kiểm thử",
            ChucVu: "ADMIN",
            SoDienThoai: `08${String(Date.now() + 1000).slice(-8)}`,
            MatKhau: "admin_test_password"
        });
        temporaryAdminId = admin.MSNV;
        temporaryAdminPhone = admin.SoDienThoai;

        const login = await request("POST", "/api/auth/login", {
            identifier: temporaryAdminPhone,
            password: "admin_test_password"
        });
        const adminToken = login.data?.token;
        const adminObjectId = login.data?.data?._id;
        if (login.status !== 200 || !adminToken || !adminObjectId) {
            throw new Error(`Không đăng nhập được Admin kiểm thử, nhận status=${login.status}`);
        }
        temporaryAdminToken = adminToken;

        const missingStaffPhone = await request("POST", "/api/nhanvien", {
            HoTenNV: "Thiếu điện thoại", ChucVu: "THUTHU", MatKhau: "test_password",
        }, { Authorization: `Bearer ${temporaryAdminToken}` });
        const duplicateStaffPhone = await request("POST", "/api/nhanvien", {
            HoTenNV: "Trùng điện thoại", ChucVu: "THUTHU", SoDienThoai: temporaryStaffPhone, MatKhau: "test_password",
        }, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (missingStaffPhone.status !== 400 || duplicateStaffPhone.status !== 400) {
            throw new Error(`Kỳ vọng từ chối thiếu/trùng số điện thoại nhân viên, nhận ${missingStaffPhone.status}/${duplicateStaffPhone.status}`);
        }

        const createdStaff = await request("POST", "/api/nhanvien", {
            HoTenNV: "Nhân viên nhận thông báo",
            ChucVu: "THUTHU",
            SoDienThoai: `07${String(Date.now() + 2000).slice(-8)}`,
            MatKhau: "notification_staff_password",
        }, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (createdStaff.status !== 201 || !createdStaff.data.data?._id) {
            throw new Error(`Admin không tạo được nhân viên kiểm thử, nhận status=${createdStaff.status}`);
        }
        createdNotificationStaffId = createdStaff.data.data._id;
        const createdStaffToken = JwtUtil.sign({
            id: createdNotificationStaffId,
            username: createdStaff.data.data.MSNV,
            role: "MANAGER",
            type: "staff",
        });
        const createdStaffInbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${createdStaffToken}` });
        if (createdStaffInbox.status !== 200 || !createdStaffInbox.data.data.some((item) => item.LoaiThongBao === "TAO_TAI_KHOAN_NHAN_VIEN")) {
            throw new Error("Nhân viên mới không nhận được thông báo tạo tài khoản.");
        }

        const unauthorized = await request(
            "PUT",
            `/api/nhanvien/${adminObjectId}`,
            { HoTenNV: "Không được phép" }
        );
        if (unauthorized.status !== 401) {
            throw new Error(`Kỳ vọng HTTP 401 khi thiếu token, nhận status=${unauthorized.status}`);
        }

        const otherProfile = await request(
            "PUT",
            `/api/nhanvien/${adminObjectId}`,
            { HoTenNV: "Không được phép" },
            { Authorization: `Bearer ${temporaryStaffToken}` }
        );
        if (otherProfile.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 403 khi nhân viên sửa hồ sơ Admin, nhận status=${otherProfile.status}`);
        }

        const updated = await request(
            "PUT",
            `/api/nhanvien/${adminObjectId}`,
            {
                HoTenNV: "Quản trị đã cập nhật",
                SoDienThoai: temporaryAdminPhone,
                DiaChi: "Cần Thơ",
                ChucVu: "THUTHU",
                MatKhau: "attacker_password"
            },
            { Authorization: `Bearer ${adminToken}` }
        );
        if (
            updated.status !== 400 ||
            updated.data.message !== "Request chứa trường không được phép."
        ) {
            throw new Error(`Kỳ vọng từ chối trường hồ sơ bị cấm, nhận status=${updated.status}`);
        }
        const permittedUpdate = await request(
            "PUT",
            `/api/nhanvien/${adminObjectId}`,
            { HoTenNV: "Quản trị đã cập nhật", SoDienThoai: temporaryAdminPhone, DiaChi: "Cần Thơ" },
            { Authorization: `Bearer ${adminToken}` }
        );
        if (
            permittedUpdate.status !== 200 ||
            permittedUpdate.data.data.HoTenNV !== "Quản trị đã cập nhật" ||
            permittedUpdate.data.data.SoDienThoai !== temporaryAdminPhone ||
            permittedUpdate.data.data.DiaChi !== "Cần Thơ" ||
            permittedUpdate.data.data.ChucVu !== "ADMIN" ||
            Object.prototype.hasOwnProperty.call(permittedUpdate.data.data, "MatKhau")
        ) {
            throw new Error(`Kỳ vọng chỉ cập nhật trường cá nhân, nhận status=${permittedUpdate.status}`);
        }

        const originalPasswordLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryAdminPhone,
            password: "admin_test_password"
        });
        const injectedPasswordLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryAdminPhone,
            password: "attacker_password"
        });
        if (originalPasswordLogin.status !== 200 || injectedPasswordLogin.status !== 401) {
            throw new Error("Mật khẩu Admin bị thay đổi ngoài ý muốn khi cập nhật hồ sơ.");
        }
    });

    // TC-AUTH-04: Từ chối Google ID Token không hợp lệ
    await assert("TC-AUTH-04: Từ chối Google ID Token không hợp lệ", async () => {
        const res = await request("POST", "/api/auth/google", { idToken: "sample_mock_google_id_token" });
        if (res.status !== 401) {
            throw new Error(`Kỳ vọng HTTP 401 với Google ID Token không hợp lệ, nhận status=${res.status}`);
        }
    });

    // TC-BOOK-01: Thêm sách mới hợp lệ
    await assert("TC-BOOK-01: Thêm sách mới hợp lệ", async () => {
        const newBook = {
            TenSach: "Giáo Trình Kiểm Thử Tự Động Web",
            DonGia: 95000,
            SoQuyen: 10,
            NamXuatBan: 2024,
            MaNXB: "NXB-0001",
            TacGia: "Nhóm Tester CTU",
            MoTa: "Tài liệu phục vụ kiểm thử hệ thống"
        };
        const res = await request("POST", "/api/sach", newBook, { Authorization: `Bearer ${temporaryStaffToken}` });
        testBookCode = res.data?.data?.MaSach;
        if (
            res.status !== 201 ||
            !testBookCode ||
            !hasOnlyFields(res.data.data, ["_id", "MaSach", "TenSach", "DonGia", "SoQuyen", "NamXuatBan", "MaNXB", "TacGia", "HinhAnh", "MoTa"])
        ) {
            throw new Error(`Kỳ vọng HTTP 201, nhận status=${res.status}`);
        }

        const publisher = await request("GET", "/api/nhaxuatban/NXB-0001");
        if (
            publisher.status !== 200 ||
            !hasOnlyFields(publisher.data, ["_id", "MaNXB", "TENNXB", "DiaChi"])
        ) {
            throw new Error(`Kỳ vọng response nhà xuất bản chỉ gồm trường trong CDM, nhận status=${publisher.status}`);
        }
    });

    await assert("TC-AUDIT-01: Nhật ký kiểm toán dùng collection và trường tiếng Việt, chỉ Admin được đọc", async () => {
        const denied = await request("GET", `/api/nhatkykiemtoan?MaSach=${encodeURIComponent(testBookCode)}`, null, {
            Authorization: `Bearer ${temporaryStaffToken}`,
        });
        const result = await request("GET", `/api/nhatkykiemtoan?MaSach=${encodeURIComponent(testBookCode)}`, null, {
            Authorization: `Bearer ${temporaryAdminToken}`,
        });
        const entry = result.data?.items?.find((item) => item.HanhDong === "SACH_TAO");
        if (denied.status !== 403 || result.status !== 200 || !entry
            || entry.LoaiDoiTuong !== "sach" || entry.MaSach !== testBookCode
            || !entry.ThoiGian || Object.prototype.hasOwnProperty.call(entry, "Action")) {
            throw new Error(`Kỳ vọng Admin đọc được log schema tiếng Việt và nhân viên bị từ chối; nhận staff=${denied.status}, admin=${result.status}`);
        }
    });

    await assert("Fixture sách hết kho cho TC-BORROW-02", async () => {
        const res = await request("POST", "/api/sach", {
            TenSach: "Sách kiểm thử hết kho",
            DonGia: 10000,
            SoQuyen: 0,
            NamXuatBan: 2024,
            MaNXB: "NXB-0001",
            TacGia: "Kiểm thử",
            MoTa: "Fixture tự tạo",
        }, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (res.status !== 201) throw new Error(`Không tạo được fixture sách hết kho, nhận status=${res.status}`);
        zeroStockBookCode = res.data.data.MaSach;
    });

    // TC-BOOK-02: Client không được tự chọn mã sách
    await assert("TC-BOOK-02: Từ chối mã sách do client tự cung cấp", async () => {
        const dupBook = {
            MaSach: "TEST_SACH_99",
            TenSach: "Sách Trùng Mã",
            DonGia: 50000,
            SoQuyen: 2,
            MaNXB: "NXB-0001",
            TacGia: "Tester"
        };
        const res = await request("POST", "/api/sach", dupBook, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (res.status !== 400) {
            throw new Error(`Kỳ vọng HTTP 400 vì trùng mã, nhận status=${res.status}`);
        }
    });

    // TC-BORROW-01: Độc giả gửi phiếu yêu cầu mượn trực tuyến
    let borrowId = null;
    await assert("TC-BORROW-01: Độc giả gửi phiếu mượn (Trạng thái ChoDuyet)", async () => {
        const res = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: testBookCode
        }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (
            res.status !== 201 ||
            res.data.data.TrangThai !== "ChoDuyet" ||
            !hasOnlyFields(res.data.data, ["_id", "MaDocGia", "MaSach", "NgayMuon", "MSNV", "NgayHenTra", "NgayTra", "TrangThai", "GiaTriBoiThuong", "GhiChu"])
        ) {
            throw new Error(`Kỳ vọng HTTP 201 & ChoDuyet, nhận status=${res.status}`);
        }
        borrowId = res.data.data._id;
    });

    // TC-BORROW-02: Chặn mượn sách khi đã hết tồn kho
    await assert("TC-BORROW-02: Chặn mượn sách khi đã hết trong kho (SoQuyen == 0)", async () => {
        const res = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: zeroStockBookCode
        }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (res.status !== 400) {
            throw new Error(`Kỳ vọng HTTP 400 vì sách đã hết kho, nhận status=${res.status}`);
        }
    });

    // TC-BORROW-04: Chặn độc giả thuộc danh sách đen mượn sách
    await assert("TC-BORROW-04: Chặn độc giả thuộc danh sách đen mượn sách (HTTP 403 Forbidden)", async () => {
        const readers = MongoDB.client.db().collection("docgia");
        await readers.updateOne(
            { MaDocGia: temporaryReaderId },
            { $set: { TrangThaiThe: "DanhSachDen", SoLanViPham: 3 } }
        );

        const res = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: testBookCode
        }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (res.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 403 từ chối mượn, nhận status=${res.status}`);
        }

        await readers.updateOne(
            { MaDocGia: temporaryReaderId },
            { $set: { TrangThaiThe: "HoatDong", SoLanViPham: 0 } }
        );
    });

    // TC-BORROW-05: Chỉ nhân viên/Admin được duyệt và MSNV lấy từ JWT
    await assert("TC-BORROW-05: Thủ thư duyệt mượn, trừ kho và gán hạn trả 14 ngày", async () => {
        const unauthorized = await request("PUT", `/api/theodoimuonsach/${borrowId}/duyet`);
        if (unauthorized.status !== 401) {
            throw new Error(`Kỳ vọng HTTP 401 khi thiếu token, nhận status=${unauthorized.status}`);
        }

        const readerRequest = await request(
            "PUT",
            `/api/theodoimuonsach/${borrowId}/duyet`,
            null,
            { Authorization: `Bearer ${JwtUtil.sign({
                id: temporaryReaderObjectId,
                username: temporaryReaderId,
                role: "MANAGER",
                type: "reader"
            })}` }
        );
        if (readerRequest.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 403 khi độc giả duyệt phiếu, nhận status=${readerRequest.status}`);
        }

        const res = await request(
            "PUT",
            `/api/theodoimuonsach/${borrowId}/duyet`,
            { msnv: "NV-FORGED" },
            { Authorization: `Bearer ${temporaryStaffToken}` }
        );
        if (
            res.status !== 200 ||
            res.data.data.TrangThai !== "DangMuon" ||
            res.data.data.MSNV !== temporaryStaffCode
        ) {
            throw new Error(`Kỳ vọng HTTP 200 & DangMuon, nhận status=${res.status}`);
        }
        const readerInbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (readerInbox.status !== 200 || !readerInbox.data.data.some((item) => item.LoaiThongBao === "PHIEU_DUYET_MUON")) {
            throw new Error("Độc giả không nhận được thông báo phiếu mượn đã duyệt.");
        }
        // Kiểm tra tồn kho TEST_SACH_99 giảm từ 10 còn 9
        const checkBook = await request("GET", `/api/sach/${testBookCode}`);
        if (checkBook.data.SoQuyen !== 9) {
            throw new Error(`Kỳ vọng SoQuyen=9, nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-RETURN-01: Xác nhận trả sách đúng hạn (Kho hoàn về 10)
    await assert("TC-RETURN-01: Xác nhận trả sách đúng hạn và tự động hoàn kho", async () => {
        const res = await request("PUT", `/api/theodoimuonsach/${borrowId}/tra-sach`, null, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (res.status !== 200 || res.data.data.TrangThai !== "DaTra") {
            throw new Error(`Kỳ vọng HTTP 200 & DaTra, nhận status=${res.status}`);
        }
        // Kiểm tra tồn kho TEST_SACH_99 hoàn về 10
        const checkBook = await request("GET", `/api/sach/${testBookCode}`);
        if (checkBook.data.SoQuyen !== 10) {
            throw new Error(`Kỳ vọng SoQuyen=10, nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-LOSS-01: Mượn và Báo mất sách (Tính tiền bồi thường GiaTriBoiThuong = DonGia, KHÔNG cộng kho)
    let lossBorrowId = null;
    await assert("TC-LOSS-01: Báo mất sách, tính GiaTriBoiThuong và không hoàn kho", async () => {
        // Tạo đơn mượn mới
        const borrowRes = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: testBookCode
        }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (borrowRes.status !== 201) {
            throw new Error(`Không tạo được phiếu mượn kiểm thử mất sách, nhận status=${borrowRes.status}`);
        }
        lossBorrowId = borrowRes.data.data._id;
        // Duyệt mượn -> kho còn 9
        const approval = await request(
            "PUT",
            `/api/theodoimuonsach/${lossBorrowId}/duyet`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (approval.status !== 200 || approval.data.data.MSNV !== temporaryAdminId) {
            throw new Error(`Admin phải duyệt được phiếu và được ghi nhận MSNV của token, nhận status=${approval.status}`);
        }

        // Báo mất sách
        const lossRes = await request("PUT", `/api/theodoimuonsach/${lossBorrowId}/bao-mat`, {
            ghiChu: "Độc giả sơ ý làm rơi mất sách trên xe buýt"
        }, { Authorization: `Bearer ${temporaryStaffToken}` });

        if (lossRes.status !== 200 || lossRes.data.data.TrangThai !== "MatSach") {
            throw new Error(`Kỳ vọng HTTP 200 & MatSach, nhận status=${lossRes.status}`);
        }
        if (lossRes.data.data.GiaTriBoiThuong !== 95000) {
            throw new Error(`Kỳ vọng GiaTriBoiThuong=95000, nhận ${lossRes.data.data.GiaTriBoiThuong}`);
        }

        // Kiểm tra tồn kho vẫn giữ nguyên là 9 (không cộng lại)
        const checkBook = await request("GET", `/api/sach/${testBookCode}`);
        if (checkBook.data.SoQuyen !== 9) {
            throw new Error(`Kỳ vọng SoQuyen=9 (không hoàn kho), nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-ADMIN-01: Admin nâng cấp quyền người dùng (VaiTro: MANAGER)
    await assert("TC-ADMIN-01: Admin nâng cấp quyền độc giả lên Thủ thư (MANAGER)", async () => {
        const res = await request("PUT", `/api/docgia/${temporaryReaderId}/role`, { role: "MANAGER" }, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (res.status !== 200 || res.data.data.VaiTro !== "MANAGER" || "Role" in res.data.data) {
            throw new Error(`Kỳ vọng HTTP 200 & VaiTro MANAGER, nhận status=${res.status}`);
        }
    });

    // TC-ADMIN-02: Admin xét gỡ độc giả khỏi danh sách đen
    await assert("TC-ADMIN-02: Gỡ khỏi danh sách đen sau xét duyệt nhưng giữ lịch sử vi phạm", async () => {
        await MongoDB.client.db().collection("docgia").updateOne(
            { MaDocGia: temporaryReaderId },
            { $set: { TrangThaiThe: "DanhSachDen", SoLanViPham: 3 } }
        );
        const cannotEmergencyUnlock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/unblock`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (cannotEmergencyUnlock.status !== 400) {
            throw new Error(`Kỳ vọng HTTP 400 khi dùng mở khóa khẩn cấp cho danh sách đen, nhận ${cannotEmergencyUnlock.status}`);
        }
        const unauthorizedReinstatement = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/reinstate`
        );
        const managerReinstatement = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/reinstate`,
            null,
            { Authorization: `Bearer ${temporaryStaffToken}` }
        );
        if (unauthorizedReinstatement.status !== 401 || managerReinstatement.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 401/403 khi xét gỡ danh sách đen không phải Admin, nhận ${unauthorizedReinstatement.status}/${managerReinstatement.status}`);
        }

        const reinstated = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/reinstate`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (
            reinstated.status !== 200 ||
            reinstated.data.data.TrangThaiThe !== "HoatDong" ||
            reinstated.data.data.SoLanViPham !== 3
        ) {
            throw new Error(`Kỳ vọng gỡ khỏi danh sách đen nhưng giữ SoLanViPham=3, nhận status=${reinstated.status}`);
        }
    });

    // TC-ADMIN-03: Khóa khẩn cấp không reset vi phạm và không bỏ qua ngưỡng danh sách đen
    await assert("TC-ADMIN-03: Khóa/mở khóa khẩn cấp giữ nguyên vi phạm", async () => {
        const readers = MongoDB.client.db().collection("docgia");
        await readers.updateOne(
            { MaDocGia: temporaryReaderId },
            { $set: { TrangThaiThe: "HoatDong", SoLanViPham: 2 } }
        );
        const unauthorizedLock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/lock`
        );
        const managerLock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/lock`,
            null,
            { Authorization: `Bearer ${temporaryStaffToken}` }
        );
        if (unauthorizedLock.status !== 401 || managerLock.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 401/403 khi thao tác khóa không phải Admin, nhận ${unauthorizedLock.status}/${managerLock.status}`);
        }

        const lock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/lock`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (lock.status !== 200 || lock.data.data.TrangThaiThe !== "Khoa" || lock.data.data.SoLanViPham !== 2) {
            throw new Error(`Kỳ vọng khóa thẻ và giữ SoLanViPham=2, nhận status=${lock.status}`);
        }
        let readerInbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (!readerInbox.data.data.some((item) => item.LoaiThongBao === "THE_KHOA")) {
            throw new Error("Độc giả không nhận được thông báo khóa thẻ.");
        }

        const unlock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/unblock`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (unlock.status !== 200 || unlock.data.data.TrangThaiThe !== "HoatDong" || unlock.data.data.SoLanViPham !== 2) {
            throw new Error(`Kỳ vọng mở khóa khẩn cấp và giữ SoLanViPham=2, nhận status=${unlock.status}`);
        }
        readerInbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (!readerInbox.data.data.some((item) => item.LoaiThongBao === "THE_MO_KHOA")) {
            throw new Error("Độc giả không nhận được thông báo mở khóa thẻ.");
        }

        await readers.updateOne(
            { MaDocGia: temporaryReaderId },
            { $set: { TrangThaiThe: "Khoa", SoLanViPham: 3 } }
        );
        const thresholdUnlock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/unblock`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (
            thresholdUnlock.status !== 200 ||
            thresholdUnlock.data.data.TrangThaiThe !== "DanhSachDen" ||
            thresholdUnlock.data.data.SoLanViPham !== 3
        ) {
            throw new Error(`Kỳ vọng mở khóa về danh sách đen khi đạt ngưỡng, nhận status=${thresholdUnlock.status}`);
        }
    });

    // Dọn dẹp dữ liệu kiểm thử
    const adminHeaders = { Authorization: `Bearer ${temporaryAdminToken}` };
    await request("DELETE", `/api/theodoimuonsach/${borrowId}`, null, adminHeaders);
    await request("DELETE", `/api/theodoimuonsach/${lossBorrowId}`, null, adminHeaders);
    await request("DELETE", `/api/sach/${testBookCode}`, null, { Authorization: `Bearer ${temporaryStaffToken}` });
    if (zeroStockBookCode) await request("DELETE", `/api/sach/${zeroStockBookCode}`, null, { Authorization: `Bearer ${temporaryStaffToken}` });
    if (temporaryReaderId) {
        await MongoDB.client.db().collection("thongbao").deleteMany({ NguoiNhanId: new (require("mongodb").ObjectId)(temporaryReaderObjectId) });
        await request("DELETE", `/api/docgia/${temporaryReaderId}`, null, adminHeaders);
    }
    if (temporaryStaffId) {
        await request("DELETE", `/api/nhanvien/${temporaryStaffId}`, null, adminHeaders);
    }
    if (createdNotificationStaffId) {
        await request("DELETE", `/api/nhanvien/${createdNotificationStaffId}`, null, adminHeaders);
    }
    if (temporaryAdminId) {
        await MongoDB.client.db().collection("nhanvien").deleteOne({ MSNV: temporaryAdminId });
    }

    console.log("\n=========================================================================");
    console.log(`TỔNG KẾT BỘ KIỂM THỬ: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================================");

    server.close();
    if (MongoDB.client) {
        await MongoDB.client.close();
    }

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error("Lỗi thực thi kiểm thử:", err);
    if (server) server.close();
    process.exit(1);
});
