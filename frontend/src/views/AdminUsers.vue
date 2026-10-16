<template>
  <div class="py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small fw-bold text-danger" style="letter-spacing: 0.05em;">
          <i class="fas fa-shield-alt me-1"></i> Khu Vực Quản Trị Tối Cao (Super Admin)
        </span>
        <h2 class="font-serif-headline fw-bold text-dark mb-0">
          Phân Quyền Người Dùng & Danh Sách Đen
        </h2>
      </div>
      <button class="ath-btn-outline" @click="fetchData">
        <i class="fas fa-sync-alt me-1"></i> Làm mới
      </button>
    </div>

    <!-- Quick Filter -->
    <div class="ath-card p-3 mb-4">
      <div class="admin-filter-panel">
        <div class="input-group admin-user-search">
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
        <div class="admin-filter-options" role="group" aria-label="Lọc danh sách người dùng">
          <button class="btn btn-sm"
                  :class="filterRole === 'all' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'all'"
                  @click="filterRole = 'all'">
            Tất cả ({{ users.length }})
          </button>
          <button class="btn btn-sm"
                  :class="filterRole === 'MANAGER' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'MANAGER'"
                  @click="filterRole = 'MANAGER'">
            <i class="fas fa-user-shield me-1"></i> Quản lý / Thủ thư
          </button>
          <button class="btn btn-sm"
                  :class="filterRole === 'DanhSachDen' ? 'ath-btn-danger' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'DanhSachDen'"
                  @click="filterRole = 'DanhSachDen'">
            <i class="fas fa-ban me-1"></i> Danh sách đen ({{ danhSachDenCount }})
          </button>
          <button class="btn btn-sm"
                  :class="filterRole === 'Khoa' ? 'ath-btn-danger' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'Khoa'"
                  @click="filterRole = 'Khoa'">
            <i class="fas fa-lock me-1"></i> Thẻ bị khóa ({{ lockedCount }})
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

      <div v-else class="table-responsive admin-users-table-wrap">
        <table class="ath-table admin-users-table">
          <thead>
            <tr>
              <th>Mã độc giả</th>
              <th>Họ và Tên</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
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
                <span v-if="u.VaiTro === 'ADMIN'" class="badge bg-danger">ADMIN</span>
                <span v-else-if="u.VaiTro === 'MANAGER'" class="badge bg-success">QUẢN LÝ / THỦ THƯ</span>
                <span v-else class="badge bg-light text-dark border">ĐỘC GIẢ (USER)</span>
              </td>
              <td>
                <span v-if="u.TrangThaiThe === 'DanhSachDen'" class="ath-badge ath-badge-danh-sach-den">
                  <i class="fas fa-ban"></i> Danh sách đen
                </span>
                <span v-else-if="u.TrangThaiThe === 'Khoa'" class="ath-badge ath-badge-out">
                  <i class="fas fa-lock"></i> Đang khóa
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
                <button v-if="u.VaiTro === 'USER'"
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="changeRole(u, 'MANAGER')"
                        title="Nâng cấp lên Quản lý / Thủ thư">
                  <i class="fas fa-arrow-up text-success"></i> Thăng cấp
                </button>
                <button v-else-if="u.VaiTro === 'MANAGER'"
                        class="ath-action-btn me-1"
                        @click="changeRole(u, 'USER')"
                        title="Hạ cấp về Độc giả thường">
                  <i class="fas fa-arrow-down text-warning"></i> Hạ cấp
                </button>

                <button v-if="u.TrangThaiThe === 'HoatDong'"
                        class="ath-action-btn ath-action-btn-danger me-1"
                        @click="lockUser(u)"
                        title="Khóa khẩn cấp thẻ, không thay đổi số lần vi phạm">
                  <i class="fas fa-lock text-danger"></i> Khóa thẻ
                </button>
                <button v-else-if="u.TrangThaiThe === 'Khoa'"
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="unblockUser(u)"
                        title="Mở khóa khẩn cấp, giữ nguyên số lần vi phạm">
                  <i class="fas fa-unlock text-info"></i> Mở khóa
                </button>
                <button v-else-if="u.TrangThaiThe === 'DanhSachDen'"
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="reinstateUser(u)"
                        title="Xét gỡ khỏi danh sách đen, giữ nguyên lịch sử vi phạm">
                  <i class="fas fa-clipboard-check text-success"></i> Xét gỡ danh sách đen
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
    danhSachDenCount() {
      return this.users.filter(u => u.TrangThaiThe === "DanhSachDen").length;
    },
    lockedCount() {
      return this.users.filter(u => u.TrangThaiThe === "Khoa").length;
    },
    filteredUsers() {
      return this.users.filter(u => {
        const matchesSearch = !this.search.trim() ||
          u.MaDocGia.toLowerCase().includes(this.search.toLowerCase()) ||
          `${u.HoLot} ${u.Ten}`.toLowerCase().includes(this.search.toLowerCase()) ||
          u.DienThoai.includes(this.search);

        let matchesRole = true;
        if (this.filterRole === "MANAGER") matchesRole = u.VaiTro === "MANAGER";
        if (this.filterRole === "DanhSachDen") matchesRole = u.TrangThaiThe === "DanhSachDen";
        if (this.filterRole === "Khoa") matchesRole = u.TrangThaiThe === "Khoa";

        return matchesSearch && matchesRole;
      });
    }
  },
  created() {
    this.syncFilterFromRoute(this.$route.query.filter);
    this.fetchData();
  },
  watch: {
    "$route.query.filter"(filter) {
      this.syncFilterFromRoute(filter);
    },
  },
  methods: {
    syncFilterFromRoute(filter) {
      if (filter === "danhsachden") {
        this.filterRole = "DanhSachDen";
      } else if (filter === "locked") {
        this.filterRole = "Khoa";
      } else {
        this.filterRole = "all";
      }
    },
    async fetchData() {
      this.loading = true;
      try {
        this.users = await docGiaService.getAll();
      } catch (err) {
        this.$refs.toast?.show(err.response?.data?.message || "Lỗi khi tải danh sách độc giả.", "error");
      } finally {
        this.loading = false;
      }
    },
    async changeRole(u, newRole) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser._id === u._id && newRole !== "ADMIN") {
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
        this.$refs.toast.show(err.response?.data?.message || "Lỗi khi cập nhật vai trò.", "error");
      }
    },
    async lockUser(u) {
      if (!confirm(`Khóa khẩn cấp thẻ của '${u.HoLot} ${u.Ten}'? Số lần vi phạm sẽ được giữ nguyên.`)) return;
      try {
        await docGiaService.lock(u._id || u.MaDocGia);
        this.$refs.toast.show("Đã khóa thẻ khẩn cấp. Số lần vi phạm không thay đổi.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Lỗi khi khóa thẻ.", "error");
      }
    },
    async unblockUser(u) {
      const willRemainInDanhSachDen = (u.SoLanViPham || 0) >= 3;
      const consequence = willRemainInDanhSachDen
        ? "Vì đã có ít nhất 3 lần vi phạm, thẻ sẽ tiếp tục ở trạng thái danh sách đen."
        : "Thẻ sẽ hoạt động trở lại.";
      if (!confirm(`Mở khóa khẩn cấp thẻ của '${u.HoLot} ${u.Ten}'? Số lần vi phạm được giữ nguyên. ${consequence}`)) return;
      try {
        await docGiaService.unblock(u._id || u.MaDocGia);
        this.$refs.toast.show(willRemainInDanhSachDen
          ? "Đã mở khóa khẩn cấp; thẻ vẫn thuộc danh sách đen do lịch sử vi phạm."
          : "Đã mở khóa thẻ. Số lần vi phạm được giữ nguyên.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Lỗi khi mở khóa thẻ.", "error");
      }
    },
    async reinstateUser(u) {
      if (!confirm(`Xét gỡ thẻ khỏi danh sách đen cho '${u.HoLot} ${u.Ten}'? Hành động này không xóa lịch sử ${u.SoLanViPham || 0} lần vi phạm.`)) return;
      try {
        await docGiaService.reinstate(u._id || u.MaDocGia);
        this.$refs.toast.show("Đã gỡ thẻ khỏi danh sách đen sau khi xét duyệt. Lịch sử vi phạm được giữ nguyên.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Lỗi khi xét gỡ khỏi danh sách đen.", "error");
      }
    },
    async deleteUser(u) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser._id === u._id) {
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

<style scoped>
.admin-filter-panel {
  display: grid;
  gap: 1rem;
}
.admin-user-search {
  width: 100%;
}
.admin-filter-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}
.admin-filter-options .btn {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding-inline: 0.65rem;
  white-space: nowrap;
}
.admin-users-table-wrap {
  max-width: 100%;
}
.admin-users-table {
  min-width: 900px;
}
@media (max-width: 767.98px) {
  .admin-filter-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .admin-filter-options {
    grid-template-columns: 1fr;
  }
}
</style>
