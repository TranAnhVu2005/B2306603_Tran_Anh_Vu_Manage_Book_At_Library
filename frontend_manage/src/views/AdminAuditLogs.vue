<template>
  <section class="vg-page audit-page">
    <header class="vg-page-header d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <span class="vg-section-label">Kiểm toán hệ thống · Chỉ Admin</span>
        <h1 class="audit-title">Nhật ký hoạt động</h1>
        <p class="audit-intro">Tra cứu lịch sử thao tác trên sách và các bước xử lý phiếu mượn.</p>
      </div>
      <button class="ath-btn-outline" type="button" :disabled="loading" @click="loadLogs(true)">
        <i class="fas fa-rotate me-2" aria-hidden="true"></i>Làm mới
      </button>
    </header>

    <form class="vg-shell audit-filter-shell" @submit.prevent="loadLogs(true)">
      <div class="vg-core audit-filters">
        <label class="audit-field">
          <span>Mã sách</span>
          <input v-model.trim="filters.MaSach" class="ath-input" autocomplete="off" placeholder="SACH-000001" />
        </label>
        <label class="audit-field">
          <span>Mã độc giả</span>
          <input v-model.trim="filters.MaDocGia" class="ath-input" autocomplete="off" placeholder="DG-000001" />
        </label>
        <label class="audit-field">
          <span>Mã nhân viên</span>
          <input v-model.trim="filters.MSNV" class="ath-input" autocomplete="off" placeholder="NV-0001" />
        </label>
        <label class="audit-field">
          <span>Loại sự kiện</span>
          <select v-model="filters.LoaiDoiTuong" class="ath-input">
            <option value="">Tất cả sự kiện</option>
            <option value="sach">Sách</option>
            <option value="phieumuon">Mượn – trả</option>
          </select>
        </label>
        <label class="audit-field">
          <span>Hành động</span>
          <select v-model="filters.HanhDong" class="ath-input">
            <option value="">Tất cả hành động</option>
          <option v-for="(label, action) in actionLabels" :key="action" :value="action">{{ label }}</option>
          </select>
        </label>
        <label class="audit-field">
          <span>Từ ngày</span>
          <input v-model="filters.from" class="ath-input" type="date" />
        </label>
        <label class="audit-field">
          <span>Đến ngày</span>
          <input v-model="filters.to" class="ath-input" type="date" />
        </label>
        <div class="audit-filter-actions">
          <button class="ath-btn-primary" type="submit" :disabled="loading">Lọc nhật ký</button>
          <button class="ath-btn-outline" type="button" @click="resetFilters">Xóa lọc</button>
        </div>
      </div>
    </form>

    <div class="audit-summary" aria-live="polite">
      <span>Tổng sự kiện: <strong>{{ total }}</strong></span>
      <span>Đang hiển thị: <strong>{{ logs.length }}</strong></span>
      <span class="audit-immutable"><i class="fas fa-lock me-1" aria-hidden="true"></i>Nhật ký chỉ đọc</span>
    </div>

    <div class="vg-shell audit-table-shell">
      <div v-if="loading && !logs.length" class="audit-state">Đang tải nhật ký…</div>
      <div v-else-if="error" class="audit-state text-danger" role="alert">{{ error }}</div>
      <div v-else-if="!logs.length" class="audit-state">Chưa có sự kiện phù hợp với bộ lọc.</div>
      <div v-else class="table-responsive audit-table-wrap">
        <table class="ath-table audit-table align-middle">
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Sự kiện</th>
              <th>Sách</th>
              <th>Độc giả</th>
              <th>Nhân viên phụ trách</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in logs" :key="entry._id">
              <td class="audit-time">{{ formatDate(entry.ThoiGian) }}</td>
              <td class="audit-event-cell">
                <div class="audit-event">
                  <span class="audit-action" :class="`audit-${entry.LoaiDoiTuong}`">{{ actionLabel(entry.HanhDong) }}</span>
                  <small v-if="actionDescription(entry.HanhDong)" class="audit-event-description">
                    {{ actionDescription(entry.HanhDong) }}
                  </small>
                </div>
              </td>
              <td>
                <strong class="d-block">{{ entry.TenSach || "—" }}</strong>
                <small class="font-mono-code text-muted">{{ entry.MaSach || "" }}</small>
              </td>
              <td>
                <strong class="d-block">{{ entry.TenDocGia || "—" }}</strong>
                <small class="font-mono-code text-muted">{{ entry.MaDocGia || "" }}</small>
              </td>
              <td>
                <strong class="d-block">{{ entry.TenNhanVien || (entry.LoaiTacNhan === 'nhanvien' ? entry.TenTacNhan : "—") }}</strong>
                <small class="font-mono-code text-muted">{{ entry.MSNV || (entry.LoaiTacNhan === 'nhanvien' ? entry.MaTacNhan : "") }}</small>
              </td>
              <td class="audit-details-cell">
                <div v-if="detailItems(entry.ChiTiet).length" class="audit-detail-list">
                  <div v-for="(item, index) in detailItems(entry.ChiTiet)" :key="`${item.label}-${index}`" class="audit-detail-item">
                    <span class="audit-detail-label">{{ item.label }}</span>
                    <span class="audit-detail-value">{{ item.value }}</span>
                  </div>
                </div>
                <span v-else class="audit-no-details">Không có thông tin bổ sung</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="error && logs.length" class="px-3 py-2 text-danger" role="alert">{{ error }}</div>
    </div>

    <div v-if="logs.length < total" class="text-center pt-3">
      <button class="ath-btn-outline" type="button" :disabled="loading" @click="loadLogs(false)">
        {{ loading ? "Đang tải…" : "Tải thêm nhật ký" }}
      </button>
    </div>
    <ToastNotification ref="toast" />
  </section>
