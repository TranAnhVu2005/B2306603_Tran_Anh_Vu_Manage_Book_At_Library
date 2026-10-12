<template>
  <div class="py-5">
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
            <h4 class="font-serif-headline font-weight-bold mb-1 text-dark">
              Đăng Nhập Thư Viện
            </h4>
            <small class="text-muted">
              Cổng Xác Thực Độc Giả, Thủ Thư & Quản Trị Viên
            </small>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="form-group mb-3">
              <label class="small font-weight-bold text-dark mb-1">
                Mã độc giả / Mã số nhân viên (MSNV) / SĐT:
              </label>
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-user text-muted"></i>
                  </span>
                </div>
                <input type="text" 
                       class="form-control ath-input border-left-0" 
                       v-model="identifier" 
                       placeholder="VD: DG01 hoặc ADMIN01" 
                       required />
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="small font-weight-bold text-dark mb-1">
                Mật khẩu:
              </label>
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                    <i class="fas fa-key text-muted"></i>
                  </span>
                </div>
                <input :type="showPassword ? 'text' : 'password'" 
                       class="form-control ath-input border-left-0" 
                       v-model="password" 
                       placeholder="Nhập mật khẩu..." 
                       required />
                <div class="input-group-append">
                  <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword" style="border-color: var(--paper-border);">
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" class="ath-btn-primary w-100 py-2" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin mr-1"></i>
              <i v-else class="fas fa-sign-in-alt mr-1"></i>
              Đăng Nhập
            </button>
          </form>

          <!-- Quick Test Credentials Box -->
          <div class="mt-4 p-3 border rounded small" style="background-color: var(--paper); border-color: var(--paper-border) !important;">
            <div class="font-weight-bold mb-2 text-dark">
              <i class="fas fa-vial text-info mr-1"></i> Tài khoản mẫu dùng để kiểm thử:
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span>Super Admin:</span>
              <a href="javascript:void(0)" class="badge badge-danger font-mono-code" @click="fill('ADMIN01', 'admin123')">
                ADMIN01 / admin123
              </a>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span>Thủ thư:</span>
              <a href="javascript:void(0)" class="badge badge-success font-mono-code" @click="fill('NV01', 'staff123')">
                NV01 / staff123
              </a>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span>Độc giả (DG01):</span>
              <a href="javascript:void(0)" class="badge badge-light border font-mono-code" @click="fill('DG01', '123456')">
                DG01 / 123456
              </a>
            </div>
          </div>

          <!-- Register Link -->
          <div class="text-center mt-3 small text-muted">
            Chưa có thẻ thư viện? 
            <router-link to="/register" class="font-weight-bold text-success text-decoration-none">
              Đăng ký ngay tại đây
            </router-link>
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
    };
  },
  methods: {
    fill(u, p) {
      this.identifier = u;
      this.password = p;
    },
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
        const msg = err.response?.data?.message || "Tài khoản hoặc mật khẩu không đúng.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
