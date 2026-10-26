<template>
  <div class="login-background d-flex align-items-center justify-content-center">
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
                  <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
                    <i class="fas fa-user text-muted"></i>
                  </span>
                  <input type="tel" inputmode="tel" autocomplete="tel" pattern="\+?[0-9]{9,15}"
                         class="form-control ath-input border-start-0" 
                         v-model="phone"
                         placeholder="Nhập số điện thoại..."
                         required />
                </div>
              </div>

              <div class="mb-4">
                <label class="small fw-bold text-dark mb-1">
                  Mật khẩu:
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0 me-2" style="border-color: var(--paper-border);">
                    <i class="fas fa-key text-muted"></i>
                  </span>
                  <input :type="showPassword ? 'text' : 'password'" 
                         class="form-control ath-input border-start-0" 
                         v-model="password" 
                         placeholder="Nhập mật khẩu..." 
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

            <div class="login-divider" aria-hidden="true"><span>HOẶC</span></div>
            <div v-if="googleClientId" class="google-login-block">
              <div ref="googleButton" class="google-button" aria-label="Đăng nhập bằng Google"></div>
              <p v-if="googleLoading" class="small text-muted text-center mt-2 mb-0" role="status">
                Đang xác thực tài khoản Google…
              </p>
              <p v-if="googleError" class="small text-danger text-center mt-2 mb-0" role="alert">
                {{ googleError }}
              </p>
            </div>
            <p v-else class="google-config-note small text-muted text-center mb-0">
              Đăng nhập Google chưa được cấu hình cho cổng độc giả.
            </p>

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
      phone: "",
      password: "",
      showPassword: false,
      loading: false,
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
      googleLoading: false,
      googleError: "",
    };
  },
  mounted() {
    if (this.googleClientId) this.loadGoogleIdentityServices();
  },
  methods: {
    loadGoogleIdentityServices() {
      if (window.google?.accounts?.id) {
        this.initializeGoogleIdentityServices();
        return;
      }
      const existingScript = document.getElementById("google-gsi-script");
      if (existingScript) {
        existingScript.addEventListener("load", this.initializeGoogleIdentityServices, { once: true });
        existingScript.addEventListener("error", this.handleGoogleScriptError, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = this.initializeGoogleIdentityServices;
      script.onerror = this.handleGoogleScriptError;
      document.head.appendChild(script);
    },
    handleGoogleScriptError() {
      this.googleError = "Không tải được dịch vụ đăng nhập Google. Vui lòng thử lại sau.";
    },
    initializeGoogleIdentityServices() {
      const googleIdentity = window.google?.accounts?.id;
      const container = this.$refs.googleButton;
      if (!googleIdentity || !container) return;
      container.replaceChildren();
      googleIdentity.initialize({
        client_id: this.googleClientId,
        callback: this.handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleIdentity.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        logo_alignment: "left",
        width: Math.min(Math.max(container.clientWidth, 200), 400),
      });
    },
    async handleGoogleCredentialResponse(response) {
      if (!response?.credential) {
        this.googleError = "Google không trả về thông tin xác thực. Vui lòng thử lại.";
        return;
      }
      this.googleLoading = true;
      this.googleError = "";
      try {
        const result = await authService.loginWithGoogle(response.credential);
        if (!authService.isReader(result.data)) {
          await authService.logout();
          throw new Error("Cổng này chỉ hỗ trợ đăng nhập Google cho độc giả.");
        }
        this.$refs.toast.show(result.message || "Đăng nhập bằng Google thành công.");
        setTimeout(() => {
          const requested = typeof this.$route.query.redirect === "string" ? this.$route.query.redirect : "/";
          const redirect = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
          this.$router.push(redirect);
        }, 600);
      } catch (error) {
        this.googleError = error.response?.data?.message || error.message || "Không thể đăng nhập bằng Google.";
      } finally {
        this.googleLoading = false;
      }
    },
    async handleLogin() {
      this.loading = true;
      try {
        const res = await authService.login(this.phone, this.password);
        if (authService.isStaffOrAdmin(res.data)) {
          const manageUrl = import.meta.env.VITE_MANAGE_APP_URL || (import.meta.env.DEV ? "http://localhost:3002" : "");
          if (!manageUrl) {
            await authService.logout();
            this.$refs.toast.show("Chưa cấu hình domain cổng nhân viên cho môi trường này.", "error");
            return;
          }
          await authService.logout();
          window.location.assign(`${manageUrl.replace(/\/$/, "")}/login`);
          return;
        }
        this.$refs.toast.show(res.message || "Đăng nhập thành công!");
        setTimeout(() => {
          const requested = typeof this.$route.query.redirect === "string" ? this.$route.query.redirect : "/";
          const redirect = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
          this.$router.push(redirect);
        }, 600);
      } catch (err) {
        const msg = err.response?.data?.message || "Tài khoản hoặc mật khẩu không chính xác.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.loading = false;
      }
    },
  }
};
</script>

<style scoped>
.login-background {
  min-height: 100vh;
  width: 100%;
  
  /* Tạo lớp phủ gradient mượt mà, trong suốt hơn để thấy rõ ảnh nền kệ sách */
  background: linear-gradient(135deg, rgba(67, 45, 215, 0.42), rgba(253, 200, 0, 0.28)), url('@/assets/background_login.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
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

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 14px;
  color: #716f68;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.login-divider::before,
.login-divider::after {
  content: "";
  height: 1px;
  flex: 1;
  background: var(--paper-border, #d7d2c5);
}

.google-login-block,
.google-button {
  width: 100%;
  min-height: 42px;
}

.google-button {
  display: flex;
  justify-content: center;
}

.google-config-note {
  padding: 10px 12px;
  border: 1px solid var(--paper-border, #d7d2c5);
  background: rgba(255, 255, 255, 0.55);
}

</style>
