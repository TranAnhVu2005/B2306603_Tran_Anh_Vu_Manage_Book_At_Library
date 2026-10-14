<template>
  <div class="py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small fw-bold text-danger" style="letter-spacing: 0.05em;">
          <i class="fas fa-shield-alt me-1"></i> Khu Vực Quản Trị Tối Cao (Super Admin)
        </span>
        <h2 class="font-serif-headline fw-bold text-dark mb-0">
          Phân Quyền Người Dùng & Quản Lý Blacklist
        </h2>
      </div>
      <button class="ath-btn-outline" @click="fetchData">
        <i class="fas fa-sync-alt me-1"></i> Làm mới
      </button>
    </div>

    <!-- Quick Filter -->
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
                   placeholder="Tìm kiếm theo mã độc giả, họ tên, số điện thoại..." />
            <button v-if="search" class="btn btn-outline-secondary" type="button" @click="search = ''" style="border-color: var(--paper-border);">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="col-md-6 d-flex justify-content-md-end flex-wrap gap-2">
          <button class="btn btn-sm me-2 mb-1 mb-md-0" 
                  :class="filterRole === 'all' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="filterRole = 'all'">
            Tất cả ({{ users.length }})
          </button>
          <button class="btn btn-sm me-2 mb-1 mb-md-0" 
                  :class="filterRole === 'MANAGER' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="filterRole = 'MANAGER'">
            <i class="fas fa-user-shield me-1"></i> Quản lý / Thủ thư
          </button>
          <button class="btn btn-sm mb-1 mb-md-0" 
                  :class="filterRole === 'Blacklist' ? 'ath-btn-danger' : 'ath-btn-outline'"
                  @click="filterRole = 'Blacklist'">
            <i class="fas fa-ban me-1"></i> Blacklist ({{ blacklistCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="ath-card p-3 p-md-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách người dùng...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="text-center py-5">
        <i class="fas fa-users-slash text-muted mb-2" style="font-size: 2.5rem;"></i>
        <h6 class="font-serif-headline fw-bold">Không tìm thấy người dùng phù hợp</h6>
        <p class="text-muted small mb-0">Thử thay đổi từ khóa hoặc bộ lọc vai trò.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="ath-table">
          <thead>
            <tr>
              <th>Mã độc giả</th>
              <th>Họ và Tên</th>
              <th>Số điện thoại</th>
              <th>Vai trò (Role)</th>
              <th>Trạng thái thẻ</th>
              <th>Vi phạm</th>
              <th class="text-end">Thao tác Quản trị</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u._id">
              <td class="font-mono-code fw-bold text-dark">{{ u.MaDocGia }}</td>
              <td>
                <strong class="text-dark d-block" style="font-size: 0.95rem;">{{ u.HoLot }} {{ u.Ten }}</strong>
                <small class="text-muted text-truncate d-inline-block" style="max-width: 220px;">{{ u.DiaChi || '—' }}</small>
              </td>
              <td class="font-mono-code small">{{ u.DienThoai }}</td>
              <td>
                <span v-if="u.Role === 'ADMIN'" class="badge bg-danger">ADMIN</span>
                <span v-else-if="u.Role === 'MANAGER'" class="badge bg-success">QUẢN LÝ / THỦ THƯ</span>
                <span v-else class="badge bg-light text-dark border">ĐỘC GIẢ (USER)</span>
              </td>
              <td>
                <span v-if="u.TrangThaiThe === 'Blacklist'" class="ath-badge ath-badge-blacklist">
                  <i class="fas fa-ban"></i> Blacklist
                </span>
                <span v-else class="ath-badge ath-badge-available">
                  <i class="fas fa-check-circle"></i> Hoạt động
                </span>
              </td>
              <td>
                <strong :class="(u.SoLanViPham || 0) >= 3 ? 'text-danger' : 'text-dark'">
                  {{ u.SoLanViPham || 0 }} / 3
                </strong>
              </td>
              <td class="text-end">
                <!-- Nâng cấp / Hạ cấp Role -->
                <button v-if="u.Role === 'USER'" 
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="changeRole(u, 'MANAGER')"
                        title="Nâng cấp lên Quản lý / Thủ thư">
                  <i class="fas fa-arrow-up text-success"></i> Thăng cấp
                </button>
                <button v-else-if="u.Role === 'MANAGER'" 
                        class="ath-action-btn me-1"
                        @click="changeRole(u, 'USER')"
                        title="Hạ cấp về Độc giả thường">
                  <i class="fas fa-arrow-down text-warning"></i> Hạ cấp
                </button>

                <!-- Mở khóa Blacklist nếu bị phạt -->
                <button v-if="u.TrangThaiThe === 'Blacklist' || (u.SoLanViPham || 0) > 0" 
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="unblockUser(u)"
                        title="Mở khóa thẻ và reset số lần vi phạm">
                  <i class="fas fa-unlock text-info"></i> Mở khóa
                </button>

                <!-- Xóa độc giả -->
                <button class="ath-action-btn ath-action-btn-danger" 
                        @click="deleteUser(u)"
                        title="Xóa tài khoản">
                  <i class="fas fa-trash-alt text-danger"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import docGiaService from "../services/docgia.service";

export default {
  name: "AdminUsers",
  components: {
    ToastNotification,
  },
  data() {
    return {
      users: [],
      loading: false,
      search: "",
      filterRole: "all",
    };
  },
  computed: {
    blacklistCount() {
      return this.users.filter(u => u.TrangThaiThe === "Blacklist").length;
    },
    filteredUsers() {
      return this.users.filter(u => {
        const matchesSearch = !this.search.trim() ||
          u.MaDocGia.toLowerCase().includes(this.search.toLowerCase()) ||
          `${u.HoLot} ${u.Ten}`.toLowerCase().includes(this.search.toLowerCase()) ||
          u.DienThoai.includes(this.search);

        let matchesRole = true;
        if (this.filterRole === "MANAGER") matchesRole = u.Role === "MANAGER";
        if (this.filterRole === "Blacklist") matchesRole = u.TrangThaiThe === "Blacklist";

        return matchesSearch && matchesRole;
      });
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.users = await docGiaService.getAll();
      } catch (err) {
        this.$refs.toast?.show("Lỗi khi tải danh sách độc giả.", "error");
      } finally {
        this.loading = false;
      }
    },
    async changeRole(u, newRole) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.username === u.MaDocGia && newRole !== "ADMIN") {
        this.$refs.toast.show("Bạn không thể tự hạ cấp quyền quản trị của chính mình!", "error");
        return;
      }

      const actionName = newRole === "MANAGER" ? "nâng cấp lên Quản lý / Thủ thư" : "hạ cấp về Độc giả thường";
      if (!confirm(`Bạn có chắc muốn ${actionName} cho tài khoản '${u.HoLot} ${u.Ten}' (${u.MaDocGia})?`)) return;

      try {
        await docGiaService.updateRole(u._id || u.MaDocGia, newRole);
        this.$refs.toast.show(`Đã cập nhật vai trò thành công: ${newRole}`);
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show("Lỗi khi cập nhật vai trò.", "error");
      }
    },
    async unblockUser(u) {
      if (!confirm(`Xác nhận mở khóa thẻ và reset số lần vi phạm về 0 cho '${u.HoLot} ${u.Ten}'?`)) return;
      try {
        await docGiaService.unblock(u._id || u.MaDocGia);
        this.$refs.toast.show("Đã mở khóa thẻ và đặt lại số lần vi phạm về 0!");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show("Lỗi khi mở khóa tài khoản.", "error");
      }
    },
    async deleteUser(u) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.username === u.MaDocGia) {
        this.$refs.toast.show("Bạn không thể tự xóa tài khoản của chính mình!", "error");
        return;
      }

      if (!confirm(`Xác nhận xóa tài khoản '${u.HoLot} ${u.Ten}'?`)) return;
      try {
        await docGiaService.delete(u._id || u.MaDocGia);
        this.$refs.toast.show("Đã xóa tài khoản.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể xóa tài khoản.";
        this.$refs.toast.show(msg, "error", 4500);
      }
    }
  }
};
</script>
