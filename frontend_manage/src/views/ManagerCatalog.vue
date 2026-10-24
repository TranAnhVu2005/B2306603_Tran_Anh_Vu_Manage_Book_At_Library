<template>
  <div class="home-root">
    <!-- ===== HERO SECTION ===== -->
    <section class="hero-section p-5">
      <div class="hero-bg" aria-hidden="true"></div>

      <div class="hero-inner">
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
          <span class="hero-title-main">Nguồn học liệu</span>
          <em>cho mọi hành trình</em>
          <span class="hero-title-region">Đồng bằng sông Cửu Long</span>
        </h1>

        <p class="hero-sub reveal reveal-d2" data-reveal>
          Khám phá giáo trình, ấn bản học thuật và tư liệu nghiên cứu trong kho thư viện.
          Tìm theo tên sách, tác giả, mã sách hoặc lọc theo nhà xuất bản và tình trạng kho.
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
            <span class="hero-stat-label">Tác giả & NXB</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== SEARCH & FILTER SECTION ===== -->
    <section class="search-section">
      <div>
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

            </div>

            <div class="search-toolbar">
              <button class="catalog-filter-toggle" type="button" aria-controls="catalog-filters" :aria-expanded="showFilters" @click="showFilters = !showFilters">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M7 12h10M10 19h4"/></svg>
                Bộ lọc <span v-if="activeFilterCount">{{ activeFilterCount }}</span>
              </button>
              <div v-if="hasActiveFilters" class="filter-status">
              <span class="filter-status-text">
                <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Đang lọc —
                <em v-if="searchKeyword">"{{ searchKeyword }}"</em>
                <span v-if="selectedPublisher !== 'all'"> · {{ selectedPublisher }}</span>
                <span v-if="selectedGenre !== 'all'"> · {{ getGenreName(selectedGenre) }}</span>
                <span v-if="selectedPriceRange !== 'all'"> · {{ getPriceRangeName(selectedPriceRange) }}</span>
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
      </div>
    </section>

    <!-- ===== BOOKS CATALOG SECTION ===== -->
    <section class="catalog-section">
      <div class="catalog-layout">
        <aside id="catalog-filters" class="vg-shell catalog-filter-shell" :class="{ 'is-open': showFilters }" aria-label="Bộ lọc sách">
          <div class="vg-core catalog-filter-core">
            <div class="catalog-filter-heading">
              <div><span class="catalog-filter-kicker">Tùy chọn</span><h2>Lọc sách</h2></div>
              <button class="catalog-filter-reset" type="button" @click="resetFilters">Đặt lại</button>
            </div>
            <div class="catalog-filter-field"><span>Nhà xuất bản</span>
              <CatalogFilterSelect v-model="selectedPublisher" :options="publisherFilterOptions" aria-label="Nhà xuất bản" />
            </div>
            <div class="catalog-filter-field"><span>Thể loại</span>
              <CatalogFilterSelect v-model="selectedGenre" :options="genreFilterOptions" aria-label="Thể loại" />
            </div>
            <div class="catalog-filter-field"><span>Khoảng giá</span>
              <CatalogFilterSelect v-model="selectedPriceRange" :options="priceFilterOptions" aria-label="Khoảng giá" />
            </div>
            <label class="catalog-stock-filter"><input type="checkbox" v-model="availableOnly" /> <span>Chỉ sách còn trong kho</span></label>
          </div>
        </aside>
        <div class="catalog-results">
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
            <BookCard :book="book" :publisher-name="getPublisherName(book.MaNXB)" :genre-name="getGenreName(book.MaTheLoai)" />
          </div>
        </div>
        </div>
      </div>
    </section>

    <!-- Toast -->
    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import nxbService from "../services/nhaxuatban.service";
import theloaiService from "../services/theloai.service";
import BookCard from "../components/CatalogBookCard.vue";
import CatalogFilterSelect from "../components/CatalogFilterSelect.vue";

