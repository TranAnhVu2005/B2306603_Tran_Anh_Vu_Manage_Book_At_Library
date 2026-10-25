<template>
  <section class="login-background">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="ath-card p-4 p-md-5">
            <div class="text-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
              <img src="@/assets/library_logo.png" alt="Logo Thư viện" class="mb-2" style="width:54px;height:54px;object-fit:contain" />
              <h1 class="font-serif-headline fw-bold mb-1 text-dark h4">Đăng ký làm nhân viên</h1>
              <p class="text-muted small mb-0">Hồ sơ cần được Quản trị viên duyệt trước khi tài khoản được kích hoạt.</p>
            </div>
            <div v-if="submitted" class="alert alert-success" role="status">
              <strong>Đã gửi hồ sơ thành công.</strong> {{ submittedMessage }}
              <div class="mt-3"><router-link class="ath-btn-outline d-inline-flex text-decoration-none" to="/login">Quay lại đăng nhập</router-link></div>
            </div>
            <form v-else @submit.prevent="submit">
              <div class="mb-3">
                <label for="staff-name" class="small fw-bold text-dark mb-1">Họ và tên</label>
                <input id="staff-name" v-model.trim="form.HoTenNV" class="form-control ath-input" autocomplete="name" maxlength="120" required />
              </div>
              <div class="mb-3">
                <label for="staff-phone-register" class="small fw-bold text-dark mb-1">Số điện thoại</label>
                <input id="staff-phone-register" v-model.trim="form.SoDienThoai" class="form-control ath-input" type="tel" inputmode="tel" autocomplete="tel" pattern="\+?[0-9]{9,15}" maxlength="16" required />
              </div>
              <div class="mb-3">
                <label for="staff-address" class="small fw-bold text-dark mb-1">Địa chỉ</label>
                <input id="staff-address" v-model.trim="form.DiaChi" class="form-control ath-input" autocomplete="street-address" maxlength="300" />
              </div>
              <div class="mb-3">
                <label for="staff-register-password" class="small fw-bold text-dark mb-1">Mật khẩu (tối thiểu 8 ký tự)</label>
                <input id="staff-register-password" v-model="form.MatKhau" type="password" class="form-control ath-input" autocomplete="new-password" minlength="8" maxlength="128" required />
              </div>
              <div class="mb-4">
                <label for="staff-confirm-password" class="small fw-bold text-dark mb-1">Nhập lại mật khẩu</label>
                <input id="staff-confirm-password" v-model="confirmPassword" type="password" class="form-control ath-input" autocomplete="new-password" minlength="8" maxlength="128" required />
              </div>
              <button class="ath-btn-primary w-100 py-2" type="submit" :disabled="loading">{{ loading ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký" }}</button>
            </form>
            <p v-if="!submitted" class="small text-center mt-4 mb-0 text-muted">Đã có tài khoản? <router-link class="fw-bold text-dark" to="/login">Đăng nhập nhân viên</router-link></p>
          </div>
        </div>
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
  data: () => ({ form: { HoTenNV: "", SoDienThoai: "", DiaChi: "", MatKhau: "" }, confirmPassword: "", loading: false, submitted: false, submittedMessage: "" }),
  methods: {
    async submit() {
      if (this.form.MatKhau !== this.confirmPassword) {
        this.$refs.toast.show("Mật khẩu xác nhận không khớp.", "error");
        return;
      }
      this.loading = true;
      try {
        const response = await authService.registerStaff(this.form);
        this.submittedMessage = response.message;
        this.submitted = true;
        this.form.MatKhau = "";
        this.confirmPassword = "";
      } catch (error) {
        this.$refs.toast.show(error.response?.data?.message || "Không thể gửi hồ sơ đăng ký.", "error");
      } finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.login-background { min-height: 100vh; display:flex; align-items:center; padding:50px 0; background:linear-gradient(135deg,rgba(67,45,215,.42),rgba(253,200,0,.28)),url('@/assets/background_login.jpg') center/cover no-repeat; }
.ath-card { background:rgba(255,255,255,.94); border:2px solid var(--ink-primary,#171717); border-radius:16px; box-shadow:5px 5px 0 var(--ink-primary,#171717); }
</style>
