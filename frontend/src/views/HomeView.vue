<template>
  <div class="home-root">
    <!-- ===== HERO SECTION ===== -->
    <section class="hero-section">
      <div class="hero-bg" aria-hidden="true"></div>

      <div class="container hero-inner">
        <!-- Eyebrow -->
        <div class="reveal" data-reveal>
          <span class="eyebrow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Thư Viện Đại Học Cần Thơ
          </span>
        </div>

        <!-- Headline -->
        <h1 class="hero-title reveal reveal-d1" data-reveal>
          Nguồn Học Liệu<br/>
          <em>Phong Phú Bậc Nhất</em><br/>
          Đồng Bằng Sông Cửu Long
        </h1>

        <p class="hero-sub reveal reveal-d2" data-reveal>
          Hệ thống quản lý ấn bản học thuật, giáo trình chuẩn hóa và tư liệu nghiên cứu.
          Tra cứu và đăng ký mượn sách nhanh chóng, tiện lợi.
        </p>

        <!-- Stats strip -->
        <div class="hero-stats reveal reveal-d3" data-reveal>
          <div class="hero-stat">
            <span class="hero-stat-num">{{ books.length }}</span>
            <span class="hero-stat-label">Đầu sách</span>
          </div>
          <div class="hero-stat-divider" aria-hidden="true"></div>
          <div class="hero-stat">
            <span class="hero-stat-num" style="color: var(--status-available);">{{ availableBooksCount }}</span>
            <span class="hero-stat-label">Sẵn sàng mượn</span>
          </div>
          <div class="hero-stat-divider" aria-hidden="true"></div>
          <div class="hero-stat">
            <span class="hero-stat-num">03</span>
            <span class="hero-stat-label">Hạn mức / độc giả</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== SEARCH & FILTER SECTION ===== -->
    <section class="search-section">
      <div class="container">
        <div class="vg-shell reveal" data-reveal>
          <div class="vg-core">
            <div class="search-bar-wrap">
              <!-- Keyword -->
              <div class="search-input-wrap">
                <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  id="search-keyword"
                  type="text"
                  class="search-input"
                  v-model="searchKeyword"
                  placeholder="Tìm theo tên sách, tác giả hoặc mã sách..."
                  autocomplete="off"
                />
                <button v-if="searchKeyword" class="search-clear" type="button" @click="clearSearch" aria-label="Xóa tìm kiếm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Divider -->
              <span class="search-divider" aria-hidden="true"></span>

              <!-- Publisher select -->
              <div class="search-select-wrap">
                <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 6h16M7 12h10M10 18h4"/>
                </svg>
                <select class="search-select" v-model="selectedPublisher" @change="fetchBooks">
                  <option value="all">Tất cả NXB</option>
                  <option v-for="nxb in publishers" :key="nxb.MaNXB" :value="nxb.MaNXB">
                    {{ nxb.TENNXB }}
                  </option>
                </select>
              </div>

              <!-- Available checkbox -->
              <label class="search-check-label" for="availCheck">
                <input
                  type="checkbox"
                  id="availCheck"
                  class="search-check-input"
                  v-model="availableOnly"
                  @change="fetchBooks"
                />
                <span class="search-check-box" aria-hidden="true"></span>
                Còn trong kho
              </label>
            </div>

            <!-- Active filter bar -->
            <div v-if="hasActiveFilters" class="filter-status">
              <span class="filter-status-text">
                <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Đang lọc —
                <em v-if="searchKeyword">"{{ searchKeyword }}"</em>
                <span v-if="selectedPublisher !== 'all'"> · {{ selectedPublisher }}</span>
                <span v-if="availableOnly"> · Còn kho</span>
                &nbsp;·&nbsp;tìm thấy <strong>{{ filteredBooks.length }}</strong> tác phẩm
              </span>
              <button class="filter-clear-btn" type="button" @click="resetFilters">
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== BOOKS CATALOG SECTION ===== -->
    <section class="catalog-section">
      <div class="container">
        <!-- Section header -->
        <div class="catalog-header reveal" data-reveal>
          <div>
            <span class="vg-section-label">Danh mục sách</span>
            <p class="catalog-count">
              Hiển thị <strong>{{ filteredBooks.length }}</strong> trên tổng số <strong>{{ books.length }}</strong> ấn bản
            </p>
          </div>
          <button class="ath-btn-outline" @click="fetchBooks" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
            </svg>
            Làm mới
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-center reveal" data-reveal>
          <div class="vg-spinner"></div>
          <p class="state-text">Đang tải danh mục sách...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredBooks.length === 0" class="vg-shell reveal" data-reveal>
          <div class="vg-core empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-muted);" aria-hidden="true">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9 9.5 6 0"/><path d="m9 13.5 4 0"/>
            </svg>
            <h2 class="empty-title">Không tìm thấy cuốn sách nào</h2>
            <p class="empty-sub">Vui lòng thử từ khóa khác hoặc bỏ bộ lọc hiện tại.</p>
            <button class="ath-btn-primary" @click="resetFilters" type="button">
              Đặt lại bộ lọc
              <span class="btn-island" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div v-else class="books-grid">
          <div
            v-for="(book, idx) in filteredBooks"
            :key="book._id"
            class="reveal"
            :class="`reveal-d${Math.min(idx % 6 + 1, 4)}`"
            data-reveal
          >
            <BookCard :book="book" :publisher-name="getPublisherName(book.MaNXB)" @borrow="openBorrowModal" />
          </div>
        </div>
      </div>
    </section>

    <!-- Borrow Modal -->
    <BorrowModal
      :show="showBorrowModal"
      :book="selectedBook"
      @close="showBorrowModal = false"
      @confirm="submitBorrowRequest"
    />

    <!-- Toast -->
    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import BookCard from "../components/BookCard.vue";