export default {
  name: "ManagerCatalog",
  components: { BookCard, CatalogFilterSelect, ToastNotification },
  data() {
    return {
      books: [],
      publishers: [],
      genres: [],
      loading: false,
      searchKeyword: "",
      showFilters: false,
      selectedPublisher: "all",
      selectedGenre: "all",
      selectedPriceRange: "all",
      availableOnly: false,
      revealObserver: null,
    };
  },
  computed: {
    publisherFilterOptions() {
      return [
        { value: "all", label: "Tất cả NXB" },
        ...this.publishers.map((publisher) => ({ value: publisher.MaNXB, label: publisher.TENNXB })),
      ];
    },
    genreFilterOptions() {
      return [
        { value: "all", label: "Tất cả thể loại" },
        ...this.genres.map((genre) => ({ value: genre.MaTheLoai, label: genre.TenTheLoai })),
      ];
    },
    priceFilterOptions() {
      return [
        { value: "all", label: "Tất cả mức giá" },
        { value: "under-50000", label: "Dưới 50.000 ₫" },
        { value: "50000-100000", label: "50.000–dưới 100.000 ₫" },
        { value: "100000-250000", label: "100.000–dưới 250.000 ₫" },
        { value: "250000-up", label: "Từ 250.000 ₫" },
      ];
    },
    activeFilterCount() {
      return Number(this.selectedPublisher !== "all") + Number(this.selectedGenre !== "all") + Number(this.selectedPriceRange !== "all") + Number(this.availableOnly);
    },
    hasActiveFilters() {
      return !!this.searchKeyword.trim() || this.selectedPublisher !== "all" || this.selectedGenre !== "all" || this.selectedPriceRange !== "all" || this.availableOnly;
    },
    availableBooksCount() {
      return this.books.filter((b) => b.SoQuyen > 0).length;
    },
    filteredBooks() {
      const keyword = this.normalizeSearchText(this.searchKeyword.trim());

      return this.books.filter((book) => {
        const searchableFields = [book.TenSach, book.TacGia, book.MaSach];
        const matchesKeyword = !keyword || searchableFields.some((field) =>
          this.normalizeSearchText(field).includes(keyword)
        );
        const matchesPublisher = this.selectedPublisher === "all" || book.MaNXB === this.selectedPublisher;
        const matchesGenre = this.selectedGenre === "all" || book.MaTheLoai === this.selectedGenre;
        const matchesPrice = this.matchesPriceRange(book.DonGia, this.selectedPriceRange);
        const matchesAvailability = !this.availableOnly || Number(book.SoQuyen) > 0;
        return matchesKeyword && matchesPublisher && matchesGenre && matchesPrice && matchesAvailability;
      });
    },
  },
  watch: {
    filteredBooks() {
      this.$nextTick(() => this.initReveal());
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
    getGenreName(code) {
      return this.genres.find((genre) => genre.MaTheLoai === code)?.TenTheLoai || "Chưa phân loại";
    },
    getPriceRangeName(range) {
      return ({ "under-50000": "Dưới 50.000 ₫", "50000-100000": "50.000–dưới 100.000 ₫", "100000-250000": "100.000–dưới 250.000 ₫", "250000-up": "Từ 250.000 ₫" })[range] || "Tất cả mức giá";
    },
    matchesPriceRange(value, range) {
      if (range === "all") return true;
      const price = Number(value);
      if (!Number.isFinite(price)) return false;
      if (range === "under-50000") return price < 50000;
      if (range === "50000-100000") return price >= 50000 && price < 100000;
      if (range === "100000-250000") return price >= 100000 && price < 250000;
      return range === "250000-up" && price >= 250000;
    },
    initReveal() {
      if (typeof IntersectionObserver === "undefined") {
        this.$el.querySelectorAll("[data-reveal]").forEach((el) => {
          el.classList.add("is-visible");
        });
        return;
      }

      if (!this.revealObserver) {
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
      }

      this.$el.querySelectorAll("[data-reveal]").forEach((el) => {
        if (!el.classList.contains("is-visible")) {
          this.revealObserver.observe(el);
        }
      });
    },
    normalizeSearchText(value) {
      return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLocaleLowerCase("vi");
    },
    async fetchData() {
      this.loading = true;
      try {
        const [booksRes, nxbRes, genresRes] = await Promise.all([sachService.getAll(), nxbService.getAll(), theloaiService.getAll()]);
        this.books = booksRes;
        this.publishers = nxbRes;
        this.genres = genresRes;
      } catch {
        this.$refs.toast.show("Lỗi khi kết nối đến máy chủ thư viện.", "error");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initReveal());
      }
    },
    async fetchBooks() {
      this.loading = true;
      try {
        this.books = await sachService.getAll();
      } catch {
        this.$refs.toast.show("Lỗi khi tải danh sách sách.", "error");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initReveal());
      }
    },
    clearSearch() { this.searchKeyword = ""; },
    resetFilters() {
      this.searchKeyword = "";
      this.selectedPublisher = "all";
      this.selectedGenre = "all";
      this.selectedPriceRange = "all";
      this.availableOnly = false;
    },
  },
};
</script>

