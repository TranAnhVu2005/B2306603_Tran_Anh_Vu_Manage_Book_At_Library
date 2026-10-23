<template>
  <div class="vg-page">
    <div>
      <!-- Back button -->
      <div class="mb-4 reveal" data-reveal>
        <router-link to="/" class="ath-btn-outline text-decoration-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 12H5M12 5l-7 7 7 7"/></svg>
          Quay lại mục lục
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-center reveal" data-reveal>
        <div class="vg-spinner"></div>
        <p class="state-text">Đang tải thông tin sách...</p>
      </div>

      <!-- Not found -->
      <div v-else-if="!book" class="vg-shell reveal" data-reveal style="max-width: 480px; margin: 4rem auto; text-align: center;">
        <div class="vg-core empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-muted);" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          <h2 class="empty-title">Không tìm thấy cuốn sách này</h2>
          <p class="empty-sub">Mã sách có thể không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        </div>
      </div>

      <!-- Book detail -->
      <div v-else class="book-detail-grid">
        <!-- ===== LEFT: Cover ===== -->
        <div class="cover-col reveal" data-reveal>
          <div class="cover-shell">
            <div class="cover-core">
              <img
                :src="book.HinhAnh || defaultCover"
                :alt="book.TenSach"
                class="cover-img"
                @error="onImageError"
              />
              <!-- Spine -->
              <span class="cover-spine" aria-hidden="true"></span>
            </div>
          </div>

          <!-- Status below cover -->
          <div class="cover-status-wrap">
            <span
              v-if="book.SoQuyen > 0"
              class="ath-badge ath-badge-available"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              Sẵn sàng phục vụ — {{ book.SoQuyen }} cuốn
            </span>
            <span v-else class="ath-badge ath-badge-out">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
              Tạm hết tại kho
            </span>
          </div>
        </div>

        <!-- ===== RIGHT: Meta ===== -->
        <div class="meta-col">
          <!-- Eyebrow code -->
          <div class="reveal" data-reveal>
            <span class="eyebrow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              MÃ SÁCH: {{ book.MaSach }}
            </span>
          </div>

          <!-- Title -->
          <h1 class="book-title reveal reveal-d1" data-reveal>{{ book.TenSach }}</h1>

          <!-- Author -->
          <p class="book-author reveal reveal-d2" data-reveal>
            Tác giả: <em>{{ book.TacGia }}</em>
          </p>

          <!-- Spec grid -->
          <div class="spec-shell reveal reveal-d2" data-reveal>
            <div class="spec-core">
              <dl class="spec-grid">
                <div class="spec-item">
                  <dt>Nhà xuất bản</dt>
                  <dd>{{ publisherName }} <span class="font-mono-code" style="font-size: 0.7rem; color: var(--ink-muted);">({{ book.MaNXB }})</span></dd>
                </div>
                <div class="spec-item">
                  <dt>Năm xuất bản</dt>
                  <dd>{{ book.NamXuatBan || '—' }}</dd>
                </div>
                <div class="spec-item">
                  <dt>Đơn giá bảo lưu (đền bù)</dt>
                  <dd class="font-mono-code" style="font-weight: 700; color: var(--ink-primary);">{{ formatCurrency(book.DonGia) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Description -->
          <div class="book-desc reveal reveal-d3" data-reveal>
            <h2 class="desc-heading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Tóm tắt nội dung
            </h2>
            <p class="desc-text">{{ book.MoTa || 'Hiện chưa có tóm tắt chi tiết cho cuốn sách này.' }}</p>
          </div>

          <!-- CTA -->
          <div class="cta-row reveal reveal-d4" data-reveal>
            <button
              v-if="book.SoQuyen > 0"
              class="ath-btn-primary borrow-btn"
              @click="handleOpenBorrow"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              Đăng ký mượn cuốn này
              <span class="btn-island" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7.5 16.5l9-9M9 7.5h7.5V15"/></svg>
              </span>
            </button>
            <button v-else class="ath-btn-outline borrow-btn" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
              Tạm hết trong kho
            </button>

            <p class="cta-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--status-available);" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Hạn mượn: 14 ngày · Nhận sách tại Quầy Thủ Thư
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Borrow Modal -->
    <BorrowModal :show="showBorrowModal" :book="book" @close="showBorrowModal = false" @confirm="submitBorrowRequest" />
    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import BorrowModal from "../components/BorrowModal.vue";
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import nxbService from "../services/nhaxuatban.service";
import theoDoiService from "../services/theodoimuon.service";
import authService from "../services/auth.service";

export default {
  name: "BookDetail",
  components: { BorrowModal, ToastNotification },
  data() {
    return {
      book: null,
      publishers: [],
      loading: false,
      showBorrowModal: false,
      defaultCover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      revealObserver: null,
    };
  },
  computed: {
    publisherName() {
      if (!this.book || !this.book.MaNXB) return "—";
      const p = this.publishers.find(n => n.MaNXB === this.book.MaNXB);
      return p ? p.TENNXB : this.book.MaNXB;
    }
  },
  watch: {
    "$route.params.id"() {
      this.fetchData();
    },
  },
  created() { this.fetchData(); },
  mounted() { this.initReveal(); },
  beforeUnmount() { if (this.revealObserver) this.revealObserver.disconnect(); },
  methods: {
    initReveal() {
      if (this.revealObserver) this.revealObserver.disconnect();
      this.revealObserver = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); this.revealObserver.unobserve(e.target); } }),
        { threshold: 0.06 }
      );
      this.$el.querySelectorAll("[data-reveal]").forEach(el => this.revealObserver.observe(el));
    },
    async fetchData() {
      this.loading = true;
      this.book = null;
      try {
        const id = this.$route.params.id;
        this.book = await sachService.get(id);
        try {
          this.publishers = await nxbService.getAll();
        } catch (error) {
          this.publishers = [];
          this.$refs.toast.show(error.response?.data?.message || "Không thể tải danh mục nhà xuất bản.", "error");
        }
      } catch (error) {
        this.$refs.toast.show(error.response?.data?.message || "Không tìm thấy thông tin cuốn sách.", "error");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initReveal());
      }
    },
    formatCurrency(val) {
      if (!val) return "0 ₫";
      return Number(val).toLocaleString("vi-VN") + " ₫";
    },
    onImageError(e) { e.target.src = this.defaultCover; },
    handleOpenBorrow() {
      const u = authService.getUser();
      if (!u) { this.$router.push(`/login?redirect=${this.$route.fullPath}`); return; }
      if (!authService.isReader(u)) {
        this.$refs.toast.show("Chỉ độc giả mới có thể đăng ký mượn sách.", "error");
        return;
      }
      if (u.TrangThaiThe === "DanhSachDen") {
        this.$refs.toast.show("Thẻ của bạn đang ở Danh sách đen. Vui lòng liên hệ quầy thủ thư!", "error", 5000); return;
      }
      if (u.TrangThaiThe === "Khoa") {
        this.$refs.toast.show("Thẻ của bạn hiện đang bị khóa tạm thời. Vui lòng liên hệ thủ thư!", "error", 5000); return;
      }
      this.showBorrowModal = true;
    },
    async submitBorrowRequest(payload) {
      if (!authService.isLoggedIn()) { this.$router.push(`/login?redirect=${this.$route.fullPath}`); return; }
      try {
        const result = await theoDoiService.dangKyMuon({ MaDocGia: authService.getUser()?.MaDocGia, MaSach: payload.maSach, GhiChu: payload.ghiChu });
        this.showBorrowModal = false;
        this.$refs.toast.show(result.message || "Đăng ký mượn thành công!");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Không thể đăng ký mượn.", "error", 4500);
      }
    }
  }
};
</script>

