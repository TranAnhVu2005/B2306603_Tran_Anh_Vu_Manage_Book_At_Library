const config = require("../config");
const { calendarKey } = require("../utils/date.util");

const ALLOWED_GEMINI_HOSTS = new Set([
    "generativelanguage.googleapis.com",
    "aiplatform.googleapis.com",
]);

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

function getValidatedGeminiEndpoint() {
    const apiKey = process.env.GEMINI_API_KEY?.trim() || config.gemini?.apiKey;
    const rawUrl =
        process.env.GEMINI_API_URL?.trim() ||
        config.gemini?.apiUrl ||
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    if (!apiKey || !rawUrl) return null;

    try {
        const parsed = new URL(rawUrl);
        const host = parsed.hostname.toLowerCase();
        const isAllowedHost =
            ALLOWED_GEMINI_HOSTS.has(host) || host.endsWith("-aiplatform.googleapis.com");
        if (parsed.protocol !== "https:" || !isAllowedHost) {
            return null;
        }
        return { apiKey, apiUrl: parsed.toString() };
    } catch {
        return null;
    }
}

class ChatbotService {
    constructor(client) {
        this.client = client;
        this.db = client.db();
        this.Sach = this.db.collection("sach");
        this.TheLoai = this.db.collection("theloai");
        this.NhaXuatBan = this.db.collection("nhaxuatban");
        this.DocGia = this.db.collection("docgia");
        this.NhanVien = this.db.collection("nhanvien");
        this.TheoDoi = this.db.collection("theodoimuonsach");
        this.GiaoDich = this.db.collection("giaodichboithuong");
    }

    async buildLibraryContext(user = null) {
        const [books, genres, publishers] = await Promise.all([
            this.Sach.find(
                { deleted: { $ne: true } },
                {
                    projection: {
                        _id: 1,
                        MaSach: 1,
                        TenSach: 1,
                        DonGia: 1,
                        SoQuyen: 1,
                        NamXuatBan: 1,
                        MaNXB: 1,
                        MaTheLoai: 1,
                        TacGia: 1,
                        HinhAnh: 1,
                        MoTa: 1,
                    },
                }
            )
                .sort({ CreatedAt: -1, _id: -1 })
                .toArray(),
            this.TheLoai.find({}, { projection: { _id: 1, MaTheLoai: 1, TenTheLoai: 1, MoTa: 1 } })
                .sort({ MaTheLoai: 1 })
                .toArray(),
            this.NhaXuatBan.find({}, { projection: { _id: 1, MaNXB: 1, TENNXB: 1, DiaChi: 1 } })
                .sort({ MaNXB: 1 })
                .toArray(),
        ]);

        const genreMap = new Map(genres.map((g) => [g.MaTheLoai, g]));
        const publisherMap = new Map(publishers.map((p) => [p.MaNXB, p]));

        const enrichedBooks = books.map((b) => {
            const genre = genreMap.get(b.MaTheLoai);
            const pub = publisherMap.get(b.MaNXB);
            return {
                _id: b._id,
                MaSach: b.MaSach,
                TenSach: b.TenSach,
                TacGia: b.TacGia || "Chưa rõ",
                DonGia: Number(b.DonGia || 0),
                SoQuyen: Number(b.SoQuyen || 0),
                NamXuatBan: b.NamXuatBan || "Không rõ",
                MaTheLoai: b.MaTheLoai,
                TenTheLoai: genre?.TenTheLoai || "Chưa phân loại",
                MaNXB: b.MaNXB,
                TENNXB: pub?.TENNXB || b.MaNXB || "Không rõ",
                HinhAnh: b.HinhAnh || "",
                MoTa: b.MoTa || "Chưa có mô tả chi tiết cho đầu sách này.",
            };
        });

        let userContext = null;
        if (user?.type === "reader" && user?.username) {
            const [reader, borrows, transactions] = await Promise.all([
                this.DocGia.findOne(
                    { MaDocGia: user.username, deleted: { $ne: true } },
                    { projection: { MaDocGia: 1, HoLot: 1, Ten: 1, TrangThaiThe: 1, SoLanViPham: 1 } }
                ),
                this.TheoDoi.find({ MaDocGia: user.username })
                    .sort({ CreatedAt: -1, _id: -1 })
                    .limit(15)
                    .toArray(),
                this.GiaoDich.find({ MaDocGia: user.username })
                    .sort({ ThoiGianTao: -1, _id: -1 })
                    .limit(10)
                    .toArray(),
            ]);
            if (reader) {
                const bookTitleMap = new Map(enrichedBooks.map((b) => [b.MaSach, b.TenSach]));
                userContext = {
                    type: "reader",
                    MaDocGia: reader.MaDocGia,
                    HoTen: [reader.HoLot, reader.Ten].filter(Boolean).join(" "),
                    TrangThaiThe: reader.TrangThaiThe || "HoatDong",
                    SoLanViPham: Number(reader.SoLanViPham || 0),
                    borrows: borrows.map((item) => ({
                        _id: String(item._id),
                        MaSach: item.MaSach,
                        TenSach: bookTitleMap.get(item.MaSach) || item.MaSach,
                        TrangThai: item.TrangThai,
                        NgayDangKy: item.NgayDangKy ? calendarKey(item.NgayDangKy) : null,
                        HanNhan: item.HanNhan ? calendarKey(item.HanNhan) : null,
                        NgayMuon: item.NgayMuon ? calendarKey(item.NgayMuon) : null,
                        NgayHenTra: item.NgayHenTra ? calendarKey(item.NgayHenTra) : null,
                        SoLanGiaHan: Number(item.SoLanGiaHan || 0),
                        GiaTriBoiThuong: Number(item.GiaTriBoiThuong || 0),
                        GhiChu: item.GhiChu || "",
                    })),
                    transactions: transactions.map((tx) => ({
                        OrderCode: tx.OrderCode,
                        MaSach: tx.MaSach,
                        TenSach: tx.TenSach,
                        SoTien: tx.SoTien,
                        TrangThaiPayOS: tx.TrangThaiPayOS,
                        TrangThaiDuyet: tx.TrangThaiDuyet,
                        LyDoTuChoi: tx.LyDoTuChoi || null,
                    })),
                };
            }
        } else if (user?.type === "staff" && user?.username) {
            const [staff, pendingCount, pickupCount, borrowingCount, lostCount, pendingPayosCount] =
                await Promise.all([
                    this.NhanVien.findOne(
                        { MSNV: user.username, deleted: { $ne: true } },
                        { projection: { MSNV: 1, HoTenNV: 1, ChucVu: 1 } }
                    ),
                    this.TheoDoi.countDocuments({ TrangThai: "ChoDuyet" }),
                    this.TheoDoi.countDocuments({ TrangThai: "ChoNhan" }),
                    this.TheoDoi.countDocuments({ TrangThai: "DangMuon" }),
                    this.TheoDoi.countDocuments({ TrangThai: "MatSach" }),
                    this.GiaoDich.countDocuments({ TrangThaiDuyet: "ChoDuyet" }),
                ]);
            if (staff) {
                userContext = {
                    type: "staff",
                    MSNV: staff.MSNV,
                    HoTenNV: staff.HoTenNV,
                    ChucVu: staff.ChucVu,
                    stats: {
                        pendingCount,
                        pickupCount,
                        borrowingCount,
                        lostCount,
                        pendingPayosCount,
                    },
                };
            }
        }

        return {
            books: enrichedBooks,
            genres,
            publishers,
            userContext,
        };
    }

