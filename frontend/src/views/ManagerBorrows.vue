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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Làm mới
        </button>
      </div>

      <!-- ===== STAT CARDS ===== -->
      <div class="stats-row reveal reveal-d1" data-reveal>
        <div class="vg-stat-card accent-yellow" @click="activeTab = 'pending'; onlyOverdue = false" role="button" tabindex="0">
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
        <div class="vg-stat-card accent-red" @click="activeTab = 'borrowing'; onlyOverdue = true" role="button" tabindex="0">
          <div class="vg-stat-inner">
            <span class="vg-stat-label">Quá hạn trả</span>
            <span class="vg-stat-number" style="color: var(--status-out);">{{ overdueList.length }}</span>
            <span class="vg-stat-sub">cuốn quá hạn</span>
          </div>
        </div>
        <div class="vg-stat-card accent-dark" @click="activeTab = 'completed'; onlyOverdue = false" role="button" tabindex="0">
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
              <button class="vg-tab" :class="{ 'is-active': activeTab === 'pending' }" @click="activeTab = 'pending'; onlyOverdue = false" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Chờ duyệt <span class="tc">{{ pendingList.length }}</span>
              </button>
              <button class="vg-tab" :class="{ 'is-active': activeTab === 'borrowing' }" @click="activeTab = 'borrowing'" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                Đang mượn <span class="tc">{{ borrowingList.length }}</span>
              </button>
              <button class="vg-tab" :class="{ 'is-active': activeTab === 'completed' }" @click="activeTab = 'completed'; onlyOverdue = false" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--ink-muted); flex-shrink: 0;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  class="table-search-input"
                  v-model="search"
                  placeholder="Lọc độc giả, mã sách..."
                />
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-muted);" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 10h8M8 14h4"/></svg>
            <h2 style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--ink-primary); margin: 0;">Không có bản ghi nào phù hợp</h2>
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
                    <span class="row-sub font-mono-code">{{ item.MaDocGia }} · {{ readerPhone(item.MaDocGia) || '—' }}</span>
                    <span v-if="readerFor(item.MaDocGia)?.TrangThaiThe === 'DanhSachDen'" class="ath-badge ath-badge-danh-sach-den" style="margin-top: 4px; font-size: 0.6rem;">
                      Danh sách đen ({{ readerFor(item.MaDocGia).SoLanViPham }} lỗi)
                    </span>
                  </td>
                  <td>
                    <strong class="row-book font-serif-headline">{{ bookName(item.MaSach) }}</strong>
                    <span class="row-sub font-mono-code">{{ item.MaSach }} · {{ bookPrice(item.MaSach).toLocaleString('vi-VN') }} ₫</span>
                  </td>
                  <td class="font-mono-code row-date">{{ item.NgayMuon || '—' }}</td>
                  <td>
                    <span class="font-mono-code row-date" :class="isLate(item) ? 'overdue-text' : ''">{{ item.NgayHenTra || '—' }}</span>
                    <span v-if="isLate(item)" class="ath-badge ath-badge-out" style="display: block; margin-top: 3px; font-size: 0.6rem;">Quá hạn!</span>
                  </td>
                  <td>
                    <span v-if="item.TrangThai === 'ChoDuyet'" class="ath-badge ath-badge-pending">Chờ duyệt</span>
                    <span v-else-if="item.TrangThai === 'DangMuon'" class="ath-badge ath-badge-available">Đang mượn</span>
                    <span v-else-if="item.TrangThai === 'DaTra'" class="ath-badge ath-badge-neutral">Đã trả</span>
                    <span v-else-if="item.TrangThai === 'MatSach'" class="ath-badge ath-badge-out">Mất sách</span>
                    <span v-else-if="item.TrangThai === 'TuChoi'" class="ath-badge ath-badge-rejected">Từ chối</span>
                  </td>
                  <td class="row-sub">
                    {{ item.GhiChu || '—' }}
                    <div v-if="item.GiaTriBoiThuong > 0" class="boi-thuong">{{ item.GiaTriBoiThuong.toLocaleString('vi-VN') }} ₫</div>
                    <div v-if="item.MSNV" class="font-mono-code" style="font-size: 0.7rem; color: var(--ink-muted); margin-top: 2px;">Duyệt bởi: {{ item.MSNV }}</div>
                  </td>
                  <td style="text-align: right;">
                    <template v-if="item.TrangThai === 'ChoDuyet'">
                      <button class="ath-action-btn ath-action-btn-success" style="margin-right: 4px;" @click="handleApprove(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                        Duyệt
                      </button>
                      <button class="ath-action-btn ath-action-btn-danger" @click="openRejectModal(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        Từ chối
                      </button>
                    </template>
                    <template v-else-if="item.TrangThai === 'DangMuon'">
                      <button class="ath-action-btn ath-action-btn-success" style="margin-right: 4px;" @click="handleReturn(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                        Đã trả
                      </button>
                      <button class="ath-action-btn ath-action-btn-danger" @click="openLossModal(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                        Báo mất
                      </button>
                    </template>
                    <template v-else>
                      <button class="ath-action-btn ath-action-btn-danger" @click="handleDelete(item)" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Từ Chối Yêu Cầu Mượn Sách
              </h3>
              <button type="button" class="modal-close" @click="showRejectModal = false" aria-label="Đóng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="modal-sub" v-if="selectedRejectItem">
                Từ chối yêu cầu mượn <strong>{{ bookName(selectedRejectItem.MaSach) }}</strong> của độc giả <strong>{{ readerName(selectedRejectItem.MaDocGia) }}</strong>.
              </p>
              <div class="mb-3">
                <label class="form-label-sm">Lý do từ chối:</label>
                <select class="ath-input mb-2" v-model="rejectReason">
                  <option value="Độc giả đã đạt định mức tối đa 3 cuốn đang mượn">Độc giả đã đạt định mức tối đa 3 cuốn đang mượn</option>
                  <option value="Sách đang được thu hồi để kiểm kê / phục chế">Sách đang được thu hồi để kiểm kê / phục chế</option>
                  <option value="Thông tin thẻ độc giả chưa hoàn tất xác thực">Thông tin thẻ độc giả chưa hoàn tất xác thực</option>
                  <option value="Khác">Lý do khác (tự nhập)...</option>
                </select>
                <input v-if="rejectReason === 'Khác'" type="text" class="ath-input" v-model="customRejectReason" placeholder="Nhập lý do cụ thể..." />
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                Xác Nhận Báo Mất Sách
              </h3>
              <button type="button" class="modal-close" @click="showLossModal = false" aria-label="Đóng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="warning-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                Khi báo mất, tồn kho sẽ <strong>không được cộng lại</strong>. Hệ thống sẽ tự động phạt độc giả số tiền bằng đúng đơn giá cuốn sách và tăng số lần vi phạm lên 1 (đạt 3 lần → tự động đưa vào Danh sách đen).
              </div>
              <div class="mb-3">
                <label class="form-label-sm">Lý do / Tình trạng ghi nhận:</label>
                <input type="text" class="ath-input" v-model="lossReason" placeholder="VD: Độc giả làm rơi mất sách trong quá trình di chuyển..." />
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
    completedList() { return this.borrows.filter(b => ["DaTra","MatSach","TuChoi"].includes(b.TrangThai)); },
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
.page-title {
  font-family: var(--font-serif);
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 767px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .stats-row { grid-template-columns: 1fr; } }

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.overdue-check-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--status-out);
  cursor: pointer;
  user-select: none;
}
.overdue-check-input { display: none; }
.overdue-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--status-out);
  transition: background 0.25s;
  flex-shrink: 0;
}
.overdue-check-input:checked + .overdue-dot {
  background: var(--status-out);
  box-shadow: 0 0 0 3px rgba(143,40,34,0.15);
}