</template>

<script>
import auditLogService from "@/services/audit-log.service";
import ToastNotification from "@/components/ToastNotification.vue";

const actionLabels = {
  SACH_TAO: "Thêm sách",
  SACH_CAP_NHAT: "Sửa sách",
  SACH_XOA_MEM: "Xóa mềm sách",
  SACH_KHOI_PHUC: "Khôi phục sách",
  PHIEU_DANG_KY_MUON: "Đăng ký mượn",
  PHIEU_DUYET_MUON: "Duyệt mượn / giao sách",
  PHIEU_TU_CHOI_MUON: "Từ chối mượn",
  PHIEU_TRA_SACH: "Xác nhận trả sách",
  PHIEU_BAO_MAT_SACH: "Ghi nhận mất sách",
  PHIEU_XOA: "Xóa phiếu mượn",
  NHANVIEN_DANG_KY: "Đăng ký làm nhân viên",
  NHANVIEN_DUYET_DANG_KY: "Duyệt hồ sơ nhân viên",
  NHANVIEN_TU_CHOI_DANG_KY: "Từ chối hồ sơ nhân viên",
  NHANVIEN_KHOA_TAI_KHOAN: "Khóa tài khoản thủ thư",
  NHANVIEN_MO_KHOA_TAI_KHOAN: "Mở khóa tài khoản thủ thư",
  DOCGIA_GO_DANH_SACH_DEN: "Gỡ độc giả khỏi danh sách đen",
};

const actionDescriptions = {
  SACH_TAO: "Thêm một đầu sách vào kho.",
  SACH_CAP_NHAT: "Cập nhật thông tin hoặc số lượng sách.",
  SACH_XOA_MEM: "Ẩn sách khỏi danh mục đang hoạt động.",
  SACH_KHOI_PHUC: "Đưa sách đã xóa trở lại danh mục.",
  PHIEU_DANG_KY_MUON: "Độc giả gửi yêu cầu mượn sách.",
  PHIEU_DUYET_MUON: "Thủ thư chấp thuận yêu cầu mượn.",
  PHIEU_TU_CHOI_MUON: "Thủ thư từ chối yêu cầu mượn.",
  PHIEU_TRA_SACH: "Ghi nhận sách đã được trả.",
  PHIEU_BAO_MAT_SACH: "Ghi nhận sách bị mất và tiền bồi thường.",
  PHIEU_XOA: "Xóa phiếu khỏi danh sách nghiệp vụ.",
  NHANVIEN_DANG_KY: "Nhân viên gửi hồ sơ để quản trị viên xét duyệt.",
  NHANVIEN_DUYET_DANG_KY: "Quản trị viên chấp thuận hồ sơ đăng ký.",
  NHANVIEN_TU_CHOI_DANG_KY: "Quản trị viên từ chối hồ sơ đăng ký.",
  NHANVIEN_KHOA_TAI_KHOAN: "Nhân viên không thể đăng nhập cho đến khi được mở khóa.",
  NHANVIEN_MO_KHOA_TAI_KHOAN: "Nhân viên có thể đăng nhập lại bằng phiên mới.",
  DOCGIA_GO_DANH_SACH_DEN: "Admin duyệt gỡ thẻ và đặt lại số lần vi phạm về 0.",
};