    buildSystemInstruction(context) {
        const { books, genres, publishers, userContext } = context;
        const totalTitles = books.length;
        const availableTitles = books.filter((b) => b.SoQuyen > 0).length;
        const totalCopies = books.reduce((sum, b) => sum + b.SoQuyen, 0);

        const genresText = genres
            .map((g) => {
                const count = books.filter((b) => b.MaTheLoai === g.MaTheLoai).length;
                return `- [${g.MaTheLoai}] ${g.TenTheLoai} (${count} đầu sách): ${g.MoTa || ""}`;
            })
            .join("\n");

        const publishersText = publishers
            .map((p) => `- [${p.MaNXB}] ${p.TENNXB} (Địa chỉ: ${p.DiaChi || "—"})`)
            .join("\n");

        const booksText = books
            .map(
                (b) =>
                    `- Mã: ${b.MaSach} | Tên: "${b.TenSach}" | Tác giả: ${b.TacGia} | Thể loại: ${b.TenTheLoai} (${b.MaTheLoai}) | NXB: ${b.TENNXB} | Năm XB: ${b.NamXuatBan} | Đơn giá/Đền bù: ${b.DonGia.toLocaleString("vi-VN")} ₫ | Tồn kho: ${b.SoQuyen} quyển (${b.SoQuyen > 0 ? "Còn sách" : "Tạm hết sách"}) | Nội dung: ${b.MoTa}`
            )
            .join("\n");

        let sessionText = "Người dùng hiện tại: Khách chưa đăng nhập (hoặc đang xem danh mục công khai).";
        if (userContext?.type === "reader") {
            const activeBorrows = userContext.borrows.filter((b) =>
                ["ChoDuyet", "ChoNhan", "DangMuon"].includes(b.TrangThai)
            );
            sessionText = [
                `Người dùng hiện tại là ĐỘC GIẢ: ${userContext.HoTen} (Mã thẻ: ${userContext.MaDocGia}).`,
                `- Trạng thái thẻ: ${userContext.TrangThaiThe} | Số lần vi phạm: ${userContext.SoLanViPham}/3.`,
                `- Số phiếu đang lưu thông: ${activeBorrows.length}/3 quyển tối đa.`,
                userContext.borrows.length
                    ? `- Các phiếu mượn gần đây:\n${userContext.borrows
                          .map(
                              (b) =>
                                  `  * [${b.MaSach}] "${b.TenSach}" - Trạng thái: ${b.TrangThai} | Hạn nhận: ${b.HanNhan || "—"} | Hạn trả: ${b.NgayHenTra || "—"} | Gia hạn: ${b.SoLanGiaHan}/1 | Bồi thường: ${b.GiaTriBoiThuong.toLocaleString("vi-VN")} ₫`
                          )
                          .join("\n")}`
                    : "- Độc giả chưa có phiếu mượn nào.",
                userContext.transactions.length
                    ? `- Giao dịch đền bù mất sách PayOS:\n${userContext.transactions
                          .map(
                              (t) =>
                                  `  * Đơn PayOS #${t.OrderCode} cho sách "${t.TenSach}" (${t.SoTien.toLocaleString("vi-VN")} ₫) - PayOS: ${t.TrangThaiPayOS} - Trạng thái duyệt: ${t.TrangThaiDuyet}${t.LyDoTuChoi ? ` (Lý do từ chối: ${t.LyDoTuChoi})` : ""}`
                          )
                          .join("\n")}`
                    : "",
            ]
                .filter(Boolean)
                .join("\n");
        } else if (userContext?.type === "staff") {
            sessionText = [
                `Người dùng hiện tại là NHÂN VIÊN QUẢN LÝ: ${userContext.HoTenNV} (Mã NV: ${userContext.MSNV}, Chức vụ: ${userContext.ChucVu}).`,
                `- Thống kê vận hành trực tiếp: ${userContext.stats.pendingCount} phiếu chờ duyệt, ${userContext.stats.pickupCount} phiếu chờ nhận sách, ${userContext.stats.borrowingCount} phiếu đang mượn, ${userContext.stats.lostCount} phiếu mất sách, ${userContext.stats.pendingPayosCount} giao dịch đền bù PayOS đang chờ quản trị viên duyệt.`,
            ].join("\n");
        }

        return `Bạn là "Trợ lý Thư viện CTU" — trợ lý AI thông minh của Hệ Thống Quản Lý Mượn Sách Thư Viện (Học phần CT449 - Khoa CNTT&TT - Đại học Cần Thơ).
Nhiệm vụ của bạn là hỗ trợ độc giả, thủ thư và quản trị viên một cách tận tình, chính xác 100% theo dữ liệu thực tế của thư viện dưới đây.

=== 1. KIẾN THỨC TOÀN DIỆN VỀ WEBSITE & QUY ĐỊNH NGHIỆP VỤ ===
- Kiến trúc hệ thống gồm 2 cổng giao diện thiết kế theo phong cách Neo-brutalism (Vàng #FDC800, Tím #432DD7, Mực #111111, Giấy ấm #FFFDF2):
  1) Cổng Độc giả (USER):
     + Trang chủ & Danh mục sách ("/" hoặc "/books"): Tìm kiếm không phân biệt dấu theo tên sách, tác giả, mã sách; bộ lọc Thể loại, Nhà xuất bản, Khoảng giá (Dưới 50.000₫, 50.000₫-100.000₫, 100.000₫-250.000₫, Từ 250.000₫) và Chỉ sách còn trong kho; phân trang 10 sách/trang.
     + Chi tiết sách ("/books/:id"): Xem ảnh bìa, mã sách, thể loại, NXB, năm xuất bản, đơn giá bảo lưu, số lượng tồn kho, mô tả nội dung và nút "Đăng ký mượn".
     + Đăng nhập ("/login"): Đăng nhập bằng Số điện thoại + Mật khẩu hoặc tài khoản Google. Đăng ký thẻ mới tại "/register".
     + Hồ sơ cá nhân ("/profile"): Chỉnh sửa thông tin, tải ảnh đại diện (JPEG/PNG/WebP tối đa 5 MiB); quản lý 3 tab "Đang mượn", "Chờ xử lý", "Lịch sử".
  2) Cổng Quản lý (STAFF / ADMIN):
     + Tra cứu sách nội bộ ("/catalog", "/catalog/books/:id").
     + Quản lý Mượn - Trả & Phê duyệt ("/manager/borrows"): Duyệt giữ sách, xác nhận bàn giao tại quầy, xác nhận trả sách, báo mất sách và duyệt/từ chối giao dịch chuyển khoản đền bù PayOS.
     + Quản lý Kho sách ("/manager/books"), Quản lý Nhà xuất bản ("/manager/publishers").
     + Quản trị viên (ADMIN): Quản lý tài khoản người dùng & nhân viên ("/admin/users"), xét duyệt hồ sơ ứng tuyển nhân viên ("/admin/staff-applications"), tra cứu nhật ký kiểm toán ("/admin/audit-logs"), khôi phục sách/tài khoản xóa mềm.

- Quy định Mượn - Trả & Kỷ luật tự động:
  + Định mức mượn: Mỗi độc giả được mượn tối đa 03 cuốn đang lưu thông (gồm Chờ duyệt, Chờ nhận sách, Đang mượn).
  + Duyệt & Giữ sách 3 ngày: Khi thủ thư duyệt yêu cầu ("ChoDuyet" -> "ChoNhan"), hệ thống giữ 1 cuốn trong kho và cho độc giả 03 ngày để đến quầy nhận sách. Nếu quá 3 ngày không nhận, phiếu tự động chuyển sang "QuaHanNhan" và hoàn sách về kho.
  + Hạn mượn 14 ngày: Chỉ bắt đầu tính từ thời điểm thủ thư bấm "Xác nhận giao sách" tại quầy ("ChoNhan" -> "DangMuon").
  + Gia hạn trực tuyến: Độc giả được gia hạn tối đa 01 lần thêm 07 ngày cho mỗi phiếu đang mượn ("DangMuon") ngay tại trang Hồ sơ cá nhân ("/profile"), với điều kiện thực hiện TRƯỚC ngày đến hạn trả.
  + Hủy yêu cầu: Độc giả có thể hủy phiếu khi đang ở trạng thái "ChoDuyet" hoặc "ChoNhan" (trước khi nhận sách). Nếu hủy phiếu "ChoNhan", sách giữ được hoàn lại kho ngay lập tức.
  + Vi phạm & Danh sách đen: Trả sách trễ hạn hoặc làm mất sách sẽ tăng 01 lần vi phạm ("SoLanViPham"). Khi đạt 03 lần vi phạm, thẻ tự động chuyển sang "DanhSachDen" (tạm dừng quyền đăng ký mượn sách mới cho đến khi Admin xét gỡ). Khác với trạng thái "Khoa" (khóa khẩn cấp tài khoản, không thể đăng nhập).

- Quy trình Báo mất sách & Đền bù trực tuyến qua PayOS (Không cần đến trực tiếp):
  + Bước 1: Khi làm mất sách đang mượn, độc giả vào trang "Hồ sơ cá nhân" (/profile) -> tab "Đang mượn" (hoặc tab "Lịch sử" nếu phiếu đã ở trạng thái Mất sách) -> bấm nút "Báo mất & Đền bù" (hoặc "Đền bù qua PayOS").
  + Bước 2: Nhập lý do làm mất sách và xác nhận. Hệ thống ghi nhận trạng thái "MatSach", tính mức tiền đền bù bằng đúng 100% Đơn giá sách ("DonGia") và tự động tạo mã QR chuyển khoản PayOS (kèm đường dẫn cổng thanh toán PayOS).
  + Bước 3: Độc giả quét mã VietQR bằng ứng dụng ngân hàng để chuyển khoản đúng số tiền và nội dung, sau đó bấm "Tôi đã chuyển khoản — Gửi chờ duyệt" (hoặc hệ thống tự động đồng bộ từ PayOS).
  + Bước 4: Giao dịch chuyển sang trạng thái "Chờ quản trị viên duyệt" (ChoDuyet). Quản trị viên kiểm tra tại trang Quản lý Mượn - Trả và bấm "Duyệt đền bù". Khi được duyệt, độc giả nhận thông báo hoàn tất đền bù ngay trên website.

=== 2. THỐNG KÊ KHO SÁCH HIỆN TẠI ===
- Tổng số đầu sách đang phục vụ: ${totalTitles} đầu sách (${availableTitles} đầu sách còn trong kho, tổng cộng ${totalCopies} quyển).

=== 3. DANH MỤC THỂ LOẠI SÁCH ===
${genresText}

=== 4. DANH MỤC NHÀ XUẤT BẢN ===
${publishersText}

=== 5. CHI TIẾT TOÀN BỘ SÁCH TRONG THƯ VIỆN ===
${booksText}

=== 6. THÔNG TIN PHIÊN NGƯỜI DÙNG HIỆN TẠI ===
${sessionText}

=== QUY TẮC TRẢ LỜI ===
- Trả lời bằng tiếng Việt tự nhiên, thân thiện, rõ ràng, trình bày dễ đọc (dùng gạch đầu dòng khi liệt kê).
- Khi tư vấn chọn sách, thể loại hoặc mô tả nội dung sách: luôn dựa vào danh sách sách thực tế ở Mục 5, nêu rõ Tên sách, Mã sách, Tác giả, Thể loại, Đơn giá, Số lượng tồn kho và tóm tắt nội dung cuốn sách đó.
- Tuyệt đối không bịa đặt đầu sách không có trong thư viện. Nếu người dùng hỏi sách hoặc chủ đề chưa có, hãy thông báo lịch sự và gợi ý các cuốn sách gần gũi nhất đang có sẵn trong kho.`;
    }

    async callGeminiApi(systemInstruction, history, message) {
        const endpoint = getValidatedGeminiEndpoint();
        if (!endpoint) return null;

        const contents = [];
        for (const turn of history) {
            if (!turn || typeof turn.text !== "string" || !turn.text.trim()) continue;
            contents.push({
                role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
                parts: [{ text: turn.text.trim().slice(0, 1500) }],
            });
        }
        contents.push({
            role: "user",
            parts: [{ text: message }],
        });

        const payload = {
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            contents,
            generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 1024,
            },
        };

        const response = await fetch(endpoint.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": endpoint.apiKey,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(18_000),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return null;
        }

        const candidateText = data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        return candidateText || null;
    }

    findSuggestedBooks(message, replyText, context) {
        const { books, genres } = context;
        if (!books.length) return [];

        const qNorm = normalizeText(message);
        const rNorm = normalizeText(replyText || "");
        const combinedQuery = `${qNorm} ${rNorm}`;
        const queryTokens = qNorm
            .split(/[^a-z0-9]+/)
            .filter((tok) => tok.length >= 2 && !["sach", "cuon", "quyen", "cho", "toi", "minh", "ve", "cua", "trong", "thu", "vien", "co", "khong", "nao", "giup", "tu", "van", "chon", "tim", "mo", "ta", "noi", "dung", "the", "loai"].includes(tok));

        // Kiểm tra người dùng có đang hỏi về sách, thể loại, mô tả, gợi ý hay không
        const isBookRelated =
            /sach|tu van|goi y|the loai|noi dung|mo ta|tac gia|nxb|nha xuat ban|lap trinh|cong nghe|van hoc|kinh te|khoa hoc|lich su|ky nang|gia|con kho|muon|doc/.test(
                qNorm
            ) || books.some((b) => combinedQuery.includes(normalizeText(b.MaSach)) || qNorm.includes(normalizeText(b.TenSach)));

        if (!isBookRelated && !rNorm.includes("sach-")) {
            return [];
        }

        const matchedGenres = genres
            .filter((g) => qNorm.includes(normalizeText(g.TenTheLoai)) || qNorm.includes(normalizeText(g.MaTheLoai)))
            .map((g) => g.MaTheLoai);

        const scored = books.map((book) => {
            let score = 0;
            const titleNorm = normalizeText(book.TenSach);
            const authorNorm = normalizeText(book.TacGia);
            const codeNorm = normalizeText(book.MaSach);
            const genreNorm = normalizeText(book.TenTheLoai);
            const descNorm = normalizeText(book.MoTa);
            const pubNorm = normalizeText(book.TENNXB);

            if (qNorm.includes(codeNorm)) score += 100;
            if (rNorm.includes(codeNorm)) score += 60;
            if (titleNorm && qNorm.includes(titleNorm)) score += 90;
            if (titleNorm && rNorm.includes(titleNorm)) score += 50;
            if (matchedGenres.includes(book.MaTheLoai)) score += 45;
            if (genreNorm && qNorm.includes(genreNorm)) score += 40;
            if (authorNorm && qNorm.includes(authorNorm)) score += 45;

            for (const token of queryTokens) {
                if (titleNorm.includes(token)) score += 14;
                if (genreNorm.includes(token)) score += 12;
                if (authorNorm.includes(token)) score += 10;
                if (descNorm.includes(token)) score += 8;
                if (pubNorm.includes(token)) score += 6;
            }

            if (book.SoQuyen > 0) score += 3;
            return { book, score };
        });

        const positive = scored
            .filter((item) => item.score > 5)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map((item) => item.book);

        if (positive.length > 0) {
            return positive;
        }

        // Nếu người dùng hỏi gợi ý sách chung chung ("tư vấn chọn sách", "sách hay", "có sách gì")
        if (/tu van|goi y|chon sach|sach hay|sach nao|danh sach sach|co sach gi/.test(qNorm)) {
            return books
                .filter((b) => b.SoQuyen > 0)
                .slice(0, 4);
        }

        return [];
    }

    generateSmartLocalAnswer(message, context) {
        const { books, genres, publishers, userContext } = context;
        const qNorm = normalizeText(message);

        // 1. Hỏi về báo mất sách / PayOS / đền bù / chuyển khoản
        if (/mat sach|bao mat|den bu|boi thuong|payos|chuyen khoan|qr/.test(qNorm)) {
            const lines = [
                "### Hướng dẫn Báo mất sách & Đền bù trực tuyến qua PayOS",
                "Khi làm mất sách, bạn **không cần đến trực tiếp thư viện** mà có thể báo cáo và chuyển khoản đền bù ngay trên website theo 4 bước:",
                "1. **Báo mất trực tuyến**: Đăng nhập vào cổng Độc giả → mở **Hồ sơ cá nhân (`/profile`)** → ở tab **Đang mượn** (hoặc **Lịch sử**), nhấn nút **\"Báo mất & Đền bù\"** cạnh cuốn sách bị mất và nhập lý do.",
                "2. **Nhận mã QR PayOS**: Hệ thống tự động ghi nhận phiếu sang trạng thái **Mất sách**, tính tiền bồi thường bằng **100% đơn giá sách (`DonGia`)** và khởi tạo **mã VietQR / cổng thanh toán PayOS**.",
                "3. **Chuyển khoản & Xác nhận**: Bạn quét mã QR bằng ứng dụng ngân hàng để chuyển khoản đúng số tiền & nội dung, sau đó bấm **\"Tôi đã chuyển khoản — Gửi chờ duyệt\"**.",
                "4. **Đợi Quản trị viên duyệt**: Yêu cầu chuyển sang trạng thái **Chờ duyệt đền bù**. Sau khi Quản trị viên kiểm tra và bấm **Duyệt đền bù**, bạn sẽ nhận được thông báo hoàn tất ngay trên chuông thông báo của website.",
            ];
            if (userContext?.type === "reader" && userContext.transactions?.length) {
                lines.push("\n**Giao dịch đền bù gần đây của bạn:**");
                for (const tx of userContext.transactions.slice(0, 3)) {
                    const statusLabel =
                        tx.TrangThaiDuyet === "DaDuyet"
                            ? "Đã được Quản trị viên duyệt hoàn tất"
                            : tx.TrangThaiDuyet === "ChoDuyet"
                            ? "Đang chờ Quản trị viên duyệt"
                            : tx.TrangThaiDuyet === "TuChoi"
                            ? `Bị từ chối (${tx.LyDoTuChoi || "Vui lòng kiểm tra lại"})`
                            : "Đang chờ chuyển khoản";
                    lines.push(
                        `- Đơn **#${tx.OrderCode}** — Sách **"${tx.TenSach}"** (${Number(tx.SoTien || 0).toLocaleString("vi-VN")} ₫): **${statusLabel}**`
                    );
                }
            }
            return lines.join("\n");
        }

        // 2. Hỏi về thông tin cá nhân / phiếu mượn của tôi / trạng thái thẻ
        if (/phieu muon cua toi|sach toi dang muon|the cua toi|tai khoan cua toi|vi pham cua toi|lich su muon/.test(qNorm)) {
            if (!userContext) {
                return "Bạn hiện chưa đăng nhập. Vui lòng **Đăng nhập** (bằng Số điện thoại hoặc Google tại trang `/login`) để mình kiểm tra trạng thái thẻ, số lần vi phạm và danh sách phiếu mượn cá nhân của bạn nhé!";
            }
            if (userContext.type === "reader") {
                const active = userContext.borrows.filter((b) =>
                    ["ChoDuyet", "ChoNhan", "DangMuon"].includes(b.TrangThai)
                );
                const lines = [
                    `### Thông tin thẻ độc giả: **${userContext.HoTen}** (\`${userContext.MaDocGia}\`)`,
                    `- **Trạng thái thẻ**: ${userContext.TrangThaiThe === "HoatDong" ? "Đang hoạt động" : userContext.TrangThaiThe === "DanhSachDen" ? "Danh sách đen (Tạm dừng mượn mới)" : "Tạm khóa"}`,
                    `- **Số lần vi phạm**: ${userContext.SoLanViPham}/3`,
                    `- **Số sách đang lưu thông**: ${active.length}/3 quyển tối đa`,
                ];
                if (userContext.borrows.length) {
                    lines.push("\n**Các phiếu mượn gần nhất của bạn:**");
                    for (const b of userContext.borrows.slice(0, 5)) {
                        lines.push(
                            `- **"${b.TenSach}"** (\`${b.MaSach}\`): Trạng thái **${b.TrangThai}**${b.HanNhan && b.TrangThai === "ChoNhan" ? ` · Hạn nhận: ${b.HanNhan}` : ""}${b.NgayHenTra && b.TrangThai === "DangMuon" ? ` · Hạn trả: ${b.NgayHenTra}` : ""}${b.GiaTriBoiThuong > 0 ? ` · Đền bù: ${b.GiaTriBoiThuong.toLocaleString("vi-VN")} ₫` : ""}`
                        );
                    }
                } else {
                    lines.push("\nHiện tại bạn chưa có phiếu mượn nào.");
                }
                return lines.join("\n");
            }
            if (userContext.type === "staff") {
                return [
                    `### Xin chào ${userContext.ChucVu === "ADMIN" ? "Quản trị viên" : "Thủ thư"} **${userContext.HoTenNV}** (\`${userContext.MSNV}\`)`,
                    "Thống kê nhanh hệ thống hiện tại:",
                    `- **Chờ duyệt mượn**: ${userContext.stats.pendingCount} phiếu`,
                    `- **Chờ độc giả đến nhận**: ${userContext.stats.pickupCount} phiếu`,
                    `- **Đang mượn lưu hành**: ${userContext.stats.borrowingCount} phiếu`,
                    `- **Phiếu báo mất sách**: ${userContext.stats.lostCount} phiếu`,
                    `- **Giao dịch đền bù PayOS chờ duyệt**: ${userContext.stats.pendingPayosCount} giao dịch`,
                ].join("\n");
            }
        }

        // 3. Hỏi về quy định mượn sách, gia hạn, hạn trả, danh sách đen, website
        if (/quy dinh|luat|gioi han|may cuon|bao nhieu cuon|gia han|han tra|14 ngay|3 ngay|giu sach|danh sach den|vi pham|huong dan|website/.test(qNorm) && !/the loai|mo ta|noi dung/.test(qNorm)) {
            return [
                "### Quy định & Hướng dẫn sử dụng Hệ thống Thư viện CTU",
                "- **Định mức mượn**: Tối đa **03 cuốn** đang lưu thông (`Chờ duyệt`, `Chờ nhận sách`, `Đang mượn`).",
                "- **Duyệt & Giữ sách 03 ngày**: Sau khi thủ thư duyệt, sách được trừ tồn kho để giữ riêng cho bạn trong **03 ngày** (`Chờ nhận sách`). Nếu quá 3 ngày chưa nhận, phiếu tự động đóng (`Quá hạn nhận`) và hoàn sách về kho.",
                "- **Thời hạn mượn 14 ngày**: Bắt đầu tính từ ngày thủ thư xác nhận bàn giao sách thực tế tại quầy.",
                "- **Gia hạn trực tuyến**: Mỗi phiếu đang mượn được gia hạn **01 lần thêm 07 ngày** tại mục **Hồ sơ cá nhân (`/profile`)** (phải thực hiện trước ngày đến hạn trả).",
                "- **Hủy yêu cầu**: Bạn có thể hủy phiếu khi đang ở `Chờ duyệt` hoặc `Chờ nhận sách` trước khi nhận bàn giao.",
                "- **Kỷ luật & Danh sách đen**: Trả trễ hạn hoặc làm mất sách tăng **+1 lần vi phạm**. Đạt **03 lần vi phạm** thẻ sẽ vào **Danh sách đen** (`DanhSachDen`), tạm dừng đăng ký mượn mới cho đến khi Quản trị viên xét gỡ.",
                "- **Báo mất & Đền bù PayOS**: Có thể báo mất và quét mã QR PayOS để đền bù 100% đơn giá sách trực tuyến tại trang `/profile`, sau đó đợi Quản trị viên duyệt.",
            ].join("\n");
        }

        // 4. Hỏi về danh sách Thể loại sách
        if (/the loai|danh muc|nhung loai sach|phan loai/.test(qNorm) && !books.some((b) => qNorm.includes(normalizeText(b.TenSach)))) {
            const genreLines = genres.map((g) => {
                const genreBooks = books.filter((b) => b.MaTheLoai === g.MaTheLoai);
                const availCount = genreBooks.filter((b) => b.SoQuyen > 0).length;
                const sampleNames = genreBooks
                    .slice(0, 3)
                    .map((b) => `*"${b.TenSach}"*`)
                    .join(", ");
                return `- **${g.TenTheLoai}** (\`${g.MaTheLoai}\` — ${genreBooks.length} đầu sách, ${availCount} đầu sách còn kho): ${g.MoTa || " Đa dạng tài liệu học tập và tham khảo."}${sampleNames ? ` Tiêu biểu: ${sampleNames}.` : ""}`;
            });

            return [
                `### Các thể loại sách hiện có tại Thư viện (${genres.length} thể loại)`,
                ...genreLines,
                "\nBạn muốn mình tư vấn sâu hơn về thể loại nào hoặc mô tả nội dung cuốn sách nào, hãy nhắn tên thể loại/tên sách nhé!",
            ].join("\n");
        }

        // 5. Hỏi về Nhà xuất bản
        if (/nha xuat ban|nxb/.test(qNorm) && !books.some((b) => qNorm.includes(normalizeText(b.TenSach)))) {
            const pubLines = publishers.map((p) => {
                const count = books.filter((b) => b.MaNXB === p.MaNXB).length;
                return `- **${p.TENNXB}** (\`${p.MaNXB}\`): ${count} đầu sách — Địa chỉ: ${p.DiaChi || "—"}`;
            });
            return [
                `### Danh sách Nhà xuất bản liên kết (${publishers.length} NXB)`,
                ...pubLines,
            ].join("\n");
        }

        // 6. Tìm sách khớp trực tiếp để mô tả nội dung / tư vấn chọn sách
        const suggested = this.findSuggestedBooks(message, "", context);
        if (suggested.length === 1) {
            const b = suggested[0];
            return [
                `### Thông tin & Nội dung sách: **${b.TenSach}** (\`${b.MaSach}\`)`,
                `- **Tác giả**: ${b.TacGia}`,
                `- **Thể loại**: ${b.TenTheLoai} (\`${b.MaTheLoai}\`)`,
                `- **Nhà xuất bản**: ${b.TENNXB} (Năm xuất bản: ${b.NamXuatBan})`,
                `- **Đơn giá / Giá trị bảo lưu**: ${b.DonGia.toLocaleString("vi-VN")} ₫`,
                `- **Tình trạng kho**: ${b.SoQuyen > 0 ? `Còn **${b.SoQuyen} quyển** (Có thể đăng ký mượn ngay)` : "**Tạm hết sách**"}`,
                `- **Mô tả nội dung**: ${b.MoTa}`,
                "\nBạn có thể nhấn trực tiếp vào thẻ sách bên dưới để xem trang chi tiết và đăng ký mượn!",
            ].join("\n");
        }

        if (suggested.length > 1) {
            const listText = suggested
                .map(
                    (b, idx) =>
                        `${idx + 1}. **${b.TenSach}** (\`${b.MaSach}\`)\n   - **Tác giả**: ${b.TacGia} · **Thể loại**: ${b.TenTheLoai} · **NXB**: ${b.TENNXB}\n   - **Đơn giá**: ${b.DonGia.toLocaleString("vi-VN")} ₫ · **Tồn kho**: ${b.SoQuyen > 0 ? `Còn ${b.SoQuyen} quyển` : "Tạm hết sách"}\n   - **Tóm tắt nội dung**: ${b.MoTa}`
                )
                .join("\n\n");

            return [
                `Mình tìm thấy **${suggested.length} đầu sách** phù hợp nhất với yêu cầu của bạn trong thư viện:`,
                "",
                listText,
                "",
                "Bạn có thể bấm vào thẻ sách bên dưới để mở trang chi tiết hoặc hỏi mình thêm về bất kỳ cuốn sách nào nhé!",
            ].join("\n");
        }

        // 7. Tổng quan chung nếu câu hỏi mở
        const topBooks = books.filter((b) => b.SoQuyen > 0).slice(0, 4);
        const topLines = topBooks.map(
            (b) =>
                `- **${b.TenSach}** (\`${b.MaSach}\` — ${b.TenTheLoai}, Tác giả: ${b.TacGia}): Còn **${b.SoQuyen} quyển** · Giá: ${b.DonGia.toLocaleString("vi-VN")} ₫. *${b.MoTa}*`
        );

        return [
            `Xin chào! Mình là **Trợ lý Thư viện CTU**. Hiện thư viện đang có **${books.length} đầu sách** thuộc **${genres.length} thể loại** (${genres.map((g) => g.TenTheLoai).join(", ")}).`,
            "",
            "**Một số đầu sách nổi bật đang còn sẵn trong kho:**",
            ...topLines,
            "",
            "**Mình có thể hỗ trợ bạn:**",
            "- Tư vấn chọn sách theo chủ đề, thể loại, tác giả, mức giá hoặc mô tả chi tiết nội dung từng cuốn sách.",
            "- Giải đáp quy định mượn (tối đa 3 cuốn, giữ sách 3 ngày, hạn mượn 14 ngày, gia hạn 7 ngày).",
            "- Hướng dẫn **Báo mất sách & Chuyển khoản đền bù trực tuyến qua PayOS**.",
            "- Kiểm tra trạng thái thẻ và phiếu mượn cá nhân khi bạn đã đăng nhập.",
        ].join("\n");
    }

    async ask({ message, history = [] }, user = null) {
        const cleanMessage = String(message || "").trim();
        if (!cleanMessage) {
            const err = new Error("Vui lòng nhập nội dung câu hỏi cho trợ lý thư viện.");
            err.statusCode = 400;
            throw err;
        }
        if (cleanMessage.length > 1000) {
            const err = new Error("Câu hỏi không được vượt quá 1000 ký tự.");
            err.statusCode = 400;
            throw err;
        }

        const sanitizedHistory = Array.isArray(history)
            ? history
                  .slice(-8)
                  .filter((item) => item && typeof item === "object" && typeof item.text === "string")
                  .map((item) => ({
                      role: item.role === "assistant" ? "assistant" : "user",
                      text: String(item.text).trim().slice(0, 1500),
                  }))
            : [];

        const context = await this.buildLibraryContext(user);
        const systemInstruction = this.buildSystemInstruction(context);

        let reply = null;
        let source = "gemini";
        try {
            reply = await this.callGeminiApi(systemInstruction, sanitizedHistory, cleanMessage);
        } catch {
            reply = null;
        }

        if (!reply) {
            source = "library_knowledge_engine";
            reply = this.generateSmartLocalAnswer(cleanMessage, context);
        }

        const suggestedBooks = this.findSuggestedBooks(cleanMessage, reply, context);

        return {
            reply,
            source,
            suggestedBooks,
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = ChatbotService;
