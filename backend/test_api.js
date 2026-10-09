const http = require("http");

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const dataString = body ? JSON.stringify(body) : null;
        const options = {
            hostname: "127.0.0.1",
            port: 3000,
            path: path,
            method: method,
            headers: {
                "Content-Type": "application/json",
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
    console.log("=== BẮT ĐẦU CHẠY BỘ KIỂM THỬ BACKEND API (docs/06_TESTING.md) ===\n");
    let passed = 0;
    let failed = 0;

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

    // TC-AUTH-01: Đăng nhập Admin thành công
    await assert("TC-AUTH-01: Đăng nhập Admin thành công", async () => {
        const res = await request("POST", "/api/auth/login", { identifier: "ADMIN01", password: "admin123" });
        if (res.status !== 200 || res.data.data.role !== "ADMIN") {
            throw new Error(`Kỳ vọng 200 & ADMIN, nhận status=${res.status}, role=${res.data?.data?.role}`);
        }
    });

    // TC-AUTH-02: Đăng nhập sai mật khẩu
    await assert("TC-AUTH-02: Đăng nhập sai mật khẩu", async () => {
        const res = await request("POST", "/api/auth/login", { identifier: "ADMIN01", password: "wrong_password" });
        if (res.status !== 401) {
            throw new Error(`Kỳ vọng 401, nhận status=${res.status}`);
        }
    });

    // TC-BOOK-01: Thêm sách mới hợp lệ
    await assert("TC-BOOK-01: Thêm sách mới hợp lệ", async () => {
        const newBook = {
            MaSach: "TEST_S01",
            TenSach: "Sách Kiểm Thử Tự Động",
            DonGia: 99000,
            SoQuyen: 10,
            NamXuatBan: 2024,
            MaNXB: "NXB01",
            TacGia: "Tester",
            MoTa: "Sách dùng để test"
        };
        const res = await request("POST", "/api/sach", newBook);
        if (res.status !== 201 || res.data.data.MaSach !== "TEST_S01") {
            throw new Error(`Kỳ vọng 201, nhận status=${res.status}`);
        }
    });

    // TC-BOOK-02: Thêm sách trùng MaSach
    await assert("TC-BOOK-02: Thêm sách trùng MaSach", async () => {
        const dupBook = {
            MaSach: "TEST_S01",
            TenSach: "Sách Trùng",
            DonGia: 50000,
            SoQuyen: 2,
            MaNXB: "NXB01",
            TacGia: "Tester"
        };
        const res = await request("POST", "/api/sach", dupBook);
        if (res.status !== 400) {
            throw new Error(`Kỳ vọng 400 vì trùng mã, nhận status=${res.status}`);
        }
    });

    // TC-BORROW-01: Độc giả gửi yêu cầu mượn thành công (ChoDuyet)
    let borrowId = null;
    await assert("TC-BORROW-01: Độc giả gửi yêu cầu mượn thành công", async () => {
        const res = await request("POST", "/api/theodoimuonsach", { MaDocGia: "DG01", MaSach: "TEST_S01" });
        if (res.status !== 201 || res.data.data.TrangThai !== "ChoDuyet") {
            throw new Error(`Kỳ vọng 201 & ChoDuyet, nhận status=${res.status}`);
        }
        borrowId = res.data.data._id;
    });

    // TC-BORROW-02: Mượn sách khi đã hết kho (S03 SoQuyen = 0)
    await assert("TC-BORROW-02: Chặn mượn sách khi đã hết kho (SoQuyen == 0)", async () => {
        const res = await request("POST", "/api/theodoimuonsach", { MaDocGia: "DG01", MaSach: "S03" });
        if (res.status !== 400) {
            throw new Error(`Kỳ vọng 400 vì hết sách, nhận status=${res.status}`);
        }
    });

    // TC-BORROW-04: Độc giả Blacklist mượn sách (DG02)
    await assert("TC-BORROW-04: Chặn độc giả Blacklist mượn sách", async () => {
        const res = await request("POST", "/api/theodoimuonsach", { MaDocGia: "DG02", MaSach: "S01" });
        if (res.status !== 403) {
            throw new Error(`Kỳ vọng 403 từ chối mượn, nhận status=${res.status}`);
        }
    });

    // TC-BORROW-05: Thủ thư duyệt đơn mượn (Kho giảm 1)
    await assert("TC-BORROW-05: Thủ thư duyệt đơn mượn & tự động trừ kho", async () => {
        const res = await request("PUT", `/api/theodoimuonsach/${borrowId}/duyet`);
        if (res.status !== 200 || res.data.data.TrangThai !== "DangMuon") {
            throw new Error(`Kỳ vọng 200 & DangMuon, nhận status=${res.status}`);
        }
        // Kiểm tra tồn kho TEST_S01 từ 10 còn 9
        const checkBook = await request("GET", "/api/sach/TEST_S01");
        if (checkBook.data.SoQuyen !== 9) {
            throw new Error(`Kỳ vọng SoQuyen=9, nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-RETURN-01: Xác nhận trả sách đúng hạn (Kho tăng lại 1)
    await assert("TC-RETURN-01: Xác nhận trả sách đúng hạn & tự động hoàn kho", async () => {
        const res = await request("PUT", `/api/theodoimuonsach/${borrowId}/tra-sach`);
        if (res.status !== 200 || res.data.data.TrangThai !== "DaTra") {
            throw new Error(`Kỳ vọng 200 & DaTra, nhận status=${res.status}`);
        }
        // Kiểm tra tồn kho TEST_S01 hoàn về 10
        const checkBook = await request("GET", "/api/sach/TEST_S01");
        if (checkBook.data.SoQuyen !== 10) {
            throw new Error(`Kỳ vọng SoQuyen=10, nhận ${checkBook.data.SoQuyen}`);
        }
    });

    // TC-ADMIN-01: Admin nâng cấp quyền người dùng
    await assert("TC-ADMIN-01: Admin nâng cấp quyền người dùng (Role: MANAGER)", async () => {
        const res = await request("PUT", "/api/docgia/DG01/role", { role: "MANAGER" });
        if (res.status !== 200 || res.data.data.Role !== "MANAGER") {
            throw new Error(`Kỳ vọng 200 & Role MANAGER, nhận status=${res.status}`);
        }
    });

    // TC-ADMIN-02: Admin mở khóa Blacklist
    await assert("TC-ADMIN-02: Admin mở khóa Blacklist (reset vi phạm)", async () => {
        const res = await request("PUT", "/api/docgia/DG02/unblock");
        if (res.status !== 200 || res.data.data.TrangThaiThe !== "HoatDong" || res.data.data.SoLanViPham !== 0) {
            throw new Error(`Kỳ vọng 200 & TrangThaiThe HoatDong & SoLanViPham=0, nhận status=${res.status}`);
        }
    });

    // Dọn dẹp sách test
    await request("DELETE", "/api/sach/TEST_S01");

    console.log(`\n=== TỔNG KẾT KIỂM THỬ: ${passed} PASSED, ${failed} FAILED ===`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error("Lỗi chạy kiểm thử:", err);
    process.exit(1);
});
