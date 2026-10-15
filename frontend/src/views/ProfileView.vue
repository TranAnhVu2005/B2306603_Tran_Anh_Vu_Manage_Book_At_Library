<template>
  <div class="vg-page">
    <div class="container">
      <!-- ===== PAGE HEADER ===== -->
      <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 reveal" data-reveal>
        <div>
          <span class="vg-section-label">Hồ Sơ Độc Giả</span>
          <h1 class="page-title">Thẻ Thư Viện &amp; Sách Đang Mượn</h1>
        </div>
        <router-link to="/" class="ath-btn-outline text-decoration-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Tìm thêm sách
        </router-link>
      </div>

      <!-- Not logged in -->
      <div v-if="!currentUser" class="vg-shell reveal" data-reveal style="max-width: 480px; margin: 4rem auto; text-align: center;">
        <div class="vg-core empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-muted);" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <h2 class="empty-title">Vui lòng đăng nhập</h2>
          <p class="empty-sub">Bạn cần đăng nhập để xem thông tin thẻ độc giả và lịch sử mượn sách.</p>
          <router-link to="/login" class="ath-btn-primary text-decoration-none">
            Đăng nhập ngay
            <span class="btn-island" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </router-link>
        </div>
      </div>

      <!-- Main content -->
      <div v-else class="profile-layout">
        <!-- ===== LEFT: Reader Card ===== -->
        <aside class="reveal" data-reveal>
          <div class="vg-shell reader-card-shell">
            <div class="vg-core reader-card">
              <!-- Avatar & name -->
              <div class="reader-card-top">
                <div class="vg-avatar" style="width: 72px; height: 72px; font-size: 1.7rem;">
                  {{ userInitials }}
                </div>
                <h2 class="reader-name">{{ currentUser.fullName }}</h2>
                <span class="reader-code">Mã thẻ: {{ currentUser.username }}</span>

                <!-- Status badge -->
                <span v-if="readerInfo?.TrangThaiThe === 'Blacklist'" class="ath-badge ath-badge-blacklist" style="margin-top: 0.75rem;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                  Bị Khóa (Blacklist)
                </span>
                <span v-else-if="readerInfo?.TrangThaiThe === 'Khoa'" class="ath-badge ath-badge-out" style="margin-top: 0.75rem;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Tạm Khóa
                </span>
                <span v-else class="ath-badge ath-badge-available" style="margin-top: 0.75rem;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  Đang Hoạt Động
                </span>
              </div>

              <!-- Info rows -->
              <div class="reader-info-list">
                <!-- Vi phạm progress -->
                <div class="reader-info-row">
                  <span class="reader-info-label">Số lần vi phạm</span>
                  <span class="reader-info-val" :class="viPhamCount >= 3 ? 'text-danger' : viPhamCount > 0 ? 'text-warning' : 'text-success'">
                    {{ viPhamCount }} / 3
                  </span>
                </div>
                <div class="vg-progress-track" style="margin-bottom: 0.75rem;">
                  <div
                    class="vg-progress-bar"
                    :class="viPhamCount >= 3 ? 'danger' : viPhamCount > 0 ? 'warning' : 'safe'"
                    :style="{ width: `${Math.min((viPhamCount / 3) * 100, 100)}%` }"
                  ></div>
                </div>

                <div class="reader-info-row">
                  <span class="reader-info-label">Số điện thoại</span>
                  <span class="reader-info-val font-mono-code">{{ readerInfo?.DienThoai || currentUser.phone || '—' }}</span>
                </div>
                <div class="reader-info-row">
                  <span class="reader-info-label">Giới tính</span>
                  <span class="reader-info-val">{{ genderText }}</span>
                </div>
                <div class="reader-info-row">
                  <span class="reader-info-label">Địa chỉ</span>
                  <span class="reader-info-val" style="text-align: right; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ readerInfo?.DiaChi || '—' }}</span>
                </div>
                <div class="reader-info-row" style="border: none;">
                  <span class="reader-info-label">Vai trò</span>
                  <span v-if="currentUser.role === 'ADMIN'" class="ath-badge ath-badge-out">SUPER ADMIN</span>
                  <span v-else-if="currentUser.role === 'MANAGER'" class="ath-badge ath-badge-available">THỦ THƯ</span>
                  <span v-else class="ath-badge ath-badge-neutral">ĐỘC GIẢ</span>
                </div>
              </div>

              <!-- Blacklist warning -->
              <div v-if="readerInfo?.TrangThaiThe === 'Blacklist'" class="blacklist-warning">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                Thẻ bị khóa do đạt 3 lần vi phạm. Vui lòng liên hệ quầy thủ thư để mở khóa.
              </div>
            </div>
          </div>
        </aside>

        <!-- ===== RIGHT: Borrow History ===== -->
        <div class="borrows-panel reveal reveal-d1" data-reveal>
          <div class="vg-shell">
            <div class="vg-core">
              <!-- Tab bar -->
              <div class="borrows-tabs">
                <div class="vg-tabs">
                  <button class="vg-tab" :class="{ 'is-active': activeTab === 'active' }" @click="activeTab = 'active'" type="button">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    Đang mượn <span class="tab-count">{{ activeBorrows.length }}</span>
                  </button>
                  <button class="vg-tab" :class="{ 'is-active': activeTab === 'pending' }" @click="activeTab = 'pending'" type="button">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    Chờ duyệt <span class="tab-count">{{ pendingBorrows.length }}</span>
                  </button>
                  <button class="vg-tab" :class="{ 'is-active': activeTab === 'history' }" @click="activeTab = 'history'" type="button">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>
                    Lịch sử <span class="tab-count">{{ historyBorrows.length }}</span>
                  </button>
                </div>
              </div>

              <!-- Loading -->
              <div v-if="loading" class="borrows-state">
                <div class="vg-spinner"></div>
                <p class="state-text">Đang tải lịch sử mượn sách...</p>
              </div>

              <!-- Empty tab -->
              <div v-else-if="currentTabList.length === 0" class="borrows-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-muted);" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 10h8M8 14h4"/></svg>
                <p class="state-text">Chưa có bản ghi nào trong mục này.</p>
              </div>

              <!-- Table -->
              <div v-else class="borrows-table-wrap">
                <table class="ath-table">
                  <thead>
                    <tr>
                      <th>Sách</th>
                      <th>Ngày mượn</th>
                      <th>Hạn trả</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú / Bồi thường</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in currentTabList" :key="item._id">
                      <td>
                        <router-link :to="`/books/${item.MaSach}`" class="book-link">
                          <strong>{{ item.sachInfo?.TenSach || item.MaSach }}</strong>
                        </router-link>
                        <span class="font-mono-code" style="display: block; font-size: 0.7rem; color: var(--ink-muted);">{{ item.MaSach }}</span>
                      </td>
                      <td class="font-mono-code" style="font-size: 0.82rem; white-space: nowrap;">{{ item.NgayMuon || '—' }}</td>
                      <td style="white-space: nowrap;">
                        <span class="font-mono-code" style="font-size: 0.82rem;" :class="isOverdue(item) ? 'overdue-text' : ''">
                          {{ item.NgayHenTra || '—' }}
                        </span>
                        <span v-if="isOverdue(item)" class="ath-badge ath-badge-out" style="display: inline-flex; font-size: 0.6rem; margin-left: 0.3rem;">Quá hạn</span>
                      </td>
                      <td>
                        <span v-if="item.TrangThai === 'DangMuon'" class="ath-badge ath-badge-available">Đang mượn</span>
                        <span v-else-if="item.TrangThai === 'ChoDuyet'" class="ath-badge ath-badge-pending">Chờ duyệt</span>
                        <span v-else-if="item.TrangThai === 'DaTra'" class="ath-badge ath-badge-neutral">Đã trả</span>
                        <span v-else-if="item.TrangThai === 'MatSach'" class="ath-badge ath-badge-out">Mất sách</span>
                        <span v-else-if="item.TrangThai === 'TuChoi'" class="ath-badge ath-badge-rejected">Từ chối</span>
                      </td>
                      <td style="font-size: 0.82rem; color: var(--ink-muted);">
                        {{ item.GhiChu || '—' }}
                        <template v-if="item.GiaTriBoiThuong > 0 || item.TienPhat > 0">
                          <div class="boi-thuong">
                            <strong>{{ (item.GiaTriBoiThuong || item.TienPhat).toLocaleString('vi-VN') }} ₫</strong>
                          </div>
                          <button class="ath-action-btn ath-action-btn-danger" @click="openMoMoPayment(item)" type="button" style="margin-top: 0.35rem;">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
                            Thanh toán MoMo
                          </button>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MoMo Payment Modal -->
    <div v-if="showPaymentModal" class="ath-modal-overlay" @click.self="showPaymentModal = false">
      <div class="ath-modal-content" style="max-width: 420px;">
        <div class="ath-modal-inner">
          <div class="modal-head">
            <h3 class="modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
              Thanh Toán Bồi Thường MoMo
            </h3>
            <button type="button" class="modal-close" @click="showPaymentModal = false" aria-label="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div v-if="paymentInfo" class="modal-body text-center">
            <p class="modal-sub">Quét mã QR bằng ứng dụng MoMo để thanh toán khoản tiền bồi thường sách:</p>
            <div class="qr-wrap">
              <img :src="paymentInfo.qrCodeUrl" alt="MoMo QR Code" style="width: 160px; height: 160px;" />
            </div>
            <div class="font-mono-code" style="font-size: 1.8rem; font-weight: 700; color: var(--status-out);">
              {{ (paymentInfo.amount || 0).toLocaleString('vi-VN') }} ₫
            </div>
            <small style="color: var(--ink-muted); display: block; margin-bottom: 1.5rem;">Mã GD: {{ paymentInfo.orderId }}</small>
            <a :href="paymentInfo.payUrl" target="_blank" rel="noopener" class="ath-btn-primary w-100 text-center text-decoration-none" style="margin-bottom: 0.75rem;">
              Chuyển tới cổng thanh toán MoMo
              <span class="btn-island" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="m10 14 11-11"/></svg>
              </span>
            </a>
            <button class="ath-btn-outline w-100" @click="showPaymentModal = false" type="button">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import authService from "../services/auth.service";
