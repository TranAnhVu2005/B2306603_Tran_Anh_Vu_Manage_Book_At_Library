<template>
  <div class="vg-page">
    <div>
      <!-- Back button -->
      <div class="mb-4 reveal" data-reveal>
        <router-link to="/catalog" class="ath-btn-outline text-decoration-none">
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
                  <dt>Thể loại</dt>
                  <dd>{{ genreName }}</dd>
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

          <!-- Inventory context for staff -->
          <div class="cta-row reveal reveal-d4" data-reveal>
            <p class="cta-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--status-available);" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Thông tin tồn kho dành cho nghiệp vụ · {{ book.SoQuyen }} cuốn hiện có
            </p>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import nxbService from "../services/nhaxuatban.service";
import theloaiService from "../services/theloai.service";

export default {
  name: "ManagerBookDetail",
  components: { ToastNotification },
  data() {
    return {
      book: null,
      publishers: [],
      genres: [],
      loading: false,
      defaultCover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      revealObserver: null,
    };
  },
  computed: {
    publisherName() {
      if (!this.book || !this.book.MaNXB) return "—";
      const p = this.publishers.find(n => n.MaNXB === this.book.MaNXB);
      return p ? p.TENNXB : this.book.MaNXB;
    },
    genreName() {
      const genre = this.genres.find(item => item.MaTheLoai === this.book?.MaTheLoai);
      return genre?.TenTheLoai || "Chưa phân loại";
    },
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
        const [publishers, genres] = await Promise.allSettled([nxbService.getAll(), theloaiService.getAll()]);
        this.publishers = publishers.status === "fulfilled" ? publishers.value : [];
        this.genres = genres.status === "fulfilled" ? genres.value : [];
        if (publishers.status === "rejected") this.$refs.toast.show(publishers.reason.response?.data?.message || "Không thể tải danh mục nhà xuất bản.", "error");
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
  }
};
</script>

<style scoped>
.book-detail-grid {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: clamp(1.5rem, 3vw, 2.75rem);
  align-items: start;
  max-width: 1240px;
  margin-inline: auto;
  padding: clamp(1rem, 2.4vw, 2rem);
  border: 2px solid var(--ink-primary, #111);
  border-radius: 1rem;
  background: var(--paper, #fffdf2);
  box-shadow: 5px 5px 0 var(--ink-primary, #111);
}
.cover-col { min-width: 0; }
.meta-col { min-width: 0; }
.cover-shell {
  max-width: 280px;
  margin-inline: auto;
  padding: 0.45rem;
  border: 2px solid var(--ink-primary, #111);
  border-radius: 0.85rem;
  background: var(--paper-subtle, #fff);
  box-shadow: 4px 4px 0 var(--ink-primary, #111);
}
.cover-core {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--paper-subtle, #fff);
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
  background: linear-gradient(90deg, rgba(0,0,0,.24), rgba(255,255,255,.12) 45%, rgba(0,0,0,.06));
}
.cover-status-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.cover-status-wrap { padding-inline: 0.25rem; }
.cover-status-wrap :deep(.ath-badge) { white-space: normal; text-align: center; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  max-width: 100%;
  padding: .4rem .65rem;
  border: 2px solid var(--ink-primary, #111);
  border-radius: .45rem;
  background: var(--brand-yellow, #fdc800);
  color: var(--ink-primary, #111);
  font: 700 .75rem/1.3 var(--font-sans, "Be Vietnam Pro", sans-serif);
  letter-spacing: .06em;
  overflow-wrap: anywhere;
}
.book-title {
  font-family: var(--font-sans, "Be Vietnam Pro", sans-serif);
  font-size: clamp(1.8rem, 3.4vw, 2.8rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--ink-primary);
  margin: .9rem 0 .5rem;
  overflow-wrap: anywhere;
}
.book-author {
  font-family: var(--font-sans, "Be Vietnam Pro", sans-serif);
  font-size: 1rem;
  color: var(--ink-secondary);
  margin-bottom: 1.25rem;
}
.book-author em { font-style: italic; color: var(--ink-primary); font-weight: 600; }
.spec-shell {
  padding: .85rem;
  border: 2px solid var(--ink-primary, #111);
  border-radius: .75rem;
  background: var(--paper-subtle, #fff);
  box-shadow: 3px 3px 0 var(--ink-primary, #111);
  margin-bottom: 1.5rem;
}
.spec-core {
  background: transparent;
}
.spec-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .35rem .75rem;
}
.spec-item {
  min-width: 0;
  padding: .7rem;
  border-left: 3px solid var(--brand-violet, #432dd7);
  background: var(--paper, #fffdf2);
}
.spec-item dt {
  font-size: 0.67rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 0.3rem;
}
.spec-item dd {
  margin: 0;
  font-size: .9rem;
  font-weight: 600;
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}
.book-desc { margin-bottom: 1.5rem; }
.desc-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: .75rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: .55rem;
}
.desc-text {
  font-size: .95rem;
  line-height: 1.75;
  color: var(--ink-secondary);
  overflow-wrap: anywhere;
}
.cta-row {
  padding-top: 1rem;
  border-top: 2px solid var(--ink-primary, #111);
}
.cta-note {
  display: flex;
  align-items: flex-start;
  gap: .5rem;
  font-size: .85rem;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.6;
}
.state-center { display: flex; flex-direction: column; align-items: center; padding: 5rem 1rem; gap: 1rem; }
.state-text { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4rem 2rem; gap: 1rem; }
.empty-title { font-family: var(--font-sans, "Be Vietnam Pro", sans-serif); font-size: 1.4rem; font-weight: 700; color: var(--ink-primary); margin: 0; }
.empty-sub { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }
.btn-island { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; margin-left: .5rem; border: 2px solid currentColor; border-radius: .35rem; flex-shrink: 0;
}
@media (max-width: 767px) {
  .book-detail-grid { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
  .cover-shell { width: min(100%, 220px); }
}
@media (max-width: 420px) {
  .book-detail-grid { padding: .85rem; box-shadow: 3px 3px 0 var(--ink-primary, #111); }
  .spec-grid { grid-template-columns: minmax(0, 1fr); }
  .book-title { font-size: clamp(1.55rem, 8vw, 2rem); }
}
</style>
