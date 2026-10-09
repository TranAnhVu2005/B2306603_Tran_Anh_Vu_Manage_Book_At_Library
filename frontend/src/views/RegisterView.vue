<template>
  <div class="py-5">
    <div class="row justify-content-center">
      <div class="col-md-9 col-lg-7">
        <div class="ath-card p-4 p-md-5">
          <!-- Header -->
          <div class="text-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
            <div class="d-inline-flex align-items-center justify-content-center mb-2 font-weight-bold" 
                 style="width: 46px; height: 46px; background-color: var(--primary); color: #fff; font-family: var(--font-serif); font-size: 1.6rem; border-radius: 4px;">
              A
            </div>
            <h4 class="font-serif-headline font-weight-bold mb-1 text-dark">
              Đăng Ký Thẻ Thư Viện Mới
            </h4>
            <small class="text-muted">
              Cấp thẻ bạn đọc trực tuyến phục vụ nghiên cứu & mượn học liệu
            </small>
          </div>

          <form @submit.prevent="handleRegister">
            <div class="row">
              <div class="col-md-6 form-group mb-3">
                <label class="small font-weight-bold mb-1">Mã Độc Giả (Bắt buộc):</label>
                <input type="text" class="form-control ath-input" v-model="form.MaDocGia" placeholder="VD: DG04 hoặc B2109880" required />
              </div>

              <div class="col-md-6 form-group mb-3">
                <label class="small font-weight-bold mb-1">Số Điện Thoại:</label>
                <input type="tel" class="form-control ath-input" v-model="form.DienThoai" placeholder="VD: 0912345678" required />
              </div>
            </div>

            <div class="row">
              <div class="col-md-7 form-group mb-3">
                <label class="small font-weight-bold mb-1">Họ và Tên Đệm:</label>
                <input type="text" class="form-control ath-input" v-model="form.HoLot" placeholder="VD: Nguyễn Văn" required />
              </div>

              <div class="col-md-5 form-group mb-3">
                <label class="small font-weight-bold mb-1">Tên:</label>
                <input type="text" class="form-control ath-input" v-model="form.Ten" placeholder="VD: An" required />
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 form-group mb-3">
                <label class="small font-weight-bold mb-1">Ngày Sinh:</label>
                <input type="date" class="form-control ath-input" v-model="form.NgaySinh" required />
              </div>

              <div class="col-md-6 form-group mb-3">
                <label class="small font-weight-bold mb-1">Giới Tính:</label>
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
              <label class="small font-weight-bold mb-1">Mật Khẩu Đăng Nhập:</label>
              <input type="password" class="form-control ath-input" v-model="form.Password" placeholder="Nhập mật khẩu an toàn..." required />
            </div>

            <button type="submit" class="ath-btn-primary w-100 py-2" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin mr-1"></i>
              <i v-else class="fas fa-user-plus mr-1"></i>
              Hoàn Tất Đăng Ký Thẻ
            </button>
          </form>

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
        MaDocGia: "",
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
    }
  }
};
</script>
