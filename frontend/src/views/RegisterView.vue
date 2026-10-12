<template>
  <div class="py-5">
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
            <h4 class="font-serif-headline font-weight-bold mb-1 text-dark">
              Đăng Ký
            </h4>
            <small class="text-muted">
              Cấp thẻ bạn đọc trực tuyến phục vụ nghiên cứu & mượn học liệu
            </small>
          </div>

          <form @submit.prevent="handleRegister">
            <div class="form-group mb-3">
              <label class="small font-weight-bold mb-1">Số điện thoại:</label>
              <input type="tel" class="form-control ath-input" v-model="form.DienThoai" placeholder="VD: 0912345678" required />
              <small class="form-text text-muted" style="font-size:0.72rem;">Mã độc giả sẽ được hệ thống tự động cấp sau khi đăng ký thành công.</small>
            </div>

            <div class="row">
              <div class="col-md-7 form-group mb-3">
                <label class="small font-weight-bold mb-1">Họ và tên đệm:</label>
                <input type="text" class="form-control ath-input" v-model="form.HoLot" placeholder="VD: Nguyễn Văn" required />
              </div>

              <div class="col-md-5 form-group mb-3">
                <label class="small font-weight-bold mb-1">Tên:</label>
                <input type="text" class="form-control ath-input" v-model="form.Ten" placeholder="VD: An" required />
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 form-group mb-3">
                <label class="small font-weight-bold mb-1">Ngày sinh:</label>
                <input type="date" class="form-control ath-input" v-model="form.NgaySinh" required />
              </div>

              <div class="col-md-6 form-group mb-3">
                <label class="small font-weight-bold mb-1">Giới tính:</label>
                <select class="form-control ath-input" v-model="form.Phai">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="small font-weight-bold mb-1">Địa Chỉ Thường Trú:</label>
              <input type="text" class="form-control ath-input" v-model="form.DiaChi" placeholder="VD: Phường Xuân Khánh, Ninh Kiều, Cần Thơ" />
            </div>

            <div class="form-group mb-4">
              <label class="small font-weight-bold mb-1">Mật khẩu đăng nhập:</label>
              <input type="password" class="form-control ath-input" v-model="form.Password" placeholder="Nhập mật khẩu an toàn..." required />
            </div>

            <button type="submit" class="ath-btn-primary w-100 py-2 mb-3" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin mr-1"></i>
              <i v-else class="fas fa-user-plus mr-1"></i>
              Hoàn Tất Đăng Ký
            </button>
          </form>

          <!-- Đường phân cách và nút đăng ký Google ở dưới -->
          <div class="position-relative my-3 text-center">
            <hr style="border-color: var(--paper-border);" />
            <span class="position-absolute bg-white px-3 text-muted small" style="top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem;">
              Hoặc tiếp tục với
            </span>
          </div>

          <button 
            type="button" 
            class="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center font-weight-bold" 
            style="border-color: #d1d5db; color: #374151;"
            @click="handleGoogleRegister"
          >
            <i class="fab fa-google text-danger mr-2"></i>
            Đăng ký bằng tài khoản Google
          </button>

          <div class="text-center mt-3 small text-muted">
            Đã có thẻ thư viện? 
            <router-link to="/login" class="font-weight-bold text-success text-decoration-none">
              Đăng nhập tại đây
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
      },
      loading: false,
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
      try {
        const res = await authService.register(this.form);
        this.$refs.toast.show(res.message || "Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
        setTimeout(() => {
          this.$router.push("/login");
        }, 1200);
      } catch (err) {
        const msg = err.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.loading = false;
      }
    },
    handleGoogleRegister() {
      this.$refs.toast.show("Chức năng đăng ký bằng Google đang được phát triển!", "info");
    }
  }
};
</script>