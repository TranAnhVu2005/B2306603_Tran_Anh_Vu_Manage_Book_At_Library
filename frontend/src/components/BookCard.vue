<template>
  <!-- Double-Bezel: outer shell -->
  <article class="bk-shell">
    <!-- Double-Bezel: inner core -->
    <div class="bk-core">
      <!-- ===== Top: cover + info ===== -->
      <div class="bk-top">
        <router-link :to="`/books/${book.MaSach}`" class="bk-cover-link" :aria-label="book.TenSach">
          <div class="bk-cover">
            <img
              v-if="hasValidImage && !imageFailed"
              :src="book.HinhAnh"
              :alt="book.TenSach"
              class="bk-cover-img"
              @error="imageFailed = true"
            />
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
          <!-- Trạng thái kho -->
          <span
            class="bk-status"
            :class="book.SoQuyen > 2 ? 'is-ok' : book.SoQuyen > 0 ? 'is-low' : 'is-out'"
          >
            <i class="bk-status-dot" aria-hidden="true"></i>
            <template v-if="book.SoQuyen > 2">Còn sách</template>
            <template v-else-if="book.SoQuyen > 0">Sắp hết · còn {{ book.SoQuyen }}</template>
            <template v-else>Tạm hết sách</template>
          </span>

          <router-link :to="`/books/${book.MaSach}`" class="bk-title-link">
            <h3 class="bk-title" :title="book.TenSach">{{ book.TenSach }}</h3>
          </router-link>

          <p class="bk-author" :title="book.TacGia">{{ book.TacGia }}</p>

          <p class="bk-publisher" v-if="book.TenNXB || book.MaNXB">
            <svg class="bk-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20.5h16M6 20.5V9.5l6-4 6 4v11M10 20.5v-5h4v5" />
            </svg>
            <span>{{ book.TenNXB || book.MaNXB }}</span>
          </p>

          <span class="bk-code">{{ book.MaSach }}</span>
        </div>
      </div>

      <!-- ===== Stats strip ===== -->
      <dl class="bk-stats">
        <div class="bk-stat">
          <dt>Năm XB</dt>
          <dd>{{ book.NamXuatBan || "—" }}</dd>
        </div>
        <div class="bk-stat">
          <dt>Trong kho</dt>
          <dd :class="{ 'is-zero': !(book.SoQuyen > 0) }">
            {{ book.SoQuyen > 0 ? book.SoQuyen : 0 }}<small> cuốn</small>
          </dd>
        </div>
        <div class="bk-stat">
          <dt>Đơn giá</dt>
          <dd>{{ book.DonGia ? formatCurrency(book.DonGia) : "—" }}</dd>
        </div>
      </dl>

      <!-- ===== Action ===== -->
      <div class="bk-action">
        <button
          v-if="book.SoQuyen > 0"
          type="button"
          class="bk-btn bk-btn-primary"
          @click="$emit('borrow', book)"
        >
          <span>Đăng ký mượn</span>
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
          Tạm hết sách
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
  },
  emits: ["borrow"],
  data() {
    return {
      imageFailed: false,
    };
  },
  computed: {
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
   BookCard — Editorial Luxury, Double-Bezel
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
  border-radius: 1.6rem;
  background: var(--tray);
  box-shadow: inset 0 0 0 1px var(--hair);
  font-family: var(--sans);
  transition: transform 0.7s var(--ease), box-shadow 0.7s var(--ease);
}
.bk-shell:hover {
  transform: translateY(-4px);
  box-shadow:
    inset 0 0 0 1px var(--hair),
    0 28px 44px -26px rgba(20, 53, 41, 0.38);
}

.bk-core {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: calc(1.6rem - 5px);
  background: var(--card);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.95);
  color: var(--ink);
}

/* ===== Top ===== */
.bk-top {
  flex: 1;
  display: flex;
  gap: 1rem;
  min-height: 0;
}

/* Cover */
.bk-cover-link {
  flex: 0 0 38%;
  max-width: 150px;
  align-self: flex-start;
  display: block;
  text-decoration: none;
}
.bk-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 3px 10px 10px 3px;
  background: var(--paper-2);
  box-shadow:
    0 18px 26px -16px rgba(20, 53, 41, 0.5),
    0 0 0 1px var(--hair);
}
.bk-cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* gáy sách */
.bk-cover-spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 9px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.28),
    rgba(255, 255, 255, 0.14) 45%,
    rgba(0, 0, 0, 0.06)
  );
}