import BorrowModal from "../components/BorrowModal.vue";
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import nxbService from "../services/nhaxuatban.service";
import theoDoiService from "../services/theodoimuon.service";
import authService from "../services/auth.service";

export default {
  name: "HomeView",
  components: { BookCard, BorrowModal, ToastNotification },
  data() {
    return {
      books: [],
      publishers: [],
      loading: false,
      searchKeyword: "",
      selectedPublisher: "all",
      availableOnly: false,
      showBorrowModal: false,
      selectedBook: null,
      revealObserver: null,
    };
  },
  computed: {
    hasActiveFilters() {
      return !!this.searchKeyword.trim() || this.selectedPublisher !== "all" || this.availableOnly;
    },
    availableBooksCount() {
      return this.books.filter((b) => b.SoQuyen > 0).length;
    },
    filteredBooks() {
      return this.books.filter((book) => {
        const kw = this.searchKeyword.toLowerCase().trim();
        const matchesKeyword =
          !kw ||
          book.TenSach.toLowerCase().includes(kw) ||
          book.TacGia.toLowerCase().includes(kw) ||
          book.MaSach.toLowerCase().includes(kw);
        const matchesPublisher = this.selectedPublisher === "all" || book.MaNXB === this.selectedPublisher;
        const matchesAvailability = !this.availableOnly || book.SoQuyen > 0;
        return matchesKeyword && matchesPublisher && matchesAvailability;
      });
    },
  },
  created() {
    this.fetchData();
  },
  mounted() {
    this.initReveal();
  },
  beforeUnmount() {
    if (this.revealObserver) this.revealObserver.disconnect();
  },
  methods: {
    getPublisherName(maNxb) {
      return this.publishers.find((publisher) => publisher.MaNXB === maNxb)?.TENNXB || "";
    },
    initReveal() {
      if (this.revealObserver) this.revealObserver.disconnect();
      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              this.revealObserver.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      this.$el.querySelectorAll("[data-reveal]").forEach((el) => {
        this.revealObserver.observe(el);
      });
    },
    async fetchData() {
      this.loading = true;
      try {
        const [booksRes, nxbRes] = await Promise.all([sachService.getAll(), nxbService.getAll()]);
        this.books = booksRes;
        this.publishers = nxbRes;
      } catch {
        this.$refs.toast.show("Lỗi khi kết nối đến máy chủ thư viện.", "error");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initReveal());
      }
    },
    async fetchBooks() {
      try {
        const params = {};
        if (this.selectedPublisher !== "all") params.maNxb = this.selectedPublisher;
        if (this.availableOnly) params.availableOnly = "true";
        this.books = await sachService.getAll(params);
      } catch {
        this.$refs.toast.show("Lỗi khi tải danh sách sách.", "error");
      }
    },
    clearSearch() { this.searchKeyword = ""; },
    resetFilters() {
      this.searchKeyword = "";
      this.selectedPublisher = "all";
      this.availableOnly = false;
      this.fetchBooks();
    },
    openBorrowModal(book) {
      if (!authService.isLoggedIn()) {
        this.$router.push("/login?redirect=/");
        return;
      }
      if (!authService.isReader()) {
        this.$refs.toast.show("Chỉ độc giả mới có thể đăng ký mượn sách.", "error");
        return;
      }
      this.selectedBook = book;
      this.showBorrowModal = true;
    },
    async submitBorrowRequest(payload) {
      try {
        const result = await theoDoiService.dangKyMuon({
          MaDocGia: authService.getUser()?.MaDocGia,
          MaSach: payload.maSach,
          GhiChu: payload.ghiChu,
        });
        this.showBorrowModal = false;
        this.$refs.toast.show(result.message || "Gửi yêu cầu mượn thành công! Vui lòng chờ xét duyệt.");
        this.fetchBooks();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Không thể gửi yêu cầu mượn.", "error", 4500);
      }
    },
  },
};
</script>

