<template>
  <div class="vg-page manager-publishers-page">
    <!-- Header -->
    <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <span class="vg-section-label">
          Danh Mục Đối Tác Xuất Bản
        </span>
        <h1 class="manager-page-title">
          Quản Lý Nhà Xuất Bản
        </h1>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button class="ath-btn-primary" @click="openCreateModal">
          <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Thêm NXB mới
        </button>
        <button class="ath-btn-outline" @click="fetchData">
          <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.9-2L20 12M4 12l2.5 5a7 7 0 0 0 11.9-2" /></svg>
          Làm mới
        </button>
      </div>
    </div>

    <!-- Quick Search Box -->
    <div class="vg-shell manager-filter-shell">
      <div class="vg-core p-3 p-md-4">
      <div class="row align-items-center">
        <div class="col-md-6 mb-2 mb-md-0">
          <div class="input-group">
            <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
              <svg class="ui-icon text-muted" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4.5 4.5" /></svg>
            </span>
            <input type="text" 
                   class="form-control ath-input border-start-0" 
                   v-model="search" 
                   placeholder="Tìm kiếm NXB theo mã, tên hoặc địa chỉ..." />
          </div>
        </div>
        <div class="col-md-6 text-md-end small text-muted">
          Tổng cộng: <strong>{{ publishers.length }}</strong> đơn vị xuất bản đối tác
        </div>
      </div>
      </div>
    </div>

    <!-- Table of Publishers -->
    <div class="vg-shell">
      <div class="vg-core p-3 p-md-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách NXB...</p>
      </div>

      <div v-else-if="filteredPublishers.length === 0" class="text-center py-5">
        <svg class="ui-icon empty-state-icon text-muted mb-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 9h.01M12 9h.01M16 9h.01M8 12h.01M16 12h.01" /></svg>
        <h6 class="font-serif-headline fw-bold">Không tìm thấy Nhà xuất bản nào</h6>
        <p class="text-muted small mb-0">Vui lòng kiểm tra lại từ khóa tìm kiếm.</p>
      </div>

      <div v-else class="table-responsive publishers-table-wrap">
        <table class="ath-table publishers-table">
          <thead>
            <tr>
              <th style="width: 130px;">Mã NXB</th>
              <th>Tên Nhà Xuất Bản</th>
              <th>Địa Chỉ Trụ Sở</th>
              <th class="text-end" style="width: 140px;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nxb in filteredPublishers" :key="nxb._id">
              <td class="font-mono-code fw-bold text-dark">{{ nxb.MaNXB }}</td>
              <td>
                <strong class="text-dark d-block" style="font-size: 0.95rem;">{{ nxb.TENNXB }}</strong>
              </td>
              <td class="text-muted small">{{ nxb.DiaChi || '—' }}</td>
              
              <!-- Gộp chung Sửa & Xóa vào 1 ô duy nhất và dùng d-flex để nằm ngang -->
              <td class="text-end">
                <div class="d-flex align-items-center justify-content-end gap-2">
                  <button class="ath-action-btn" @click="openEditModal(nxb)" title="Chỉnh sửa">
                    <svg class="ui-icon text-secondary" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg> Sửa
                  </button>
                  <button class="ath-action-btn ath-action-btn-danger" @click="handleDelete(nxb)" title="Xóa NXB">
                    <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg> Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="ath-modal-overlay" @click.self="showModal = false">
      <div class="ath-modal-content publisher-modal">
        <div class="ath-modal-inner publisher-modal-inner">
          <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom" style="border-color: var(--paper-border) !important;">
            <h2 class="font-serif-headline fw-bold mb-0 text-dark manager-modal-title">
              {{ isEditing ? 'Cập Nhật Nhà Xuất Bản' : 'Thêm Nhà Xuất Bản Mới' }}
            </h2>
            <button type="button" class="btn-close" aria-label="Đóng" @click="showModal = false"></button>
          </div>

          <form @submit.prevent="saveNXB">
          <!-- Khi chỉnh sửa: hiển thị mã hiện tại (read-only) -->
          <div v-if="isEditing" class="mb-3">
            <label class="small fw-bold mb-1">Mã NXB:</label>
            <div class="ath-input d-flex align-items-center" style="background:var(--paper-50,#f5f4ef);cursor:not-allowed;">
              <span class="badge bg-secondary font-mono-code me-2">{{ form.MaNXB }}</span>
              <small class="text-muted">Mã NXB không thể thay đổi.</small>
            </div>
          </div>
          <!-- Khi thêm mới: thông báo tự động sinh mã -->
          <div class="mb-3">
            <label class="small fw-bold mb-1">Tên Nhà Xuất Bản:</label>
            <input type="text" class="ath-input" v-model="form.TENNXB" placeholder="VD: NXB Kim Đồng" required />
          </div>
          <div class="mb-4">
            <label class="small fw-bold mb-1">Địa Chỉ Trụ Sở:</label>
            <input type="text" class="ath-input" v-model="form.DiaChi" placeholder="VD: Hà Nội hoặc TP.HCM..." />
          </div>
          <div class="d-flex justify-content-end align-items-center pt-3 border-top" style="border-color: var(--paper-border) !important;">
            <button type="button" class="ath-btn-outline me-2" @click="showModal = false">Hủy</button>
            <button type="submit" class="ath-btn-primary" :disabled="saving">
              <span v-if="saving" class="vg-spinner vg-spinner-inline me-1" aria-hidden="true"></span>
              <svg v-else class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3h2ZM7 3v6h10V3M7 21v-8h10v8" /></svg>
              {{ isEditing ? 'Cập Nhật' : 'Lưu NXB' }}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import nxbService from "../services/nhaxuatban.service";

