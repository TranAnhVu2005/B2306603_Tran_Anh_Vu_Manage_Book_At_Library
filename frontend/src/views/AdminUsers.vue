<template>
  <div class="py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small font-weight-bold text-danger" style="letter-spacing: 0.05em;">
          <i class="fas fa-shield-alt mr-1"></i> Khu Vực Quản Trị Tối Cao (Super Admin)
        </span>
        <h2 class="font-serif-headline font-weight-bold text-dark mb-0">
          Phân Quyền Người Dùng & Quản Lý Blacklist
        </h2>
      </div>
      <button class="ath-btn-outline" @click="fetchData">
        <i class="fas fa-sync-alt mr-1"></i> Làm mới
      </button>
    </div>

    <!-- Quick Filter -->
    <div class="ath-card p-3 mb-4">
      <div class="row align-items-center">
        <div class="col-md-6 mb-2 mb-md-0">
          <input type="text" class="form-control ath-input" v-model="search" placeholder="Tìm kiếm theo mã, họ tên, số điện thoại..." />
        </div>
        <div class="col-md-6 d-flex justify-content-md-end gap-2">
          <button class="btn btn-sm mr-2" 
                  :class="filterRole === 'all' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="filterRole = 'all'">
            Tất cả ({{ users.length }})
          </button>
          <button class="btn btn-sm mr-2" 
                  :class="filterRole === 'MANAGER' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="filterRole = 'MANAGER'">
            Thủ thư / Quản lý
          </button>
          <button class="btn btn-sm" 
                  :class="filterRole === 'Blacklist' ? 'ath-btn-danger' : 'ath-btn-outline'"
                  @click="filterRole = 'Blacklist'">
            Blacklist ({{ blacklistCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="ath-card p-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách người dùng...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="text-center py-5">
        <p class="text-muted mb-0">Không có người dùng nào khớp với bộ lọc.</p>
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
              <th>Số lần vi phạm</th>
              <th class="text-right">Thao tác Quản trị</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u._id">
              <td class="font-mono-code font-weight-bold text-dark">{{ u.MaDocGia }}</td>
              <td>
                <strong class="text-dark">{{ u.HoLot }} {{ u.Ten }}</strong>
                <small class="text-muted d-block">{{ u.DiaChi || '—' }}</small>
              </td>
              <td class="font-mono-code small">{{ u.DienThoai }}</td>
              <td>
                <span v-if="u.Role === 'ADMIN'" class="badge badge-danger">ADMIN</span>
                <span v-else-if="u.Role === 'MANAGER'" class="badge badge-success">QUẢN LÝ / THỦ THƯ</span>
                <span v-else class="badge badge-light border">ĐỘC GIẢ (USER)</span>
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
              <td class="text-right">
                <!-- Nâng cấp / Hạ cấp Role -->
                <button v-if="u.Role === 'USER'" 
                        class="btn btn-sm btn-outline-success py-1 px-2 mr-1"
                        @click="changeRole(u, 'MANAGER')"
                        title="Nâng cấp lên Quản lý / Thủ thư">
                  <i class="fas fa-arrow-up mr-1"></i> Thăng cấp
                </button>
                <button v-else-if="u.Role === 'MANAGER'" 
                        class="btn btn-sm btn-outline-warning py-1 px-2 mr-1"
                        @click="changeRole(u, 'USER')"
                        title="Hạ cấp về Độc giả thường">
                  <i class="fas fa-arrow-down mr-1"></i> Hạ cấp
                </button>

                <!-- Mở khóa Blacklist nếu bị phạt -->
                <button v-if="u.TrangThaiThe === 'Blacklist' || (u.SoLanViPham || 0) > 0" 
                        class="btn btn-sm btn-outline-info py-1 px-2 mr-1"
                        @click="unblockUser(u)"
                        title="Mở khóa thẻ và reset số lần vi phạm">
                  <i class="fas fa-unlock mr-1"></i> Mở khóa
                </button>

                <!-- Xóa độc giả -->
                <button class="btn btn-sm btn-outline-danger py-1 px-2" 
                        @click="deleteUser(u)"
                        title="Xóa tài khoản">
                  <i class="fas fa-trash-alt"></i>
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
