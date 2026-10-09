<template>
  <div v-if="show" class="ath-modal-overlay" @click.self="$emit('close')">
    <div class="ath-modal-content p-4">
      <!-- Modal Header -->
      <div class="d-flex justify-content-between align-items-center pb-3 border-bottom" style="border-color: var(--paper-border) !important;">
        <div>
          <span class="text-uppercase small font-weight-bold" style="color: var(--primary); font-size: 0.7rem; letter-spacing: 0.05em;">
            Thủ tục lưu chiểu
          </span>
          <h5 class="font-serif-headline font-weight-bold mb-0 text-dark">
            Xác Nhận Đăng Ký Mượn Sách
          </h5>
        </div>
        <button type="button" class="close text-muted" aria-label="Close" @click="$emit('close')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="py-3" v-if="book">
        <!-- Book Summary Box -->
        <div class="p-3 mb-3 border rounded" style="background-color: var(--paper); border-color: var(--paper-border) !important;">
          <small class="text-muted text-uppercase d-block mb-1" style="font-size: 0.68rem; letter-spacing: 0.05em;">Tựa sách yêu cầu:</small>
          <h6 class="font-serif-headline font-weight-bold text-dark mb-1">{{ book.TenSach }}</h6>
          <div class="small text-muted">
            <span>Tác giả: <strong>{{ book.TacGia }}</strong></span>
            <span class="mx-2">•</span>
            <span>Mã: <strong>{{ book.MaSach }}</strong></span>
          </div>
        </div>

        <!-- Borrowing Parameters -->
        <div class="row mb-3">
          <div class="col-6">
            <div class="p-2 border rounded text-center" style="background-color: #fff; border-color: var(--paper-border) !important;">
              <small class="text-muted d-block" style="font-size: 0.7rem;">Thời hạn mượn</small>
              <strong class="text-dark" style="font-size: 0.85rem;">14 ngày tiêu chuẩn</strong>
            </div>
          </div>
          <div class="col-6">
            <div class="p-2 border rounded text-center" style="background-color: #fff; border-color: var(--paper-border) !important;">
              <small class="text-muted d-block" style="font-size: 0.7rem;">Địa điểm nhận sách</small>
              <strong class="text-dark" style="font-size: 0.85rem;">Quầy Thủ thư — Tầng 1</strong>
            </div>
          </div>
        </div>

        <!-- Reader Info Input -->
        <div class="form-group mb-3">
          <label class="small font-weight-bold mb-1">Thông tin Độc giả Đăng ký:</label>
          <div v-if="loggedInUser" class="p-2 px-3 border rounded d-flex justify-content-between align-items-center mb-1" style="background-color: var(--paper-subtle); border-color: var(--paper-border) !important;">
            <div>
              <strong class="text-dark d-block" style="font-size: 0.9rem;">{{ loggedInUser.fullName || loggedInUser.username }}</strong>
              <small class="font-mono-code text-muted">Mã thẻ: <strong>{{ loggedInUser.username }}</strong> • SĐT: {{ loggedInUser.phone || '—' }}</small>
            </div>
            <span class="ath-badge ath-badge-available" style="font-size: 0.65rem;">
              <i class="fas fa-check-circle"></i> Xác thực
            </span>
          </div>
          <input v-else 
                 type="text" 
                 class="ath-input" 
                 v-model="readerCode" 
                 placeholder="VD: DG01 hoặc 0912345678" />
          <small class="form-text text-muted" style="font-size: 0.725rem;">
            <i class="fas fa-info-circle mr-1 text-info"></i> Định mức thư viện: Tối đa 03 cuốn đang lưu hành cùng thời điểm.
          </small>
        </div>

        <div class="form-group mb-3">
          <label class="small font-weight-bold mb-1">Ghi chú (nếu có):</label>
          <input type="text" 
                 class="ath-input" 
                 v-model="note" 
                 placeholder="Ví dụ: Cần mượn phục vụ làm tiểu luận môn CT449..." />
        </div>

        <div class="alert alert-warning py-2 px-3 small mb-0 border-0" style="background-color: #FEF6EB; color: #9A5B18; font-size: 0.75rem;">
          <i class="fas fa-exclamation-triangle mr-1"></i>
          Yêu cầu sẽ ở trạng thái <strong>Chờ duyệt</strong>. Sau khi thủ thư xét duyệt, bạn vui lòng đến quầy nhận sách vật lý.
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="pt-3 border-top d-flex justify-content-end align-items-center" style="border-color: var(--paper-border) !important;">
        <button type="button" class="ath-btn-outline mr-2" @click="$emit('close')">
          Hủy bỏ
        </button>
        <button type="button" class="ath-btn-primary" :disabled="submitting" @click="handleConfirm">
          <i v-if="submitting" class="fas fa-spinner fa-spin mr-1"></i>
          <i v-else class="fas fa-check mr-1"></i>
          Gửi yêu cầu mượn
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import authService from "../services/auth.service";

export default {
  name: "BorrowModal",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    book: {
      type: Object,
      default: null,
    }
  },
  emits: ["close", "confirm"],
  data() {
    return {
      readerCode: "",
      note: "Đăng ký mượn trực tuyến",
      submitting: false,
      loggedInUser: null,
    };
  },
  watch: {
    show(val) {
      if (val) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", this.handleKeyDown);
        this.submitting = false;
        this.loggedInUser = authService.getUser();
        if (this.loggedInUser) {
          this.readerCode = this.loggedInUser.username || this.loggedInUser.phone || "";
        }
      } else {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", this.handleKeyDown);
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  methods: {
    handleKeyDown(e) {
      if (e.key === "Escape") {
        this.$emit("close");
      }
    },
    handleConfirm() {
      if (!this.readerCode.trim()) {
        alert("Vui lòng nhập Mã độc giả hoặc Số điện thoại để đăng ký mượn!");
        return;
      }
      this.submitting = true;
      this.$emit("confirm", {
        maDocGia: this.readerCode.trim(),
        maSach: this.book.MaSach,
        ghiChu: this.note.trim()
      });
    }
  }
};
</script>
