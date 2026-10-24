<template>
  <!-- Double-Bezel: outer shell -->
  <article class="bk-shell">
    <!-- Double-Bezel: inner core -->
    <div class="bk-core">
      <!-- ===== Top: cover + info ===== -->
      <div class="bk-top">
        <router-link :to="`/books/${book.MaSach}`" class="bk-cover-link" :aria-label="book.TenSach">
          <div class="bk-cover">
            <img v-if="hasValidImage && !imageFailed" :src="coverUrl" :alt="book.TenSach"
              class="bk-cover-img" @error="imageFailed = true" />
            <!-- Bìa thiết kế sẵn khi chưa có ảnh -->
            <div v-else class="bk-cover-fallback">
              <span class="bk-fb-code">{{ book.MaSach }}</span>
              <span class="bk-fb-title">{{ book.TenSach }}</span>
              <span class="bk-fb-author">{{ book.TacGia }}</span>
            </div>
            <span class="bk-cover-spine" aria-hidden="true"></span>
          </div>
        </router-link>

        <div class="bk-info">
          <!-- Trạng thái kho gọn gàng hơn -->
          <div class="bk-header-meta">
            <span class="bk-status" :class="book.SoQuyen > 2 ? 'is-ok' : book.SoQuyen > 0 ? 'is-low' : 'is-out'">
              <i class="bk-status-dot" aria-hidden="true"></i>
              <template v-if="book.SoQuyen > 2">Còn {{ book.SoQuyen }} cuốn</template>
              <template v-else-if="book.SoQuyen > 0">Sắp hết ({{ book.SoQuyen }})</template>
              <template v-else>Hết sách</template>
            </span>
            <span class="bk-code">{{ book.MaSach }}</span>
          </div>

          <router-link :to="`/books/${book.MaSach}`" class="bk-title-link">
            <h3 class="bk-title" :title="book.TenSach">{{ book.TenSach }}</h3>
          </router-link>

          <p class="bk-author" :title="book.TacGia">{{ book.TacGia }}</p>

          <p class="bk-publisher" v-if="publisherName || book.MaNXB">
            <span>{{ publisherName || book.MaNXB }}</span>
          </p>
          <p class="bk-publisher" v-if="genreName"><span>{{ genreName }}</span></p>
        </div>
      </div>

      <!-- ===== Stats strip (Tinh gọn, sang trọng hơn) ===== -->
      <div class="bk-stats">
        <div class="bk-stat">
          <span class="bk-stat-label">Năm XB</span>
          <span class="bk-stat-val">{{ book.NamXuatBan || "—" }}</span>
        </div>
        <div class="bk-stat-divider"></div>
        <div class="bk-stat">
          <span class="bk-stat-label">Đơn giá</span>
          <span class="bk-stat-val highlight">{{ book.DonGia ? formatCurrency(book.DonGia) : "—" }}</span>
        </div>
      </div>

      <!-- ===== Action ===== -->
      <div class="bk-action">
        <button v-if="book.SoQuyen > 0" type="button" class="bk-btn bk-btn-primary" @click="$emit('borrow', book)">
          <span>Đăng ký mượn sách</span>
          <span class="bk-btn-island" aria-hidden="true">
            <svg class="bk-ico" viewBox="0 0 24 24">
              <path d="M7.5 16.5l9-9M9 7.5h7.5V15" />
            </svg>
          </span>
        </button>
        <button v-else type="button" class="bk-btn bk-btn-off" disabled>
          <svg class="bk-ico" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M6 18L18 6" />
          </svg>
          Tạm hết sách trong kho
        </button>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: "BookCard",
  props: {
    book: {
      type: Object,
      required: true,
    },
    publisherName: {
      type: String,
      default: "",
    },
    genreName: { type: String, default: "" },
  },
  emits: ["borrow"],
  data() {
    return {
      imageFailed: false,
    };
  },
  computed: {
    coverUrl() {
      return `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${this.book.HinhAnh}`;
    },
    hasValidImage() {
      return (
        this.book &&
        this.book.HinhAnh &&
        typeof this.book.HinhAnh === "string" &&
        this.book.HinhAnh.trim().length > 0
      );
    },
  },
  methods: {
    formatCurrency(value) {
      if (!value) return "0 ₫";
      return Number(value).toLocaleString("vi-VN") + " ₫";
    },
  },
};
</script>

<style scoped>
/* =====================================================
   BookCard — Editorial Luxury, Tối ưu không gian
   ===================================================== */
.bk-shell {
  --paper: #FAF9F5;
  --paper-2: #F4F2EB;
  --card: #FFFFFF;
  --ink: #1C1917;
  --ink-2: #4A463F;
  --ink-muted: #787368;
  --primary: #143529;
  --primary-2: #1d4e3d;
  --ok: #23694C;
  --low: #9A5B18;
  --out: #8F2822;
  --hair: rgba(28, 25, 23, 0.08);
  --tray: rgba(28, 25, 23, 0.04);
  --ease: cubic-bezier(0.32, 0.72, 0, 1);
  --serif: var(--font-serif, 'Newsreader', 'PP Editorial New', Georgia, serif);
  --sans: var(--font-sans, 'Plus Jakarta Sans', 'Geist', system-ui, sans-serif);
  --mono: var(--font-mono, 'Geist Mono', ui-monospace, Menlo, monospace);

  height: 100%;
  padding: 5px;
  background: var(--tray);
  box-shadow: inset 0 0 0 1px var(--hair);
  font-family: var(--sans);
  transition: transform 0.5s var(--ease), box-shadow 0.5s var(--ease);
}