<style scoped>
/* === Root === */
.home-root {
  width: 100%;
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
    radial-gradient(ellipse 80% 60% at 10% 0%, rgba(67, 45, 215, 0.28), transparent 55%),
    radial-gradient(ellipse 60% 50% at 90% 100%, rgba(253, 200, 0, 0.24), transparent 55%),
    url('@/assets/background_homeview.jpg') center/cover no-repeat;
  opacity: 0.62;
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
  max-width: 900px;
}
.hero-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-family: var(--font-serif);
  font-size: clamp(2.4rem, 5.2vw, 4.25rem);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.035em;
  color: var(--ink-primary);
  margin: 1.5rem 0 1.4rem;
}
.hero-title-main {
  max-width: 100%;
}
.hero-title em {
  font-style: italic;
  color: var(--primary);
  font-weight: 600;
}
.hero-title-region {
  margin-top: 0.85rem;
  font-family: var(--font-sans);
  font-size: 0.24em;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.hero-sub {
  font-size: 1.05rem;
  color: var(--ink-secondary);
  line-height: 1.7;
  max-width: 510px;
  margin-bottom: 2rem;
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
.catalog-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  align-items: start;
  gap: 1.5rem;
}
.catalog-filter-shell { position: relative; z-index: 4; min-width: 0; }
.catalog-filter-core { display: grid; gap: 0.9rem; padding: 1.15rem; overflow: visible; }
.catalog-filter-heading { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding-bottom: 0.9rem; border-bottom: 1px solid var(--paper-border); }
.catalog-filter-kicker { display: inline-block; padding: 0.1rem 0.35rem; background: var(--neo-yellow); color: var(--ink-primary); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; line-height: 1.35; text-transform: uppercase; }
.catalog-filter-heading h2 { margin: 0.2rem 0 0; color: var(--ink-primary); font-size: 1.2rem; font-weight: 800; line-height: 1.25; }
.catalog-filter-reset { flex: 0 0 auto; padding: 0.4rem 0.15rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--ink-secondary); font: inherit; font-size: 0.76rem; font-weight: 700; cursor: pointer; transition: color 160ms ease, border-color 160ms ease; }
.catalog-filter-reset:hover { color: var(--ink-primary); border-bottom-color: var(--neo-yellow); }
.catalog-filter-reset:focus-visible { outline: 2px solid var(--neo-violet); outline-offset: 3px; }
.catalog-filter-field { display: grid; gap: 0.45rem; color: var(--ink-secondary); font-size: 0.78rem; font-weight: 700; }
.catalog-stock-filter { display: flex; align-items: flex-start; gap: 0.65rem; padding-top: 0.2rem; color: var(--ink-secondary); font-size: 0.8rem; font-weight: 600; line-height: 1.45; cursor: pointer; }
.catalog-stock-filter input { flex: 0 0 auto; width: 17px; height: 17px; margin: 0.08rem 0 0; accent-color: var(--neo-yellow); }
.catalog-results { position: relative; z-index: 1; min-width: 0; }
.search-toolbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-top: 0.5rem; }
.catalog-filter-toggle { display: none; align-items: center; justify-content: center; gap: 0.55rem; min-height: 42px; padding: 0.5rem 0.8rem; border: 2px solid var(--ink-primary); border-radius: 0.7rem; background: var(--paper); color: var(--ink-primary); font-weight: 700; box-shadow: 3px 3px 0 var(--ink-primary); }
.catalog-filter-toggle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.catalog-filter-toggle span { display: inline-grid; place-items: center; min-width: 21px; height: 21px; padding: 0 5px; border-radius: 50%; background: var(--accent-yellow); font-size: 0.75rem; }
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
  .hero-title {
    font-size: clamp(2.25rem, 9vw, 3rem);
    margin-top: 1.25rem;
  }
  .hero-title-region {
    font-size: 0.27em;
    letter-spacing: 0.12em;
  }
  .hero-sub { font-size: 0.96rem; margin-bottom: 1.5rem; }
  .hero-stats { flex-wrap: wrap; border-radius: 1.25rem; }
  .hero-stat { flex: 1; min-width: 100px; }
  .hero-stat-divider { display: none; }
  .search-bar-wrap { flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .search-divider { display: none; }
  .search-select-wrap { padding: 0.5rem 0.9rem; }
  .search-check-label { margin-left: 0; }
  .catalog-layout { grid-template-columns: minmax(0, 1fr); gap: 0.85rem; }
  .catalog-filter-toggle { display: inline-flex; flex: 0 0 auto; }
  .catalog-filter-shell { display: none; }
  .catalog-filter-shell.is-open { display: block; }
  .catalog-filter-core { gap: 0.85rem; padding: 1rem; }
  .search-toolbar { align-items: stretch; flex-direction: column; }
  .books-grid { grid-template-columns: 1fr; }
  .catalog-section { padding-bottom: 3rem; }
}

@media (min-width: 576px) and (max-width: 767.98px) {
  .books-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 420px) {
  .hero-stats {
    width: 100%;
    border-radius: 1.25rem;
  }

  .hero-stat {
    min-width: 0;
    padding-inline: 0.6rem;
  }

  .hero-stat-num { font-size: 1.35rem; }
  .hero-stat-label { font-size: 0.57rem; letter-spacing: 0.06em; }
  .search-select { min-width: 0; width: 100%; }
  .filter-status { align-items: flex-start; }
}
</style>
