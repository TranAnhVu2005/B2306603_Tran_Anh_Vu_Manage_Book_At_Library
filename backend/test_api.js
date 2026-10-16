const http = require("http");
const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");

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
    let temporaryStaffCode = null;
    let temporaryStaffToken = null;
    let temporaryAdminId = null;
    let temporaryAdminToken = null;

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
        const staff = await request("POST", "/api/nhanvien", {
            HoTenNV: "Nhân viên kiểm thử",
            ChucVu: "THUTHU",
            MatKhau: "staff_test_password"
        });
        if (staff.status !== 201) {
            throw new Error(`Không tạo được nhân viên kiểm thử, nhận status=${staff.status}`);
        }
        temporaryStaffId = staff.data.data.MSNV;
        temporaryStaffCode = staff.data.data.MSNV;

        const res = await request("POST", "/api/auth/login", { identifier: temporaryStaffCode, password: "staff_test_password" });
        temporaryStaffToken = res.data.token;
        if (
            res.status !== 200 ||
            res.data.data.ChucVu !== "THUTHU" ||
            !hasOnlyFields(res.data.data, ["_id", "MSNV", "HoTenNV", "ChucVu", "SoDienThoai", "DiaChi"])
        ) {
            throw new Error(`Kỳ vọng HTTP 200, chỉ trả trường ChucVu theo lược đồ nhân viên, nhận status=${res.status}`);
        }
    });

    // TC-AUTH-02: Đăng nhập sai mật khẩu bị chặn
    await assert("TC-AUTH-02: Đăng nhập sai mật khẩu (Báo lỗi 401)", async () => {
        const res = await request("POST", "/api/auth/login", { identifier: temporaryStaffCode, password: "wrong_password" });
        if (res.status !== 401) {
            throw new Error(`Kỳ vọng HTTP 401, nhận status=${res.status}`);
        }
    });

    // TC-AUTH-03: Đăng nhập Độc giả bằng số điện thoại
    await assert("TC-AUTH-03: Độc giả đăng nhập bằng SĐT", async () => {
        const reader = await request("POST", "/api/docgia", {
            HoLot: "Kiểm thử",
            Ten: "Đăng nhập",
            NgaySinh: "2000-01-01",
            Phai: 1,
            DienThoai: `09${String(Date.now()).slice(-8)}`,
            MatKhau: "reader_test_password"
        });
        if (reader.status !== 201) {
            throw new Error(`Không tạo được độc giả kiểm thử, nhận status=${reader.status}`);
        }
        temporaryReaderId = reader.data.data.MaDocGia;
        temporaryReaderPhone = reader.data.data.DienThoai;

        const res = await request("POST", "/api/auth/login", {
            identifier: reader.data.data.DienThoai,
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

    await assert("TC-STATUS-01: Từ chối trạng thái thẻ không chuẩn", async () => {
        const res = await request("POST", "/api/docgia", {
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

        const updated = await request(
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
        const admin = await request("POST", "/api/nhanvien", {
            HoTenNV: "Quản trị kiểm thử",
            ChucVu: "ADMIN",
            MatKhau: "admin_test_password"
        });
        if (admin.status !== 201) {
            throw new Error(`Không tạo được Admin kiểm thử, nhận status=${admin.status}`);
        }
        temporaryAdminId = admin.data.data.MSNV;

        const login = await request("POST", "/api/auth/login", {
            identifier: temporaryAdminId,
            password: "admin_test_password"
        });
        const adminToken = login.data?.token;
        const adminObjectId = login.data?.data?._id;
        if (login.status !== 200 || !adminToken || !adminObjectId) {
            throw new Error(`Không đăng nhập được Admin kiểm thử, nhận status=${login.status}`);
        }
        temporaryAdminToken = adminToken;

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
                SoDienThoai: "0901234567",
                DiaChi: "Cần Thơ",
                ChucVu: "THUTHU",
                MatKhau: "attacker_password"
            },
            { Authorization: `Bearer ${adminToken}` }
        );
        if (
            updated.status !== 200 ||
            updated.data.data.HoTenNV !== "Quản trị đã cập nhật" ||
            updated.data.data.SoDienThoai !== "0901234567" ||
            updated.data.data.DiaChi !== "Cần Thơ" ||
            updated.data.data.ChucVu !== "ADMIN" ||
            Object.prototype.hasOwnProperty.call(updated.data.data, "MatKhau")
        ) {
            throw new Error(`Kỳ vọng chỉ cập nhật trường cá nhân, nhận status=${updated.status}`);
        }

        const originalPasswordLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryAdminId,
            password: "admin_test_password"
        });
        const injectedPasswordLogin = await request("POST", "/api/auth/login", {
            identifier: temporaryAdminId,
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
            MaSach: "TEST_SACH_99",
            TenSach: "Giáo Trình Kiểm Thử Tự Động Web",
            DonGia: 95000,
            SoQuyen: 10,
            NamXuatBan: 2024,
            MaNXB: "NXB-0001",
            TacGia: "Nhóm Tester CTU",
            MoTa: "Tài liệu phục vụ kiểm thử hệ thống"
        };
        const res = await request("POST", "/api/sach", newBook);
        if (
            res.status !== 201 ||
            res.data.data.MaSach !== "TEST_SACH_99" ||
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

    // TC-BOOK-02: Chặn thêm sách trùng MaSach
    await assert("TC-BOOK-02: Chặn thêm sách trùng mã MaSach", async () => {
        const dupBook = {
            MaSach: "TEST_SACH_99",
            TenSach: "Sách Trùng Mã",
            DonGia: 50000,
            SoQuyen: 2,
            MaNXB: "NXB-0001",
            TacGia: "Tester"
        };
        const res = await request("POST", "/api/sach", dupBook);
        if (res.status !== 400) {
            throw new Error(`Kỳ vọng HTTP 400 vì trùng mã, nhận status=${res.status}`);
        }
    });

    // TC-BORROW-01: Độc giả gửi phiếu yêu cầu mượn trực tuyến
    let borrowId = null;
    await assert("TC-BORROW-01: Độc giả gửi phiếu mượn (Trạng thái ChoDuyet)", async () => {
        const res = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: "TEST_SACH_99"
        });
        if (
            res.status !== 201 ||
            res.data.data.TrangThai !== "ChoDuyet" ||
            !hasOnlyFields(res.data.data, ["_id", "MaDocGia", "MaSach", "NgayMuon", "MSNV", "NgayHenTra", "NgayTra", "TrangThai", "GiaTriBoiThuong", "GhiChu"])
        ) {
            throw new Error(`Kỳ vọng HTTP 201 & ChoDuyet, nhận status=${res.status}`);
        }
        borrowId = res.data.data._id;
    });

    // TC-BORROW-02: Chặn mượn sách khi đã hết tồn kho (SACH-000003 SoQuyen = 0)
    await assert("TC-BORROW-02: Chặn mượn sách khi đã hết trong kho (SoQuyen == 0)", async () => {
        const res = await request("POST", "/api/theodoimuonsach", {
            MaDocGia: temporaryReaderId,
            MaSach: "SACH-000003"
        });
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
            MaSach: "TEST_SACH_99"
        });
        if (res.status !== 403) {
            throw new Error(`Kỳ vọng HTTP 403 từ chối mượn, nhận status=${res.status}`);
        }

        await readers.updateOne(
            { MaDocGia: temporaryReaderId },
            { $set: { TrangThaiThe: "HoatDong", SoLanViPham: 0 } }
        );
    });

    // TC-BORROW-05: Thủ thư duyệt đơn mượn (Kho giảm từ 10 xuống 9, gán MSNV và hạn trả 14 ngày)
    await assert("TC-BORROW-05: Thủ thư duyệt mượn, trừ kho và gán hạn trả 14 ngày", async () => {
        const res = await request("PUT", `/api/theodoimuonsach/${borrowId}/duyet`, { msnv: "NV-0002" });
        if (res.status !== 200 || res.data.data.TrangThai !== "DangMuon") {
            throw new Error(`Kỳ vọng HTTP 200 & DangMuon, nhận status=${res.status}`);
        }
        // Kiểm tra tồn kho TEST_SACH_99 giảm từ 10 còn 9
        const checkBook = await request("GET", "/api/sach/TEST_SACH_99");
        if (checkBook.data.SoQuyen !== 9) {
            throw new Error(`Kỳ vọng SoQuyen=9, nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-RETURN-01: Xác nhận trả sách đúng hạn (Kho hoàn về 10)
    await assert("TC-RETURN-01: Xác nhận trả sách đúng hạn và tự động hoàn kho", async () => {
        const res = await request("PUT", `/api/theodoimuonsach/${borrowId}/tra-sach`);
        if (res.status !== 200 || res.data.data.TrangThai !== "DaTra") {
            throw new Error(`Kỳ vọng HTTP 200 & DaTra, nhận status=${res.status}`);
        }
        // Kiểm tra tồn kho TEST_SACH_99 hoàn về 10
        const checkBook = await request("GET", "/api/sach/TEST_SACH_99");
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
            MaSach: "TEST_SACH_99"
        });
        if (borrowRes.status !== 201) {
            throw new Error(`Không tạo được phiếu mượn kiểm thử mất sách, nhận status=${borrowRes.status}`);
        }
        lossBorrowId = borrowRes.data.data._id;
        // Duyệt mượn -> kho còn 9
        await request("PUT", `/api/theodoimuonsach/${lossBorrowId}/duyet`);

        // Báo mất sách
        const lossRes = await request("PUT", `/api/theodoimuonsach/${lossBorrowId}/bao-mat`, {
            ghiChu: "Độc giả sơ ý làm rơi mất sách trên xe buýt"
        });

        if (lossRes.status !== 200 || lossRes.data.data.TrangThai !== "MatSach") {
            throw new Error(`Kỳ vọng HTTP 200 & MatSach, nhận status=${lossRes.status}`);
        }
        if (lossRes.data.data.GiaTriBoiThuong !== 95000) {
            throw new Error(`Kỳ vọng GiaTriBoiThuong=95000, nhận ${lossRes.data.data.GiaTriBoiThuong}`);
        }

        // Kiểm tra tồn kho vẫn giữ nguyên là 9 (không cộng lại)
        const checkBook = await request("GET", "/api/sach/TEST_SACH_99");
        if (checkBook.data.SoQuyen !== 9) {
            throw new Error(`Kỳ vọng SoQuyen=9 (không hoàn kho), nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-PAY-01: Khởi tạo phiên thanh toán MoMo cho tiền bồi thường mất sách
    await assert("TC-PAY-01: Khởi tạo yêu cầu thanh toán bồi thường qua cổng MoMo", async () => {
        const res = await request("POST", "/api/payment/momo/create", {
            borrowId: lossBorrowId,
            orderInfo: "Thanh toán đền bù mất sách TEST_SACH_99"
        });
        if (res.status !== 200 || !res.data.data.payUrl) {
            throw new Error(`Kỳ vọng HTTP 200 & payUrl, nhận status=${res.status}`);
        }
    });

    // TC-ADMIN-01: Admin nâng cấp quyền người dùng (VaiTro: MANAGER)
    await assert("TC-ADMIN-01: Admin nâng cấp quyền độc giả lên Thủ thư (MANAGER)", async () => {
        const res = await request("PUT", `/api/docgia/${temporaryReaderId}/role`, { role: "MANAGER" });
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

        const unlock = await request(
            "PUT",
            `/api/docgia/${temporaryReaderId}/unblock`,
            null,
            { Authorization: `Bearer ${temporaryAdminToken}` }
        );
        if (unlock.status !== 200 || unlock.data.data.TrangThaiThe !== "HoatDong" || unlock.data.data.SoLanViPham !== 2) {
            throw new Error(`Kỳ vọng mở khóa khẩn cấp và giữ SoLanViPham=2, nhận status=${unlock.status}`);
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
    await request("DELETE", `/api/theodoimuonsach/${borrowId}`);
    await request("DELETE", `/api/theodoimuonsach/${lossBorrowId}`);
    await request("DELETE", "/api/sach/TEST_SACH_99");
    if (temporaryReaderId) {
        await request("DELETE", `/api/docgia/${temporaryReaderId}`);
    }
    if (temporaryStaffId) {
        await request("DELETE", `/api/nhanvien/${temporaryStaffId}`);
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