import theoDoiService from "../services/theodoimuon.service";
import docGiaService from "../services/docgia.service";
import paymentService from "../services/payment.service";

export default {
  name: "ProfileView",
  components: { ToastNotification },
  data() {
    return {
      currentUser: null,
      readerInfo: null,
      borrows: [],
      loading: false,
      activeTab: "active",
      showPaymentModal: false,
      paymentInfo: null,
      revealObserver: null,
    };
  },
  computed: {
    userInitials() {
      if (!this.currentUser) return "DG";
      const name = this.currentUser.fullName || this.currentUser.username || "";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    },
    genderText() {
      const phai = this.readerInfo?.Phai ?? this.currentUser?.phai;
      if (phai === 1 || phai === "Nam") return "Nam";
      if (phai === 0 || phai === "Nữ") return "Nữ";
      return "Khác";
    },
    viPhamCount() {
      return this.readerInfo?.SoLanViPham || this.currentUser?.soLanViPham || 0;
    },
    activeBorrows() { return this.borrows.filter(b => b.TrangThai === "DangMuon"); },
    pendingBorrows() { return this.borrows.filter(b => b.TrangThai === "ChoDuyet"); },
    historyBorrows() { return this.borrows.filter(b => ["DaTra","MatSach","TuChoi"].includes(b.TrangThai)); },
    currentTabList() {
      if (this.activeTab === "active") return this.activeBorrows;
      if (this.activeTab === "pending") return this.pendingBorrows;
      return this.historyBorrows;
    }
  },
  created() {
    this.currentUser = authService.getUser();
    if (this.currentUser) this.fetchData();
  },
  mounted() { this.initReveal(); },
  beforeUnmount() { if (this.revealObserver) this.revealObserver.disconnect(); },
  methods: {
    initReveal() {
      this.revealObserver = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); this.revealObserver.unobserve(e.target); } }),
        { threshold: 0.08 }
      );
      this.$el.querySelectorAll("[data-reveal]").forEach(el => this.revealObserver.observe(el));
    },
    async fetchData() {
      this.loading = true;
      try {
        const [readerRes, borrowsRes] = await Promise.all([
          docGiaService.get(this.currentUser.username).catch(() => null),
          theoDoiService.getAll({ maDocGia: this.currentUser.username }),
        ]);
        if (readerRes) this.readerInfo = readerRes;
        this.borrows = borrowsRes;
      } catch {
        this.$refs.toast?.show("Lỗi khi tải thông tin độc giả.", "error");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initReveal());
      }
    },
    isOverdue(item) {
      if (item.TrangThai !== "DangMuon" || !item.NgayHenTra) return false;
      return new Date().toISOString().split("T")[0] > item.NgayHenTra;
    },
    async openMoMoPayment(item) {
      try {
        const amount = item.GiaTriBoiThuong || item.TienPhat || 0;
        const res = await paymentService.createMoMoPayment({
          borrowId: item._id,
          amount,
          orderInfo: `Bồi thường mất sách ${item.MaSach} cho độc giả ${item.MaDocGia}`
        });
        this.paymentInfo = res.data;
        this.showPaymentModal = true;
      } catch {
        this.$refs.toast?.show("Không thể khởi tạo cổng thanh toán MoMo.", "error");
      }
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

/* Layout */
.profile-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}
@media (max-width: 991px) {
  .profile-layout { grid-template-columns: 1fr; }
}

