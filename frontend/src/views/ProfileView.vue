<template>
  <div class="py-4">
    <!-- Header Page -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small font-weight-bold" style="color: var(--primary); letter-spacing: 0.05em;">
          Hồ Sơ Độc Giả
        </span>
        <h2 class="font-serif-headline font-weight-bold text-dark mb-0">
          Thẻ Thư Viện & Sách Đang Mượn
        </h2>
      </div>
      <router-link to="/" class="ath-btn-outline text-decoration-none">
        <i class="fas fa-search mr-1"></i> Tìm thêm sách
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
            <h5 class="font-serif-headline font-weight-bold text-dark mb-0">
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
              <div class="progress" style="height: 5px; background-color: var(--paper-subtle);">
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
              <span class="text-muted">Địa chỉ:</span>
              <span class="text-truncate ml-2" style="max-width: 170px;">{{ readerInfo?.DiaChi || '—' }}</span>
            </div>

            <div class="d-flex justify-content-between align-items-center py-2">
              <span class="text-muted">Vai trò hệ thống:</span>
              <span v-if="currentUser.role === 'ADMIN'" class="badge badge-danger">SUPER ADMIN</span>
              <span v-else-if="currentUser.role === 'MANAGER'" class="badge badge-success">THỦ THƯ</span>
              <span v-else class="badge badge-light border">ĐỘC GIẢ TIÊU CHUẨN</span>
            </div>
          </div>

          <div v-if="readerInfo?.TrangThaiThe === 'Blacklist'" class="alert alert-danger py-2 px-3 small mb-0 border-0" style="font-size: 0.775rem;">
            <i class="fas fa-exclamation-triangle mr-1"></i>
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
              <button class="btn btn-sm mr-2 mb-1" 
                      :class="activeTab === 'active' ? 'ath-btn-primary' : 'ath-btn-outline'"
                      @click="activeTab = 'active'">
                <i class="fas fa-book-reader mr-1"></i> Đang mượn ({{ activeBorrows.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="btn btn-sm mr-2 mb-1" 
                      :class="activeTab === 'pending' ? 'ath-btn-primary' : 'ath-btn-outline'"
                      @click="activeTab = 'pending'">
                <i class="fas fa-clock mr-1"></i> Chờ duyệt ({{ pendingBorrows.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="btn btn-sm mb-1" 
                      :class="activeTab === 'history' ? 'ath-btn-primary' : 'ath-btn-outline'"
                      @click="activeTab = 'history'">
                <i class="fas fa-history mr-1"></i> Lịch sử ({{ historyBorrows.length }})
              </button>
            </li>
          </ul>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-success spinner-border-sm" role="status"></div>
            <span class="ml-2 small text-muted">Đang tải lịch sử mượn sách...</span>
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
                  <th>Hạn trả</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
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
                    <span :class="isOverdue(item) ? 'text-danger font-weight-bold' : ''">
                      {{ item.NgayHenTra || '—' }}
                    </span>
                    <span v-if="isOverdue(item)" class="badge badge-danger ml-1" style="font-size: 0.65rem;">Trễ hạn</span>
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
                    <span v-if="item.TienPhat > 0" class="text-danger d-block font-weight-bold mt-1">
                      Phạt bồi hoàn: {{ item.TienPhat.toLocaleString('vi-VN') }} ₫
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
    }
  }
};
</script>
