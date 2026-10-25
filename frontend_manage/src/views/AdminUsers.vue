<template>
  <div class="vg-page admin-users-page">
    <!-- Header -->
    <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <span class="vg-section-label admin-eyebrow">
          <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
          Khu Vực Quản Trị Tối Cao (Super Admin)
        </span>
        <h1 class="admin-page-title">
          Quản lý tài khoản
        </h1>
      </div>
      <button class="ath-btn-outline" type="button" @click="fetchData">
        <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.9-2L20 12M4 12l2.5 5a7 7 0 0 0 11.9-2" /></svg>
        Làm mới
      </button>
    </div>

    <!-- Quick Filter -->
    <div class="vg-shell">
      <div class="vg-core p-3 p-md-4">
      <div class="admin-filter-panel">
        <div class="input-group admin-user-search">
          <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
            <svg class="ui-icon text-muted" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4.5 4.5" /></svg>
          </span>
          <input type="text"
                 class="form-control ath-input border-start-0"
                 v-model="search"
                 placeholder="Tìm theo mã tài khoản, họ tên hoặc số điện thoại..." />
          <button v-if="search" class="btn btn-outline-secondary" type="button" @click="search = ''" style="border-color: var(--paper-border);">
            <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div class="admin-filter-options" role="group" aria-label="Lọc tài khoản">
          <button class="btn btn-sm"
                  :class="filterRole === 'all' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'all'"
                  @click="filterRole = 'all'">
            Tất cả ({{ accounts.length }})
          </button>
          <button class="btn btn-sm"
                  :class="filterRole === 'DanhSachDen' ? 'ath-btn-danger' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'DanhSachDen'"
                  @click="filterRole = 'DanhSachDen'">
            <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></svg>
            Danh sách đen ({{ danhSachDenCount }})
          </button>
          <button class="btn btn-sm"
                  :class="filterRole === 'Khoa' ? 'ath-btn-danger' : 'ath-btn-outline'"
                  :aria-pressed="filterRole === 'Khoa'"
                  @click="filterRole = 'Khoa'">
            <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>
            Thẻ bị khóa ({{ lockedCount }})
          </button>
        </div>
      </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="vg-shell">
      <div class="vg-core p-3 p-md-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách người dùng...</p>
      </div>

      <div v-else-if="filteredAccounts.length === 0" class="text-center py-5">
        <svg class="ui-icon admin-empty-icon text-muted mb-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v8M16 12h8" /></svg>
        <h6 class="font-serif-headline fw-bold">Không tìm thấy người dùng phù hợp</h6>
        <p class="text-muted small mb-0">Thử thay đổi từ khóa hoặc bộ lọc vai trò.</p>
      </div>

      <div v-else class="table-responsive admin-users-table-wrap">
        <table class="ath-table admin-users-table">
          <thead>
            <tr>
              <th>Mã tài khoản</th>
              <th>Họ và Tên</th>
              <th>Số điện thoại</th>
              <th>Vai trò / Chức vụ</th>
              <th>Trạng thái thẻ</th>
              <th>Vi phạm</th>
              <th class="text-end">Thao tác Quản trị</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in filteredAccounts" :key="account._kind + account._id">
              <td class="font-mono-code fw-bold text-dark">{{ account._kind === 'staff' ? account.MSNV : account.MaDocGia }}</td>
              <td>
                <strong class="text-dark d-block" style="font-size: 0.95rem;">{{ account._kind === 'staff' ? account.HoTenNV : `${account.HoLot} ${account.Ten}` }}</strong>
                <small class="text-muted text-truncate d-inline-block" style="max-width: 220px;">{{ account.DiaChi || '—' }}</small>
              </td>
              <td class="font-mono-code small">{{ account._kind === 'staff' ? (account.SoDienThoai || '—') : account.DienThoai }}</td>
              <td>
                <span v-if="account._kind === 'staff' && account.ChucVu === 'ADMIN'" class="badge bg-danger">QUẢN TRỊ VIÊN</span>
                <span v-else-if="account._kind === 'staff'" class="badge bg-success">THỦ THƯ</span>
                <span v-else class="badge bg-light text-dark border">ĐỘC GIẢ (USER)</span>
              </td>
              <td>
                <span v-if="account._kind === 'staff'" class="text-muted">—</span>
                <span v-else-if="account.TrangThaiThe === 'DanhSachDen'" class="ath-badge ath-badge-danh-sach-den">
                  <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></svg> Danh sách đen
                </span>
                <span v-else-if="account.TrangThaiThe === 'Khoa'" class="ath-badge ath-badge-out">
                  <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg> Đang khóa
                </span>
                <span v-else class="ath-badge ath-badge-available">
                  <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg> Hoạt động
                </span>
              </td>
              <td>
                <span v-if="account._kind === 'staff'" class="text-muted">—</span>
                <strong v-else :class="(account.SoLanViPham || 0) >= 3 ? 'text-danger' : 'text-dark'">{{ account.SoLanViPham || 0 }} / 3</strong>
              </td>
              <td v-if="account._kind === 'reader'" class="text-end">
                <button v-if="account.TrangThaiThe === 'HoatDong'"
                        class="ath-action-btn ath-action-btn-danger me-1"
                        @click="lockUser(account)"
                        title="Khóa khẩn cấp thẻ, không thay đổi số lần vi phạm">
                  <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg> Khóa thẻ
                </button>
                <button v-else-if="account.TrangThaiThe === 'Khoa'"
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="unblockUser(account)"
                        title="Mở khóa khẩn cấp, giữ nguyên số lần vi phạm">
                  <svg class="ui-icon text-info" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2" /></svg> Mở khóa
                </button>
                <button v-else-if="account.TrangThaiThe === 'DanhSachDen'"
                        class="ath-action-btn ath-action-btn-success me-1"
                        @click="reinstateUser(account)"
                        title="Xét gỡ khỏi danh sách đen, giữ nguyên lịch sử vi phạm">
                  <svg class="ui-icon text-success" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M8.5 13l2.2 2.2 4.8-4.8" /></svg> Xét gỡ danh sách đen
                </button>

                <!-- Xóa độc giả -->
                <button class="ath-action-btn ath-action-btn-danger" 
                        @click="deleteUser(account)"
                        title="Xóa tài khoản">
                  <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>
                </button>
              </td>
              <td v-else class="text-muted text-center">—</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import docGiaService from "../services/docgia.service";
