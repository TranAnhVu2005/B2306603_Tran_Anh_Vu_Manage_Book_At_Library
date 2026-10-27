<template>
  <section class="login-background py-5">
    <div class="container status-container">
      <div class="ath-card p-4 p-md-5">
        <header class="text-center pb-3 mb-4 border-bottom">
          <span class="vg-section-label">HỒ SƠ ỨNG TUYỂN</span>
          <h1 class="fw-bold h3 mt-2">Tra cứu trạng thái đăng ký</h1>
          <p class="text-muted mb-0">Dùng số điện thoại và mật khẩu đã đăng ký để xem kết quả xử lý.</p>
        </header>
        <form @submit.prevent="lookup">
          <label class="form-label fw-semibold" for="application-phone">Số điện thoại đăng ký</label>
          <input id="application-phone" v-model.trim="phone" class="form-control ath-input mb-3" type="tel" autocomplete="tel" required />
          <label class="form-label fw-semibold" for="application-password">Mật khẩu đã đăng ký</label>
          <input id="application-password" v-model="password" class="form-control ath-input mb-4" type="password" autocomplete="current-password" required />
          <button class="ath-btn-primary w-100" :disabled="loading" type="submit">{{ loading ? "Đang tra cứu..." : "Tra cứu hồ sơ" }}</button>
        </form>
        <section v-if="application" class="result-card mt-4" aria-live="polite">
          <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center">
            <h2 class="h5 mb-0">{{ application.HoTenNV }}</h2>
            <span class="status-badge" :class="`status-${application.TrangThai.toLowerCase()}`">{{ statusLabel }}</span>
          </div>
          <p class="mb-1 mt-3">Ngày gửi: {{ formatDate(application.ThoiGianGui) }}</p>
          <p v-if="application.ThoiGianXuLy" class="mb-1">Ngày xử lý: {{ formatDate(application.ThoiGianXuLy) }}</p>
          <p v-if="application.LyDoTuChoi" class="reason mt-3 mb-0"><strong>Lý do từ chối:</strong> {{ application.LyDoTuChoi }}</p>
          <p v-if="application.TrangThai === 'DaDuyet'" class="mt-3 mb-0">Hồ sơ đã được duyệt<span v-if="application.MSNV">, mã nhân viên của bạn là <strong>{{ application.MSNV }}</strong></span>. Bạn có thể <router-link to="/login">đăng nhập vào cổng nhân viên</router-link> bằng số điện thoại này.</p>
          <p v-else-if="application.TrangThai === 'ChoDuyet' || application.TrangThai === 'DangDuyet'" class="mt-3 mb-0">Bạn chưa thể đăng nhập cho đến khi hồ sơ được duyệt.</p>
          <p v-else-if="application.TrangThai === 'TuChoi'" class="mt-3 mb-0">Bạn có thể cập nhật thông tin và gửi lại hồ sơ tại <router-link to="/staff-register">trang đăng ký nhân viên</router-link>.</p>
        </section>
        <p class="text-center mt-4 mb-0"><router-link to="/login">Quay lại đăng nhập</router-link> · <router-link to="/staff-register">Đăng ký nhân viên</router-link></p>
      </div>
    </div>
    <ToastNotification ref="toast" />
  </section>
</template>

<script>
import ToastNotification from "@/components/ToastNotification.vue";
import authService from "@/services/auth.service";

export default {
  components: { ToastNotification },
  data: () => ({ phone: "", password: "", loading: false, application: null }),
  computed: {
    statusLabel() {
      return ({ ChoDuyet: "Chờ duyệt", DangDuyet: "Đang xử lý", DaDuyet: "Đã duyệt", TuChoi: "Từ chối" })[this.application?.TrangThai] || "Không xác định";
    },
  },
  methods: {
    async lookup() {
      this.loading = true;
      this.application = null;
      try {
        const result = await authService.lookupStaffApplication({ SoDienThoai: this.phone, MatKhau: this.password });
        this.application = result.data;
        this.password = "";
      } catch (error) {
        this.$refs.toast.show(error.response?.data?.message || "Không thể tra cứu hồ sơ.", "error");
      } finally { this.loading = false; }
    },
    formatDate(value) { return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; },
  },
};
</script>

<style scoped>
.login-background { min-height: 100vh; display:flex; align-items:center; background:linear-gradient(135deg,rgba(67,45,215,.42),rgba(253,200,0,.28)),url('@/assets/background_login.jpg') center/cover no-repeat; }
.status-container { max-width: 720px; }
.ath-card { background:var(--paper,#fffdf2); border:2px solid var(--ink-primary,#171717); border-radius:16px; box-shadow:5px 5px 0 var(--ink-primary,#171717); }
.result-card { padding:1.25rem; border:1px solid var(--paper-border,#d5d0bf); border-radius:12px; background:#fff; }
.status-badge { padding:.4rem .7rem; border:1px solid currentColor; border-radius:999px; font-weight:700; }
.status-choduyet,.status-dangduyet { color:#8a5b00; background:#fff4cc; }
.status-daduyet { color:#087443; background:#e6f6ed; }
.status-tuchoi { color:#b42318; background:#fff0ee; }
.reason { padding:.9rem 1rem; border-left:4px solid #b42318; background:#fff5f3; }
</style>
