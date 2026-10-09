<template>
  <div class="ath-card h-100 d-flex flex-column justify-content-between p-3 position-relative">
    <!-- Top Meta Line: Mã sách & Status Badge -->
    <div>
      <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style="border-color: var(--paper-border) !important; font-size: 0.75rem;">
        <span class="font-mono-code text-muted font-weight-bold">
          MÃ: <span class="text-dark">{{ book.MaSach }}</span>
        </span>

        <span v-if="book.SoQuyen > 2" class="ath-badge ath-badge-available">
          <i class="fas fa-check-circle mr-1"></i> Sẵn sàng ({{ book.SoQuyen }})
        </span>
        <span v-else-if="book.SoQuyen > 0" class="ath-badge ath-badge-scarce">
          <i class="fas fa-exclamation-circle mr-1"></i> Còn {{ book.SoQuyen }} cuốn
        </span>
        <span v-else class="ath-badge ath-badge-out">
          <i class="fas fa-ban mr-1"></i> Tạm hết kho
        </span>
      </div>

      <!-- Book Image & Main Info -->
      <div class="row no-gutters mb-3">
        <!-- Cover Image with Fallback Pattern -->
        <div class="col-4 pr-3">
          <div class="position-relative overflow-hidden ath-book-spine" 
               style="height: 125px; width: 100%; background-color: var(--paper-subtle);">
            <img v-if="hasValidImage && !imageFailed" 
                 :src="book.HinhAnh" 
                 :alt="book.TenSach" 
                 class="w-100 h-100" 
                 style="object-fit: cover;" 
                 @error="imageFailed = true" />
            <div v-else class="w-100 h-100 d-flex flex-column justify-content-center align-items-center text-center p-2" 
                 style="background: linear-gradient(135deg, #FAF7EE 0%, #E8E2D2 100%); color: var(--ink-secondary);">
              <i class="fas fa-book-open mb-1" style="font-size: 1.6rem; color: var(--primary); opacity: 0.85;"></i>
              <span class="font-mono-code font-weight-bold" style="font-size: 0.65rem; letter-spacing: 0.05em;">{{ book.MaSach }}</span>
            </div>
          </div>
        </div>

        <!-- Book Details -->
        <div class="col-8 d-flex flex-column justify-content-between">
          <div>
            <router-link :to="`/books/${book.MaSach}`" class="text-decoration-none">
              <h6 class="font-serif-headline font-weight-bold mb-1 line-clamp-2 text-dark" 
                  :title="book.TenSach"
                  style="font-size: 1.025rem; line-height: 1.35;">
                {{ book.TenSach }}
              </h6>
            </router-link>
            <p class="font-italic text-muted small mb-2 text-truncate" 
               :title="book.TacGia"
               style="font-family: var(--font-serif); max-width: 180px;">
              Tác giả: {{ book.TacGia }}
            </p>
          </div>

          <div class="p-2 border rounded" style="background-color: var(--paper); border-color: var(--paper-border) !important; font-size: 0.75rem;">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">NXB:</span>
              <strong class="text-truncate ml-1" style="max-width: 100px;">{{ book.MaNXB }}</strong>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Năm XB:</span>
              <span>{{ book.NamXuatBan || '—' }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Còn kho:</span>
              <strong :class="book.SoQuyen > 0 ? 'text-success' : 'text-danger'">
                {{ book.SoQuyen }} quyển
              </strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Short Description -->
      <p v-if="book.MoTa" class="text-muted small mb-3 line-clamp-2" style="font-size: 0.8rem; line-height: 1.45;">
        {{ book.MoTa }}
      </p>
    </div>

    <!-- Bottom Actions -->
    <div class="pt-2 border-top d-flex justify-content-between align-items-center" style="border-color: var(--paper-border) !important;">
      <div class="small">
        <span class="text-muted" style="font-size: 0.68rem; display: block; text-transform: uppercase;">Đơn giá bảo lưu</span>
        <strong class="font-mono-code text-dark">{{ formatCurrency(book.DonGia) }}</strong>
      </div>

      <div>
        <button v-if="book.SoQuyen > 0" 
                class="ath-btn-primary py-1 px-3" 
                @click="$emit('borrow', book)">
          <i class="fas fa-bookmark mr-1"></i> Mượn
        </button>
        <button v-else 
                class="ath-btn-outline py-1 px-3" 
                disabled 
                style="opacity: 0.55; cursor: not-allowed;">
          <i class="fas fa-ban mr-1"></i> Hết
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BookCard",
  props: {
    book: {
      type: Object,
      required: true,
    }
  },
  emits: ["borrow"],
  data() {
    return {
      imageFailed: false,
    };
  },
  computed: {
    hasValidImage() {
      return this.book && this.book.HinhAnh && typeof this.book.HinhAnh === "string" && this.book.HinhAnh.trim().length > 0;
    }
  },
  methods: {
    formatCurrency(value) {
      if (!value) return "0 ₫";
      return Number(value).toLocaleString("vi-VN") + " ₫";
    }
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