.table-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--paper-border);
  background: var(--paper-subtle);
}
.table-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--ink-primary);
  width: min(180px, 40vw);
  min-width: 0;
}
.table-search-input::placeholder { color: var(--ink-muted); }

.borrows-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1.5rem;
  gap: 0.75rem;
  text-align: center;
}
.state-text { font-size: 0.88rem; color: var(--ink-muted); margin: 0; }
.table-wrap {
  max-width: 100%;
  overflow-x: auto;
}
.table-wrap .ath-table { min-width: 900px; }
.manager-borrows-page { min-width: 0; }

.row-name { font-size: 0.88rem; color: var(--ink-primary); display: block; }
.row-book { font-size: 0.9rem; color: var(--ink-primary); display: block; }
.row-sub { font-size: 0.76rem; color: var(--ink-muted); display: block; }
.row-date { font-size: 0.8rem; }
.overdue-text { color: var(--status-out); font-weight: 700; }
.boi-thuong { font-size: 0.82rem; font-weight: 700; color: var(--status-out); margin-top: 2px; }

/* Tab count pill */
.tc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  font-size: 0.64rem;
}
.vg-tab.is-active .tc { background: rgba(255,255,255,0.2); }
.vg-tab:not(.is-active) .tc { background: var(--paper-border); color: var(--ink-muted); }

/* Modal */
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--paper-border);
}
.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}
.modal-close {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 1px solid var(--paper-border);
  background: #fff;
  cursor: pointer;
  color: var(--ink-secondary);
  transition: all 0.25s;
}
.modal-close:hover { background: var(--paper-subtle); }
.modal-body { padding: 1.25rem 1.5rem; }
.modal-sub { font-size: 0.84rem; color: var(--ink-muted); margin-bottom: 1rem; }
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--paper-border);
}
.form-label-sm { display: block; font-size: 0.8rem; font-weight: 600; color: var(--ink-secondary); margin-bottom: 0.4rem; }
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  background: #FEF6EB;
  color: var(--status-scarce);
  font-size: 0.82rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  box-shadow: inset 0 0 0 1px rgba(154, 91, 24, 0.2);
}

@media (max-width: 575.98px) {
  .filter-row,
  .table-search-wrap {
    width: 100%;
  }

  .table-search-input { width: 100%; }

  .modal-head,
  .modal-body {
    padding-inline: 1rem;
  }

  .modal-footer-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .modal-footer-actions button { width: 100%; }
}

@media (max-width: 359.98px) {
  .stats-row { grid-template-columns: 1fr; }
}
</style>