<style scoped>
/* Detail grid layout */
.book-detail-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
  align-items: flex-start;
}
@media (max-width: 991.98px) {
  .book-detail-grid { grid-template-columns: 1fr; gap: 2rem; }
  .cover-col { position: static; display: flex; flex-direction: column; align-items: center; }
}

/* Cover */
.cover-col { position: sticky; top: 1.5rem; }
.meta-col { min-width: 0; }
.cover-shell {
  padding: 5px;
  border-radius: 1.25rem;
  background: var(--tray);
  box-shadow: inset 0 0 0 1px var(--hair), 0 20px 40px -20px rgba(20, 53, 41, 0.3);
}
.cover-core {
  position: relative;
  border-radius: calc(1.25rem - 5px);
  overflow: hidden;
  background: var(--paper-subtle);
}
.cover-img {
  display: block;
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
}
.cover-spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 10px;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(0,0,0,0.26), rgba(255,255,255,0.12) 45%, rgba(0,0,0,0.06));
}
.cover-status-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

/* Meta */
.book-title {
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--ink-primary);
  margin: 1rem 0 0.75rem;
}
.book-author {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--ink-secondary);
  margin-bottom: 1.75rem;
}
.book-author em { font-style: italic; color: var(--ink-primary); font-weight: 600; }

/* Spec Double-Bezel */
.spec-shell {
  padding: 5px;
  border-radius: 1.25rem;
  background: var(--tray);
  box-shadow: inset 0 0 0 1px var(--hair);
  margin-bottom: 2rem;
}
.spec-core {
  border-radius: calc(1.25rem - 5px);
  background: var(--paper-subtle);
  padding: 1rem;
}
.spec-grid {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
@media (max-width: 575px) { .spec-grid { grid-template-columns: 1fr; } }
.spec-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
}
.spec-item dt {
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 0.3rem;
}
.spec-item dd {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ink-primary);
}

/* Description */
.book-desc { margin-bottom: 2rem; }
.desc-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 0.75rem;
}
.desc-text {
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--ink-secondary);
}

/* CTA row */
.cta-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  padding-top: 1.5rem;
  border-top: 1px solid var(--paper-border);
}
.borrow-btn { min-width: 220px; justify-content: space-between; padding: 0.55rem 0.55rem 0.55rem 1.4rem; }
.cta-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--ink-muted);
  margin: 0;
}

/* Common */
.state-center { display: flex; flex-direction: column; align-items: center; padding: 5rem 1rem; gap: 1rem; }
.state-text { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4rem 2rem; gap: 1rem; }
.empty-title { font-family: var(--font-serif); font-size: 1.4rem; font-weight: 700; color: var(--ink-primary); margin: 0; }
.empty-sub { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }

.btn-island {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  flex-shrink: 0;
  transition: transform 0.5s var(--ease-spring), background 0.4s;
}
.ath-btn-primary:hover .btn-island {
  transform: translate(2px, -1px) scale(1.08);
  background: rgba(255,255,255,0.22);
}
</style>