<style scoped>
/* === Root === */
.home-root {
  min-height: 100vh;
  background-color: var(--paper);
}

/* ===== HERO ===== */
.hero-section {
  position: relative;
  overflow: hidden;
  padding: 5rem 0 4rem;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 10% 0%, rgba(20, 53, 41, 0.08), transparent 55%),
    radial-gradient(ellipse 60% 50% at 90% 100%, rgba(140, 61, 40, 0.05), transparent 55%),
    url('@/assets/background_homeview.jpg') center/cover no-repeat;
  opacity: 0.35;
}
.hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    var(--paper) 0%,
    rgba(250, 249, 245, 0.0) 20%,
    rgba(250, 249, 245, 0.0) 80%,
    var(--paper) 100%
  );
}
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 820px;
}
.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: var(--ink-primary);
  margin: 1.25rem 0 1.5rem;
}
.hero-title em {
  font-style: italic;
  color: var(--primary);
}
.hero-sub {
  font-size: 1.05rem;
  color: var(--ink-secondary);
  line-height: 1.7;
  max-width: 560px;
  margin-bottom: 2.5rem;
}
.hero-stats {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 5px;
  border-radius: 999px;
  background: var(--tray);
  box-shadow: inset 0 0 0 1px var(--hair);
  width: fit-content;
}
.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.65rem 1.5rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: inset 0 1px 1px rgba(255,255,255,.9);
}
.hero-stat-num {
  font-family: var(--font-mono);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink-primary);
}
.hero-stat-label {
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 0.25rem;
}
.hero-stat-divider {
  width: 1px;
  height: 32px;
  background: var(--paper-border);
  margin: 0 4px;
}

