<template>
  <div class="py-4">
    <!-- Back button -->
    <div class="mb-3">
      <router-link to="/" class="ath-btn-outline text-decoration-none">
        <i class="fas fa-arrow-left mr-1"></i> Quay lại mục lục
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="text-muted small mt-2">Đang tải thông tin sách...</p>
    </div>

    <div v-else-if="!book" class="ath-card text-center py-5">
      <h5>Không tìm thấy thông tin cuốn sách này</h5>
    </div>

    <div v-else class="ath-card p-4 p-md-5">
      <div class="row">
        <!-- Book Cover -->
        <div class="col-md-4 mb-4 mb-md-0">
          <div class="border rounded p-2 text-center" style="background-color: var(--paper); border-color: var(--paper-border) !important;">
            <img :src="book.HinhAnh || defaultCover" 
                 :alt="book.TenSach" 
                 class="img-fluid rounded shadow-sm"
                 style="max-height: 400px; width: auto; object-fit: cover;" 
                 @error="onImageError" />
          </div>
        </div>

        <!-- Book Meta & Actions -->
        <div class="col-md-8">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="font-mono-code text-muted font-weight-bold">
              MÃ SÁCH: <strong class="text-dark">{{ book.MaSach }}</strong>
            </span>
            <span v-if="book.SoQuyen > 0" class="ath-badge ath-badge-available">
              <i class="fas fa-check-circle"></i> Sẵn sàng mượn ({{ book.SoQuyen }} cuốn)
            </span>
            <span v-else class="ath-badge ath-badge-out">
              <i class="fas fa-ban"></i> Tạm hết tại kho
            </span>
          </div>

          <h2 class="font-serif-headline font-weight-bold text-dark mb-2">
            {{ book.TenSach }}
          </h2>
          <p class="lead font-italic text-muted mb-4" style="font-family: var(--font-serif);">
            Tác giả: <strong class="text-dark">{{ book.TacGia }}</strong>
          </p>

          <!-- Archival Spec Grid -->
          <div class="p-3 border rounded mb-4" style="background-color: var(--paper); border-color: var(--paper-border) !important;">
            <div class="row">
              <div class="col-sm-6 mb-2">
                <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Nhà xuất bản:</small>
                <strong class="text-dark">{{ book.MaNXB }}</strong>
              </div>
              <div class="col-sm-6 mb-2">
                <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Năm xuất bản:</small>
                <strong class="text-dark">{{ book.NamXuatBan || '—' }}</strong>
              </div>
              <div class="col-sm-6 mb-2">
                <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Nguồn gốc / Xuất xứ:</small>
                <strong class="text-dark">{{ book.NguonGoc || 'Việt Nam' }}</strong>
              </div>
              <div class="col-sm-6 mb-2">
                <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Đơn giá bồi hoàn:</small>
                <strong class="font-mono-code text-dark">{{ formatCurrency(book.DonGia) }}</strong>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <h6 class="text-uppercase small font-weight-bold text-muted mb-2">Tóm tắt nội dung</h6>
            <p class="text-dark leading-relaxed" style="font-size: 0.95rem;">
              {{ book.MoTa || 'Hiện chưa có tóm tắt chi tiết cho cuốn sách này.' }}
            </p>
          </div>

          <!-- CTA Buttons -->
          <div class="d-flex align-items-center pt-3 border-top" style="border-color: var(--paper-border) !important;">
            <button v-if="book.SoQuyen > 0" class="ath-btn-primary mr-3" @click="showBorrowModal = true">
              <i class="fas fa-bookmark mr-1"></i> Đăng ký mượn cuốn này
            </button>
            <button v-else class="ath-btn-outline mr-3" disabled style="opacity: 0.6;">
              <i class="fas fa-ban mr-1"></i> Tạm hết trong kho
            </button>
            <small class="text-muted">
              <i class="fas fa-shield-alt mr-1 text-success"></i> Thời hạn mượn: 14 ngày tiêu chuẩn
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Borrow Modal -->
    <BorrowModal :show="showBorrowModal" 
                 :book="book" 
                 @close="showBorrowModal = false" 
                 @confirm="submitBorrowRequest" />

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import BorrowModal from "../components/BorrowModal.vue";
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import theoDoiService from "../services/theodoimuon.service";
import authService from "../services/auth.service";

export default {
  name: "BookDetail",
  components: {
    BorrowModal,
    ToastNotification,
  },
  data() {
    return {
      book: null,
      loading: false,
      showBorrowModal: false,
      defaultCover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    };
  },
  created() {
    this.fetchBook();
  },
  methods: {
    async fetchBook() {
      this.loading = true;
      try {
        const id = this.$route.params.id;
        this.book = await sachService.get(id);
      } catch (err) {
        this.$refs.toast.show("Không tìm thấy thông tin cuốn sách.", "error");
      } finally {
        this.loading = false;
      }
    },
    formatCurrency(val) {
      if (!val) return "0 ₫";
      return Number(val).toLocaleString("vi-VN") + " ₫";
    },
    onImageError(e) {
      e.target.src = this.defaultCover;
    },
    async submitBorrowRequest(payload) {
      if (!authService.isLoggedIn()) {
        this.$router.push(`/login?redirect=${this.$route.fullPath}`);
        return;
      }
      try {
        const result = await theoDoiService.dangKyMuon({
          MaDocGia: payload.maDocGia,
          MaSach: payload.maSach,
          GhiChu: payload.ghiChu,
        });
        this.showBorrowModal = false;
        this.$refs.toast.show(result.message || "Đăng ký mượn thành công!");
        this.fetchBook();
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || "Không thể đăng ký mượn.";
        this.$refs.toast.show(errMsg, "error", 4500);
      }
    }
  }
};
</script>