/* Bìa dựng sẵn */
.bk-cover-fallback {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.9rem 0.7rem 0.8rem 1.2rem;
  color: #F3F0E6;
  background:
    radial-gradient(120% 70% at 0% 0%, rgba(54, 120, 92, 0.42), transparent 60%),
    radial-gradient(90% 60% at 100% 100%, rgba(140, 61, 40, 0.3), transparent 65%),
    var(--primary);
}
.bk-cover-fallback::before {
  content: "";
  position: absolute;
  inset: 7px 7px 7px 13px;
  border-radius: 2px 6px 6px 2px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  pointer-events: none;
}
.bk-fb-code {
  position: relative;
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(232, 217, 196, 0.8);
}
.bk-fb-title {
  position: relative;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--serif);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: -0.01em;
  color: #FBF9F2;
}
.bk-fb-author {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--serif);
  font-size: 0.68rem;
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

.bk-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.22rem 0.6rem 0.22rem 0.5rem;
  margin-bottom: 0.7rem;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: color-mix(in srgb, currentColor 9%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 18%, transparent);
}
.bk-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.bk-status.is-ok { color: var(--ok); }
.bk-status.is-low { color: var(--low); }
.bk-status.is-out { color: var(--out); }

.bk-title-link { text-decoration: none; color: inherit; }
.bk-title {
  margin: 0 0 0.4rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -0.01em;
  color: var(--ink);
  transition: color 0.5s var(--ease);
}
.bk-title-link:hover .bk-title { color: var(--primary-2); }

.bk-author {
  margin: 0 0 0.6rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--serif);
  font-size: 0.9rem;
  font-style: italic;
  line-height: 1.35;
  color: var(--ink-2);
}

.bk-publisher {
  margin: 0 0 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 0.74rem;
  line-height: 1.4;
  color: var(--ink-muted);
}
.bk-publisher .bk-ico { margin-top: 0.1rem; color: var(--primary); }
.bk-publisher span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bk-code {
  margin-top: auto;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: var(--paper-2);
  box-shadow: inset 0 0 0 1px var(--hair);
  font-family: var(--mono);
  font-size: 0.66rem;
  color: var(--ink-2);
}

/* ===== Stats ===== */
.bk-stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-radius: 1rem;
  background: var(--paper-2);
  box-shadow: inset 0 0 0 1px var(--hair);
}
.bk-stat {
  min-width: 0;
  padding: 0.65rem 0.5rem;
  text-align: center;
}
.bk-stat + .bk-stat { box-shadow: inset 1px 0 0 var(--hair); }
.bk-stat dt {
  margin: 0 0 0.25rem;
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.bk-stat dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink);
}
.bk-stat dd small {
  font-family: var(--sans);
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--ink-muted);
}
.bk-stat dd.is-zero { color: var(--out); }

/* ===== Action ===== */
.bk-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border: 0;
  border-radius: 999px;
  font-family: var(--sans);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.6s var(--ease),
    background-color 0.5s var(--ease),
    box-shadow 0.6s var(--ease);
}
.bk-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.bk-btn:active:not(:disabled) { transform: scale(0.98); }

.bk-btn-primary {
  justify-content: space-between;
  padding: 0.35rem 0.35rem 0.35rem 1.3rem;
  background: var(--primary);
  color: #FBF9F2;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.18),
    0 12px 22px -12px rgba(20, 53, 41, 0.6);
}
.bk-btn-primary:hover {
  background: var(--primary-2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.22),
    0 16px 26px -12px rgba(20, 53, 41, 0.65);
}
.bk-btn-island {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  transition: transform 0.6s var(--ease), background-color 0.5s var(--ease);
}
.bk-btn-primary:hover .bk-btn-island {
  transform: translate(2px, -1px) scale(1.06);
  background: rgba(255, 255, 255, 0.2);
}

.bk-btn-off {
  padding: 0.7rem 1rem;
  background: rgba(143, 40, 34, 0.07);
  box-shadow: inset 0 0 0 1px rgba(143, 40, 34, 0.18);
  color: var(--out);
  cursor: not-allowed;
}

/* ===== Icons: ultra-light line ===== */
.bk-ico {
  width: 0.95rem;
  height: 0.95rem;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bk-btn-island .bk-ico { width: 1rem; height: 1rem; }

@media (prefers-reduced-motion: reduce) {
  .bk-shell, .bk-btn, .bk-btn-island, .bk-title { transition: none; }
}

/* ===== Màn hình hẹp ===== */
@media (max-width: 399.98px) {
  .bk-cover-link { flex-basis: 34%; }
  .bk-core { padding: 0.85rem; }
  .bk-stat dd { font-size: 0.76rem; }
}
</style>