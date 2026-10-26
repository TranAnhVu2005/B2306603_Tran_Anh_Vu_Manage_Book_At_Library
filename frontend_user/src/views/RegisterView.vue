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
                  <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
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
                    <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
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
                    <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
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
                    <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
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
                    <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
                      <i class="fas fa-venus-mars text-muted"></i>
                    </span>
                    <select class="form-select ath-input border-start-0" v-model="form.Phai">
                      <option :value="1">Nam</option>
                      <option :value="0">Nữ</option>
                      <option :value="2">Khác</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Địa chỉ -->
              <div class="mb-3">
                <label class="small fw-bold mb-1 text-dark">Địa chỉ thường trú:</label>
                <div class="input-group">
                  <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
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
                  <span class="input-group-text bg-white me-2" style="border-color: var(--paper-border);">
                    <i class="fas fa-key text-muted"></i>
                  </span>
                  <input
                    type="password"
                    class="form-control ath-input border-start-0"
                    v-model="form.MatKhau"
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
        Phai: 1,
        DiaChi: "",
        DienThoai: "",
        MatKhau: "",
      },
      loading: false,
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
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
  }
};
</script>

<style scoped>
.register-background {
  min-height: 100vh;
  width: 100%;

  /* Đồng bộ hiệu ứng gradient trong suốt, sang trọng với trang đăng nhập */
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
  /* Hiệu ứng kính mờ (Glassmorphism) đồng bộ với trang đăng nhập */
  background-color: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

</style>