.bk-shell:hover {
  transform: translateY(-4px);
  box-shadow:
    inset 0 0 0 1px var(--hair),
    0 24px 40px -24px rgba(20, 53, 41, 0.3);
}

.bk-core {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem;
  background: var(--card);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.95);
  color: var(--ink);
}

/* ===== Top ===== */
.bk-top {
  flex: 1;
  display: flex;
  gap: 1.1rem;
  min-height: 0;
}

/* Cover */
.bk-cover-link {
  flex: 0 0 36%;
  max-width: 135px;
  align-self: flex-start;
  display: block;
  text-decoration: none;
}

.bk-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 4px 10px 10px 4px;
  background: var(--paper-2);
  box-shadow:
    0 14px 22px -14px rgba(20, 53, 41, 0.45),
    0 0 0 1px var(--hair);
}

.bk-cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease);
}

.bk-cover-link:hover .bk-cover-img {
  transform: scale(1.03);
}

/* gáy sách */
.bk-cover-spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 8px;
  pointer-events: none;
  background: linear-gradient(90deg,
      rgba(0, 0, 0, 0.25),
      rgba(255, 255, 255, 0.12) 45%,
      rgba(0, 0, 0, 0.05));
}

/* Bìa dựng sẵn */
.bk-cover-fallback {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0.8rem 0.6rem 0.7rem 1rem;
  color: #F3F0E6;
  background:
    radial-gradient(120% 70% at 0% 0%, rgba(54, 120, 92, 0.42), transparent 60%),
    radial-gradient(90% 60% at 100% 100%, rgba(140, 61, 40, 0.3), transparent 65%),
    var(--primary);
}

.bk-fb-code {
  font-family: var(--mono);
  font-size: 0.52rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(232, 217, 196, 0.8);
}

.bk-fb-title {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--serif);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.15;
  color: #FBF9F2;
}

.bk-fb-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--serif);
  font-size: 0.64rem;
  font-style: italic;
  color: rgba(243, 240, 230, 0.75);
}

/* Info */
.bk-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.bk-header-meta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.bk-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 600;
  background: color-mix(in srgb, currentColor 8%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 15%, transparent);
}

.bk-status-dot {
  width: 5px;
  height: 5px;
  background: currentColor;
}

.bk-status.is-ok {
  color: var(--ok);
}

.bk-status.is-low {
  color: var(--low);
}

.bk-status.is-out {
  color: var(--out);
}

.bk-code {
  padding: 0.12rem 0.45rem;
  background: var(--paper-2);
  font-family: var(--mono);
  font-size: 0.6rem;
  color: var(--ink-muted);
}

.bk-title-link {
  text-decoration: none;
  color: inherit;
}

.bk-title {
  margin: 0 0 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--serif);
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ink);
  transition: color 0.3s var(--ease);
}

.bk-title-link:hover .bk-title {
  color: var(--primary-2);
}

.bk-author {
  margin: 0 0 0.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  font-family: var(--serif);
  font-size: 0.85rem;
  font-style: italic;
  color: var(--ink-2);
}

.bk-publisher {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: var(--ink-muted);
}

.bk-publisher span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bk-publisher .bk-ico {
  color: var(--primary);
  width: 0.85rem;
  height: 0.85rem;
}

/* ===== Stats strip tinh gọn ===== */
.bk-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.85rem;
  background: var(--paper-2);
  box-shadow: inset 0 0 0 1px var(--hair);
}

.bk-stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
}

.bk-stat-label {
  color: var(--ink-muted);
  font-weight: 500;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bk-stat-val {
  font-family: var(--mono);
  font-weight: 600;
  color: var(--ink);
}

.bk-stat-val.highlight {
  color: var(--primary);
}

.bk-stat-divider {
  width: 1px;
  height: 12px;
  background: var(--hair);
}

/* ===== Action ===== */
.bk-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  border-radius: 999px;
  font-family: var(--sans);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s var(--ease);
}

.bk-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.bk-btn-primary {
  justify-content: space-between;
  padding: 0.3rem 0.3rem 0.3rem 1.15rem;
  background: var(--primary);
  color: #FBF9F2;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.18),
    0 10px 20px -10px rgba(20, 53, 41, 0.5);
}

.bk-btn-primary:hover {
  background: var(--primary-2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.22),
    0 14px 24px -10px rgba(20, 53, 41, 0.6);
}

.bk-btn-island {
  width: 1.85rem;
  height: 1.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  transition: transform 0.4s var(--ease);
}

.bk-btn-primary:hover .bk-btn-island {
  transform: translate(2px, -1px) scale(1.05);
  background: rgba(255, 255, 255, 0.2);
}

.bk-btn-off {
  padding: 0.6rem 1rem;
  background: rgba(143, 40, 34, 0.06);
  box-shadow: inset 0 0 0 1px rgba(143, 40, 34, 0.15);
  color: var(--out);
  cursor: not-allowed;
}

/* ===== Icons ===== */
.bk-ico {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 399.98px) {
  .bk-cover-link {
    flex-basis: 34%;
  }

  .bk-core {
    padding: 0.9rem;
  }
}
</style>
