<template>
  <div class="login-background vh-100 d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-7 col-lg-5">
          <div class="ath-card p-4 p-md-5">
            <!-- Brand Header -->
            <div class="text-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
              <img
                src="@/assets/library_logo.png"
                alt="Logo Thư Viện"
                class="mb-2"
                style="width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(20, 53, 41, 0.15));"
              />
              <h4 class="font-serif-headline fw-bold mb-1 text-dark">
                Đăng Nhập Thư Viện
              </h4>
              <small class="text-muted">
              </small>
            </div>

            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label class="small fw-bold text-dark mb-1">
                  Số điện thoại:
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-user text-muted"></i>
                  </span>
                  <input type="text" 
                         class="form-control ath-input border-start-0" 
                         v-model="identifier" 
                         placeholder="Nhập số điện thoại" 
                         required />
                </div>
              </div>

              <div class="mb-4">
                <label class="small fw-bold text-dark mb-1">
                  Mật khẩu:
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-key text-muted"></i>
                  </span>
                  <input :type="showPassword ? 'text' : 'password'" 
                         class="form-control ath-input border-start-0" 
                         v-model="password" 
                         placeholder="Nhập mật khẩu" 
                         required />
                  <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword" style="border-color: var(--paper-border);">
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="ath-btn-primary w-100 py-2 mb-3" :disabled="loading">
                <i v-if="loading" class="fas fa-spinner fa-spin me-1"></i>
                <i v-else class="fas fa-sign-in-alt me-1"></i>
                Đăng Nhập
              </button>
            </form>

            <!-- Divider -->
            <div class="position-relative my-3 text-center">
              <hr style="border-color: var(--paper-border);" />
              <span class="position-absolute bg-white px-3 text-muted small" style="top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem;">
                Hoặc tiếp tục với
              </span>
            </div>

            <!-- Google Login Button -->
            <button 
              type="button" 
              class="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center fw-bold" 
              style="border-color: #d1d5db; color: #374151;"
              :disabled="googleLoading"
              @click="handleGoogleLogin"
            >
              <i v-if="googleLoading" class="fas fa-spinner fa-spin me-2"></i>
              <i v-else class="fab fa-google text-danger me-2"></i>
              Đăng nhập bằng tài khoản Google
            </button>

            <!-- Register Link -->
            <div class="text-center mt-4 small text-muted">
              Chưa có thẻ thư viện? 
              <router-link to="/register" class="fw-bold text-success text-decoration-none">
                Đăng ký cấp thẻ trực tuyến
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
  name: "LoginView",
  components: {
    ToastNotification,
  },
  data() {
    return {
      identifier: "",
      password: "",
      showPassword: false,
      loading: false,
      googleLoading: false,
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      try {
        const res = await authService.login(this.identifier, this.password);
        this.$refs.toast.show(res.message || "Đăng nhập thành công!");
        setTimeout(() => {
          const redirect = this.$route.query.redirect || "/";
          this.$router.push(redirect);
        }, 600);
      } catch (err) {
        const msg = err.response?.data?.message || "Tài khoản hoặc mật khẩu không chính xác.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.loading = false;
      }
    },
    async handleGoogleLogin() {
      this.googleLoading = true;
      try {
        const res = await authService.loginWithGoogle();
        this.$refs.toast.show(res.message || "Đăng nhập Google thành công!");
        setTimeout(() => {
          const redirect = this.$route.query.redirect || "/";
          this.$router.push(redirect);
        }, 600);
      } catch (err) {
        const msg = err.response?.data?.message || "Không thể đăng nhập bằng tài khoản Google.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.googleLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-background {
  min-height: calc(100vh - 120px);
  width: 100%;
  
  /* Tạo lớp phủ gradient mượt mà, trong suốt hơn để thấy rõ ảnh nền kệ sách */
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.55), rgba(20, 83, 45, 0.45)), url('@/assets/background_1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.ath-card {
  /* Hiệu ứng kính mờ (Glassmorphism) cực kỳ mướt mắt và hiện đại */
  background-color: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
</style>