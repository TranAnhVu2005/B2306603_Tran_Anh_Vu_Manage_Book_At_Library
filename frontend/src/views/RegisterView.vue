<template>
  <div class="register-background d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-9 col-lg-7">
          <div class="ath-card p-4 p-md-5">
            <!-- Header -->
            <div class="text-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
              <img
                src="@/assets/library_logo.png"
                alt="Logo Thư Viện"
                class="mb-2"
                style="width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(20, 53, 41, 0.15));"
              />
              <h4 class="font-serif-headline fw-bold mb-1 text-dark">
                Đăng Ký Tài Khoản
              </h4>
              <small class="text-muted">
                Tài khoản là thẻ bạn đọc trực tuyến phục vụ tra cứu &amp; mượn học liệu
              </small>
            </div>

            <form @submit.prevent="handleRegister">
              <!-- Số điện thoại -->
              <div class="mb-3">
                <label class="small fw-bold mb-1 text-dark">Số điện thoại liên hệ:</label>
                <div class="input-group">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-phone text-muted"></i>
                  </span>
                  <input
                    type="tel"
                    class="form-control ath-input border-start-0"
                    v-model="form.DienThoai"
                    placeholder="Nhập số điện thoại..."
                    required
                  />
                </div>
              </div>

              <!-- Họ tên đệm + Tên -->
              <div class="row">
                <div class="col-md-7 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Họ và tên đệm:</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                      <i class="fas fa-user text-muted"></i>
                    </span>
                    <input
                      type="text"
                      class="form-control ath-input border-start-0"
                      v-model="form.HoLot"
                      placeholder="Nhập họ và tên đệm..."
                      required
                    />
                  </div>
                </div>

                <div class="col-md-5 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Tên:</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                      <i class="fas fa-signature text-muted"></i>
                    </span>
                    <input
                      type="text"
                      class="form-control ath-input border-start-0"
                      v-model="form.Ten"
                      placeholder="Nhập tên..."
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- Ngày sinh + Giới tính -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Ngày sinh:</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                      <i class="fas fa-calendar-alt text-muted"></i>
                    </span>
                    <input
                      type="date"
                      class="form-control ath-input border-start-0"
                      v-model="form.NgaySinh"
                      required
                    />
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Giới tính:</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                      <i class="fas fa-venus-mars text-muted"></i>
                    </span>
                    <select class="form-select ath-input border-start-0" v-model="form.Phai">
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Địa chỉ -->
              <div class="mb-3">
                <label class="small fw-bold mb-1 text-dark">Địa chỉ thường trú:</label>
                <div class="input-group">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-map-marker-alt text-muted"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control ath-input border-start-0"
                    v-model="form.DiaChi"
                    placeholder="Nhập địa chỉ thường trú..."
                  />
                </div>
              </div>

              <!-- Mật khẩu -->
              <div class="mb-4">
                <label class="small fw-bold mb-1 text-dark">Mật khẩu tài khoản:</label>
                <div class="input-group">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-key text-muted"></i>
                  </span>
                  <input
                    type="password"
                    class="form-control ath-input border-start-0"
                    v-model="form.Password"
                    placeholder="Nhập mật khẩu..."
                    required
                  />
                </div>
              </div>

              <button type="submit" class="ath-btn-primary w-100 py-2 mb-3" :disabled="loading">
                <i v-if="loading" class="fas fa-spinner fa-spin me-1"></i>
                <i v-else class="fas fa-user-plus me-1"></i>
                Hoàn Tất Đăng Ký
              </button>
            </form>

            <!-- Divider -->
            <div class="position-relative my-3 text-center">
              <hr style="border-color: var(--paper-border);" />
              <span class="position-absolute bg-white px-3 text-muted small" style="top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem;">
                Hoặc tiếp tục với
              </span>
            </div>

            <!-- Nút đăng ký Google (đồng bộ style với LoginView) -->
            <button
              type="button"
              class="btn google-google-btn w-100 py-2 d-flex align-items-center justify-content-center fw-bold"
              :disabled="googleLoading"
              @click="handleGoogleRegister"
            >
              <i v-if="googleLoading" class="fas fa-spinner fa-spin me-2"></i>
              <template v-else>
                <svg class="me-2" width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Đăng ký bằng tài khoản Google
              </template>
            </button>

            <div class="text-center mt-4 small text-muted">
              Đã có tài khoản?
              <router-link to="/login" class="fw-bold text-success text-decoration-none">
                Đăng nhập tại đây
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import authService from "../services/auth.service";

export default {
  name: "RegisterView",
  components: {
    ToastNotification,
  },
  data() {
    return {
      form: {
        HoLot: "",
        Ten: "",
        NgaySinh: "2003-01-01",
        Phai: "Nam",
        DiaChi: "",
        DienThoai: "",
        Password: "",
        MatKhau: "",
      },
      loading: false,
      googleLoading: false,
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
      this.form.MatKhau = this.form.Password;
      try {
        const res = await authService.register(this.form);
        const assignedCode = res.data?.MaDocGia ? ` (Mã thẻ: ${res.data.MaDocGia})` : "";
        this.$refs.toast.show(`Đăng ký thành công${assignedCode}! Đang chuyển đến trang đăng nhập...`);
        setTimeout(() => {
          this.$router.push("/login");
        }, 1500);
      } catch (err) {
        const msg = err.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.loading = false;
      }
    },
    async handleGoogleRegister() {
      this.googleLoading = true;
      try {
        const res = await authService.loginWithGoogle();
        this.$refs.toast.show("Cấp thẻ thành công thông qua tài khoản Google!");
        setTimeout(() => {
          this.$router.push("/");
        }, 800);
      } catch (err) {
        this.$refs.toast.show("Đăng ký qua Google không thành công.", "error");
      } finally {
        this.googleLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.register-background {
  min-height: 100vh;
  width: 100%;

  /* Đồng bộ hiệu ứng gradient trong suốt, sang trọng với trang đăng nhập */
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.55), rgba(20, 83, 45, 0.45)), url('@/assets/background_1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.ath-card {
  /* Hiệu ứng kính mờ (Glassmorphism) đồng bộ với trang đăng nhập */
  background-color: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* Nút Google đồng bộ với fallback button trong LoginView */
.google-google-btn {
  border: 1.5px solid #d1d5db;
  color: #374151;
  background: #fff;
  border-radius: 8px;
  font-size: 0.92rem;
  transition: background 0.18s, box-shadow 0.18s;
}

.google-google-btn:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
}
</style>