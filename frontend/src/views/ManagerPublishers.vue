<template>
  <div class="py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small fw-bold" style="color: var(--primary); letter-spacing: 0.05em;">
          Danh Mục Đối Tác Xuất Bản
        </span>
        <h2 class="font-serif-headline fw-bold text-dark mb-0">
          Quản Lý Nhà Xuất Bản
        </h2>
      </div>
      <div>
        <button class="ath-btn-primary me-2" @click="openCreateModal">
          <i class="fas fa-plus me-1"></i> Thêm NXB mới
        </button>
        <button class="ath-btn-outline" @click="fetchData">
          <i class="fas fa-sync-alt me-1"></i> Làm mới
        </button>
      </div>
    </div>

    <!-- Quick Search Box -->
    <div class="ath-card p-3 mb-4">
      <div class="row align-items-center">
        <div class="col-md-6 mb-2 mb-md-0">
          <div class="input-group">
            <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
              <i class="fas fa-search text-muted"></i>
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

    <!-- Table of Publishers -->
    <div class="ath-card p-3 p-md-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách NXB...</p>
      </div>

      <div v-else-if="filteredPublishers.length === 0" class="text-center py-5">
        <i class="fas fa-building text-muted mb-2" style="font-size: 2.5rem;"></i>
        <h6 class="font-serif-headline fw-bold">Không tìm thấy Nhà xuất bản nào</h6>
        <p class="text-muted small mb-0">Vui lòng kiểm tra lại từ khóa tìm kiếm.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="ath-table">
          <thead>
            <tr>
              <th style="width: 130px;">Mã NXB</th>
              <th>Tên Nhà Xuất Bản</th>
              <th>Địa Chỉ Trụ Sở</th>
              <th class="text-end" style="width: 140px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nxb in filteredPublishers" :key="nxb._id">
              <td class="font-mono-code fw-bold text-dark">{{ nxb.MaNXB }}</td>
              <td>
                <strong class="text-dark d-block" style="font-size: 0.95rem;">{{ nxb.TenNXB || nxb.TENNXB }}</strong>
              </td>
              <td class="text-muted small">{{ nxb.DiaChi || '—' }}</td>
              <td class="text-end">
                <button class="ath-action-btn me-1" @click="openEditModal(nxb)" title="Chỉnh sửa">
                  <i class="fas fa-edit text-secondary"></i> Sửa
                </button>
                <button class="ath-action-btn ath-action-btn-danger" @click="handleDelete(nxb)" title="Xóa NXB">
                  <i class="fas fa-trash-alt text-danger"></i> Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="ath-modal-overlay" @click.self="showModal = false">
      <div class="ath-modal-content p-4">
        <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style="border-color: var(--paper-border) !important;">
          <h5 class="font-serif-headline fw-bold mb-0 text-dark">
            {{ isEditing ? 'Cập Nhật Nhà Xuất Bản' : 'Thêm Nhà Xuất Bản Mới' }}
          </h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showModal = false"></button>
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
          <div v-else class="mb-3">
            <label class="small fw-bold mb-1">Mã NXB:</label>
            <div class="ath-input d-flex align-items-center" style="background:var(--paper-50,#f5f4ef);cursor:default;">
              <i class="fas fa-magic me-2 text-muted small"></i>
              <small class="text-muted">Mã sẽ được tự động sinh (NXB-0001, NXB-0002, …)</small>
            </div>
          </div>
          <div class="mb-3">
            <label class="small fw-bold mb-1">Tên Nhà Xuất Bản:</label>
            <input type="text" class="ath-input" v-model="form.TenNXB" placeholder="VD: NXB Kim Đồng" required />
          </div>
          <div class="mb-4">
            <label class="small fw-bold mb-1">Địa Chỉ Trụ Sở:</label>
            <input type="text" class="ath-input" v-model="form.DiaChi" placeholder="VD: Hà Nội hoặc TP.HCM..." />
          </div>
          <div class="d-flex justify-content-end align-items-center pt-3 border-top" style="border-color: var(--paper-border) !important;">
            <button type="button" class="ath-btn-outline me-2" @click="showModal = false">Hủy</button>
            <button type="submit" class="ath-btn-primary" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-save me-1"></i>
              {{ isEditing ? 'Cập Nhật' : 'Lưu NXB' }}
            </button>
          </div>
        </form>
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
        TenNXB: "",
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
        p.TenNXB.toLowerCase().includes(q) ||
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
        TenNXB: "",
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
      if (!confirm(`Xác nhận xóa NXB '${nxb.TenNXB}' (${nxb.MaNXB})?`)) return;
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
