<template>
  <section class="login-background">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-7 col-lg-5">
          <div class="ath-card p-4 p-md-5">
            <div class="text-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
              <img src="@/assets/library_logo.png" alt="Logo Thư viện" class="mb-2" style="width:54px;height:54px;object-fit:contain" />
              <h1 class="font-serif-headline fw-bold mb-1 text-dark h4">Đăng nhập nhân viên</h1>
              <p class="text-muted small mb-0">Cổng nghiệp vụ dành cho Thủ thư và Quản trị viên</p>
            </div>
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="staff-phone" class="small fw-bold text-dark mb-1">Số điện thoại</label>
                <input id="staff-phone" v-model.trim="phone" class="form-control ath-input" type="tel" inputmode="tel" autocomplete="tel" placeholder="Nhập số điện thoại đã đăng ký" required />
              </div>
              <div class="mb-4">
                <label for="staff-password" class="small fw-bold text-dark mb-1">Mật khẩu</label>
                <input id="staff-password" v-model="password" type="password" class="form-control ath-input" autocomplete="current-password" required />
              </div>
              <button class="ath-btn-primary w-100 py-2" type="submit" :disabled="loading">
                {{ loading ? "Đang xác thực..." : "Đăng nhập" }}
              </button>
            </form>
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
  data: () => ({ phone: "", password: "", loading: false }),
  methods: {
    async handleLogin() {
      this.loading = true;
      try {
        const response = await authService.login(this.phone, this.password);
        if (!authService.isStaffOrAdmin(response?.data)) {
          await authService.logout();
          this.password = "";
          this.$refs.toast.show("Tài khoản này không có quyền truy cập cổng nhân viên.", "error");
          return;
        }
        const requested = typeof this.$route.query.redirect === "string" ? this.$route.query.redirect : "/manager/borrows";
        const redirect = /^\/(manager\/|admin\/|profile(?:\?|$))/.test(requested) && !requested.startsWith("//")
          ? requested
          : "/manager/borrows";
        await this.$router.replace(redirect);
      } catch (error) {
        this.password = "";
        this.$refs.toast.show(error.response?.data?.message || "Tài khoản hoặc mật khẩu không chính xác.", "error");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-background { min-height: 100vh; display:flex; align-items:center; padding:50px 0; background:linear-gradient(135deg,rgba(67,45,215,.42),rgba(253,200,0,.28)),url('@/assets/background_login.jpg') center/cover no-repeat; }
.ath-card { background:rgba(255,255,255,.9); backdrop-filter:blur(14px); border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,.2); }
</style>