import nhanVienService from "../services/nhanvien.service";

export default {
  name: "AdminUsers",
  components: {
    ToastNotification,
  },
  data() {
    return {
      users: [],
      staff: [],
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
    accounts() {
      return [
        ...this.users.map(user => ({ ...user, _kind: "reader" })),
        ...this.staff.map(person => ({ ...person, _kind: "staff" })),
      ];
    },
    filteredAccounts() {
      const query = this.search.trim().toLocaleLowerCase("vi");
      return this.accounts.filter(account => {
        const matchesSearch = !query || [
          account._kind === "staff" ? account.MSNV : account.MaDocGia,
          account._kind === "staff" ? account.HoTenNV : `${account.HoLot} ${account.Ten}`,
          account._kind === "staff" ? account.SoDienThoai : account.DienThoai,
          account.DiaChi,
        ].some(value => String(value || "").toLocaleLowerCase("vi").includes(query));

        let matchesFilter = true;
        if (this.filterRole === "DanhSachDen") matchesFilter = account._kind === "reader" && account.TrangThaiThe === "DanhSachDen";
        if (this.filterRole === "Khoa") matchesFilter = account._kind === "reader" && account.TrangThaiThe === "Khoa";
        return matchesSearch && matchesFilter;
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
        const [users, staff] = await Promise.all([docGiaService.getAll(), nhanVienService.getAll()]);
        this.users = users;
        this.staff = staff;
      } catch (err) {
        this.$refs.toast?.show(err.response?.data?.message || "Lỗi khi tải danh sách độc giả.", "error");
      } finally {
        this.loading = false;
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
.admin-users-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  min-width: 0;
}
.admin-users-page > * { min-width: 0; }

.admin-eyebrow { color: var(--accent); }
.admin-eyebrow .ui-icon { margin-right: 0.25rem; }

.admin-page-title {
  margin: 0;
  color: var(--ink-primary);
  font-family: var(--font-serif);
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.admin-filter-panel {
  display: grid;
  gap: 1rem;
}
.admin-user-search {
  width: 100%;
}
.admin-filter-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}
.admin-filter-options .btn {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding-inline: 0.65rem;
  white-space: normal;
  line-height: 1.35;
}
.admin-users-table-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.admin-users-table {
  min-width: 980px;
}
.admin-empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media (max-width: 767.98px) {
  .admin-users-page { gap: 1rem; }

  .admin-filter-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .admin-filter-options .btn {
    min-height: 52px;
    padding-inline: 0.45rem;
    font-size: 0.72rem;
  }
}
</style>
