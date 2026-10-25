<template>
  <div class="vg-page">
    <div class="manager-borrows-page">
      <!-- ===== PAGE HEADER ===== -->
      <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 reveal" data-reveal>
        <div>
          <span class="vg-section-label">Nghiệp Vụ Thủ Thư &amp; Quản Trị</span>
          <h1 class="page-title">Quản Lý Mượn — Trả Sách &amp; Phê Duyệt</h1>
        </div>
        <button class="ath-btn-outline" @click="fetchData" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Làm mới
        </button>
      </div>

      <!-- ===== STAT CARDS ===== -->
      <div class="stats-row reveal reveal-d1" data-reveal>
        <div class="vg-stat-card accent-yellow" @click="activeTab = 'pending'; onlyOverdue = false" role="button"
          tabindex="0">
          <div class="vg-stat-inner">
            <span class="vg-stat-label">Chờ xét duyệt</span>
            <span class="vg-stat-number" style="color: #F59E0B;">{{ pendingList.length }}</span>
            <span class="vg-stat-sub">đơn yêu cầu</span>
          </div>
        </div>
        <div class="vg-stat-card accent-green" @click="activeTab = 'borrowing'" role="button" tabindex="0">
          <div class="vg-stat-inner">
            <span class="vg-stat-label">Đang lưu hành</span>
            <span class="vg-stat-number" style="color: var(--status-available);">{{ borrowingList.length }}</span>
            <span class="vg-stat-sub">cuốn đang mượn</span>
          </div>
        </div>
        <div class="vg-stat-card accent-red" @click="activeTab = 'borrowing'; onlyOverdue = true" role="button"
          tabindex="0">
          <div class="vg-stat-inner">
            <span class="vg-stat-label">Quá hạn trả</span>
            <span class="vg-stat-number" style="color: var(--status-out);">{{ overdueList.length }}</span>
            <span class="vg-stat-sub">cuốn quá hạn</span>
          </div>
        </div>
        <div class="vg-stat-card accent-dark" @click="activeTab = 'completed'; onlyOverdue = false" role="button"
          tabindex="0">
          <div class="vg-stat-inner">
            <span class="vg-stat-label">Đã hoàn tất / Mất</span>
            <span class="vg-stat-number">{{ completedList.length }}</span>
            <span class="vg-stat-sub">phiếu lưu trữ</span>
          </div>
        </div>
      </div>

      <!-- ===== MAIN TABLE SECTION ===== -->
      <div class="vg-shell reveal reveal-d2" data-reveal>
        <div class="vg-section-body">
          <!-- Top bar: tabs + filter -->
          <div class="vg-section-header">
            <div class="vg-tabs">
              <button class="vg-tab" :class="{ 'is-active': activeTab === 'pending' }"
                @click="activeTab = 'pending'; onlyOverdue = false" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Chờ duyệt <span class="tc">{{ pendingList.length }}</span>
              </button>
              <button class="vg-tab" :class="{ 'is-active': activeTab === 'borrowing' }"
                @click="activeTab = 'borrowing'" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                Đang mượn <span class="tc">{{ borrowingList.length }}</span>
              </button>
              <button class="vg-tab" :class="{ 'is-active': activeTab === 'completed' }"
                @click="activeTab = 'completed'; onlyOverdue = false" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="M3 3v5h5" />
                  <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                </svg>
                Lịch sử <span class="tc">{{ completedList.length }}</span>
              </button>
            </div>

            <div class="filter-row">
              <label v-if="activeTab === 'borrowing'" class="overdue-check-label">
                <input type="checkbox" class="overdue-check-input" v-model="onlyOverdue" />
                <span class="overdue-dot" aria-hidden="true"></span>
                Chỉ quá hạn
              </label>
              <div class="table-search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                  style="color: var(--ink-muted); flex-shrink: 0;">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" class="table-search-input" v-model="search" placeholder="Lọc độc giả, mã sách..." />
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="borrows-state">
            <div class="vg-spinner"></div>
            <p class="state-text">Đang tải dữ liệu lưu chiểu...</p>
          </div>

          <!-- Empty -->
          <div v-else-if="filteredDisplayList.length === 0" class="borrows-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"
              stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-muted);" aria-hidden="true">
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <path d="M8 10h8M8 14h4" />
            </svg>
            <h2 style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--ink-primary); margin: 0;">Không
              có bản ghi nào phù hợp</h2>
            <p class="state-text">Hệ thống đang ở trạng thái đồng bộ.</p>
          </div>

          <!-- Table -->
          <div v-else class="table-wrap">
            <table class="ath-table">
              <thead>
                <tr>
                  <th>Độc giả</th>
                  <th>Sách mượn</th>
                  <th>Ngày mượn</th>
                  <th>Hạn trả</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú / Bồi thường</th>
                  <th style="text-align: right;">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredDisplayList" :key="item._id">
                  <td>
                    <strong class="row-name">{{ readerName(item.MaDocGia) }}</strong>
                    <span class="row-sub font-mono-code">{{ item.MaDocGia }} · {{ readerPhone(item.MaDocGia) || '—'
                      }}</span>
                    <span v-if="readerFor(item.MaDocGia)?.TrangThaiThe === 'DanhSachDen'"
                      class="ath-badge ath-badge-danh-sach-den" style="margin-top: 4px; font-size: 0.6rem;">
                      Danh sách đen ({{ readerFor(item.MaDocGia).SoLanViPham }} lỗi)
                    </span>
                  </td>
                  <td>
                    <strong class="row-book font-serif-headline">{{ bookName(item.MaSach) }}</strong>
                    <span class="row-sub font-mono-code">{{ item.MaSach }} · {{
                      bookPrice(item.MaSach).toLocaleString('vi-VN') }} ₫</span>
                  </td>
                  <td class="font-mono-code row-date">{{ item.NgayMuon || '—' }}</td>
                  <td>
                    <span class="font-mono-code row-date" :class="isLate(item) ? 'overdue-text' : ''">{{ item.NgayHenTra
                      || '—' }}</span>
                    <span v-if="isLate(item)" class="ath-badge ath-badge-out"
                      style="display: block; margin-top: 3px; font-size: 0.6rem;">Quá hạn!</span>
                  </td>
                  <td>
                    <span v-if="item.TrangThai === 'ChoDuyet'" class="ath-badge ath-badge-pending">Chờ duyệt</span>
                    <span v-else-if="item.TrangThai === 'DangMuon'" class="ath-badge ath-badge-available">Đang
                      mượn</span>
                    <span v-else-if="item.TrangThai === 'DaTra'" class="ath-badge ath-badge-neutral">Đã trả</span>
                    <span v-else-if="item.TrangThai === 'MatSach'" class="ath-badge ath-badge-out">Mất sách</span>
                    <span v-else-if="item.TrangThai === 'TuChoi'" class="ath-badge ath-badge-rejected">Từ chối</span>
                  </td>
                  <td class="row-sub">
                    {{ item.GhiChu || '—' }}
                    <div v-if="item.GiaTriBoiThuong > 0" class="boi-thuong">{{
                      item.GiaTriBoiThuong.toLocaleString('vi-VN') }} ₫</div>
                    <div v-if="item.MSNV" class="font-mono-code"
                      style="font-size: 0.7rem; color: var(--ink-muted); margin-top: 2px;">Duyệt bởi: {{ item.MSNV }}
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <template v-if="item.TrangThai === 'ChoDuyet'">
                      <button class="ath-action-btn ath-action-btn-success" style="margin-right: 4px;"
                        @click="handleApprove(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="1.5" aria-hidden="true">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <path d="m9 11 3 3L22 4" />
                        </svg>
                        Duyệt
                      </button>
                      <button class="ath-action-btn ath-action-btn-danger" @click="openRejectModal(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="1.5" aria-hidden="true">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                        Từ chối
                      </button>
                    </template>
                    <template v-else-if="item.TrangThai === 'DangMuon'">
                      <button class="ath-action-btn ath-action-btn-success" style="margin-right: 4px;"
                        @click="handleReturn(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="1.5" aria-hidden="true">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M8 16H3v5" />
                        </svg>
                        Đã trả
                      </button>
                      <button class="ath-action-btn ath-action-btn-danger" @click="openLossModal(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="1.5" aria-hidden="true">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <path d="M12 9v4" />
                          <circle cx="12" cy="17" r="1" fill="currentColor" />
                        </svg>
                        Báo mất
                      </button>
                    </template>
                    <template v-else>
                      <button class="ath-action-btn ath-action-btn-danger" @click="handleDelete(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="1.5" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        Xóa
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== REJECT MODAL ===== -->
      <div v-if="showRejectModal" class="ath-modal-overlay" @click.self="showRejectModal = false">
        <div class="ath-modal-content">
          <div class="ath-modal-inner">
            <div class="modal-head">
              <h3 class="modal-title" style="color: var(--status-out);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Từ Chối Yêu Cầu Mượn Sách
              </h3>
              <button type="button" class="modal-close" @click="showRejectModal = false" aria-label="Đóng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="modal-sub" v-if="selectedRejectItem">
                Từ chối yêu cầu mượn <strong>{{ bookName(selectedRejectItem.MaSach) }}</strong> của độc giả <strong>{{
                  readerName(selectedRejectItem.MaDocGia) }}</strong>.
              </p>
              <div class="mb-3">
                <label class="form-label-sm">Lý do từ chối:</label>
                <select class="ath-input mb-2" v-model="rejectReason">
                  <option value="Độc giả đã đạt định mức tối đa 3 cuốn đang mượn">Sách đang được thu hồi để kiểm kê
                    /phục chế
                  </option>
                  <option value="Khác">Lý do khác (tự nhập)...</option>
                </select>
                <input v-if="rejectReason === 'Khác'" type="text" class="ath-input" v-model="customRejectReason"
                  placeholder="Nhập lý do cụ thể..." />
              </div>
              <div class="modal-footer-actions">
                <button class="ath-btn-outline" @click="showRejectModal = false" type="button">Hủy</button>
                <button class="ath-btn-danger" @click="confirmReject" type="button">Xác nhận Từ chối</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== LOSS MODAL ===== -->
      <div v-if="showLossModal" class="ath-modal-overlay" @click.self="showLossModal = false">
        <div class="ath-modal-content">
          <div class="ath-modal-inner">
            <div class="modal-head">
              <h3 class="modal-title" style="color: var(--status-out);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
                Xác Nhận Báo Mất Sách
              </h3>
              <button type="button" class="modal-close" @click="showLossModal = false" aria-label="Đóng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="warning-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
                Khi báo mất, tồn kho sẽ <strong>không được cộng lại</strong>. Hệ thống sẽ tự động phạt độc giả số tiền
                bằng
                đúng đơn giá cuốn sách và tăng số lần vi phạm lên 1 (đạt 3 lần → tự động đưa vào Danh sách đen).
              </div>
              <div class="mb-3">
                <label class="form-label-sm">Lý do / Tình trạng ghi nhận:</label>
                <input type="text" class="ath-input" v-model="lossReason"
                  placeholder="VD: Độc giả làm rơi mất sách trong quá trình di chuyển..." />
              </div>
              <div class="modal-footer-actions">
                <button class="ath-btn-outline" @click="showLossModal = false" type="button">Hủy</button>
                <button class="ath-btn-danger" @click="confirmLoss" type="button">Xác nhận Báo mất &amp; Phạt</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastNotification ref="toast" />
    </div>
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import theoDoiService from "../services/theodoimuon.service";
import sachService from "../services/sach.service";
import docGiaService from "../services/docgia.service";