/* Reader card */
.reader-card-shell { height: 100%; }
.reader-card {
  padding: 1.75rem 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
}
.reader-card-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--paper-border);
  margin-bottom: 1rem;
}
.reader-name {
  font-family: var(--font-serif);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0.85rem 0 0.2rem;
}
.reader-code {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-muted);
}
.reader-info-list { display: flex; flex-direction: column; gap: 0; }
.reader-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--paper-border);
  font-size: 0.84rem;
  gap: 0.5rem;
}
.reader-info-label { color: var(--ink-muted); flex-shrink: 0; }
.reader-info-val { color: var(--ink-primary); font-weight: 500; }
.text-danger { color: var(--status-out) !important; }
.text-warning { color: var(--status-scarce) !important; }
.text-success { color: var(--status-available) !important; }

.blacklist-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #FDF2F1;
  color: var(--status-out);
  font-size: 0.78rem;
  line-height: 1.5;
  box-shadow: inset 0 0 0 1px rgba(143, 40, 34, 0.18);
}

/* Borrows panel */
.borrows-tabs {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--paper-border);
}
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 0.65rem;
  background: rgba(255,255,255,0.25);
  font-variant-numeric: tabular-nums;
}
.vg-tab.is-active .tab-count {
  background: rgba(255,255,255,0.2);
}
.vg-tab:not(.is-active) .tab-count {
  background: var(--paper-border);
  color: var(--ink-muted);
}

