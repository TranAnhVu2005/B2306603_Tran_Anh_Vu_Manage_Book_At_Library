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
                Tài khoản là thẻ bạn đọc trực tuyến phục vụ tra cứu & mượn học liệu
              </small>
            </div>

            <form @submit.prevent="handleRegister">
              <div class="mb-3">
                <label class="small fw-bold mb-1 text-dark">Số điện thoại liên hệ:</label>
                <input type="tel" class="form-control ath-input" v-model="form.DienThoai" placeholder="Nhập số điện thoại..." required />
              </div>

              <div class="row">
                <div class="col-md-7 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Họ và tên đệm:</label>
                  <input type="text" class="form-control ath-input" v-model="form.HoLot" placeholder="Nhập họ và tên đệm..." required />
                </div>

                <div class="col-md-5 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Tên:</label>
                  <input type="text" class="form-control ath-input" v-model="form.Ten" placeholder="Nhập tên..." required />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Ngày sinh:</label>
                  <input type="date" class="form-control ath-input" v-model="form.NgaySinh" required />
                </div>

                <div class="col-md-6 mb-3">
                  <label class="small fw-bold mb-1 text-dark">Giới tính:</label>
                  <select class="form-control ath-input" v-model="form.Phai">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="small fw-bold mb-1 text-dark">Địa chỉ thường trú:</label>
                <input type="text" class="form-control ath-input" v-model="form.DiaChi" placeholder="Nhập địa chỉ thường trú..." />
              </div>

              <div class="mb-4">
                <label class="small fw-bold mb-1 text-dark">Mật khẩu tài khoản:</label>
                <input type="password" class="form-control ath-input" v-model="form.Password" placeholder="Nhập mật khẩu..." required />
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

            <button 
              type="button" 
              class="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center fw-bold" 
              style="border-color: #d1d5db; color: #374151;"
              :disabled="googleLoading"
              @click="handleGoogleRegister"
            >
              <i v-if="googleLoading" class="fas fa-spinner fa-spin me-2"></i>
              <i v-else class="fab fa-google text-danger me-2"></i>
              Đăng ký bằng tài khoản Google
            </button>

            <div class="text-center mt-3 small text-muted">
              Đã có tài khoản ?
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
  
  /* Đồng bộ hiệu ứng gradient trong suốt, sang trọng */
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
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
</style>