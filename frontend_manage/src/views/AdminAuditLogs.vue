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
          <select v-model="filters.EntityType" class="ath-input">
            <option value="">Tất cả sự kiện</option>
            <option value="book">Sách</option>
            <option value="borrow">Mượn – trả</option>
          </select>
        </label>
        <label class="audit-field">
          <span>Hành động</span>
          <select v-model="filters.Action" class="ath-input">
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
              <td class="audit-time">{{ formatDate(entry.OccurredAt) }}</td>
              <td><span class="audit-action" :class="`audit-${entry.EntityType}`">{{ actionLabel(entry.Action) }}</span></td>
              <td>
                <strong class="d-block">{{ entry.TenSach || "—" }}</strong>
                <small class="font-mono-code text-muted">{{ entry.MaSach || "" }}</small>
              </td>
              <td>
                <strong class="d-block">{{ entry.TenDocGia || "—" }}</strong>
                <small class="font-mono-code text-muted">{{ entry.MaDocGia || "" }}</small>
              </td>
              <td>
                <strong class="d-block">{{ entry.TenNhanVien || (entry.ActorType === 'staff' ? entry.ActorName : "—") }}</strong>
                <small class="font-mono-code text-muted">{{ entry.MSNV || (entry.ActorType === 'staff' ? entry.ActorId : "") }}</small>
              </td>
              <td class="audit-details">{{ formatDetails(entry.Details) }}</td>
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
  BOOK_CREATED: "Thêm sách",
  BOOK_UPDATED: "Sửa sách",
  BOOK_SOFT_DELETED: "Xóa mềm sách",
  BOOK_RESTORED: "Khôi phục sách",
  BORROW_REQUESTED: "Đăng ký mượn",
  BORROW_APPROVED: "Duyệt mượn / giao sách",
  BORROW_REJECTED: "Từ chối mượn",
  BOOK_RETURNED: "Xác nhận trả sách",
  BOOK_REPORTED_LOST: "Ghi nhận mất sách",
  BORROW_RECORD_DELETED: "Xóa phiếu mượn",
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
      filters: { MaSach: "", MaDocGia: "", MSNV: "", EntityType: "", Action: "", from: "", to: "" },
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
      this.filters = { MaSach: "", MaDocGia: "", MSNV: "", EntityType: "", Action: "", from: "", to: "" };
      this.loadLogs(true);
    },
    actionLabel(action) { return actionLabels[action] || action || "Sự kiện"; },
    formatDate(value) {
      if (!value) return "—";
      return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
    },
    formatDetails(details) {
      if (!details) return "—";
      if (details.from !== undefined || details.to !== undefined) {
        return `${details.from ?? "mới"} → ${details.to ?? "đã xóa"}`;
      }
      return Object.entries(details).map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`).join(" · ");
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
.audit-action { display: inline-flex; padding: .3rem .65rem; border-radius: 999px; background: #edf2ee; color: #214d39; font-size: .75rem; font-weight: 700; white-space: nowrap; }
.audit-borrow { background: #fff3dc; color: #805414; }
.audit-details { max-width: 240px; color: var(--ink-secondary); font-size: .78rem; overflow-wrap: anywhere; }
.audit-state { padding: 3rem 1rem; text-align: center; color: var(--ink-muted); }
@media (max-width: 767.98px) {
  .audit-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .audit-filter-actions { grid-column: 1 / -1; }
}
@media (max-width: 479.98px) {
  .audit-filters { grid-template-columns: minmax(0, 1fr); }
  .audit-filter-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .audit-immutable { margin-left: 0; }
}
</style>
