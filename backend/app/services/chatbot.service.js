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

const DEFAULT_GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

function getValidatedGeminiEndpoint() {
    const apiKey = process.env.GEMINI_API_KEY?.trim() || config.gemini?.apiKey;
    const rawUrl =
        process.env.GEMINI_API_URL?.trim() ||
        config.gemini?.apiUrl ||
        DEFAULT_GEMINI_URL;

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

- Quy trình Báo mất sách & Đền bù (Hỗ trợ 2 phương thức: Chuyển khoản PayOS hoặc Trả trực tiếp tại quầy):
  + Bước 1: Khi làm mất sách đang mượn, độc giả vào trang "Hồ sơ cá nhân" (/profile) -> tab "Đang mượn" (hoặc tab "Lịch sử" nếu phiếu đã ở trạng thái Mất sách) -> bấm nút "Báo mất & Đền bù".
  + Bước 2: Nhập lý do làm mất sách và chọn 1 trong 2 phương thức đền bù (mức bồi thường bằng đúng 100% Đơn giá sách "DonGia"):
    * Cách 1 — Chuyển khoản trực tuyến qua PayOS (VietQR): Hệ thống tạo mã VietQR và link thanh toán PayOS; độc giả quét mã chuyển khoản rồi bấm "Tôi đã chuyển khoản — Gửi chờ duyệt".
    * Cách 2 — Đền bù trực tiếp tại quầy thư viện: Hệ thống ghi nhận yêu cầu đăng ký trả trực tiếp tại quầy (Mã biên nhận #...); độc giả đến quầy đóng tiền mặt để Thủ thư hoặc Quản trị viên xác nhận duyệt hoàn tất.
  + Bước 3: Thủ thư / Quản trị viên kiểm tra tại trang Quản lý Mượn - Trả ("/manager/borrows" -> tab "Đền bù mất sách") và bấm "Duyệt đền bù". Khi được duyệt, độc giả nhận thông báo hoàn tất ngay trên website. Độc giả cũng có thể đổi phương thức giữa PayOS và trực tiếp tại quầy trước khi giao dịch được duyệt.

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

        // Gemini yêu cầu lượt đầu tiên trong contents phải có role "user" và luân phiên user/model.
        const rawTurns = [];
        for (const turn of history) {
            if (!turn || typeof turn.text !== "string" || !turn.text.trim()) continue;
            rawTurns.push({
                role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
                text: turn.text.trim().slice(0, 1500),
            });
        }
        while (rawTurns.length && rawTurns[0].role !== "user") {
            rawTurns.shift();
        }
        rawTurns.push({ role: "user", text: message });

        const contents = [];
        for (const turn of rawTurns) {
            const last = contents[contents.length - 1];
            if (last && last.role === turn.role) {
                last.parts[0].text = `${last.parts[0].text}\n${turn.text}`;
            } else {
                contents.push({
                    role: turn.role,
                    parts: [{ text: turn.text }],
                });
            }
        }

        const payload = {
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            contents,
            generationConfig: {
                temperature: 0.4,
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
            signal: AbortSignal.timeout(30_000),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const errMsg = data?.error?.message || `HTTP ${response.status}`;
            console.warn(`[Chatbot] Gemini endpoint thất bại (${response.status}): ${errMsg}`);
            return null;
        }

        const candidateText = data?.candidates?.[0]?.content?.parts
            ?.filter((part) => !part.thought)
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
        try {
            reply = await this.callGeminiApi(systemInstruction, sanitizedHistory, cleanMessage);
        } catch (err) {
            console.warn(`[Chatbot] Lỗi kết nối Gemini API: ${err.message}`);
        }

        if (!reply) {
            const err = new Error("Trợ lý AI hiện đang bận hoặc tạm thời gián đoạn. Vui lòng thử lại sau giây lát.");
            err.statusCode = 503;
            throw err;
        }

        const suggestedBooks = this.findSuggestedBooks(cleanMessage, reply, context);

        return {
            reply,
            source: "gemini",
            suggestedBooks,
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = ChatbotService;
