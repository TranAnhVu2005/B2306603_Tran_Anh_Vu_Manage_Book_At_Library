<template>
  <div class="ath-card h-100 d-flex flex-column justify-content-between p-3 position-relative">
    <!-- Top Meta Line: Mã sách & Status Badge -->
    <div>
      <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style="border-color: var(--paper-border) !important; font-size: 0.75rem;">
        <span class="font-mono-code text-muted font-weight-bold">
          Mã: <span class="text-dark">{{ book.MaSach }}</span>
        </span>

        <span v-if="book.SoQuyen > 2" class="ath-badge ath-badge-available">
          <i class="fas fa-circle" style="font-size: 0.4rem;"></i> Sẵn sàng mượn
        </span>
        <span v-else-if="book.SoQuyen > 0" class="ath-badge ath-badge-scarce">
          <i class="fas fa-circle" style="font-size: 0.4rem;"></i> Còn ít ({{ book.SoQuyen }} cuốn)
        </span>
        <span v-else class="ath-badge ath-badge-out">
          <i class="fas fa-circle" style="font-size: 0.4rem;"></i> Tạm hết kho
        </span>
      </div>

      <!-- Book Image & Main Info -->
      <div class="row no-gutters mb-3">
        <!-- Cover Image -->
        <div class="col-4 pr-3">
          <div class="position-relative overflow-hidden" 
               style="aspect-ratio: 3/4; background-color: var(--paper-subtle); border: 1px solid var(--paper-border); border-radius: 2px;">
            <img :src="book.HinhAnh || defaultCover" 
                 :alt="book.TenSach"
                 class="w-100 h-100" 
                 style="object-fit: cover;"
                 @error="onImageError" />
          </div>
        </div>

        <!-- Book Details -->
        <div class="col-8 d-flex flex-column justify-content-between">
          <div>
            <router-link :to="`/books/${book.MaSach}`" class="text-decoration-none">
              <h6 class="font-serif-headline font-weight-bold mb-1 line-clamp-2 text-dark" style="font-size: 1.05rem; line-height: 1.3;">
                {{ book.TenSach }}
              </h6>
            </router-link>
            <p class="font-italic text-muted small mb-2" style="font-family: var(--font-serif);">
              {{ book.TacGia }}
            </p>
          </div>

          <div class="p-2 border rounded" style="background-color: var(--paper); border-color: var(--paper-border) !important; font-size: 0.75rem;">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">NXB:</span>
              <strong class="text-truncate ml-1" style="max-width: 110px;">{{ book.MaNXB }}</strong>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Năm XB:</span>
              <span>{{ book.NamXuatBan || '—' }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Tồn kho:</span>
              <strong :class="book.SoQuyen > 0 ? 'text-success' : 'text-danger'">
                {{ book.SoQuyen }} cuốn
              </strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Short Description -->
      <p v-if="book.MoTa" class="text-muted small mb-3 line-clamp-2" style="font-size: 0.8rem; line-height: 1.4;">
        {{ book.MoTa }}
      </p>
    </div>

    <!-- Bottom Actions -->
    <div class="pt-2 border-top d-flex justify-content-between align-items-center" style="border-color: var(--paper-border) !important;">
      <div class="small">
        <span class="text-muted" style="font-size: 0.7rem; display: block;">Giá bồi hoàn</span>
        <strong class="font-mono-code text-dark">{{ formatCurrency(book.DonGia) }}</strong>
      </div>

      <div>
        <button v-if="book.SoQuyen > 0" 
                class="ath-btn-primary" 
                @click="$emit('borrow', book)">
          <i class="fas fa-bookmark mr-1"></i> Mượn sách
        </button>
        <button v-else 
                class="ath-btn-outline" 
                disabled 
                style="opacity: 0.6; cursor: not-allowed;">
          <i class="fas fa-ban mr-1"></i> Hết sách
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
      defaultCover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    };
  },
  methods: {
    formatCurrency(value) {
      if (!value) return "0 ₫";
      return Number(value).toLocaleString("vi-VN") + " ₫";
    },
    onImageError(e) {
      e.target.src = this.defaultCover;
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
