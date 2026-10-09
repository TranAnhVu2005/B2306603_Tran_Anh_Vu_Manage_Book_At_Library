<template>
  <div class="py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small font-weight-bold" style="color: var(--primary); letter-spacing: 0.05em;">
          Danh Mục Đối Tác
        </span>
        <h2 class="font-serif-headline font-weight-bold text-dark mb-0">
          Quản Lý Nhà Xuất Bản
        </h2>
      </div>
      <div>
        <button class="ath-btn-primary mr-2" @click="openCreateModal">
          <i class="fas fa-plus mr-1"></i> Thêm NXB mới
        </button>
        <button class="ath-btn-outline" @click="fetchData">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Table of Publishers -->
    <div class="ath-card p-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách NXB...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="ath-table">
          <thead>
            <tr>
              <th>Mã NXB</th>
              <th>Tên Nhà Xuất Bản</th>
              <th>Địa Chỉ Trụ Sở</th>
              <th class="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nxb in publishers" :key="nxb._id">
              <td class="font-mono-code font-weight-bold text-dark">{{ nxb.MaNXB }}</td>
              <td><strong class="text-dark">{{ nxb.TenNXB }}</strong></td>
              <td class="text-muted small">{{ nxb.DiaChi || '—' }}</td>
              <td class="text-right">
                <button class="btn btn-sm btn-outline-secondary py-1 px-2 mr-1" @click="openEditModal(nxb)" title="Chỉnh sửa">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger py-1 px-2" @click="handleDelete(nxb)" title="Xóa NXB">
                  <i class="fas fa-trash-alt"></i>
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
        <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
          <h5 class="font-serif-headline font-weight-bold mb-0">
            {{ isEditing ? 'Cập Nhật Nhà Xuất Bản' : 'Thêm Nhà Xuất Bản Mới' }}
          </h5>
          <button type="button" class="close" @click="showModal = false">&times;</button>
        </div>

        <form @submit.prevent="saveNXB">
          <div class="form-group mb-3">
            <label class="small font-weight-bold mb-1">Mã NXB:</label>
            <input type="text" class="ath-input" v-model="form.MaNXB" :disabled="isEditing" placeholder="VD: NXB06" required />
          </div>
          <div class="form-group mb-3">
            <label class="small font-weight-bold mb-1">Tên Nhà Xuất Bản:</label>
            <input type="text" class="ath-input" v-model="form.TenNXB" placeholder="VD: NXB Kim Đồng" required />
          </div>
          <div class="form-group mb-4">
            <label class="small font-weight-bold mb-1">Địa Chỉ:</label>
            <input type="text" class="ath-input" v-model="form.DiaChi" placeholder="VD: Hà Nội hoặc TP.HCM..." />
          </div>
          <div class="d-flex justify-content-end align-items-center pt-2 border-top">
            <button type="button" class="ath-btn-outline mr-2" @click="showModal = false">Hủy</button>
            <button type="submit" class="ath-btn-primary" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin mr-1"></i>
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
      showModal: false,
      isEditing: false,
      saving: false,
      form: {
        MaNXB: "",
        TenNXB: "",
        DiaChi: "",
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
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
        MaNXB: `NXB0${this.publishers.length + 1}`,
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