.borrows-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.5rem 1.5rem;
  gap: 0.75rem;
  text-align: center;
}
.state-text { font-size: 0.9rem; color: var(--ink-muted); margin: 0; }

.borrows-table-wrap { overflow-x: auto; }

.book-link {
  text-decoration: none;
  color: var(--ink-primary);
  font-size: 0.88rem;
  font-family: var(--font-serif);
  font-weight: 600;
  transition: color 0.3s;
  display: block;
}
.book-link:hover { color: var(--primary); }

.overdue-text { color: var(--status-out); font-weight: 700; }

.boi-thuong {
  font-size: 0.82rem;
  color: var(--status-out);
  margin-top: 0.2rem;
}

/* Empty state */
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
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0;
}
.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid var(--paper-border);
  background: #fff;
  cursor: pointer;
  color: var(--ink-secondary);
  transition: all 0.25s;
}
.modal-close:hover { background: var(--paper-subtle); color: var(--ink-primary); }
.modal-body { padding: 1.5rem; }
.modal-sub { font-size: 0.84rem; color: var(--ink-muted); margin-bottom: 1rem; }
.qr-wrap {
  display: inline-block;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--paper-subtle);
  box-shadow: inset 0 0 0 1px var(--paper-border);
  margin-bottom: 1rem;
}

.btn-island {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
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