const detailLabels = {
  Tu: "Trạng thái trước",
  Den: "Trạng thái sau",
  ThayDoi: "Thay đổi",
  TruongDuocTao: "Thông tin được tạo",
  LyDo: "Lý do",
  QuaHan: "Trả quá hạn",
  GiaTriBoiThuong: "Tiền bồi thường",
  HoTenNV: "Họ tên nhân viên",
  TrangThaiThe: "Trạng thái thẻ",
  SoLanViPham: "Số lần vi phạm",
  SoDienThoai: "Số điện thoại",
  DiaChi: "Địa chỉ",
  ChucVu: "Chức vụ",
  TrangThai: "Trạng thái hồ sơ",
  TrangThaiThe: "Trạng thái tài khoản",
  TenSach: "Tên sách",
  TacGia: "Tác giả",
  MaSach: "Mã sách",
  MaTheLoai: "Mã thể loại",
  MaNXB: "Mã nhà xuất bản",
  DonGia: "Đơn giá",
  SoQuyen: "Số lượng",
  NamXuatBan: "Năm xuất bản",
  HinhAnh: "Ảnh bìa",
  MoTa: "Mô tả",
  NgayMuon: "Ngày mượn",
  NgayTra: "Ngày trả",
  HanTra: "Hạn trả",
};

const statusLabels = {
  HoatDong: "Hoạt động",
  Khoa: "Đã khóa",
  DanhSachDen: "Danh sách đen",
  ChoDuyet: "Chờ duyệt",
  DaDuyet: "Đã duyệt",
  TuChoi: "Đã từ chối",
  DangMuon: "Đang mượn",
  DaTra: "Đã trả",
  MatSach: "Báo mất sách",
};

export default {
  name: "AdminAuditLogs",
  components: { ToastNotification },
  data() {
    return {
      actionLabels,
      logs: [],
      total: 0,
      loading: false,
      error: "",
      filters: { MaSach: "", MaDocGia: "", MSNV: "", LoaiDoiTuong: "", HanhDong: "", from: "", to: "" },
    };
  },
  created() { this.loadLogs(true); },
  methods: {
    async loadLogs(reset) {
      if (this.loading) return;
      if (reset) this.logs = [];
      this.loading = true;
      this.error = "";
      try {
        const params = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value));
        const result = await auditLogService.getAll({ ...params, limit: 50, skip: reset ? 0 : this.logs.length });
        this.logs = reset ? result.items : [...this.logs, ...result.items];
        this.total = result.total;
      } catch (err) {
        this.error = err.response?.data?.message || "Không thể tải nhật ký kiểm toán.";
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      this.filters = { MaSach: "", MaDocGia: "", MSNV: "", LoaiDoiTuong: "", HanhDong: "", from: "", to: "" };
      this.loadLogs(true);
    },
    actionLabel(action) { return actionLabels[action] || this.humanizeKey(action) || "Sự kiện khác"; },
    actionDescription(action) { return actionDescriptions[action] || "Ghi nhận thao tác trong hệ thống."; },
    formatDate(value) {
      if (!value) return "—";
      return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
    },
    humanizeKey(key) {
      return String(key || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
    },
    displayValue(value, key = "") {
      if (typeof value === "boolean") {
        if (key === "QuaHan") return value ? "Có, trả quá hạn" : "Không quá hạn";
        return value ? "Có" : "Không";
      }
      if (value === null || value === undefined || value === "") return "Chưa có";
      if (typeof value === "string") return statusLabels[value] || value;
      if (Array.isArray(value)) return value.map(item => detailLabels[item] || this.humanizeKey(item)).join(", ");
      if (typeof value === "object") return "";
      if (key === "GiaTriBoiThuong" || key === "DonGia") return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
      return String(value);
    },
    detailItems(details) {
      if (!details || typeof details !== "object" || Array.isArray(details)) return [];
      const items = [];
      const append = (key, value, prefix = "") => {
        const label = detailLabels[key] || this.humanizeKey(key);
        if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => append(nestedKey, nestedValue, `${label}: `));
          return;
        }
        const fullLabel = `${prefix}${label}`;
        const shownValue = this.displayValue(value, key);
        if (shownValue) items.push({ label: fullLabel, value: shownValue });
      };

      if (details.Tu !== undefined || details.Den !== undefined) {
        const hasStaffStatus = [details.Tu, details.Den].some(value => ["HoatDong", "Khoa"].includes(value));
        items.push({
          label: hasStaffStatus ? "Trạng thái tài khoản" : "Trạng thái phiếu",
          value: `${this.displayValue(details.Tu ?? "Mới") } → ${this.displayValue(details.Den ?? "Đã xóa")}`,
        });
      }
      Object.entries(details)
        .filter(([key]) => key !== "Tu" && key !== "Den")
        .forEach(([key, value]) => append(key, value));
      return items;
    },
  },
};
</script>

