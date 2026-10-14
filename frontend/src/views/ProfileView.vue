<template>
  <div class="py-4">
    <!-- Header Page -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small fw-bold" style="color: var(--primary); letter-spacing: 0.05em;">
          Hồ Sơ Độc Giả
        </span>
        <h2 class="font-serif-headline fw-bold text-dark mb-0">
          Thẻ Thư Viện & Sách Đang Mượn
        </h2>
      </div>
      <router-link to="/" class="ath-btn-outline text-decoration-none">
        <i class="fas fa-search me-1"></i> Tìm thêm sách
      </router-link>
    </div>

    <div v-if="!currentUser" class="ath-card text-center py-5">
      <i class="fas fa-lock text-muted mb-3" style="font-size: 2.5rem;"></i>
      <h5>Vui lòng đăng nhập để xem thông tin thẻ độc giả</h5>
      <router-link to="/login" class="ath-btn-primary mt-2">
        Đăng nhập ngay
      </router-link>
    </div>

    <div v-else class="row">
      <!-- Card Thông Tin Thẻ Độc Giả -->
      <div class="col-lg-4 mb-4">
        <div class="ath-card p-4">
          <div class="text-center pb-3 border-bottom mb-3" style="border-color: var(--paper-border) !important;">
            <!-- Monogram Avatar -->
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-2 shadow-sm" 
                 style="width: 72px; height: 72px; background: linear-gradient(135deg, #143529 0%, #23694C 100%); color: #FAF9F5; font-family: var(--font-serif); font-size: 1.8rem; font-weight: bold; border: 2px solid var(--paper-border);">
              {{ userInitials }}
            </div>
            <h5 class="font-serif-headline fw-bold text-dark mb-0">
              {{ currentUser.fullName }}
            </h5>
            <small class="font-mono-code text-muted">MÃ THẺ: {{ currentUser.username }}</small>
          </div>

          <div class="small mb-3">
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom" style="border-color: var(--paper-border) !important;">
              <span class="text-muted">Trạng thái thẻ:</span>
              <span v-if="readerInfo?.TrangThaiThe === 'Blacklist'" class="ath-badge ath-badge-blacklist">
                <i class="fas fa-ban"></i> Bị Khóa (Blacklist)
              </span>
              <span v-else-if="readerInfo?.TrangThaiThe === 'Khoa'" class="ath-badge ath-badge-out">
                <i class="fas fa-lock"></i> Tạm Khóa
              </span>
              <span v-else class="ath-badge ath-badge-available">
                <i class="fas fa-check-circle"></i> Đang Hoạt Động
              </span>
            </div>

            <!-- Vi phạm & Warning Progress -->
            <div class="py-2 border-bottom" style="border-color: var(--paper-border) !important;">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-muted">Số lần vi phạm:</span>
                <strong :class="viPhamCount >= 3 ? 'text-danger' : (viPhamCount > 0 ? 'text-warning' : 'text-success')">
                  {{ viPhamCount }} / 3 lỗi tối đa
                </strong>
              </div>
              <div class="progress" style="height: 6px; background-color: var(--paper-subtle);">
                <div class="progress-bar" 
                     :class="viPhamCount >= 3 ? 'bg-danger' : (viPhamCount > 0 ? 'bg-warning' : 'bg-success')" 
                     :style="{ width: `${Math.min((viPhamCount / 3) * 100, 100)}%` }"></div>
              </div>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--paper-border) !important;">
              <span class="text-muted">Số điện thoại:</span>
              <span class="font-mono-code">{{ readerInfo?.DienThoai || currentUser.phone || '—' }}</span>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--paper-border) !important;">
              <span class="text-muted">Giới tính:</span>
              <span>{{ genderText }}</span>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--paper-border) !important;">
              <span class="text-muted">Địa chỉ:</span>
              <span class="text-truncate ms-2" style="max-width: 170px;">{{ readerInfo?.DiaChi || '—' }}</span>
            </div>

            <div class="d-flex justify-content-between align-items-center py-2">
              <span class="text-muted">Vai trò hệ thống:</span>
              <span v-if="currentUser.role === 'ADMIN'" class="badge bg-danger">SUPER ADMIN</span>
              <span v-else-if="currentUser.role === 'MANAGER'" class="badge bg-success">THỦ THƯ</span>
              <span v-else class="badge bg-light text-dark border">ĐỘC GIẢ TIÊU CHUẨN</span>
            </div>
          </div>

          <div v-if="readerInfo?.TrangThaiThe === 'Blacklist'" class="alert alert-danger py-2 px-3 small mb-0 border-0" style="font-size: 0.775rem;">
            <i class="fas fa-exclamation-triangle me-1"></i>
            Thẻ của bạn đã bị khóa do đạt 3 lần vi phạm (trả trễ hạn hoặc làm mất sách). Vui lòng liên hệ quầy thủ thư để mở khóa.
          </div>
        </div>
      </div>

      <!-- Danh Sách Phiếu Mượn -->
      <div class="col-lg-8">
        <div class="ath-card p-4">
          <!-- Navigation Tabs -->
          <ul class="nav nav-pills mb-3 border-bottom pb-3" style="border-color: var(--paper-border) !important;">
            <li class="nav-item">
              <button class="btn btn-sm me-2 mb-1" 
                      :class="activeTab === 'active' ? 'ath-btn-primary' : 'ath-btn-outline'"
                      @click="activeTab = 'active'">
                <i class="fas fa-book-reader me-1"></i> Đang mượn ({{ activeBorrows.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="btn btn-sm me-2 mb-1" 
                      :class="activeTab === 'pending' ? 'ath-btn-primary' : 'ath-btn-outline'"
                      @click="activeTab = 'pending'">
                <i class="fas fa-clock me-1"></i> Chờ duyệt ({{ pendingBorrows.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="btn btn-sm mb-1" 
                      :class="activeTab === 'history' ? 'ath-btn-primary' : 'ath-btn-outline'"
                      @click="activeTab = 'history'">
                <i class="fas fa-history me-1"></i> Lịch sử ({{ historyBorrows.length }})
              </button>
            </li>
          </ul>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-success spinner-border-sm" role="status"></div>
            <span class="ms-2 small text-muted">Đang tải lịch sử mượn sách...</span>
          </div>

          <!-- Empty Tab -->
          <div v-else-if="currentTabList.length === 0" class="text-center py-5">
            <i class="fas fa-inbox text-muted mb-2" style="font-size: 2.2rem;"></i>
            <p class="text-muted small mb-0">Chưa có bản ghi nào trong mục này.</p>
          </div>

          <!-- Table of Borrows -->
          <div v-else class="table-responsive">
            <table class="ath-table">
              <thead>
                <tr>
                  <th>Sách</th>
                  <th>Ngày mượn</th>
                  <th>Hạn trả (14 ngày)</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú / Bồi thường</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in currentTabList" :key="item._id">
                  <td>
                    <router-link :to="`/books/${item.MaSach}`" class="text-decoration-none text-dark">
                      <strong class="font-serif-headline d-block" style="font-size: 0.95rem;">
                        {{ item.sachInfo?.TenSach || item.MaSach }}
                      </strong>
                    </router-link>
                    <small class="text-muted font-mono-code">Mã sách: {{ item.MaSach }}</small>
                  </td>
                  <td class="font-mono-code small">{{ item.NgayMuon || '—' }}</td>
                  <td class="font-mono-code small">
                    <span :class="isOverdue(item) ? 'text-danger fw-bold' : ''">
                      {{ item.NgayHenTra || '—' }}
                    </span>
                    <span v-if="isOverdue(item)" class="badge bg-danger ms-1" style="font-size: 0.65rem;">Quá hạn</span>
                  </td>
                  <td>
                    <span v-if="item.TrangThai === 'DangMuon'" class="ath-badge ath-badge-available">Đang mượn</span>
                    <span v-else-if="item.TrangThai === 'ChoDuyet'" class="ath-badge ath-badge-pending">Chờ duyệt</span>
                    <span v-else-if="item.TrangThai === 'DaTra'" class="ath-badge" style="background-color: #E2E8F0; color: #475569;">Đã trả</span>
                    <span v-else-if="item.TrangThai === 'MatSach'" class="ath-badge ath-badge-out">Mất sách</span>
                    <span v-else-if="item.TrangThai === 'TuChoi'" class="ath-badge" style="background-color: #FEE2E2; color: #991B1B;">Từ chối</span>
                  </td>
                  <td class="small text-muted">
                    {{ item.GhiChu || '—' }}
                    <template v-if="(item.GiaTriBoiThuong > 0 || item.TienPhat > 0)">
                      <div class="text-danger fw-bold mt-1">
                        Bồi hoàn: {{ (item.GiaTriBoiThuong || item.TienPhat).toLocaleString('vi-VN') }} ₫
                      </div>
                      <button 
                        class="btn btn-sm btn-outline-danger mt-1 py-0 px-2 fw-bold d-inline-flex align-items-center"
                        style="font-size: 0.72rem; border-radius: 4px;"
                        @click="openMoMoPayment(item)"
                      >
                        <i class="fas fa-wallet me-1"></i> Thanh toán MoMo
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

    <!-- MoMo Payment Modal -->
    <div v-if="showPaymentModal" class="ath-modal-overlay" @click.self="showPaymentModal = false">
      <div class="ath-modal-content p-4" style="max-width: 440px;">
        <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style="border-color: var(--paper-border) !important;">
          <h5 class="font-serif-headline fw-bold text-danger mb-0 d-flex align-items-center">
            <i class="fas fa-wallet me-2"></i> Thanh Toán Bồi Thường MoMo
          </h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showPaymentModal = false"></button>
        </div>

        <div v-if="paymentInfo" class="text-center py-2">
          <p class="small text-muted mb-2">Quét mã QR bằng ứng dụng MoMo để thanh toán khoản tiền bồi thường sách:</p>
          <div class="p-3 bg-light rounded d-inline-block border mb-3">
            <img :src="paymentInfo.qrCodeUrl" alt="MoMo QR Code" style="width: 180px; height: 180px;" />
          </div>
          <div class="h4 font-mono-code text-danger fw-bold mb-1">
            {{ (paymentInfo.amount || 0).toLocaleString('vi-VN') }} ₫
          </div>
          <small class="text-muted d-block mb-3">Mã GD: {{ paymentInfo.orderId }}</small>

          <a :href="paymentInfo.payUrl" target="_blank" class="ath-btn-primary w-100 py-2 d-inline-block text-center text-decoration-none mb-2">
            <i class="fas fa-external-link-alt me-1"></i> Chuyển tới cổng thanh toán MoMo
          </a>
          <button class="ath-btn-outline w-100 py-1.5" @click="showPaymentModal = false">
            Đóng
          </button>
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
  components: {
    ToastNotification,
  },
  data() {
    return {
      currentUser: null,
      readerInfo: null,
      borrows: [],
      loading: false,
      activeTab: "active",
      showPaymentModal: false,
      paymentInfo: null,
    };
  },
  computed: {
    userInitials() {
      if (!this.currentUser) return "DG";
      const name = this.currentUser.fullName || this.currentUser.username || "";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
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
    activeBorrows() {
      return this.borrows.filter(b => b.TrangThai === "DangMuon");
    },
    pendingBorrows() {
      return this.borrows.filter(b => b.TrangThai === "ChoDuyet");
    },
    historyBorrows() {
      return this.borrows.filter(b => ["DaTra", "MatSach", "TuChoi"].includes(b.TrangThai));
    },
    currentTabList() {
      if (this.activeTab === "active") return this.activeBorrows;
      if (this.activeTab === "pending") return this.pendingBorrows;
      return this.historyBorrows;
    }
  },
  created() {
    this.currentUser = authService.getUser();
    if (this.currentUser) {
      this.fetchData();
    }
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [readerRes, borrowsRes] = await Promise.all([
          docGiaService.get(this.currentUser.username).catch(() => null),
          theoDoiService.getAll({ maDocGia: this.currentUser.username }),
        ]);
        if (readerRes) {
          this.readerInfo = readerRes;
        }
        this.borrows = borrowsRes;
      } catch (err) {
        this.$refs.toast?.show("Lỗi khi tải thông tin độc giả.", "error");
      } finally {
        this.loading = false;
      }
    },
    isOverdue(item) {
      if (item.TrangThai !== "DangMuon" || !item.NgayHenTra) return false;
      const today = new Date().toISOString().split("T")[0];
      return today > item.NgayHenTra;
    },
    async openMoMoPayment(item) {
      try {
        const amount = item.GiaTriBoiThuong || item.TienPhat || 0;
        const res = await paymentService.createMoMoPayment({
          borrowId: item._id,
          amount: amount,
          orderInfo: `Bồi thường mất sách ${item.MaSach} cho độc giả ${item.MaDocGia}`
        });
        this.paymentInfo = res.data;
        this.showPaymentModal = true;
      } catch (err) {
        this.$refs.toast?.show("Không thể khởi tạo cổng thanh toán MoMo.", "error");
      }
    }
  }
};
</script>
