const auditFields = {
    _id: 1, HanhDong: 1, LoaiDoiTuong: 1, MaDoiTuong: 1,
    MaSach: 1, TenSach: 1, MaDocGia: 1, TenDocGia: 1, MSNV: 1, TenNhanVien: 1,
    LoaiTacNhan: 1, MaTacNhan: 1, TenTacNhan: 1, ChiTiet: 1, ThoiGian: 1,
};

const actionNames = {
    BOOK_CREATED: "SACH_TAO", BOOK_UPDATED: "SACH_CAP_NHAT", BOOK_SOFT_DELETED: "SACH_XOA_MEM",
    BOOK_RESTORED: "SACH_KHOI_PHUC", BORROW_REQUESTED: "PHIEU_DANG_KY_MUON",
    BORROW_APPROVED: "PHIEU_DUYET_MUON", BORROW_REJECTED: "PHIEU_TU_CHOI_MUON",
    BOOK_RETURNED: "PHIEU_TRA_SACH", BOOK_REPORTED_LOST: "PHIEU_BAO_MAT_SACH",
    BORROW_CANCELLED: "PHIEU_HUY_DANG_KY",
    BORROW_RECORD_DELETED: "PHIEU_XOA",
    NHANVIEN_DANG_KY: "NHANVIEN_DANG_KY",
    NHANVIEN_DUYET_DANG_KY: "NHANVIEN_DUYET_DANG_KY",
    NHANVIEN_TU_CHOI_DANG_KY: "NHANVIEN_TU_CHOI_DANG_KY",
    STAFF_ACCOUNT_LOCKED: "NHANVIEN_KHOA_TAI_KHOAN",
    STAFF_ACCOUNT_UNLOCKED: "NHANVIEN_MO_KHOA_TAI_KHOAN",
    READER_BLACKLIST_REINSTATED: "DOCGIA_GO_DANH_SACH_DEN",
};
const detailNames = { from: "Tu", to: "Den", changes: "ThayDoi", createdFields: "TruongDuocTao", reason: "LyDo", overdue: "QuaHan", compensation: "GiaTriBoiThuong" };
const translateDetails = (value) => {
    if (Array.isArray(value)) return value.map(translateDetails);
    if (!value || typeof value !== "object" || value instanceof Date) return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [detailNames[key] || key, translateDetails(item)]));
};

class AuditLogService {
    constructor(client) {
        this.db = client.db();
        this.Logs = this.db.collection("nhatkykiemtoan");
    }

    async record(event) {
        const actorType = event.actorType || "system";
        const actorId = String(event.actorId || "system");
        let actorName = String(event.actorName || "");

        if (!actorName && actorType === "staff") {
            const actor = await this.db.collection("nhanvien").findOne({ MSNV: actorId }, { projection: { HoTenNV: 1 } });
            actorName = actor?.HoTenNV || actorId;
        } else if (!actorName && actorType === "reader") {
            const actor = await this.db.collection("docgia").findOne({ MaDocGia: actorId }, { projection: { HoLot: 1, Ten: 1 } });
            actorName = [actor?.HoLot, actor?.Ten].filter(Boolean).join(" ") || actorId;
        }

        const entry = {
            HanhDong: actionNames[event.action] || String(event.action),
            LoaiDoiTuong: ({ book: "sach", borrow: "phieumuon", yeucaunhanvien: "yeucaunhanvien", staff: "nhanvien", reader: "docgia" })[event.entityType] || "phieumuon",
            MaDoiTuong: String(event.entityId || ""),
            LoaiTacNhan: actorType === "staff" ? "nhanvien" : actorType === "reader" ? "docgia" : "hethong",
            MaTacNhan: actorId,
            TenTacNhan: actorName || actorId,
            ThoiGian: new Date(),
        };

        for (const key of ["MaSach", "TenSach", "MaDocGia", "TenDocGia", "MSNV", "TenNhanVien", "Details"]) {
            if (event[key] !== undefined && event[key] !== null) entry[key === "Details" ? "ChiTiet" : key] = key === "Details" ? translateDetails(event[key]) : event[key];
        }
        if (actorType === "staff") {
            entry.MSNV = entry.MSNV || actorId;
            entry.TenNhanVien = entry.TenNhanVien || actorName || actorId;
        }

        await this.Logs.insertOne(entry);
        return entry;
    }

    async find(filters = {}) {
        const query = {};
        for (const field of ["HanhDong", "LoaiDoiTuong", "MaSach", "MaDocGia", "MSNV"]) {
            if (filters[field]) query[field] = String(filters[field]).trim();
        }
        if (filters.from || filters.to) {
            query.ThoiGian = {};
            if (filters.from) query.ThoiGian.$gte = new Date(filters.from);
            if (filters.to) {
                const upperBound = new Date(filters.to);
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(filters.to))) upperBound.setDate(upperBound.getDate() + 1);
                query.ThoiGian.$lt = upperBound;
            }
        }
        const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 100, 1), 300);
        const skip = Math.min(Math.max(Number.parseInt(filters.skip, 10) || 0, 0), 100000);
        const cursor = this.Logs.find(query, { projection: auditFields })
            .sort({ ThoiGian: -1, _id: -1 }).skip(skip).limit(limit);
        const [items, total] = await Promise.all([cursor.toArray(), this.Logs.countDocuments(query)]);
        return { items, total, limit, skip };
    }
}

module.exports = AuditLogService;