<style scoped>
.audit-page { min-width: 0; display: grid; gap: 1rem; }
.audit-title { margin: .2rem 0 .35rem; font-family: var(--font-serif); font-size: clamp(1.7rem, 4vw, 2.45rem); font-weight: 700; color: var(--ink-primary); }
.audit-intro { color: var(--ink-secondary); margin: 0; }
.audit-filter-shell { padding: 5px; }
.audit-filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; padding: 1rem; }
.audit-field { display: grid; gap: .35rem; min-width: 0; color: var(--ink-secondary); font-size: .78rem; font-weight: 600; }
.audit-field :deep(.ath-input) { min-width: 0; }
.audit-filter-actions { display: flex; align-items: end; gap: .5rem; flex-wrap: wrap; }
.audit-summary { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1.25rem; color: var(--ink-secondary); font-size: .85rem; }
.audit-summary strong { color: var(--ink-primary); }
.audit-immutable { margin-left: auto; color: var(--ink-muted); font-size: .78rem; }
.audit-table-shell { min-width: 0; overflow: hidden; }
.audit-table-wrap { width: 100%; }
.audit-table { min-width: 1040px; }
.audit-table th { white-space: nowrap; }
.audit-time { min-width: 150px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.audit-event-cell { min-width: 250px; }
.audit-event { display: grid; justify-items: start; gap: .45rem; max-width: 260px; }
.audit-action { display: inline-flex; align-items: center; min-height: 32px; max-width: 100%; padding: .35rem .6rem; border: 1px solid #17633b; border-radius: 6px; background: #e8f4eb; color: #174d32; font-size: .8rem; font-weight: 750; line-height: 1.35; white-space: normal; overflow-wrap: anywhere; }
.audit-phieumuon { background: #fff3dc; color: #805414; }
.audit-yeucaunhanvien { border-color: #432dd7; background: #eeeaff; color: #30217f; }
.audit-event-description { max-width: 260px; color: var(--ink-muted); font-size: .78rem; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
.audit-details-cell { min-width: 270px; max-width: 370px; color: var(--ink-secondary); font-size: .83rem; line-height: 1.55; }
.audit-detail-list { display: grid; gap: .5rem; }
.audit-detail-item { display: grid; gap: .1rem; min-width: 0; }
.audit-detail-label { color: var(--ink-muted); font-size: .7rem; font-weight: 750; letter-spacing: .025em; }
.audit-detail-value { color: var(--ink-primary); overflow-wrap: anywhere; }
.audit-no-details { color: var(--ink-muted); font-size: .78rem; }
.audit-state { padding: 3rem 1rem; text-align: center; color: var(--ink-muted); }
@media (max-width: 767.98px) {
  .audit-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .audit-filter-actions { grid-column: 1 / -1; }
}
@media (max-width: 479.98px) {
  .audit-filters { grid-template-columns: minmax(0, 1fr); }
  .audit-filter-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .audit-immutable { margin-left: 0; }
  .audit-event-cell, .audit-details-cell { min-width: 230px; }
}
</style>