export default {
  name: "ManagerBorrows",
  components: { ToastNotification },
  data() {
    return {
      borrows: [],
      books: [],
      readers: [],
      loading: false,
      activeTab: "pending",
      search: "",
      onlyOverdue: false,
      showLossModal: false,
      selectedLossItem: null,
      lossReason: "Độc giả làm mất sách vật lý",
      showRejectModal: false,
      selectedRejectItem: null,
      rejectReason: "Độc giả đã đạt định mức tối đa 3 cuốn đang mượn",
      customRejectReason: "",
      revealObserver: null,
    };
  },
  computed: {
    pendingList() { return this.borrows.filter(b => b.TrangThai === "ChoDuyet"); },
    borrowingList() { return this.borrows.filter(b => b.TrangThai === "DangMuon"); },
    overdueList() {
      const today = new Date().toISOString().split("T")[0];
      return this.borrows.filter(b => b.TrangThai === "DangMuon" && b.NgayHenTra && today > b.NgayHenTra);
    },
    completedList() { return this.borrows.filter(b => ["DaTra", "MatSach", "TuChoi"].includes(b.TrangThai)); },
    currentDisplayList() {
      if (this.activeTab === "pending") return this.pendingList;
      if (this.activeTab === "borrowing") return this.onlyOverdue ? this.overdueList : this.borrowingList;
      return this.completedList;
    },
    filteredDisplayList() {
      if (!this.search.trim()) return this.currentDisplayList;
      const q = this.search.toLowerCase();
      return this.currentDisplayList.filter(item => {
        const rn = this.readerName(item.MaDocGia).toLowerCase();
        const bn = this.bookName(item.MaSach).toLowerCase();
        return item.MaDocGia.toLowerCase().includes(q) || item.MaSach.toLowerCase().includes(q) || rn.includes(q) || bn.includes(q);
      });
    }
  },
  watch: {
    showLossModal(val) { this.syncModalScroll(val || this.showRejectModal); },
    showRejectModal(val) { this.syncModalScroll(val || this.showLossModal); }
  },
  beforeUnmount() {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleKeyDown);
    if (this.revealObserver) this.revealObserver.disconnect();
  },
  created() { this.fetchData(); },
  mounted() { this.initReveal(); },
  methods: {
    initReveal() {
      if (this.revealObserver) this.revealObserver.disconnect();
      this.revealObserver = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); this.revealObserver.unobserve(e.target); } }),
        { threshold: 0.05 }
      );
      this.$el.querySelectorAll("[data-reveal]").forEach(el => this.revealObserver.observe(el));
    },
    syncModalScroll(isOpen) {
      if (isOpen) { document.body.style.overflow = "hidden"; window.addEventListener("keydown", this.handleKeyDown); }
      else { document.body.style.overflow = ""; window.removeEventListener("keydown", this.handleKeyDown); }
    },
    handleKeyDown(e) {
      if (e.key === "Escape") { this.showLossModal = false; this.showRejectModal = false; }
    },
    async fetchData() {
      this.loading = true;
      try {
        const [borrows, books, readers] = await Promise.all([
          theoDoiService.getAll(),
          sachService.getAll(),
          docGiaService.getAll(),
        ]);
        this.borrows = borrows;
        this.books = books;
        this.readers = readers;
      }
      catch (err) { this.$refs.toast?.show(err.response?.data?.message || "Lỗi khi tải danh sách phiếu mượn.", "error"); }
      finally { this.loading = false; this.$nextTick(() => this.initReveal()); }
    },
    readerFor(maDocGia) {
      return this.readers.find((reader) => reader.MaDocGia === maDocGia) || null;
    },
    readerName(maDocGia) {
      const reader = this.readerFor(maDocGia);
      return reader ? `${reader.HoLot} ${reader.Ten}`.trim() : maDocGia;
    },
    readerPhone(maDocGia) {
      return this.readerFor(maDocGia)?.DienThoai || "";
    },
    bookFor(maSach) {
      return this.books.find((book) => book.MaSach === maSach) || null;
    },
    bookName(maSach) {
      return this.bookFor(maSach)?.TenSach || maSach;
    },
    bookPrice(maSach) {
      return this.bookFor(maSach)?.DonGia || 0;
    },
    isLate(item) {
      if (item.TrangThai !== "DangMuon" || !item.NgayHenTra) return false;
      return new Date().toISOString().split("T")[0] > item.NgayHenTra;
    },
    async handleApprove(item) {
      try {
        const res = await theoDoiService.duyet(item._id);
        this.$refs.toast.show(res.message || "Đã duyệt mượn và trừ 1 cuốn trong kho.");
        this.fetchData();
      } catch (err) { this.$refs.toast.show(err.response?.data?.message || "Không thể duyệt yêu cầu mượn.", "error"); }
    },
    openRejectModal(item) { this.selectedRejectItem = item; this.rejectReason = "Độc giả đã đạt định mức tối đa 3 cuốn đang mượn"; this.customRejectReason = ""; this.showRejectModal = true; },
    async confirmReject() {
      if (!this.selectedRejectItem) return;
      const finalReason = this.rejectReason === "Khác" ? (this.customRejectReason.trim() || "Không đủ điều kiện") : this.rejectReason;
      try { const res = await theoDoiService.tuChoi(this.selectedRejectItem._id, finalReason); this.showRejectModal = false; this.$refs.toast.show(res.message || "Đã từ chối yêu cầu."); this.fetchData(); }
      catch { this.$refs.toast.show("Lỗi khi từ chối yêu cầu.", "error"); }
    },
    async handleReturn(item) {
      if (!confirm(`Xác nhận độc giả đã trả cuốn sách '${this.bookName(item.MaSach)}'?`)) return;
      try { const res = await theoDoiService.xacNhanTra(item._id); this.$refs.toast.show(res.message || "Đã xác nhận trả sách và hoàn lại kho."); this.fetchData(); }
      catch (err) { this.$refs.toast.show(err.response?.data?.message || "Không thể xác nhận trả sách.", "error"); }
    },
    openLossModal(item) { this.selectedLossItem = item; this.lossReason = "Độc giả làm mất sách vật lý"; this.showLossModal = true; },
    async confirmLoss() {
      if (!this.selectedLossItem) return;
      try { const res = await theoDoiService.baoMat(this.selectedLossItem._id, this.lossReason); this.showLossModal = false; this.$refs.toast.show(res.message || "Đã ghi nhận mất sách."); this.fetchData(); }
      catch (err) { this.$refs.toast.show(err.response?.data?.message || "Lỗi khi báo mất sách.", "error"); }
    },
    async handleDelete(item) {
      if (!confirm("Bạn có chắc chắn muốn xóa phiếu lưu trữ này?")) return;
      try { await theoDoiService.delete(item._id); this.$refs.toast.show("Đã xóa phiếu lưu trữ."); this.fetchData(); }
      catch { this.$refs.toast.show("Không thể xóa phiếu.", "error"); }
    }
  }
};
</script>

