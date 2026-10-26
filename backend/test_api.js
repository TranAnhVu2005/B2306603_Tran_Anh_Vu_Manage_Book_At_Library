const http = require("http");
const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");
const JwtUtil = require("./app/utils/jwt.util");
const DocGiaService = require("./app/services/docgia.service");
const NhanVienService = require("./app/services/nhanvien.service");
const ThongBaoService = require("./app/services/thongbao.service");
const TheLoaiService = require("./app/services/theloai.service");
const { migrateLegacyRoles } = require("./app/utils/role-migration.util");
const { ObjectId } = require("mongodb");
const { resetAuthRateLimitsForTests } = require("./app/middleware/security.middleware");

let server = null;
let testPort = null;

function hasOnlyFields(value, allowedFields) {
    return value && Object.keys(value).every(field => allowedFields.includes(field));
}

function request(method, path, body = null, headers = {}) {
    resetAuthRateLimitsForTests();
    return new Promise((resolve, reject) => {
        const dataString = body ? JSON.stringify(body) : null;
        const options = {
            hostname: "127.0.0.1",
            port: testPort,
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
    await migrateLegacyRoles(MongoDB.client.db());
    await new TheLoaiService(MongoDB.client).ensureDefaults();
    server = await new Promise((resolve, reject) => {
        const s = app.listen(0, "127.0.0.1", () => {
            testPort = s.address().port;
            resolve(s);
        });
        s.once("error", reject);
    });

    let passed = 0;
    let failed = 0;
    let temporaryReaderId = null;
    let temporaryReaderObjectId = null;
    let temporaryReaderPhone = null;
    let temporaryReaderToken = null;
    let temporaryOtherReaderId = null;
    let temporaryOtherReaderObjectId = null;
    let temporaryOtherReaderToken = null;
    let temporaryStaffId = null;
    let createdNotificationStaffId = null;
    let createdNotificationStaffToken = null;
    let createdNotificationStaffPhone = null;
    let temporaryStaffCode = null;
    let temporaryStaffPhone = null;
    let temporaryStaffToken = null;
    let temporaryAdminId = null;
    let temporaryAdminPhone = null;
    let temporaryAdminToken = null;
    let temporaryNotificationId = null;
    let testBookCode = null;
    let zeroStockBookCode = null;
    let cancellationBookCode = null;
    let cancellationBookTitle = null;
    const cancellationBorrowIds = [];
    const testApplicationIds = [];
    const testStaffCodes = [];
    const testStaffObjectIds = [];

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
            ChucVu: "STAFF",
            SoDienThoai: `09${String(Date.now()).slice(-8)}`,
            MatKhau: "staff_test_password"
        });
        temporaryStaffId = String(staff._id);
        testStaffObjectIds.push(temporaryStaffId);
        temporaryStaffCode = staff.MSNV;
        testStaffCodes.push(staff.MSNV);
        temporaryStaffPhone = staff.SoDienThoai;

        const res = await request("POST", "/api/auth/login", { phone: temporaryStaffPhone, password: "staff_test_password" });
        temporaryStaffToken = res.data.token;
        if (
            res.status !== 200 ||
            res.data.data.ChucVu !== "STAFF" ||
            JwtUtil.verify(res.data.token).role !== "STAFF" ||
            !hasOnlyFields(res.data.data, ["_id", "MSNV", "HoTenNV", "ChucVu", "SoDienThoai", "DiaChi", "TrangThaiThe"])
        ) {
            throw new Error(`Kỳ vọng HTTP 200, ChucVu và JWT role phải là STAFF, nhận status=${res.status}`);
        }
        const staffCollection = MongoDB.client.db().collection("nhanvien");
        await staffCollection.updateOne({ _id: staff._id }, { $set: { ChucVu: "THUTHU" } });
        const migration = await migrateLegacyRoles(MongoDB.client.db());
        const migratedStaff = await staffCollection.findOne({ _id: staff._id }, { projection: { ChucVu: 1 } });
        if (migration.staff < 1 || migratedStaff?.ChucVu !== "STAFF") {
            throw new Error("Migration không chuyển chức vụ legacy của nhân viên thành STAFF.");
        }
        const codeLogin = await request("POST", "/api/auth/login", { phone: temporaryStaffCode, password: "staff_test_password" });
        if (codeLogin.status !== 401) throw new Error("Đăng nhập nhân viên bằng mã MSNV vẫn được chấp nhận.");
    });

    // TC-AUTH-02: Đăng nhập sai mật khẩu bị chặn
    await assert("TC-AUTH-02: Đăng nhập sai mật khẩu (Báo lỗi 401)", async () => {
        const res = await request("POST", "/api/auth/login", { phone: temporaryStaffPhone, password: "wrong_password" });
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
        // Dùng mã chưa từng xuất hiện ở hồ sơ hoặc phiếu mượn nếu bộ sinh tuần tự
        // đụng mã cũ; tránh test trùng cả với phiếu mượn mồ côi từ lượt chạy trước.
        const readers = MongoDB.client.db().collection("docgia");
        const borrowRecords = MongoDB.client.db().collection("theodoimuonsach");
        if (
            await readers.countDocuments({ MaDocGia: reader.MaDocGia }) > 1 ||
            await borrowRecords.countDocuments({ MaDocGia: reader.MaDocGia }) > 0
        ) {
            let uniqueCode;
            do {
                uniqueCode = `DG-${String(800000 + Math.floor(Math.random() * 199999)).padStart(6, "0")}`;
            } while (await readers.findOne({ MaDocGia: uniqueCode }) || await borrowRecords.findOne({ MaDocGia: uniqueCode }));
            await readers.updateOne({ _id: reader._id }, { $set: { MaDocGia: uniqueCode } });
            reader.MaDocGia = uniqueCode;
        }
        temporaryReaderId = reader.MaDocGia;
        temporaryReaderPhone = reader.DienThoai;

        const res = await request("POST", "/api/auth/login", {
            phone: reader.DienThoai,
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
        const readerCodeLogin = await request("POST", "/api/auth/login", {
            phone: temporaryReaderId,
            password: "reader_test_password",
        });
        if (readerCodeLogin.status !== 401) throw new Error("Mã độc giả không được chấp nhận làm thông tin đăng nhập.");
        const readerCollection = MongoDB.client.db().collection("docgia");
        await readerCollection.updateOne({ MaDocGia: temporaryReaderId }, { $set: { VaiTro: "MANAGER" } });
        const legacyRoleMe = await request("GET", "/api/auth/me", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        const legacyRoleList = await request("GET", "/api/docgia", null, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (legacyRoleMe.data?.data?.VaiTro !== "USER" || legacyRoleList.data?.find((item) => item.MaDocGia === temporaryReaderId)?.VaiTro !== "USER") {
            throw new Error("Vai trò MANAGER cũ của độc giả vẫn được dùng như quyền nhân viên.");
        }
        const migration = await migrateLegacyRoles(MongoDB.client.db());
        const migratedReader = await readerCollection.findOne({ MaDocGia: temporaryReaderId }, { projection: { VaiTro: 1 } });
        if (migration.readers < 1 || migratedReader?.VaiTro !== "USER") {
            throw new Error("Migration không đưa vai trò legacy của độc giả về USER.");
        }
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
            phone: temporaryReaderPhone,
            password: "reader_test_password"
        });
        const injectedPasswordLogin = await request("POST", "/api/auth/login", {
            phone: temporaryReaderPhone,
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
        testStaffObjectIds.push(String(admin._id));
        testStaffCodes.push(admin.MSNV);
        temporaryAdminPhone = admin.SoDienThoai;

        const login = await request("POST", "/api/auth/login", {
            phone: temporaryAdminPhone,
            password: "admin_test_password"
        });
        const adminToken = login.data?.token;
        const adminObjectId = login.data?.data?._id;
        if (login.status !== 200 || !adminToken || !adminObjectId) {
            throw new Error(`Không đăng nhập được Admin kiểm thử, nhận status=${login.status}`);
        }
        temporaryAdminToken = adminToken;

        const missingStaffPhone = await request("POST", "/api/nhanvien", {
            HoTenNV: "Thiếu điện thoại", ChucVu: "STAFF", MatKhau: "test_password",
        }, { Authorization: `Bearer ${temporaryAdminToken}` });
        const duplicateStaffPhone = await request("POST", "/api/nhanvien", {
            HoTenNV: "Trùng điện thoại", ChucVu: "STAFF", SoDienThoai: temporaryStaffPhone, MatKhau: "test_password",
        }, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (missingStaffPhone.status !== 400 || duplicateStaffPhone.status !== 400) {
            throw new Error(`Kỳ vọng từ chối thiếu/trùng số điện thoại nhân viên, nhận ${missingStaffPhone.status}/${duplicateStaffPhone.status}`);
        }

        const createdStaff = await request("POST", "/api/nhanvien", {
            HoTenNV: "Nhân viên nhận thông báo",
            ChucVu: "STAFF",
            SoDienThoai: `07${String(Date.now() + 2000).slice(-8)}`,
            MatKhau: "notification_staff_password",
        }, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (createdStaff.status !== 201 || !createdStaff.data.data?._id) {
            throw new Error(`Admin không tạo được nhân viên kiểm thử, nhận status=${createdStaff.status}`);
        }
        createdNotificationStaffId = createdStaff.data.data._id;
        createdNotificationStaffPhone = createdStaff.data.data.SoDienThoai;
        testStaffObjectIds.push(String(createdNotificationStaffId));
        if (createdStaff.data.data.MSNV) testStaffCodes.push(createdStaff.data.data.MSNV);
        const createdStaffToken = JwtUtil.sign({
            id: createdNotificationStaffId,
            username: createdStaff.data.data.MSNV,
            role: "STAFF",
            type: "staff",
        });
        createdNotificationStaffToken = createdStaffToken;
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
                ChucVu: "STAFF",
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
            phone: temporaryAdminPhone,
            password: "admin_test_password"
        });
        const injectedPasswordLogin = await request("POST", "/api/auth/login", {
            phone: temporaryAdminPhone,
            password: "attacker_password"
        });
        if (originalPasswordLogin.status !== 200 || injectedPasswordLogin.status !== 401) {
            throw new Error("Mật khẩu Admin bị thay đổi ngoài ý muốn khi cập nhật hồ sơ.");
        }
    });

    // TC-ACCOUNT-SOFT-DELETE-01: Tài khoản chỉ xóa mềm, phiên bị chặn và Admin có thể khôi phục.
    await assert("TC-ACCOUNT-SOFT-DELETE-01: Xóa mềm và khôi phục tài khoản độc giả/nhân viên", async () => {
        const readerDelete = await request("DELETE", `/api/docgia/${temporaryReaderObjectId}`, null, { Authorization: `Bearer ${temporaryAdminToken}` });
        const readerDocument = await MongoDB.client.db().collection("docgia").findOne({ _id: new ObjectId(temporaryReaderObjectId) });
        const readerLoginAfterDelete = await request("POST", "/api/auth/login", { phone: temporaryReaderPhone, password: "reader_test_password" });
        const readerSessionAfterDelete = await request("GET", "/api/auth/me", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        const hiddenReader = await request("GET", "/api/docgia", null, { Authorization: `Bearer ${temporaryAdminToken}` });
        const deletedReaders = await request("GET", "/api/docgia?includeDeleted=true", null, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (readerDelete.status !== 200 || readerDocument?.deleted !== true || readerLoginAfterDelete.status !== 401 || readerSessionAfterDelete.status !== 401 || hiddenReader.data.some(item => item.MaDocGia === temporaryReaderId) || !deletedReaders.data.some(item => item.MaDocGia === temporaryReaderId && item.DeletedAt && item.DeletedBy)) {
            throw new Error(`Độc giả phải được ẩn mềm, giữ document, mất quyền đăng nhập và chỉ xuất hiện trong danh sách Admin; delete=${readerDelete.status}, deleted=${readerDocument?.deleted}, login=${readerLoginAfterDelete.status}, oldSession=${readerSessionAfterDelete.status}, activeList=${Array.isArray(hiddenReader.data) && hiddenReader.data.some(item => item.MaDocGia === temporaryReaderId)}, adminList=${Array.isArray(deletedReaders.data) && deletedReaders.data.some(item => item.MaDocGia === temporaryReaderId && item.DeletedAt && item.DeletedBy)}`);
        }
        const readerRestore = await request("PUT", `/api/docgia/${temporaryReaderObjectId}/restore`, {}, { Authorization: `Bearer ${temporaryAdminToken}` });
        const readerLoginAfterRestore = await request("POST", "/api/auth/login", { phone: temporaryReaderPhone, password: "reader_test_password" });
        const oldReaderSessionAfterRestore = await request("GET", "/api/auth/me", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (readerRestore.status !== 200 || readerLoginAfterRestore.status !== 200 || oldReaderSessionAfterRestore.status !== 401 || Object.hasOwn(readerRestore.data.data, "deleted")) {
            throw new Error(`Khôi phục độc giả phải xóa metadata xóa mềm và cho phép đăng nhập lại bằng số điện thoại; restore=${readerRestore.status}, login=${readerLoginAfterRestore.status}, oldSession=${oldReaderSessionAfterRestore.status}, hasDeleted=${Object.hasOwn(readerRestore.data?.data || {}, "deleted")}`);
        }
        temporaryReaderToken = readerLoginAfterRestore.data.token;

        const staffDelete = await request("DELETE", `/api/nhanvien/${createdNotificationStaffId}`, null, { Authorization: `Bearer ${temporaryAdminToken}` });
        const staffDocument = await MongoDB.client.db().collection("nhanvien").findOne({ _id: new ObjectId(createdNotificationStaffId) });
        const staffLoginAfterDelete = await request("POST", "/api/auth/staff-login", { phone: createdNotificationStaffPhone, password: "notification_staff_password" });
        if (staffDelete.status !== 200 || staffDocument?.deleted !== true || staffLoginAfterDelete.status !== 401) {
            throw new Error("Nhân viên phải được xóa mềm và không đăng nhập được sau khi bị xóa.");
        }
        const staffRestore = await request("PUT", `/api/nhanvien/${createdNotificationStaffId}/restore`, {}, { Authorization: `Bearer ${temporaryAdminToken}` });
        const staffLoginAfterRestore = await request("POST", "/api/auth/staff-login", { phone: createdNotificationStaffPhone, password: "notification_staff_password" });
        if (staffRestore.status !== 200 || staffLoginAfterRestore.status !== 200) {
            throw new Error("Khôi phục nhân viên phải cho phép đăng nhập lại bằng số điện thoại.");
        }
        createdNotificationStaffToken = staffLoginAfterRestore.data.token;
        const selfDelete = await request("DELETE", `/api/nhanvien/${temporaryAdminId}`, null, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (selfDelete.status !== 400) throw new Error("Không được xóa tài khoản ADMIN, kể cả gọi trực tiếp API.");
    });

    // TC-STAFF-LOCK-01: Admin khóa/mở khóa thủ thư, chặn tự khóa qua API và thu hồi JWT đang có.
    await assert("TC-STAFF-LOCK-01: Khóa tài khoản thủ thư an toàn phía máy chủ", async () => {
        if (!temporaryAdminToken || !temporaryAdminId || !createdNotificationStaffId || !createdNotificationStaffToken) {
            throw new Error("Thiếu tài khoản fixture Admin hoặc thủ thư để kiểm thử khóa tài khoản.");
        }

        const selfLock = await request("PUT", `/api/nhanvien/${temporaryAdminId}/lock`, { LyDo: "Tự khóa kiểm thử" }, {
            Authorization: `Bearer ${temporaryAdminToken}`,
        });
        if (selfLock.status !== 403) throw new Error(`Admin tự khóa qua API phải bị từ chối 403, nhận ${selfLock.status}`);

        const managerAttempt = await request("PUT", `/api/nhanvien/${createdNotificationStaffId}/lock`, { LyDo: "Không đủ quyền" }, {
            Authorization: `Bearer ${temporaryStaffToken}`,
        });
        if (managerAttempt.status !== 403) throw new Error(`Thủ thư khác không được khóa tài khoản, nhận ${managerAttempt.status}`);

        const locked = await request("PUT", `/api/nhanvien/${createdNotificationStaffId}/lock`, { LyDo: "Kiểm thử khóa tài khoản" }, {
            Authorization: `Bearer ${temporaryAdminToken}`,
        });
        if (locked.status !== 200 || locked.data.data.TrangThaiThe !== "Khoa") {
            throw new Error(`Admin phải khóa được thủ thư, nhận ${locked.status}`);
        }

        const revokedSession = await request("GET", "/api/auth/me", null, {
            Authorization: `Bearer ${createdNotificationStaffToken}`,
        });
        const blockedLogin = await request("POST", "/api/auth/staff-login", {
            phone: createdNotificationStaffPhone,
            password: "notification_staff_password",
        });
        const wrongPasswordWhileLocked = await request("POST", "/api/auth/staff-login", {
            phone: createdNotificationStaffPhone,
            password: "wrong_notification_staff_password",
        });
        const sharedLoginBlocked = await request("POST", "/api/auth/login", {
            phone: createdNotificationStaffPhone,
            password: "notification_staff_password",
        });
        if (
            revokedSession.status !== 401 ||
            blockedLogin.status !== 403 || !blockedLogin.data.message.includes("đang bị khóa") || blockedLogin.data.token ||
            wrongPasswordWhileLocked.status !== 401 || wrongPasswordWhileLocked.data.message.includes("khóa") ||
            sharedLoginBlocked.status !== 403 || !sharedLoginBlocked.data.message.includes("đang bị khóa") || sharedLoginBlocked.data.token
        ) {
            throw new Error(`Phiên bị thu hồi, mật khẩu đúng báo khóa riêng và mật khẩu sai vẫn báo lỗi chung; nhận me/staff-login/wrong/shared=${revokedSession.status}/${blockedLogin.status}/${wrongPasswordWhileLocked.status}/${sharedLoginBlocked.status}`);
        }

        const unlocked = await request("PUT", `/api/nhanvien/${createdNotificationStaffId}/unlock`, { LyDo: "Kết thúc kiểm thử" }, {
            Authorization: `Bearer ${temporaryAdminToken}`,
        });
        if (unlocked.status !== 200 || unlocked.data.data.TrangThaiThe !== "HoatDong") {
            throw new Error(`Admin phải mở khóa được thủ thư, nhận ${unlocked.status}`);
        }

        const staleSession = await request("GET", "/api/auth/me", null, {
            Authorization: `Bearer ${createdNotificationStaffToken}`,
        });
        const freshLogin = await request("POST", "/api/auth/staff-login", {
            phone: createdNotificationStaffPhone,
            password: "notification_staff_password",
        });
        if (staleSession.status !== 401 || freshLogin.status !== 200) {
            throw new Error(`JWT cũ phải tiếp tục bị thu hồi sau mở khóa và đăng nhập mới được phép, nhận ${staleSession.status}/${freshLogin.status}`);
        }

        const inbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${freshLogin.data.token}` });
        if (inbox.status !== 200 || !inbox.data.data.some((item) => item.LoaiThongBao === "TAI_KHOAN_NHAN_VIEN_BI_KHOA") || !inbox.data.data.some((item) => item.LoaiThongBao === "TAI_KHOAN_NHAN_VIEN_DUOC_MO_KHOA")) {
            throw new Error("Thủ thư phải nhận thông báo khóa và mở khóa tài khoản.");
        }
        const staffAudit = await MongoDB.client.db().collection("nhatkykiemtoan").find({
            MaDoiTuong: locked.data.data.MSNV,
            HanhDong: { $in: ["NHANVIEN_KHOA_TAI_KHOAN", "NHANVIEN_MO_KHOA_TAI_KHOAN"] },
        }).toArray();
        if (staffAudit.length < 2 || staffAudit.some((entry) => !entry.ChiTiet?.LyDo)) {
            throw new Error("Khóa/mở khóa phải có đủ hai bản ghi audit cùng lý do thao tác.");
        }
    });

    // TC-AUTH-04: Google chỉ cấp phiên USER và phải từ chối token/field giả mạo.
    await assert("TC-AUTH-04: Từ chối Google ID Token không hợp lệ", async () => {
        const invalidToken = await request("POST", "/api/auth/google", { idToken: "sample_mock_google_id_token" });
        const missingToken = await request("POST", "/api/auth/google", {});
        const extraField = await request("POST", "/api/auth/google", {
            idToken: "sample_mock_google_id_token",
            role: "ADMIN",
        });
        if (invalidToken.status !== 401 || invalidToken.data?.token) {
            throw new Error(`Google token giả phải bị từ chối và không cấp JWT; nhận HTTP ${invalidToken.status}`);
        }
        if (missingToken.status !== 400 || extraField.status !== 400) {
            throw new Error(`Thiếu token/trường role giả phải nhận HTTP 400; nhận ${missingToken.status}/${extraField.status}`);
        }
    });

    await assert("TC-AUTH-05: Chỉ nhận số điện thoại làm thông tin đăng nhập", async () => {
        const readerCodeLogin = await request("POST", "/api/auth/login", {
            phone: temporaryReaderId,
            password: "reader_test_password",
        });
        const identifierAliasLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryReaderPhone,
            password: "reader_test_password",
        });
        const phoneLogin = await request("POST", "/api/auth/login", {
            phone: temporaryReaderPhone,
            password: "reader_test_password",
        });
        if (readerCodeLogin.status !== 401 || identifierAliasLogin.status !== 400 || phoneLogin.status !== 200) {
            throw new Error(`Chỉ đăng nhập bằng SĐT; mã/alias/SĐT hợp lệ=${readerCodeLogin.status}/${identifierAliasLogin.status}/${phoneLogin.status}`);
        }
    });

    await assert("TC-GENRE-01: Danh mục thể loại và bộ lọc sách", async () => {
        const genres = await request("GET", "/api/theloai");
        if (genres.status !== 200 || !genres.data.some((item) => item.MaTheLoai === "TL-0002" && item.TenTheLoai === "Công nghệ thông tin")) {
            throw new Error(`Danh mục thể loại chưa sẵn sàng, nhận HTTP ${genres.status}`);
        }
        const baseBook = { TenSach: "Kiểm thử thể loại", DonGia: 10000, SoQuyen: 1, MaNXB: "NXB-0001", TacGia: "Tester" };
        const missingGenre = await request("POST", "/api/sach", baseBook, { Authorization: `Bearer ${temporaryStaffToken}` });
        const unknownGenre = await request("POST", "/api/sach", { ...baseBook, MaTheLoai: "TL-9999" }, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (missingGenre.status !== 400 || unknownGenre.status !== 400) {
            throw new Error(`Backend phải từ chối thiếu/mã thể loại không tồn tại; nhận ${missingGenre.status}/${unknownGenre.status}`);
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
            MaTheLoai: "TL-0002",
            TacGia: "Nhóm Tester CTU",
            MoTa: "Tài liệu phục vụ kiểm thử hệ thống"
        };
        const res = await request("POST", "/api/sach", newBook, { Authorization: `Bearer ${temporaryStaffToken}` });
        testBookCode = res.data?.data?.MaSach;
        if (
            res.status !== 201 ||
            !testBookCode ||
            res.data.data.MaTheLoai !== "TL-0002" ||
            !hasOnlyFields(res.data.data, ["_id", "MaSach", "TenSach", "DonGia", "SoQuyen", "NamXuatBan", "MaNXB", "MaTheLoai", "TacGia", "HinhAnh", "MoTa"])
        ) {
            throw new Error(`Kỳ vọng HTTP 201, nhận status=${res.status}`);
        }

        const filtered = await request("GET", "/api/sach?maTheLoai=TL-0002");
        if (filtered.status !== 200 || !filtered.data.some((book) => book.MaSach === testBookCode)) {
            throw new Error("Bộ lọc sách theo MaTheLoai không trả về sách phù hợp.");
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
            MaTheLoai: "TL-0017",
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
            !hasOnlyFields(res.data.data, ["_id", "MaDocGia", "MaSach", "NgayDangKy", "NgayDuyet", "HanNhan", "NgayMuon", "MSNV", "NgayHenTra", "SoLanGiaHan", "NgayGiaHan", "NgayTra", "TrangThai", "GiaTriBoiThuong", "GhiChu"])
            || !res.data.data.NgayDangKy || res.data.data.NgayMuon !== null || res.data.data.NgayHenTra !== null
        ) {
            throw new Error(`Kỳ vọng HTTP 201 & ChoDuyet, nhận status=${res.status}, response=${JSON.stringify(res.data)}`);
        }
        borrowId = res.data.data._id;
    });

    await assert("TC-CANCEL-01: Hủy phiếu chờ duyệt giải phóng hạn mức mượn", async () => {
        cancellationBookTitle = `Sách kiểm thử hủy yêu cầu ${Date.now()}`;
        const newBook = await request("POST", "/api/sach", {
            TenSach: cancellationBookTitle,
            DonGia: 30000,
            SoQuyen: 1,
            NamXuatBan: 2024,
            MaNXB: "NXB-0001",
            MaTheLoai: "TL-0002",
            TacGia: "Tester",
            MoTa: "Fixture kiểm thử hủy yêu cầu mượn",
        }, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (newBook.status !== 201) throw new Error(`Không tạo được sách fixture, nhận HTTP ${newBook.status}`);
        cancellationBookCode = newBook.data.data.MaSach;

        const other = await new DocGiaService(MongoDB.client).create({
            HoLot: "Kiểm thử",
            Ten: "Người khác",
            NgaySinh: "2000-01-01",
            Phai: 1,
            DienThoai: `08${String(Date.now()).slice(-8)}`,
            MatKhau: "other_reader_test_password",
        });
        temporaryOtherReaderObjectId = String(other._id);
        temporaryOtherReaderId = `DG-${String(800000 + Math.floor(Math.random() * 199999)).padStart(6, "0")}`;
        const readers = MongoDB.client.db().collection("docgia");
        while (await readers.findOne({ MaDocGia: temporaryOtherReaderId })) {
            temporaryOtherReaderId = `DG-${String(800000 + Math.floor(Math.random() * 199999)).padStart(6, "0")}`;
        }
        await readers.updateOne({ _id: other._id }, { $set: { MaDocGia: temporaryOtherReaderId } });
        temporaryOtherReaderToken = JwtUtil.sign({
            id: temporaryOtherReaderObjectId,
            username: temporaryOtherReaderId,
            role: "USER",
            type: "reader",
        });

        const otherAttempt = await request("PUT", `/api/theodoimuonsach/${borrowId}/huy`, null, {
            Authorization: `Bearer ${temporaryOtherReaderToken}`,
        });
        if (otherAttempt.status !== 403) throw new Error(`Độc giả khác không được hủy phiếu, nhận HTTP ${otherAttempt.status}`);

        const cancelInitial = await request("PUT", `/api/theodoimuonsach/${borrowId}/huy`, null, {
            Authorization: `Bearer ${temporaryReaderToken}`,
        });
        if (cancelInitial.status !== 200 || cancelInitial.data.data.TrangThai !== "DaHuy") {
            throw new Error(`Chủ phiếu phải hủy được yêu cầu đang chờ, nhận HTTP ${cancelInitial.status}`);
        }
        cancellationBorrowIds.push(borrowId);

        const fixtureBorrowResult = await MongoDB.client.db().collection("theodoimuonsach").insertMany([
            { MaDocGia: temporaryReaderId, MaSach: "FIXTURE-A", TrangThai: "DangMuon", NgayMuon: "2026-01-01", CreatedAt: new Date() },
            { MaDocGia: temporaryReaderId, MaSach: "FIXTURE-B", TrangThai: "DangMuon", NgayMuon: "2026-01-01", CreatedAt: new Date() },
        ]);
        const fixtureBorrowIds = Object.values(fixtureBorrowResult.insertedIds);
        try {
            const atLimit = await request("POST", "/api/theodoimuonsach", {
                MaDocGia: temporaryReaderId,
                MaSach: cancellationBookCode,
            }, { Authorization: `Bearer ${temporaryReaderToken}` });
            if (atLimit.status !== 201) throw new Error(`Đăng ký thứ ba khi đang có hai cuốn phải thành công, nhận HTTP ${atLimit.status}`);
            cancellationBorrowIds.push(atLimit.data.data._id);

            const overLimit = await request("POST", "/api/theodoimuonsach", {
                MaDocGia: temporaryReaderId,
                MaSach: testBookCode,
            }, { Authorization: `Bearer ${temporaryReaderToken}` });
            if (overLimit.status !== 400) throw new Error(`Phiếu chờ duyệt phải tính vào hạn mức 3, nhận HTTP ${overLimit.status}`);

            const cancelledAtLimit = await request("PUT", `/api/theodoimuonsach/${atLimit.data.data._id}/huy`, null, {
                Authorization: `Bearer ${temporaryReaderToken}`,
            });
            if (cancelledAtLimit.status !== 200 || cancelledAtLimit.data.data.TrangThai !== "DaHuy") {
                throw new Error(`Hủy phiếu thứ ba phải giải phóng hạn mức, nhận HTTP ${cancelledAtLimit.status}`);
            }
            const repeatCancel = await request("PUT", `/api/theodoimuonsach/${atLimit.data.data._id}/huy`, null, {
                Authorization: `Bearer ${temporaryReaderToken}`,
            });
            if (repeatCancel.status !== 409) throw new Error(`Không được hủy lại phiếu đã hủy, nhận HTTP ${repeatCancel.status}`);

            const newChoice = await request("POST", "/api/theodoimuonsach", {
                MaDocGia: temporaryReaderId,
                MaSach: testBookCode,
            }, { Authorization: `Bearer ${temporaryReaderToken}` });
            if (newChoice.status !== 201 || newChoice.data.data.TrangThai !== "ChoDuyet") {
                throw new Error(`Sau khi hủy phải đăng ký được sách khác, nhận HTTP ${newChoice.status}`);
            }
            borrowId = newChoice.data.data._id;

            const stock = await MongoDB.client.db().collection("sach").findOne({ MaSach: cancellationBookCode }, { projection: { SoQuyen: 1 } });
            if (stock?.SoQuyen !== 1) throw new Error(`Hủy phiếu chờ duyệt không được trừ kho; tồn thực tế=${stock?.SoQuyen}`);

            const audit = await request("GET", `/api/nhatkykiemtoan?MaDocGia=${encodeURIComponent(temporaryReaderId)}&HanhDong=PHIEU_HUY_DANG_KY`, null, {
                Authorization: `Bearer ${temporaryAdminToken}`,
            });
            if (audit.status !== 200 || audit.data.items?.filter((entry) => cancellationBorrowIds.includes(entry.MaDoiTuong)).length < 2) {
                throw new Error("Nhật ký phải ghi nhận các phiếu đã được độc giả hủy.");
            }
        } finally {
            await MongoDB.client.db().collection("theodoimuonsach").deleteMany({ _id: { $in: fixtureBorrowIds } });
        }
    });

    await assert("TC-CANCEL-02: Hủy phiếu đã duyệt nhưng chưa nhận hoàn lại sách giữ", async () => {
        const requested = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId, MaSach: cancellationBookCode,
        }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (requested.status !== 201) throw new Error(`Không tạo được yêu cầu nhận sách, HTTP ${requested.status}`);
        cancellationBorrowIds.push(requested.data.data._id);

        const approved = await request("PUT", `/api/theodoimuonsach/${requested.data.data._id}/duyet`, null, {
            Authorization: `Bearer ${temporaryStaffToken}`,
        });
        if (approved.status !== 200 || approved.data.data.TrangThai !== "ChoNhan") {
            throw new Error(`Duyệt phải chuyển phiếu sang ChoNhan, HTTP ${approved.status}`);
        }
        let stock = await MongoDB.client.db().collection("sach").findOne({ MaSach: cancellationBookCode }, { projection: { SoQuyen: 1 } });
        if (stock?.SoQuyen !== 0) throw new Error(`Duyệt phải giữ 1 cuốn trong kho, tồn=${stock?.SoQuyen}`);

        const cancelled = await request("PUT", `/api/theodoimuonsach/${requested.data.data._id}/huy`, null, {
            Authorization: `Bearer ${temporaryReaderToken}`,
        });
        if (cancelled.status !== 200 || cancelled.data.data.TrangThai !== "DaHuy") {
            throw new Error(`Độc giả phải hủy được trước bàn giao, HTTP ${cancelled.status}`);
        }
        stock = await MongoDB.client.db().collection("sach").findOne({ MaSach: cancellationBookCode }, { projection: { SoQuyen: 1 } });
        if (stock?.SoQuyen !== 1) throw new Error(`Hủy phiếu ChoNhan phải hoàn cuốn đã giữ, tồn=${stock?.SoQuyen}`);
    });

    await assert("TC-BORROW-EXPIRY-01: Phiếu quá hạn nhận đóng và hoàn lại sách", async () => {
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() - 4);
        const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const inserted = await MongoDB.client.db().collection("theodoimuonsach").insertOne({
            MaDocGia: temporaryReaderId, MaSach: cancellationBookCode,
            NgayDangKy: dateKey(expiredAt), NgayDuyet: dateKey(expiredAt), HanNhan: dateKey(expiredAt),
            NgayMuon: null, NgayHenTra: null, NgayTra: null, MSNV: temporaryStaffCode,
            TrangThai: "ChoNhan", GiaTriBoiThuong: 0, GhiChu: "Fixture kiểm thử hạn nhận", CreatedAt: new Date(),
        });
        cancellationBorrowIds.push(String(inserted.insertedId));
        await MongoDB.client.db().collection("sach").updateOne({ MaSach: cancellationBookCode }, { $inc: { SoQuyen: -1 } });

        const listed = await request("GET", "/api/theodoimuonsach", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        const expiredRecord = listed.data.find((item) => item._id === String(inserted.insertedId));
        const stock = await MongoDB.client.db().collection("sach").findOne({ MaSach: cancellationBookCode }, { projection: { SoQuyen: 1 } });
        if (expiredRecord?.TrangThai !== "QuaHanNhan" || stock?.SoQuyen !== 1) {
            throw new Error(`Phiếu quá hạn phải thành QuaHanNhan và hoàn kho; trạng thái=${expiredRecord?.TrangThai}, tồn=${stock?.SoQuyen}`);
        }
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
    await assert("TC-BORROW-05: Duyệt giữ sách, bàn giao mới bắt đầu hạn mượn 14 ngày", async () => {
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
                role: "STAFF",
                type: "reader",
                sessionVersion: JwtUtil.verify(temporaryReaderToken).sessionVersion || 0,
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
            res.data.data.TrangThai !== "ChoNhan" ||
            res.data.data.MSNV !== temporaryStaffCode ||
            res.data.data.NgayMuon !== null || res.data.data.NgayHenTra !== null || !res.data.data.HanNhan
        ) {
            throw new Error(`Kỳ vọng HTTP 200 & ChoNhan, không bắt đầu hạn mượn trước bàn giao; nhận status=${res.status}`);
        }
        const pickupDate = new Date();
        pickupDate.setDate(pickupDate.getDate() + 3);
        const expectedPickupDate = `${pickupDate.getFullYear()}-${String(pickupDate.getMonth() + 1).padStart(2, "0")}-${String(pickupDate.getDate()).padStart(2, "0")}`;
        if (res.data.data.HanNhan !== expectedPickupDate) throw new Error(`HanNhan phải bằng ngày duyệt + 3; kỳ vọng=${expectedPickupDate}, thực tế=${res.data.data.HanNhan}`);
        const readerInbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (readerInbox.status !== 200 || !readerInbox.data.data.some((item) => item.LoaiThongBao === "PHIEU_DUYET_MUON")) {
            throw new Error("Độc giả không nhận được thông báo phiếu mượn đã duyệt.");
        }
        // Kiểm tra tồn kho TEST_SACH_99 giảm từ 10 còn 9
        const checkBook = await request("GET", `/api/sach/${testBookCode}`);
        if (checkBook.data.SoQuyen !== 9) {
            throw new Error(`Kỳ vọng SoQuyen=9, nhận ${checkBook.data.SoQuyen}`);
        }

        const unauthenticatedHandover = await request("PUT", `/api/theodoimuonsach/${borrowId}/giao-sach`);
        const readerHandover = await request("PUT", `/api/theodoimuonsach/${borrowId}/giao-sach`, null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (unauthenticatedHandover.status !== 401 || readerHandover.status !== 403) throw new Error("Chỉ nhân viên/Admin được xác nhận bàn giao.");
        const handover = await request("PUT", `/api/theodoimuonsach/${borrowId}/giao-sach`, null, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (handover.status !== 200 || handover.data.data.TrangThai !== "DangMuon" || !handover.data.data.NgayMuon || !handover.data.data.NgayHenTra) {
            throw new Error(`Bàn giao phải chuyển DangMuon và ghi mốc ngày, nhận HTTP ${handover.status}`);
        }
        const borrowDate = new Date(`${handover.data.data.NgayMuon}T00:00:00`);
        borrowDate.setDate(borrowDate.getDate() + 14);
        const expectedDueDate = `${borrowDate.getFullYear()}-${String(borrowDate.getMonth() + 1).padStart(2, "0")}-${String(borrowDate.getDate()).padStart(2, "0")}`;
        if (handover.data.data.NgayHenTra !== expectedDueDate) throw new Error(`Hạn trả phải là ngày bàn giao + 14; kỳ vọng=${expectedDueDate}, thực tế=${handover.data.data.NgayHenTra}`);
        const handedOverInbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (handedOverInbox.status !== 200 || !handedOverInbox.data.data.some((item) => item.LoaiThongBao === "PHIEU_GIAO_SACH")) {
            throw new Error("Độc giả chưa nhận được thông báo xác nhận bàn giao sách.");
        }
    });

    await assert("TC-BORROW-08: Độc giả gia hạn đúng điều kiện thêm 7 ngày", async () => {
        const path = `/api/theodoimuonsach/${borrowId}/gia-han`;
        const anonymous = await request("PUT", path);
        const staffAttempt = await request("PUT", path, null, { Authorization: `Bearer ${temporaryStaffToken}` });
        const otherReaderAttempt = await request("PUT", path, null, { Authorization: `Bearer ${temporaryOtherReaderToken}` });
        const forgedBody = await request("PUT", path, { MaDocGia: temporaryOtherReaderId }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (anonymous.status !== 401 || staffAttempt.status !== 403 || otherReaderAttempt.status !== 403 || forgedBody.status !== 400) {
            throw new Error(`Gia hạn phải giới hạn chủ phiếu ở độc giả hiện tại; HTTP anonymous/staff/other/forged=${anonymous.status}/${staffAttempt.status}/${otherReaderAttempt.status}/${forgedBody.status}`);
        }

        const borrows = MongoDB.client.db().collection("theodoimuonsach");
        const before = await borrows.findOne({ _id: new ObjectId(borrowId) });
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        await borrows.updateOne({ _id: new ObjectId(borrowId) }, { $set: { NgayHenTra: yesterdayKey } });
        const overdueAttempt = await request("PUT", path, null, { Authorization: `Bearer ${temporaryReaderToken}` });
        await borrows.updateOne({ _id: new ObjectId(borrowId) }, { $set: { NgayHenTra: before.NgayHenTra } });
        if (overdueAttempt.status !== 409) throw new Error(`Phiếu đã đến hạn không được gia hạn, nhận HTTP ${overdueAttempt.status}`);

        const concurrentAttempts = await Promise.all([
            request("PUT", path, null, { Authorization: `Bearer ${temporaryReaderToken}` }),
            request("PUT", path, null, { Authorization: `Bearer ${temporaryReaderToken}` }),
        ]);
        if (concurrentAttempts.filter((item) => item.status === 200).length !== 1 || concurrentAttempts.filter((item) => item.status === 409).length !== 1) {
            throw new Error(`Hai request đồng thời phải chỉ gia hạn thành công một lần, nhận HTTP ${concurrentAttempts.map((item) => item.status).join("/")}`);
        }
        const response = concurrentAttempts.find((item) => item.status === 200);
        const [year, month, day] = before.NgayHenTra.split("-").map(Number);
        const expected = new Date(year, month - 1, day);
        expected.setDate(expected.getDate() + 7);
        const expectedDate = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`;
        if (response.status !== 200 || response.data.data.NgayHenTra !== expectedDate || response.data.data.SoLanGiaHan !== 1 || !response.data.data.NgayGiaHan) {
            throw new Error(`Gia hạn phải cộng 7 ngày và ghi nhận một lần, HTTP=${response.status}, data=${JSON.stringify(response.data?.data)}`);
        }
        const repeated = await request("PUT", path, null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (repeated.status !== 409) throw new Error(`Không được gia hạn lần thứ hai, nhận HTTP ${repeated.status}`);

        const inbox = await request("GET", "/api/thongbao", null, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (inbox.status !== 200 || !inbox.data.data.some((item) => item.LoaiThongBao === "PHIEU_GIA_HAN")) {
            throw new Error("Thiếu thông báo xác nhận gia hạn.");
        }
        const audit = await request("GET", `/api/nhatkykiemtoan?MaDocGia=${encodeURIComponent(temporaryReaderId)}&HanhDong=PHIEU_GIA_HAN`, null, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (audit.status !== 200 || !audit.data.items?.some((entry) => entry.MaDoiTuong === borrowId && entry.ChiTiet?.SoNgayGiaHan === 7)) {
            throw new Error("Thiếu nhật ký kiểm toán cho thao tác gia hạn.");
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
        // Duyệt giữ sách trong 3 ngày; sách chưa được coi là đang mượn.
        const approval = await request(
            "PUT",
            `/api/theodoimuonsach/${lossBorrowId}/duyet`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (approval.status !== 200 || approval.data.data.MSNV !== temporaryAdminId || approval.data.data.TrangThai !== "ChoNhan") {
            throw new Error(`Admin phải duyệt được phiếu và được ghi nhận MSNV của token, nhận status=${approval.status}`);
        }

        const handover = await request(
            "PUT",
            `/api/theodoimuonsach/${lossBorrowId}/giao-sach`,
            null,
            { Authorization: `Bearer ${temporaryStaffToken}` }
        );
        if (handover.status !== 200 || handover.data.data.TrangThai !== "DangMuon") {
            throw new Error(`Phải xác nhận bàn giao trước khi báo mất sách, nhận status=${handover.status}`);
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

    // TC-STAFF-APPLICATION-01: Ứng viên chưa có quyền cho đến khi Admin duyệt hồ sơ.
    await assert("TC-STAFF-APPLICATION-01: Đăng ký, chặn đăng nhập chờ duyệt, Admin duyệt và audit", async () => {
        const phone = `08${String(Date.now()).slice(-8)}`;
        const submitted = await request("POST", "/api/yeu-cau-nhan-vien", {
            HoTenNV: "Ứng viên kiểm thử",
            SoDienThoai: phone,
            DiaChi: "Cần Thơ",
            MatKhau: "applicant_test_password",
        });
        if (submitted.data?.data?._id) testApplicationIds.push(String(submitted.data.data._id));
        if (submitted.status !== 201 || submitted.data.data.TrangThai !== "ChoDuyet" || "MatKhau" in submitted.data.data) {
            throw new Error(`Đăng ký hồ sơ không đúng, status=${submitted.status}`);
        }
        const blockedLogin = await request("POST", "/api/auth/staff-login", { phone: phone, password: "applicant_test_password" });
        if (blockedLogin.status !== 403 || blockedLogin.data.token || !blockedLogin.data.message.includes("chờ")) {
            throw new Error(`Hồ sơ chờ duyệt không bị chặn đúng, status=${blockedLogin.status}`);
        }
        const headers = { Authorization: `Bearer ${temporaryAdminToken}` };
        const anonymousList = await request("GET", "/api/yeu-cau-nhan-vien");
        const managerList = await request("GET", "/api/yeu-cau-nhan-vien", null, { Authorization: `Bearer ${temporaryStaffToken}` });
        if (anonymousList.status !== 401 || managerList.status !== 403) {
            throw new Error(`Hồ sơ đăng ký chưa được bảo vệ theo Admin-only, status=${anonymousList.status}/${managerList.status}`);
        }
        const pendingList = await request("GET", "/api/yeu-cau-nhan-vien", null, headers);
        const application = pendingList.data?.data?.find((item) => item._id === submitted.data.data._id);
        if (pendingList.status !== 200 || !application || "MatKhau" in application) {
            throw new Error("Admin không thấy hồ sơ chờ duyệt hoặc API làm lộ mật khẩu.");
        }
        const approved = await request("PUT", `/api/yeu-cau-nhan-vien/${application._id}/approve`, {}, headers);
        if (approved.data?.data?._id) testStaffObjectIds.push(String(approved.data.data._id));
        if (approved.status !== 200 || approved.data.data.ChucVu !== "STAFF" || !approved.data.data.MSNV || "MatKhau" in approved.data.data) {
            throw new Error(`Duyệt hồ sơ không tạo đúng tài khoản thủ thư, status=${approved.status}`);
        }
        const activeLogin = await request("POST", "/api/auth/staff-login", { phone: phone, password: "applicant_test_password" });
        if (activeLogin.status !== 200 || activeLogin.data.data.MSNV !== approved.data.data.MSNV) {
            throw new Error(`Nhân viên được duyệt không đăng nhập được, status=${activeLogin.status}`);
        }
        const stillReader = await MongoDB.client.db().collection("docgia").findOne({ MaDocGia: temporaryReaderId }, { projection: { VaiTro: 1 } });
        if (stillReader?.VaiTro !== "USER") throw new Error("Hồ sơ độc giả bị thay đổi khi tạo nhân viên mới.");
        const auditCount = await MongoDB.client.db().collection("nhatkykiemtoan").countDocuments({
            LoaiDoiTuong: "yeucaunhanvien", MaDoiTuong: application._id,
            HanhDong: { $in: ["NHANVIEN_DANG_KY", "NHANVIEN_DUYET_DANG_KY"] },
        });
        if (auditCount < 2) throw new Error("Thiếu nhật ký gửi/duyệt hồ sơ nhân viên.");
        await MongoDB.client.db().collection("thongbao").deleteMany({
            NguoiNhanId: new (require("mongodb").ObjectId)(approved.data.data._id),
            LoaiNguoiNhan: "nhanvien",
        });
        await MongoDB.client.db().collection("nhanvien").deleteOne({ _id: new (require("mongodb").ObjectId)(approved.data.data._id), MSNV: approved.data.data.MSNV });
        await MongoDB.client.db().collection("yeucaunhanvien").deleteOne({ _id: new (require("mongodb").ObjectId)(application._id) });
    });

    await assert("TC-STAFF-APPLICATION-02: Admin từ chối hồ sơ có lý do và chỉ ứng viên hợp lệ xem được trạng thái", async () => {
        const phone = `06${String(Date.now() + 1).slice(-8)}`;
        const submitted = await request("POST", "/api/yeu-cau-nhan-vien", {
            HoTenNV: "Ứng viên bị từ chối", SoDienThoai: phone, DiaChi: "Cần Thơ", MatKhau: "applicant_test_password",
        });
        if (submitted.data?.data?._id) testApplicationIds.push(String(submitted.data.data._id));
        if (submitted.status !== 201) throw new Error(`Không gửi được hồ sơ kiểm thử, status=${submitted.status}`);
        const headers = { Authorization: `Bearer ${temporaryAdminToken}` };
        const rejected = await request("PUT", `/api/yeu-cau-nhan-vien/${submitted.data.data._id}/reject`, { LyDoTuChoi: "Thiếu thông tin xác minh." }, headers);
        const login = await request("POST", "/api/auth/staff-login", { phone: phone, password: "applicant_test_password" });
        const saved = await MongoDB.client.db().collection("yeucaunhanvien").findOne({ _id: new (require("mongodb").ObjectId)(submitted.data.data._id) });
        if (rejected.status !== 200 || login.status !== 403 || !login.data.message.includes("Thiếu thông tin") || saved?.TrangThai !== "TuChoi") {
            throw new Error(`Từ chối hồ sơ chưa đúng, reject/login=${rejected.status}/${login.status}`);
        }
        const resubmitted = await request("POST", "/api/yeu-cau-nhan-vien", {
            HoTenNV: "Ứng viên bị từ chối", SoDienThoai: phone, DiaChi: "Cần Thơ", MatKhau: "applicant_new_password",
        });
        if (resubmitted.data?.data?._id) testApplicationIds.push(String(resubmitted.data.data._id));
        const previousPassword = await request("POST", "/api/auth/staff-login", { phone: phone, password: "applicant_test_password" });
        const newPassword = await request("POST", "/api/auth/staff-login", { phone: phone, password: "applicant_new_password" });
        if (resubmitted.status !== 201 || resubmitted.data.data.TrangThai !== "ChoDuyet" || previousPassword.status !== 401 || newPassword.status !== 403) {
            throw new Error("Ứng viên không thể gửi lại hồ sơ sau khi bị từ chối.");
        }
        await MongoDB.client.db().collection("yeucaunhanvien").deleteOne({ _id: saved._id });
    });

    await assert("TC-STAFF-APPLICATION-03: Endpoint cũ thăng cấp độc giả đã bị gỡ", async () => {
        const res = await request("PUT", `/api/docgia/${temporaryReaderId}/role`, { role: "STAFF" }, { Authorization: `Bearer ${temporaryAdminToken}` });
        if (res.status !== 404) throw new Error(`Route thăng cấp vẫn tồn tại, nhận HTTP ${res.status}`);
    });

    // TC-ADMIN-02: Admin xét gỡ độc giả khỏi danh sách đen
    await assert("TC-ADMIN-02: Gỡ khỏi danh sách đen sau xét duyệt và reset số lần vi phạm", async () => {
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
            reinstated.data.data.SoLanViPham !== 0
        ) {
            throw new Error(`Kỳ vọng gỡ khỏi danh sách đen và reset SoLanViPham=0, nhận status=${reinstated.status}, số lần vi phạm=${reinstated.data?.data?.SoLanViPham}`);
        }
        const reinstatementLog = await request(
            "GET",
            `/api/nhatkykiemtoan?MaDocGia=${encodeURIComponent(temporaryReaderId)}&HanhDong=DOCGIA_GO_DANH_SACH_DEN`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (
            reinstatementLog.status !== 200 ||
            !reinstatementLog.data.items?.some((entry) =>
                entry.ChiTiet?.Tu?.SoLanViPham === 3 && entry.ChiTiet?.Den?.SoLanViPham === 0
            )
        ) {
            throw new Error("Nhật ký kiểm toán phải ghi nhận việc đặt SoLanViPham từ 3 về 0.");
        }

        const borrowAfterReinstatement = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: testBookCode,
        }, { Authorization: `Bearer ${temporaryReaderToken}` });
        if (borrowAfterReinstatement.status !== 201) {
            throw new Error(`Phiên độc giả hiện tại phải mượn được sau khi Admin gỡ khỏi danh sách đen, nhận status=${borrowAfterReinstatement.status}, response=${JSON.stringify(borrowAfterReinstatement.data)}`);
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
    const testBookCodes = [testBookCode, zeroStockBookCode, cancellationBookCode].filter(Boolean);
    const db = MongoDB.client.db();
    // Dọn trực tiếp theo ID/mã fixture để teardown không phụ thuộc API hoặc tạo thêm audit log xóa.
    const borrowIds = [borrowId, lossBorrowId, ...cancellationBorrowIds].filter(Boolean).filter(ObjectId.isValid).map(id => new ObjectId(id));
    if (borrowIds.length) await db.collection("theodoimuonsach").deleteMany({ _id: { $in: borrowIds } });
    if (temporaryReaderId) await db.collection("docgia").deleteOne({ MaDocGia: temporaryReaderId });
    if (temporaryOtherReaderObjectId && ObjectId.isValid(temporaryOtherReaderObjectId)) {
        await db.collection("docgia").deleteOne({ _id: new ObjectId(temporaryOtherReaderObjectId) });
    }
    const staffObjectIds = testStaffObjectIds.filter(ObjectId.isValid).map(id => new ObjectId(id));
    if (staffObjectIds.length) await db.collection("nhanvien").deleteMany({ _id: { $in: staffObjectIds } });
    if (temporaryAdminId) await db.collection("nhanvien").deleteOne({ MSNV: temporaryAdminId });
    const applicationIds = testApplicationIds.filter(ObjectId.isValid).map(id => new ObjectId(id));
    if (applicationIds.length) await db.collection("yeucaunhanvien").deleteMany({ _id: { $in: applicationIds } });
    if (temporaryReaderObjectId && ObjectId.isValid(temporaryReaderObjectId)) {
        await db.collection("thongbao").deleteMany({ NguoiNhanId: new ObjectId(temporaryReaderObjectId) });
    }
    if (temporaryOtherReaderObjectId && ObjectId.isValid(temporaryOtherReaderObjectId)) {
        await db.collection("thongbao").deleteMany({ NguoiNhanId: new ObjectId(temporaryOtherReaderObjectId) });
    }
    if (staffObjectIds.length) await db.collection("thongbao").deleteMany({ NguoiNhanId: { $in: staffObjectIds } });
    await db.collection("thongbao").deleteMany({ TieuDe: "Thông báo kiểm thử" });

    // API xóa sách chỉ soft-delete; loại fixture khỏi DB sau khi kết thúc kiểm thử.
    // Dọn fixture cũ cùng dấu hiệu chính xác do các lượt chạy trước để sót.
    const testBookTitles = ["Giáo Trình Kiểm Thử Tự Động Web", "Sách kiểm thử hết kho", cancellationBookTitle].filter(Boolean);
    await db.collection("sach").deleteMany({
        $or: [
            { MaSach: { $in: testBookCodes } },
            { TenSach: "Giáo Trình Kiểm Thử Tự Động Web", TacGia: "Nhóm Tester CTU", MoTa: "Tài liệu phục vụ kiểm thử hệ thống" },
            { TenSach: "Sách kiểm thử hết kho", TacGia: "Kiểm thử", MoTa: "Fixture tự tạo" },
        ],
    });
    const testEntityIds = [borrowId, lossBorrowId, ...testApplicationIds].filter(Boolean).map(String);
    const testAuditConditions = [
        { MaSach: { $in: testBookCodes } },
        { TenSach: { $in: testBookTitles } },
        { MaDocGia: temporaryReaderId || "__no_test_reader__" },
        { MSNV: { $in: testStaffCodes } },
        { MaTacNhan: { $in: testStaffCodes } },
        { TenNhanVien: { $in: ["Nhân viên kiểm thử", "Quản trị kiểm thử", "Quản trị đã cập nhật", "Nhân viên nhận thông báo"] } },
        { TenTacNhan: { $in: ["Nhân viên kiểm thử", "Quản trị kiểm thử", "Quản trị đã cập nhật", "Nhân viên nhận thông báo"] } },
        { MaDoiTuong: { $in: testEntityIds } },
    ];
    await db.collection("nhatkykiemtoan").deleteMany({ $or: testAuditConditions });
    if (temporaryReaderObjectId) {
        await db.collection("thongbao").deleteMany({ NguoiNhanId: new (require("mongodb").ObjectId)(temporaryReaderObjectId) });
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
