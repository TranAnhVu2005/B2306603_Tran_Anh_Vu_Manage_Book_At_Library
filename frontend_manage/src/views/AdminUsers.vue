<template>
  <div class="vg-page admin-users-page">
    <!-- Header -->
    <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <h1 class="admin-page-title">
          Quản lý tài khoản
        </h1>
      </div>
      <button class="ath-btn-outline" type="button" @click="fetchData">
        <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.9-2L20 12M4 12l2.5 5a7 7 0 0 0 11.9-2" />
        </svg>
        Làm mới
      </button>
    </div>

    <!-- Quick Filter -->
    <div class="vg-shell">
      <div class="vg-core p-3 p-md-4">
        <div class="admin-filter-panel">
          <div class="input-group admin-user-search">
            <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
              <svg class="ui-icon text-muted" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </span>
            <input type="text" class="form-control ath-input border-start-0" v-model="search"
              placeholder="Tìm theo mã tài khoản, họ tên hoặc số điện thoại..." />
            <button v-if="search" class="btn btn-outline-secondary" type="button" @click="search = ''"
              style="border-color: var(--paper-border);">
              <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div class="admin-filter-options" role="group" aria-label="Lọc tài khoản">
            <button class="btn btn-sm" :class="filterRole === 'all' ? 'ath-btn-primary' : 'ath-btn-outline'"
              :aria-pressed="filterRole === 'all'" @click="filterRole = 'all'">
              Tất cả ({{ accounts.filter(account => !account.deleted).length }})
            </button>
            <button class="btn btn-sm" :class="filterRole === 'DanhSachDen' ? 'ath-btn-danger' : 'ath-btn-outline'"
              :aria-pressed="filterRole === 'DanhSachDen'" @click="filterRole = 'DanhSachDen'">
              <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m5.6 5.6 12.8 12.8" />
              </svg>
              Danh sách đen ({{ danhSachDenCount }})
            </button>
            <button class="btn btn-sm" :class="filterRole === 'Khoa' ? 'ath-btn-danger' : 'ath-btn-outline'"
              :aria-pressed="filterRole === 'Khoa'" @click="filterRole = 'Khoa'">
              <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" />
              </svg>
              Tài khoản/thẻ bị khóa ({{ lockedCount }})
            </button>
            <button class="btn btn-sm" :class="filterRole === 'deleted' ? 'ath-btn-primary' : 'ath-btn-outline'"
              :aria-pressed="filterRole === 'deleted'" @click="filterRole = 'deleted'">
              Đã xóa mềm ({{ deletedCount }})
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
          <svg class="ui-icon admin-empty-icon text-muted mb-2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v8M16 12h8" />
          </svg>
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
                <th>Trạng thái tài khoản / thẻ</th>
                <th>Vi phạm</th>
                <th class="text-end">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in filteredAccounts" :key="account._kind + account._id">
                <td class="font-mono-code fw-bold text-dark">{{ account._kind === 'staff' ? account.MSNV :
                  account.MaDocGia }}</td>
                <td>
                  <strong class="text-dark d-block" style="font-size: 0.95rem;">{{ account._kind === 'staff' ?
                    account.HoTenNV : `${account.HoLot} ${account.Ten}` }}</strong>
                  <small class="text-muted text-truncate d-inline-block" style="max-width: 220px;">{{ account.DiaChi ||
                    '—' }}</small>
                </td>
                <td class="font-mono-code small">{{ account._kind === 'staff' ? (account.SoDienThoai || '—') :
                  account.DienThoai }}</td>
                <td>
                  <span v-if="account._kind === 'staff' && account.ChucVu === 'ADMIN'" class="badge bg-danger">QUẢN TRỊ
                    VIÊN</span>
                  <span v-else-if="account._kind === 'staff'" class="badge bg-success">THỦ THƯ</span>
                  <span v-else class="badge bg-light text-dark border">ĐỘC GIẢ (USER)</span>
                </td>
                <td>
                  <span v-if="account.deleted" class="ath-badge ath-badge-out">
                    Đã xóa mềm
                  </span>
                  <span v-else-if="account._kind === 'staff' && account.TrangThaiThe === 'Khoa'"
                    class="ath-badge ath-badge-out">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                    </svg> Đang khóa
                  </span>
                  <span v-else-if="account._kind === 'staff'" class="ath-badge ath-badge-available">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8 12 2.5 2.5L16 9" />
                    </svg> Hoạt động
                  </span>
                  <span v-else-if="account.TrangThaiThe === 'DanhSachDen'" class="ath-badge ath-badge-danh-sach-den">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m5.6 5.6 12.8 12.8" />
                    </svg> Danh sách đen
                  </span>
                  <span v-else-if="account.TrangThaiThe === 'Khoa'" class="ath-badge ath-badge-out">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                    </svg> Đang khóa
                  </span>
                  <span v-else class="ath-badge ath-badge-available">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8 12 2.5 2.5L16 9" />
                    </svg> Hoạt động
                  </span>
                </td>
                <td>
                  <span v-if="account._kind === 'staff'" class="text-muted">—</span>
                  <strong v-else :class="(account.SoLanViPham || 0) >= 3 ? 'text-danger' : 'text-dark'">{{
                    account.SoLanViPham || 0 }} / 3</strong>
                </td>
                <td v-if="account.deleted" class="text-end">
                  <button class="ath-action-btn ath-action-btn-success" @click="restoreAccount(account)"
                    title="Khôi phục tài khoản đã xóa mềm">
                    Khôi phục
                  </button>
                </td>
                <td v-else-if="account._kind === 'reader'" class="text-end">
                  <button v-if="account.TrangThaiThe === 'HoatDong'" class="ath-action-btn ath-action-btn-danger me-1"
                    @click="lockUser(account)" title="Khóa khẩn cấp thẻ, không thay đổi số lần vi phạm">
                    <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                    </svg> Khóa thẻ
                  </button>
                  <button v-else-if="account.TrangThaiThe === 'Khoa'" class="ath-action-btn ath-action-btn-success me-1"
                    @click="unblockUser(account)" title="Mở khóa khẩn cấp, giữ nguyên số lần vi phạm">
                    <svg class="ui-icon text-info" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 7.5-2" />
                    </svg> Mở khóa
                  </button>
                  <button v-else-if="account.TrangThaiThe === 'DanhSachDen'"
                    class="ath-action-btn ath-action-btn-success me-1" @click="reinstateUser(account)"
                    title="Xét gỡ khỏi danh sách đen và đặt lại số lần vi phạm về 0">
                    <svg class="ui-icon text-success" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="4" width="14" height="17" rx="2" />
                      <path d="M9 4.5h6M8.5 13l2.2 2.2 4.8-4.8" />
                    </svg> Xét gỡ danh sách đen
                  </button>

                  <button class="ath-action-btn ath-action-btn-danger" @click="deleteUser(account)"
                    title="Xóa mềm tài khoản">
                    <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                    </svg>
                  </button>
                </td>
                <td v-else-if="account._kind === 'staff' && account.ChucVu === 'STAFF'" class="text-end">
                  <button v-if="account.TrangThaiThe !== 'Khoa'" class="ath-action-btn ath-action-btn-danger me-1"
                    @click="setStaffAccountStatus(account, true)" title="Khóa tài khoản thủ thư">
                    <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                    </svg> Khóa tài khoản
                  </button>
                  <button v-else class="ath-action-btn ath-action-btn-success"
                    @click="setStaffAccountStatus(account, false)" title="Mở khóa tài khoản thủ thư">
                    <svg class="ui-icon text-success" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 7.5-2" />
                    </svg> Mở khóa
                  </button>
                  <button class="ath-action-btn ath-action-btn-danger ms-1" @click="deleteUser(account)"
                    title="Xóa mềm tài khoản nhân viên">
                    <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                    </svg>
                  </button>
                </td>
                <td v-else class="text-muted text-center">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="staff-status-dialog">
        <div v-if="staffStatusDialog.open" class="staff-status-overlay" @click.self="closeStaffStatusDialog">
          <section ref="staffStatusDialogElement" class="staff-status-dialog" role="dialog" tabindex="-1" aria-modal="true"
            aria-labelledby="staff-status-title" aria-describedby="staff-status-description"
            :aria-busy="staffStatusDialog.submitting" @keydown="handleStaffStatusDialogKeydown">
            <div class="staff-status-dialog__header">
              <span class="staff-status-dialog__icon" :class="staffStatusDialog.lock ? 'is-lock' : 'is-unlock'" aria-hidden="true">
                <svg v-if="staffStatusDialog.lock" viewBox="0 0 24 24">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 7.5-2" />
                </svg>
              </span>
              <button class="staff-status-dialog__close" type="button" aria-label="Đóng hộp thoại"
                :disabled="staffStatusDialog.submitting" @click="closeStaffStatusDialog">×</button>
            </div>

            <p class="staff-status-dialog__eyebrow">XÁC NHẬN THAO TÁC</p>
            <h2 id="staff-status-title">{{ staffStatusDialog.lock ? 'Khóa tài khoản thủ thư' : 'Mở khóa tài khoản thủ thư' }}</h2>
            <p id="staff-status-description" class="staff-status-dialog__description">
              {{ staffStatusDialog.lock
                ? 'Nhân viên sẽ bị đăng xuất và không thể đăng nhập cho đến khi tài khoản được mở khóa.'
                : 'Nhân viên có thể đăng nhập lại sau khi tài khoản được mở khóa.' }}
            </p>

            <div v-if="staffStatusDialog.account" class="staff-status-dialog__account">
              <span class="staff-status-dialog__account-label">NHÂN VIÊN</span>
              <strong>{{ staffStatusDialog.account.HoTenNV }}</strong>
              <span class="staff-status-dialog__account-code">{{ staffStatusDialog.account.MSNV }}</span>
            </div>

            <label class="staff-status-dialog__label" for="staff-status-reason">Lý do <span>Bắt buộc</span></label>
            <textarea id="staff-status-reason" ref="staffStatusReason" v-model="staffStatusDialog.reason"
              class="staff-status-dialog__textarea" rows="4" maxlength="500"
              :aria-invalid="Boolean(staffStatusDialog.error)" aria-describedby="staff-status-reason-hint staff-status-reason-error"
              placeholder="Nhập lý do để lưu vào nhật ký kiểm toán..." :disabled="staffStatusDialog.submitting"></textarea>
            <div class="staff-status-dialog__field-meta">
              <span id="staff-status-reason-hint">Không nhập thông tin nhạy cảm.</span>
              <span>{{ staffStatusDialog.reason.length }}/500</span>
            </div>
            <p v-if="staffStatusDialog.error" id="staff-status-reason-error" class="staff-status-dialog__error" role="alert">
              {{ staffStatusDialog.error }}
            </p>

            <div class="staff-status-dialog__actions">
              <button class="staff-status-dialog__cancel" type="button" :disabled="staffStatusDialog.submitting"
                @click="closeStaffStatusDialog">Hủy</button>
              <button class="staff-status-dialog__submit" :class="staffStatusDialog.lock ? 'is-lock' : 'is-unlock'"
                type="button" :disabled="staffStatusDialog.submitting || !staffStatusDialog.reason.trim()"
                @click="submitStaffAccountStatus">
                <span v-if="staffStatusDialog.submitting" class="staff-status-dialog__spinner" aria-hidden="true"></span>
                {{ staffStatusDialog.submitting ? 'Đang xử lý...' : (staffStatusDialog.lock ? 'Khóa tài khoản' : 'Mở khóa tài khoản') }}
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>

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
      staffStatusDialog: {
        open: false,
        lock: true,
        account: null,
        reason: "",
        error: "",
        submitting: false,
      },
      staffStatusPreviousFocus: null,
      previousBodyOverflow: "",
    };
  },
  computed: {
    danhSachDenCount() {
      return this.users.filter(u => u.TrangThaiThe === "DanhSachDen").length;
    },
    lockedCount() {
      return this.users.filter(u => u.TrangThaiThe === "Khoa").length +
        this.staff.filter(person => person.TrangThaiThe === "Khoa").length;
    },
    deletedCount() {
      return this.accounts.filter(account => account.deleted).length;
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
        if (this.filterRole === "deleted") matchesFilter = account.deleted === true;
        else {
          matchesFilter = !account.deleted;
          if (this.filterRole === "DanhSachDen") matchesFilter = matchesFilter && account._kind === "reader" && account.TrangThaiThe === "DanhSachDen";
          if (this.filterRole === "Khoa") matchesFilter = matchesFilter && account.TrangThaiThe === "Khoa";
        }
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
    "staffStatusDialog.open"(open) {
      if (open) {
        this.staffStatusPreviousFocus = document.activeElement;
        this.previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        this.$nextTick(() => this.$refs.staffStatusReason?.focus());
      } else {
        document.body.style.overflow = this.previousBodyOverflow;
        this.$nextTick(() => this.staffStatusPreviousFocus?.focus?.());
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = this.previousBodyOverflow;
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
        const [users, staff] = await Promise.all([
          docGiaService.getAll({ includeDeleted: true }),
          nhanVienService.getAll({ includeDeleted: true }),
        ]);
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
      if (!confirm(`Xét gỡ thẻ khỏi danh sách đen cho '${u.HoLot} ${u.Ten}'? Số lần vi phạm hiện tại (${u.SoLanViPham || 0}) sẽ được đặt lại về 0. Nhật ký kiểm toán vẫn lưu quyết định này.`)) return;
      try {
        await docGiaService.reinstate(u._id || u.MaDocGia);
        this.$refs.toast.show("Đã gỡ khỏi danh sách đen và đặt lại số lần vi phạm về 0.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Lỗi khi xét gỡ khỏi danh sách đen.", "error");
      }
    },
    async setStaffAccountStatus(account, lock) {
      this.staffStatusDialog = {
        open: true,
        lock,
        account,
        reason: "",
        error: "",
        submitting: false,
      };
    },
    closeStaffStatusDialog() {
      if (this.staffStatusDialog.submitting) return;
      this.staffStatusDialog.open = false;
    },
    handleStaffStatusDialogKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeStaffStatusDialog();
        return;
      }
      if (event.key !== "Tab") return;
      if (this.staffStatusDialog.submitting) {
        event.preventDefault();
        this.$refs.staffStatusDialogElement?.focus();
        return;
      }

      const dialog = event.currentTarget;
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), textarea:not(:disabled)')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    async submitStaffAccountStatus() {
      const { account, lock } = this.staffStatusDialog;
      const verb = lock ? "khóa" : "mở khóa";
      const reason = this.staffStatusDialog.reason.trim();
      if (!reason) {
        this.staffStatusDialog.error = "Vui lòng nhập lý do trước khi xác nhận.";
        this.$refs.staffStatusReason?.focus();
        return;
      }
      this.staffStatusDialog.error = "";
      this.staffStatusDialog.submitting = true;
      this.$nextTick(() => this.$refs.staffStatusDialogElement?.focus());
      try {
        if (lock) await nhanVienService.lockAccount(account._id, reason);
        else await nhanVienService.unlockAccount(account._id, reason);
        this.staffStatusDialog.open = false;
        this.$refs.toast.show(lock ? "Đã khóa tài khoản thủ thư và thu hồi các phiên hiện tại." : "Đã mở khóa tài khoản thủ thư.");
        await this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || `Không thể ${verb} tài khoản nhân viên.`, "error");
      } finally {
        this.staffStatusDialog.submitting = false;
      }
    },
    async deleteUser(u) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser._id === u._id) {
        this.$refs.toast.show("Bạn không thể tự xóa tài khoản của chính mình!", "error");
        return;
      }

      const displayName = u._kind === "staff" ? u.HoTenNV : `${u.HoLot} ${u.Ten}`;
      if (!confirm(`Chuyển tài khoản '${displayName}' vào trạng thái xóa mềm? Tài khoản sẽ không đăng nhập được và vẫn có thể khôi phục; lịch sử mượn/nhật ký được giữ lại.`)) return;
      try {
        const service = u._kind === "staff" ? nhanVienService : docGiaService;
        await service.delete(u._id || (u._kind === "staff" ? u.MSNV : u.MaDocGia));
        this.$refs.toast.show("Đã chuyển tài khoản sang trạng thái xóa mềm.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể xóa tài khoản.";
        this.$refs.toast.show(msg, "error", 4500);
      }
    },
    async restoreAccount(account) {
      const service = account._kind === "staff" ? nhanVienService : docGiaService;
      const id = account._id || (account._kind === "staff" ? account.MSNV : account.MaDocGia);
      try {
        await service.restore(id);
        this.$refs.toast.show("Đã khôi phục tài khoản. Trạng thái khóa hoặc thẻ hiện tại vẫn được giữ nguyên.");
        await this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Không thể khôi phục tài khoản.", "error");
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

.admin-users-page>* {
  min-width: 0;
}

.admin-eyebrow {
  color: var(--accent);
}

.admin-eyebrow .ui-icon {
  margin-right: 0.25rem;
}

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

.staff-status-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 1.25rem;
  background: rgb(17 17 17 / 68%);
}

.staff-status-dialog {
  position: relative;
  width: min(100%, 540px);
  max-height: min(780px, calc(100dvh - 40px));
  overflow-y: auto;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 2px solid var(--ink-primary, #111);
  border-radius: 16px;
  background: var(--paper, #fffdf2);
  color: var(--ink-primary, #111);
  box-shadow: 5px 5px 0 var(--ink-primary, #111);
}

.staff-status-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.staff-status-dialog__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 2px solid var(--ink-primary, #111);
  border-radius: 10px;
  box-shadow: 2px 2px 0 var(--ink-primary, #111);
}

.staff-status-dialog__icon.is-lock { background: #fff0eb; color: #a62920; }
.staff-status-dialog__icon.is-unlock { background: #e6f4eb; color: #087443; }
.staff-status-dialog__icon svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

.staff-status-dialog__close {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 2px solid var(--ink-primary, #111);
  border-radius: 8px;
  background: transparent;
  color: var(--ink-primary, #111);
  font: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.staff-status-dialog__eyebrow {
  margin: 0 0 0.35rem;
  color: #6b5a00;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.staff-status-dialog h2 {
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.staff-status-dialog__description {
  margin: 0.65rem 0 1.25rem;
  color: var(--ink-secondary, #302f35);
  font-size: 0.92rem;
  line-height: 1.55;
}

.staff-status-dialog__account {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.15rem 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid #d6d0bd;
  border-radius: 8px;
  background: var(--paper-subtle, #fff8d9);
}

.staff-status-dialog__account-label {
  grid-column: 1 / -1;
  color: var(--ink-muted, #625f67);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.staff-status-dialog__account strong { min-width: 0; overflow-wrap: anywhere; }
.staff-status-dialog__account-code { color: var(--ink-muted, #625f67); font-family: ui-monospace, monospace; font-size: 0.8rem; }

.staff-status-dialog__label {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
  font-size: 0.9rem;
  font-weight: 750;
}

.staff-status-dialog__label span { color: #a62920; font-size: 0.75rem; font-weight: 700; }

.staff-status-dialog__textarea {
  display: block;
  width: 100%;
  min-height: 112px;
  resize: vertical;
  padding: 0.75rem 0.85rem;
  border: 2px solid var(--ink-primary, #111);
  border-radius: 8px;
  background: #fff;
  color: var(--ink-primary, #111);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
}

.staff-status-dialog__textarea:focus-visible {
  outline: 3px solid var(--neo-violet, #432dd7);
  outline-offset: 2px;
}

.staff-status-dialog__textarea[aria-invalid="true"] { border-color: #b42318; }

.staff-status-dialog__field-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.4rem;
  color: var(--ink-muted, #625f67);
  font-size: 0.72rem;
}

.staff-status-dialog__error { margin: 0.5rem 0 0; color: #a62920; font-size: 0.82rem; font-weight: 650; }

.staff-status-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.staff-status-dialog__cancel,
.staff-status-dialog__submit {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border: 2px solid var(--ink-primary, #111);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--ink-primary, #111);
  color: var(--ink-primary, #111);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 750;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.staff-status-dialog__cancel { background: var(--paper, #fffdf2); }
.staff-status-dialog__submit.is-lock { background: #f9d5cd; }
.staff-status-dialog__submit.is-unlock { background: var(--neo-yellow, #fdc800); }

.staff-status-dialog__cancel:hover,
.staff-status-dialog__submit:not(:disabled):hover { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--ink-primary, #111); }

.staff-status-dialog__cancel:focus-visible,
.staff-status-dialog__submit:focus-visible,
.staff-status-dialog__close:focus-visible { outline: 3px solid var(--neo-violet, #432dd7); outline-offset: 3px; }

.staff-status-dialog__cancel:disabled,
.staff-status-dialog__submit:disabled,
.staff-status-dialog__close:disabled { opacity: 0.55; cursor: not-allowed; }

.staff-status-dialog__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: staff-status-spin 650ms linear infinite;
}

@keyframes staff-status-spin { to { transform: rotate(360deg); } }

.staff-status-dialog-enter-active,
.staff-status-dialog-leave-active { transition: opacity 160ms ease; }
.staff-status-dialog-enter-active .staff-status-dialog,
.staff-status-dialog-leave-active .staff-status-dialog { transition: transform 160ms ease; }
.staff-status-dialog-enter-from,
.staff-status-dialog-leave-to { opacity: 0; }
.staff-status-dialog-enter-from .staff-status-dialog,
.staff-status-dialog-leave-to .staff-status-dialog { transform: translateY(8px); }

@media (max-width: 767.98px) {
  .admin-users-page {
    gap: 1rem;
  }

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

  .staff-status-overlay { padding: 0.75rem; }
  .staff-status-dialog { max-height: calc(100dvh - 24px); padding: 1rem; }
  .staff-status-dialog__actions { flex-direction: column-reverse; }
  .staff-status-dialog__cancel,
  .staff-status-dialog__submit { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .staff-status-dialog-enter-active,
  .staff-status-dialog-leave-active,
  .staff-status-dialog-enter-active .staff-status-dialog,
  .staff-status-dialog-leave-active .staff-status-dialog,
  .staff-status-dialog__cancel,
  .staff-status-dialog__submit { transition: none; }
  .staff-status-dialog__spinner { animation-duration: 1200ms; }
}
</style>