<style scoped>
/* Layout */
.manager-borrows-page {
  --mb-ink: #202b3c;
  --mb-muted: #737d8b;
  --mb-line: #e9e7e1;
  --mb-paper: #fff;
  --mb-soft: #f8f7f3;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: clamp(1rem, 2.2vw, 2rem) 0 clamp(2rem, 4vw, 4rem);
  color: var(--mb-ink);
}

.manager-borrows-page,
.manager-borrows-page * {
  box-sizing: border-box;
}

.vg-page {
  min-width: 0;
  width: 100%;
}

.vg-page-header {
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-title {
  font-family: var(--font-serif, Georgia, serif);
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.25;
  font-weight: 700;
  color: var(--ink-primary, var(--mb-ink));
  margin: .35rem 0 0;
  letter-spacing: -.025em;
  text-wrap: balance;
}

.vg-page-header>button {
  flex-shrink: 0;
}

/* Summary cards */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(.75rem, 1.3vw, 1.15rem);
  margin: 0 0 1.5rem;
}

.stats-row>* {
  min-width: 0;
}

.vg-stat-card {
  min-width: 0;
  padding: 3px !important;
  border-radius: 10px !important;
  box-shadow: 4px 4px 0 var(--neo-ink, #111) !important;
  cursor: pointer;
  transition: transform .28s cubic-bezier(.2, .75, .25, 1), box-shadow .28s cubic-bezier(.2, .75, .25, 1);
}

.vg-stat-card:hover {
  transform: translateY(-2px);
}

.vg-stat-card:focus-visible {
  outline: 3px solid rgba(48, 111, 224, .28);
  outline-offset: 3px;
}

.vg-stat-inner {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "label number" "sub number";
  align-items: center;
  column-gap: 12px;
  padding: 12px 14px;
  border-radius: 7px !important;
  background: var(--neo-paper, #fffdf2) !important;
  box-shadow: none !important;
}

.vg-stat-label {
  grid-area: label;
  margin: 0 0 3px !important;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.vg-stat-sub {
  grid-area: sub;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.vg-stat-number {
  grid-area: number;
  justify-self: end;
  margin: 0 !important;
  font-size: clamp(1.45rem, 2vw, 1.8rem);
  line-height: 1;
}

/* Main panel and toolbar */
.vg-shell {
  min-width: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 1.25rem;
  background: var(--mb-paper);
  box-shadow: 0 0 0 1px rgba(55, 65, 81, .07), 0 12px 34px rgba(40, 48, 60, .045);
}

.vg-section-body {
  min-width: 0;
  padding: clamp(.85rem, 1.7vw, 1.4rem);
}

.vg-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.vg-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  min-width: 0;
}

.vg-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  min-height: 40px;
  padding: .6rem .9rem;
  border-radius: .75rem;
  white-space: nowrap;
  transition: color .22s cubic-bezier(.2, .75, .25, 1), background .22s cubic-bezier(.2, .75, .25, 1), transform .22s cubic-bezier(.2, .75, .25, 1);
}

.vg-tab:focus-visible {
  outline: 3px solid rgba(48, 111, 224, .24);
  outline-offset: 2px;
}

.tc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.25rem;
  padding: 0 .35rem;
  border-radius: 999px;
  font-size: .7rem;
  font-variant-numeric: tabular-nums;
}

.vg-tab.is-active .tc {
  background: rgba(255, 255, 255, .22);
}

.vg-tab:not(.is-active) .tc {
  background: var(--paper-border, #e8e6df);
  color: var(--ink-muted, #737d8b);
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .75rem;
  flex-wrap: wrap;
  min-width: 0;
}

.overdue-check-label {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  font-size: .85rem;
  font-weight: 600;
  color: var(--status-out, #b54743);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.overdue-check-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.overdue-check-input:focus-visible+.overdue-dot {
  outline: 3px solid rgba(181, 71, 67, .22);
  outline-offset: 3px;
}

.overdue-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  transition: background .22s cubic-bezier(.2, .75, .25, 1);
  flex: 0 0 auto;
}

.overdue-check-input:checked+.overdue-dot {
  background: currentColor;
  box-shadow: 0 0 0 3px rgba(181, 71, 67, .12);
}

.table-search-wrap {
  display: flex;
  align-items: center;
  gap: .6rem;
  width: min(100%, 290px);
  min-width: 190px;
  padding: .65rem .9rem;
  border-radius: .8rem;
  border: 1px solid var(--paper-border, #e8e6df);
  background: var(--paper-subtle, #faf9f6);
  transition: border-color .22s cubic-bezier(.2, .75, .25, 1), box-shadow .22s cubic-bezier(.2, .75, .25, 1);
}

.table-search-wrap:focus-within {
  border-color: rgba(48, 111, 224, .5);
  box-shadow: 0 0 0 3px rgba(48, 111, 224, .09);
}

.table-search-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: .86rem;
  color: var(--ink-primary, var(--mb-ink));
}

.table-search-input::placeholder {
  color: var(--ink-muted, #8a929d);
}

/* Table: keep native table layout intact; scroll only inside this wrapper */
.table-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--mb-line);
  border-radius: 1rem;
  background: #fff;
  scrollbar-width: thin;
  scrollbar-color: #c9c9c2 transparent;
  -webkit-overflow-scrolling: touch;
}

.table-wrap .ath-table {
  width: 100%;
  min-width: 1080px;
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.table-wrap .ath-table th,
.table-wrap .ath-table td {
  padding: 1rem 1.05rem;
  vertical-align: middle;
  text-align: left;
  border-bottom: 1px solid var(--mb-line);
  overflow-wrap: anywhere;
  word-break: normal;
}

.table-wrap .ath-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f7f6f1;
  color: #77796f;
  font-size: .7rem;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: .075em;
  text-transform: uppercase;
  white-space: normal;
}

.table-wrap .ath-table tbody tr {
  transition: background .2s cubic-bezier(.2, .75, .25, 1);
}

.table-wrap .ath-table tbody tr:hover {
  background: #fbfaf7;
}

.table-wrap .ath-table tbody tr:last-child td {
  border-bottom: 0;
}

.table-wrap .ath-table th:nth-child(1) {
  width: 18%;
}

.table-wrap .ath-table th:nth-child(2) {
  width: 21%;
}

.table-wrap .ath-table th:nth-child(3) {
  width: 10%;
}

.table-wrap .ath-table th:nth-child(4) {
  width: 10%;
}

.table-wrap .ath-table th:nth-child(5) {
  width: 11%;
}

.table-wrap .ath-table th:nth-child(6) {
  width: 17%;
}

.table-wrap .ath-table th:nth-child(7) {
  width: 13%;
  text-align: right;
}

.table-wrap .ath-table td:last-child {
  text-align: right;
}

.table-wrap .ath-table td.row-sub {
  display: table-cell;
  font-size: .8rem;
  line-height: 1.5;
  color: var(--ink-muted, #737d8b);
}

.row-name {
  display: block;
  font-size: .9rem;
  line-height: 1.4;
  font-weight: 700;
  color: var(--ink-primary, var(--mb-ink));
}

.row-book {
  display: block;
  font-size: .95rem;
  line-height: 1.45;
  font-weight: 700;
  color: var(--ink-primary, var(--mb-ink));
}

.row-sub {
  display: block;
  margin-top: .35rem;
  font-size: .76rem;
  line-height: 1.55;
  color: var(--ink-muted, #737d8b);
}

.row-date {
  font-size: .8rem;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  white-space: normal;
}

.font-mono-code {
  overflow-wrap: anywhere;
}

.overdue-text {
  color: var(--status-out, #b54743);
  font-weight: 700;
}

.boi-thuong {
  margin-top: .35rem;
  font-size: .84rem;
  font-weight: 700;
  color: var(--status-out, #b54743);
}

.ath-table .ath-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  white-space: normal;
  text-align: center;
  line-height: 1.35;
}

.ath-table td:last-child .ath-action-btn {
  margin: .2rem 0 .2rem .25rem;
  white-space: nowrap;
}

.borrows-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(2.5rem, 6vw, 4rem) 1.5rem;
  gap: .75rem;
  text-align: center;
}

.state-text {
  margin: 0;
  font-size: .88rem;
  line-height: 1.6;
  color: var(--ink-muted, #737d8b);
}

/* Dialog */
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--paper-border, #e8e6df);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: .55rem;
  font-family: var(--font-serif, Georgia, serif);
  font-size: 1.05rem;
  line-height: 1.4;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--paper-border, #e8e6df);
  background: #fff;
  cursor: pointer;
  color: var(--ink-secondary, #596273);
  transition: background .22s cubic-bezier(.2, .75, .25, 1), transform .22s cubic-bezier(.2, .75, .25, 1);
}

.modal-close:hover {
  background: var(--paper-subtle, #f8f7f3);
  transform: rotate(4deg);
}

.modal-body {
  padding: 1.35rem 1.5rem;
}

.modal-sub {
  margin-bottom: 1rem;
  font-size: .88rem;
  line-height: 1.65;
  color: var(--ink-muted, #737d8b);
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 1.25rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--paper-border, #e8e6df);
}

.form-label-sm {
  display: block;
  margin-bottom: .45rem;
  font-size: .82rem;
  font-weight: 650;
  color: var(--ink-secondary, #596273);
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  padding: 1rem;
  margin-bottom: 1.1rem;
  border-radius: .9rem;
  background: #fff8ed;
  color: var(--status-scarce, #925b18);
  font-size: .84rem;
  line-height: 1.65;
  box-shadow: inset 0 0 0 1px rgba(154, 91, 24, .16);
}

.warning-box svg {
  flex: 0 0 auto;
  margin-top: .15rem;
}

@media (max-width: 1100px) {
  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vg-section-header {
    align-items: stretch;
  }

  .filter-row {
    justify-content: flex-start;
  }
}

@media (max-width: 700px) {
  .manager-borrows-page {
    padding-top: 1rem;
  }

  .vg-page-header {
    align-items: flex-start !important;
  }

  .page-title {
    font-size: 1.45rem;
  }

  .vg-section-body {
    padding: .75rem;
  }

  .vg-tabs {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .vg-tab {
    padding: .6rem .35rem;
    gap: .3rem;
    font-size: .78rem;
    white-space: normal;
  }

  .filter-row,
  .table-search-wrap {
    width: 100%;
  }

  .table-search-wrap {
    min-width: 0;
  }

  .modal-head,
  .modal-body {
    padding-inline: 1rem;
  }

  .modal-footer-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .modal-footer-actions button {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .stats-row {
    gap: .6rem;
  }

  .vg-stat-inner {
    column-gap: 8px;
    padding: .65rem .7rem;
  }

  .vg-stat-label {
    font-size: .7rem;
    letter-spacing: .08em;
  }

  .vg-stat-sub {
    font-size: .68rem;
  }

  .vg-stat-number {
    font-size: clamp(1.2rem, 5.5vw, 1.5rem);
  }

  .vg-tabs {
    grid-template-columns: 1fr;
  }

  .vg-tab {
    justify-content: flex-start;
    padding-inline: .8rem;
  }

  .modal-title {
    font-size: .95rem;
  }
}

@media (prefers-reduced-motion: reduce) {

  .manager-borrows-page *,
  .manager-borrows-page *::before,
  .manager-borrows-page *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
