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
                  <input type="text" 
                         class="form-control ath-input border-start-0" 
                         v-model="identifier" 
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

            <!-- Divider -->
            <div class="position-relative my-3 text-center">
              <hr style="border-color: var(--paper-border);" />
              <span class="position-absolute bg-white px-3 text-muted small" style="top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem;">
                Hoặc tiếp tục với
              </span>
            </div>

            <!-- Google Sign-In Button (GSI rendered button) -->
            <div class="google-btn-wrapper">
              <!-- Nút Google chính thức do GSI render - ưu tiên dùng nếu GSI load thành công -->
              <div id="google-signin-btn" ref="googleBtnContainer" class="d-flex justify-content-center"></div>

              <!-- Nút dự phòng hiển thị khi GSI chưa tải hoặc đang tải -->
              <button
                v-if="!gsiReady"
                type="button"
                class="btn google-fallback-btn w-100 py-2 d-flex align-items-center justify-content-center fw-bold"
                :disabled="googleLoading"
                @click="handleFallbackGoogleLogin"
              >
                <i v-if="googleLoading" class="fas fa-spinner fa-spin me-2"></i>
                <template v-else>
                  <svg class="me-2" width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Đăng nhập bằng tài khoản Google
                </template>
              </button>
            </div>

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

// Google Client ID khớp với cấu hình trên Google Cloud Console
const GOOGLE_CLIENT_ID = "662587995671-tgve448mjem4jffqkqkgqcgrog4v6nuo.apps.googleusercontent.com";

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
      gsiReady: false,       // Trạng thái Google Identity Services đã load xong
      gsiScriptLoaded: false,
    };
  },
  mounted() {
    this.loadGoogleIdentityServices();
  },
  beforeUnmount() {
    // Dọn dẹp script tag khi rời khỏi trang để tránh duplicate
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.remove();
    }
  },
  methods: {
    /**
     * Tải thư viện Google Identity Services (GSI) từ CDN.
     * Khi load xong, khởi tạo nút đăng nhập Google chính thức.
     */
    loadGoogleIdentityServices() {
      // Nếu GSI đã được tải trước đó (ví dụ khi quay lại trang)
      if (window.google && window.google.accounts) {
        this.initializeGSI();
        return;
      }

      // Tránh tải script trùng lặp
      if (document.getElementById("google-gsi-script")) {
        // Script đang tải, đợi callback
        window.__onGSILoaded = () => this.initializeGSI();
        return;
      }

      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gsiScriptLoaded = true;
        this.initializeGSI();
        if (window.__onGSILoaded) window.__onGSILoaded();
      };
      script.onerror = () => {
        console.warn("[LoginView] Không thể tải Google Identity Services. Sử dụng nút dự phòng.");
        // gsiReady vẫn = false → nút dự phòng hiển thị
      };
      document.head.appendChild(script);
    },

    /**
     * Khởi tạo Google Identity Services:
     * - Gọi google.accounts.id.initialize() với clientId và callback
     * - Render nút "Sign in with Google" chuẩn của Google vào container
     */
    initializeGSI() {
      if (!window.google || !window.google.accounts) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: this.handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render nút Google chính thức
      const container = this.$refs.googleBtnContainer;
      if (container) {
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          text: "signin_with",
          size: "large",
          logo_alignment: "left",
          width: container.offsetWidth || 400,
        });
        this.gsiReady = true;
      }
    },

    /**
     * Callback được gọi khi người dùng chọn tài khoản Google thành công.
     * Google trả về { credential: "JWT_ID_TOKEN_STRING" }
     * @param {Object} response - Response từ Google GSI
     */
    async handleGoogleCredentialResponse(response) {
      if (!response || !response.credential) {
        this.$refs.toast.show("Không nhận được thông tin từ Google.", "error");
        return;
      }

      this.googleLoading = true;
      try {
        // Gửi credential (ID Token) lên backend để xác thực và tạo phiên
        const res = await authService.loginWithGoogle(response.credential);
        this.$refs.toast.show(res.message || "Đăng nhập Google thành công!");
        setTimeout(() => {
          const requested = typeof this.$route.query.redirect === "string" ? this.$route.query.redirect : "/";
          const redirect = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
          this.$router.push(redirect);
        }, 700);
      } catch (err) {
        const msg = err.response?.data?.message || "Không thể đăng nhập bằng tài khoản Google.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.googleLoading = false;
      }
    },

    /**
     * Nút dự phòng: kích hoạt popup One Tap của Google theo cách thủ công
     * khi nút GSI render không hiển thị được (lỗi mạng, tải chậm).
     */
    handleFallbackGoogleLogin() {
      if (window.google && window.google.accounts) {
        // Thử render lại và prompt One Tap
        this.initializeGSI();
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.$refs.toast.show(
              "Cửa sổ đăng nhập Google không thể mở. Hãy kiểm tra trình duyệt có chặn pop-up không.",
              "error"
            );
          }
        });
      } else {
        this.$refs.toast.show(
          "Dịch vụ Google chưa sẵn sàng. Vui lòng kiểm tra kết nối internet và thử lại.",
          "error"
        );
        // Thử tải lại GSI
        this.loadGoogleIdentityServices();
      }
    },

    async handleLogin() {
      this.loading = true;
      try {
        const res = await authService.login(this.identifier, this.password);
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
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.55), rgba(20, 83, 45, 0.45)), url('@/assets/background_login.jpg');
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

/* Container cho nút Google - đảm bảo full width */
.google-btn-wrapper {
  width: 100%;
  min-height: 44px;
}

#google-signin-btn {
  width: 100%;
}

/* Nút dự phòng khi GSI chưa load */
.google-fallback-btn {
  border: 1.5px solid #d1d5db;
  color: #374151;
  background: #fff;
  border-radius: 8px;
  font-size: 0.92rem;
  transition: background 0.18s, box-shadow 0.18s;
}

.google-fallback-btn:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
</style>