export default {
  name: "ManagerPublishers",
  components: {
    ToastNotification,
  },
  data() {
    return {
      publishers: [],
      loading: false,
      search: "",
      showModal: false,
      isEditing: false,
      saving: false,
      form: {
        TENNXB: "",
        DiaChi: "",
      }
    };
  },
  computed: {
    filteredPublishers() {
      if (!this.search.trim()) return this.publishers;
      const q = this.search.toLowerCase();
      return this.publishers.filter(p => 
        p.MaNXB.toLowerCase().includes(q) ||
        p.TENNXB.toLowerCase().includes(q) ||
        (p.DiaChi && p.DiaChi.toLowerCase().includes(q))
      );
    }
  },
  watch: {
    showModal(val) {
      if (val) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", this.handleKeyDown);
      } else {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", this.handleKeyDown);
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  created() {
    this.fetchData();
  },
  methods: {
    handleKeyDown(e) {
      if (e.key === "Escape") {
        this.showModal = false;
      }
    },
    async fetchData() {
      this.loading = true;
      try {
        this.publishers = await nxbService.getAll();
      } catch (err) {
        this.$refs.toast?.show("Lỗi khi tải danh sách NXB.", "error");
      } finally {
        this.loading = false;
      }
    },
    openCreateModal() {
      this.isEditing = false;
      this.form = {
        TENNXB: "",
        DiaChi: "",
      };
      this.showModal = true;
    },
    openEditModal(nxb) {
      this.isEditing = true;
      this.form = { ...nxb };
      this.showModal = true;
    },
    async saveNXB() {
      this.saving = true;
      try {
        if (this.isEditing) {
          await nxbService.update(this.form._id || this.form.MaNXB, this.form);
          this.$refs.toast.show("Cập nhật NXB thành công!");
        } else {
          await nxbService.create(this.form);
          this.$refs.toast.show("Thêm NXB mới thành công!");
        }
        this.showModal = false;
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể lưu NXB.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.saving = false;
      }
    },
    async handleDelete(nxb) {
      if (!confirm(`Xác nhận xóa NXB '${nxb.TENNXB}' (${nxb.MaNXB})?`)) return;
      try {
        await nxbService.delete(nxb._id || nxb.MaNXB);
        this.$refs.toast.show("Đã xóa Nhà xuất bản.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể xóa NXB.";
        this.$refs.toast.show(msg, "error", 4500);
      }
    }
  }
};
</script>

<style scoped>
.manager-publishers-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  min-width: 0;
}
.manager-publishers-page > * { min-width: 0; }

.manager-page-title {
  margin: 0;
  color: var(--ink-primary);
  font-family: var(--font-serif);
  font-size: clamp(1.55rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.manager-filter-shell { margin-bottom: 0.25rem; }
.publisher-modal { padding: 6px; }
.publisher-modal-inner { padding: 1.5rem; }
.manager-modal-title { font-size: clamp(1.1rem, 3vw, 1.35rem); }
.empty-state-icon {
  width: 2.5rem;
  height: 2.5rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vg-spinner-inline { display: inline-block; width: 1rem; height: 1rem; border-width: 2px; }

.publishers-table-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.publishers-table {
  min-width: 680px;
}

@media (max-width: 575.98px) {
  .publisher-modal-inner { padding: 1rem; }
  .manager-publishers-page { gap: 1rem; }
}
</style>