/* ===== SEARCH ===== */
.search-section {
  padding: 0 0 2.5rem;
}
.search-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.5rem;
  flex-wrap: wrap;
}
.search-input-wrap {
  flex: 1;
  min-width: 220px;
  position: relative;
  display: flex;
  align-items: center;
}
.search-ico {
  width: 16px;
  height: 16px;
  color: var(--ink-muted);
  flex-shrink: 0;
  stroke-width: 1.5;
}
.search-input-wrap .search-ico {
  position: absolute;
  left: 0.85rem;
  pointer-events: none;
}
.search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--ink-primary);
  padding: 0.65rem 2.5rem 0.65rem 2.4rem;
}
.search-input::placeholder { color: var(--ink-muted); }
.search-clear {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--paper-border);
  cursor: pointer;
  transition: background 0.25s;
}
.search-clear svg { width: 12px; height: 12px; color: var(--ink-secondary); }
.search-clear:hover { background: var(--ink-muted); }
.search-clear:hover svg { color: #fff; }

.search-divider {
  display: block;
  width: 1px;
  height: 28px;
  background: var(--paper-border);
  margin: 0 0.5rem;
  flex-shrink: 0;
}
.search-select-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
}
.search-select {
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.84rem;
  color: var(--ink-primary);
  cursor: pointer;
  min-width: 160px;
}
.search-check-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem 0.5rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--ink-secondary);
  cursor: pointer;
  user-select: none;
  background: var(--paper-subtle);
  margin-left: 0.5rem;
  transition: background 0.3s;
}
.search-check-label:hover { background: var(--paper-border); }
.search-check-input { display: none; }
.search-check-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--paper-border);
  background: #fff;
  flex-shrink: 0;
  transition: background 0.25s, border-color 0.25s;
  display: flex; align-items: center; justify-content: center;
}
.search-check-input:checked + .search-check-box {
  background: var(--primary);
  border-color: var(--primary);
}
.search-check-input:checked + .search-check-box::after {
  content: "";
  display: block;
  width: 8px;
  height: 5px;
  border-left: 1.5px solid #fff;
  border-bottom: 1.5px solid #fff;
  transform: rotate(-45deg) translateY(-1px);
}

.filter-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  border-top: 1px solid var(--paper-border);
  font-size: 0.82rem;
  color: var(--ink-secondary);
  flex-wrap: wrap;
  gap: 0.5rem;
}
.filter-status-text em { font-style: normal; color: var(--ink-primary); font-weight: 600; }
.filter-clear-btn {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--status-out);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  transition: background 0.25s;
}
.filter-clear-btn:hover { background: #FDF2F1; }

/* ===== CATALOG ===== */
.catalog-section {
  padding-bottom: 5rem;
}
.catalog-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.catalog-count {
  font-size: 0.84rem;
  color: var(--ink-muted);
  margin: 0.25rem 0 0;
}
.catalog-count strong { color: var(--ink-primary); }

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* Loading / empty state */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 1rem;
  gap: 1rem;
}
.state-text { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem;
  gap: 1rem;
}
.empty-title {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0;
}
.empty-sub { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }

/* Button island icon */
.btn-island {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  flex-shrink: 0;
  transition: transform 0.5s var(--ease-spring), background 0.4s;
}
.ath-btn-primary:hover .btn-island {
  transform: translate(2px, -1px) scale(1.08);
  background: rgba(255,255,255,0.22);
}

/* ===== MOBILE ===== */
@media (max-width: 767.98px) {
  .hero-section { padding: 3rem 0 2.5rem; }
  .hero-title { font-size: 2rem; }
  .hero-stats { flex-wrap: wrap; border-radius: 1.25rem; }
  .hero-stat { flex: 1; min-width: 100px; }
  .hero-stat-divider { display: none; }
  .search-bar-wrap { flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .search-divider { display: none; }
  .search-select-wrap { padding: 0.5rem 0.9rem; }
  .search-check-label { margin-left: 0; }
  .books-grid { grid-template-columns: 1fr; }
  .catalog-section { padding-bottom: 3rem; }
}
</style>