<template>
  <div class="py-4">
    <!-- Header Page -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small font-weight-bold" style="color: var(--primary); letter-spacing: 0.05em;">
          Nghiệp Vụ Thủ Thư & Quản Trị
        </span>
        <h2 class="font-serif-headline font-weight-bold text-dark mb-0">
          Quản Lý Mượn — Trả Sách & Phê Duyệt
        </h2>
      </div>
      <button class="ath-btn-outline" @click="fetchData">
        <i class="fas fa-sync-alt mr-1"></i> Làm mới dữ liệu
      </button>
    </div>

    <!-- Quick Stats Cards -->
    <div class="row mb-4">
      <div class="col-md-3 col-sm-6 mb-3 mb-md-0">
        <div class="ath-card p-3 border-left border-warning" style="border-left-width: 4px !important;">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Chờ xét duyệt</small>
          <strong class="font-mono-code h4 text-warning mb-0">{{ pendingList.length }}</strong> đơn
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3 mb-md-0">
        <div class="ath-card p-3 border-left border-success" style="border-left-width: 4px !important;">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Đang lưu hành</small>
          <strong class="font-mono-code h4 text-success mb-0">{{ borrowingList.length }}</strong> cuốn
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3 mb-md-0">
        <div class="ath-card p-3 border-left border-danger" style="border-left-width: 4px !important;">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Quá hạn trả</small>
          <strong class="font-mono-code h4 text-danger mb-0">{{ overdueList.length }}</strong> cuốn
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="ath-card p-3 border-left border-dark" style="border-left-width: 4px !important;">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Đã hoàn tất / Mất</small>
          <strong class="font-mono-code h4 text-dark mb-0">{{ completedList.length }}</strong> phiếu
        </div>
      </div>
    </div>

    <!-- Main Card Container -->
    <div class="ath-card p-4">
      <!-- Tabs Navigation -->
      <ul class="nav nav-pills mb-3 border-bottom pb-3" style="border-color: var(--paper-border) !important;">
        <li class="nav-item">
          <button class="btn btn-sm mr-2" 
                  :class="activeTab === 'pending' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="activeTab = 'pending'">
            <i class="fas fa-clock mr-1"></i> Chờ duyệt ({{ pendingList.length }})
          </button>
        </li>
        <li class="nav-item">
          <button class="btn btn-sm mr-2" 
                  :class="activeTab === 'borrowing' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="activeTab = 'borrowing'">
            <i class="fas fa-book-reader mr-1"></i> Đang mượn ({{ borrowingList.length }})
          </button>
        </li>
        <li class="nav-item">
          <button class="btn btn-sm" 
                  :class="activeTab === 'completed' ? 'ath-btn-primary' : 'ath-btn-outline'"
                  @click="activeTab = 'completed'">
            <i class="fas fa-history mr-1"></i> Lịch sử hoàn tất ({{ completedList.length }})
          </button>
        </li>
      </ul>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải dữ liệu lưu chiểu...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="currentDisplayList.length === 0" class="text-center py-5">
        <i class="fas fa-clipboard-check text-muted mb-2" style="font-size: 2.5rem;"></i>
        <h6 class="font-serif-headline font-weight-bold">Không có bản ghi nào trong mục này</h6>
        <p class="text-muted small mb-0">Hệ thống đang ở trạng thái đồng bộ và sẵn sàng phục vụ.</p>
      </div>

      <!-- Data Table -->
      <div v-else class="table-responsive">
        <table class="ath-table">
          <thead>
            <tr>
              <th>Độc giả</th>
              <th>Sách mượn</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
              <th>Ghi chú / Tiền phạt</th>
              <th class="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentDisplayList" :key="item._id">
              <!-- Reader -->
              <td>
                <strong class="text-dark d-block">
                  {{ item.docGiaInfo ? `${item.docGiaInfo.HoLot} ${item.docGiaInfo.Ten}` : item.MaDocGia }}
                </strong>
                <small class="text-muted font-mono-code">
                  {{ item.MaDocGia }} • SĐT: {{ item.docGiaInfo?.DienThoai || '—' }}
                </small>
                <div v-if="item.docGiaInfo?.TrangThaiThe === 'Blacklist'" class="mt-1">
                  <span class="ath-badge ath-badge-blacklist" style="font-size: 0.65rem;">
                    <i class="fas fa-ban"></i> Blacklist ({{ item.docGiaInfo.SoLanViPham }} lỗi)
                  </span>
                </div>
              </td>

              <!-- Book -->
              <td>
                <strong class="font-serif-headline text-dark d-block" style="font-size: 0.95rem;">
                  {{ item.sachInfo?.TenSach || item.MaSach }}
                </strong>
                <small class="text-muted font-mono-code">
                  Mã: {{ item.MaSach }} • Giá: {{ (item.sachInfo?.DonGia || 0).toLocaleString('vi-VN') }} ₫
                </small>
              </td>

              <!-- Dates -->
              <td class="font-mono-code small">{{ item.NgayMuon || '—' }}</td>
              <td class="font-mono-code small">
                <span :class="isLate(item) ? 'text-danger font-weight-bold' : ''">
                  {{ item.NgayHenTra || '—' }}
                </span>
                <div v-if="isLate(item)">
                  <span class="badge badge-danger" style="font-size: 0.65rem;">Quá hạn trả!</span>
                </div>
              </td>

              <!-- Status -->
              <td>
                <span v-if="item.TrangThai === 'ChoDuyet'" class="ath-badge ath-badge-pending">Chờ duyệt</span>
                <span v-else-if="item.TrangThai === 'DangMuon'" class="ath-badge ath-badge-available">Đang mượn</span>
                <span v-else-if="item.TrangThai === 'DaTra'" class="ath-badge" style="background-color: #E2E8F0; color: #475569;">Đã trả</span>
                <span v-else-if="item.TrangThai === 'MatSach'" class="ath-badge ath-badge-out">Mất sách</span>
                <span v-else-if="item.TrangThai === 'TuChoi'" class="ath-badge" style="background-color: #FEE2E2; color: #991B1B;">Từ chối</span>
              </td>

              <!-- Notes / Fine -->
              <td class="small text-muted">
                {{ item.GhiChu || '—' }}
                <div v-if="item.TienPhat > 0" class="text-danger font-weight-bold mt-1">
                  Bồi hoàn: {{ item.TienPhat.toLocaleString('vi-VN') }} ₫
                </div>
              </td>

              <!-- Actions -->
              <td class="text-right">
                <!-- If Pending -->
                <template v-if="item.TrangThai === 'ChoDuyet'">
                  <button class="ath-btn-primary py-1 px-2 mr-1" 
                          title="Duyệt đơn và trừ kho" 
                          @click="handleApprove(item)">
                    <i class="fas fa-check mr-1"></i> Duyệt
                  </button>
                  <button class="ath-btn-outline py-1 px-2 text-danger" 
                          title="Từ chối đơn" 
                          @click="handleReject(item)">
                    <i class="fas fa-times"></i>
                  </button>
                </template>

                <!-- If Borrowing -->
                <template v-else-if="item.TrangThai === 'DangMuon'">
                  <button class="ath-btn-primary py-1 px-2 mr-1" 
                          title="Xác nhận trả sách và cộng kho" 
                          @click="handleReturn(item)">
                    <i class="fas fa-undo mr-1"></i> Đã trả
                  </button>
                  <button class="ath-btn-danger py-1 px-2" 
                          title="Báo mất sách và phạt tiền" 
                          @click="openLossModal(item)">
                    <i class="fas fa-exclamation-triangle mr-1"></i> Báo mất
                  </button>
                </template>

                <!-- If Completed -->
                <template v-else>
                  <button class="btn btn-sm btn-link text-muted p-0" 
                          title="Xóa bản ghi lưu trữ" 
                          @click="handleDelete(item)">
                    <i class="far fa-trash-alt"></i>
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loss Modal -->
    <div v-if="showLossModal" class="ath-modal-overlay" @click.self="showLossModal = false">
      <div class="ath-modal-content p-4">
        <h5 class="font-serif-headline font-weight-bold text-danger mb-2">
          <i class="fas fa-exclamation-triangle mr-2"></i> Xác Nhận Báo Mất Sách
        </h5>
        <p class="small text-muted mb-3">
          Khi báo mất, tồn kho sẽ <strong>không được cộng lại</strong>. Hệ thống sẽ tự động phạt độc giả số tiền bằng đúng đơn giá cuốn sách và tăng số lần vi phạm lên 1 (đạt 3 lần sẽ tự động khóa thẻ Blacklist).
        </p>
        <div class="form-group mb-3">
          <label class="small font-weight-bold mb-1">Lý do / Tình trạng ghi nhận:</label>
          <input type="text" class="ath-input" v-model="lossReason" placeholder="VD: Độc giả làm rơi mất sách trong quá trình di chuyển..." />
        </div>
        <div class="d-flex justify-content-end align-items-center pt-2">
          <button class="ath-btn-outline mr-2" @click="showLossModal = false">Hủy</button>
          <button class="ath-btn-danger" @click="confirmLoss">Xác nhận Báo mất & Phạt</button>
        </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import theoDoiService from "../services/theodoimuon.service";

export default {
  name: "ManagerBorrows",
  components: {
    ToastNotification,
  },
  data() {
    return {
      borrows: [],
      loading: false,
      activeTab: "pending",
      showLossModal: false,
      selectedLossItem: null,
      lossReason: "Độc giả làm mất sách vật lý",
    };
  },
  computed: {
    pendingList() {
      return this.borrows.filter(b => b.TrangThai === "ChoDuyet");
    },
    borrowingList() {
      return this.borrows.filter(b => b.TrangThai === "DangMuon");
    },
    overdueList() {
      const today = new Date().toISOString().split("T")[0];
      return this.borrows.filter(b => b.TrangThai === "DangMuon" && b.NgayHenTra && today > b.NgayHenTra);
    },
    completedList() {
      return this.borrows.filter(b => ["DaTra", "MatSach", "TuChoi"].includes(b.TrangThai));
    },
    currentDisplayList() {
      if (this.activeTab === "pending") return this.pendingList;
      if (this.activeTab === "borrowing") return this.borrowingList;
      return this.completedList;
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.borrows = await theoDoiService.getAll();
      } catch (err) {
        this.$refs.toast?.show("Lỗi khi tải danh sách phiếu mượn.", "error");
      } finally {
        this.loading = false;
      }
    },
    isLate(item) {
      if (item.TrangThai !== "DangMuon" || !item.NgayHenTra) return false;
      const today = new Date().toISOString().split("T")[0];
      return today > item.NgayHenTra;
    },
    async handleApprove(item) {
      try {
        const res = await theoDoiService.duyet(item._id);
        this.$refs.toast.show(res.message || "Đã duyệt mượn và trừ 1 cuốn trong kho.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || "Không thể duyệt yêu cầu mượn.";
        this.$refs.toast.show(msg, "error");
      }
    },
    async handleReject(item) {
      const reason = prompt("Nhập lý do từ chối yêu cầu mượn:", "Không đủ điều kiện mượn sách");
      if (reason === null) return;
      try {
        const res = await theoDoiService.tuChoi(item._id, reason);
        this.$refs.toast.show(res.message || "Đã từ chối yêu cầu.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show("Lỗi khi từ chối yêu cầu.", "error");
      }
    },
    async handleReturn(item) {
      if (!confirm(`Xác nhận độc giả đã trả cuốn sách '${item.sachInfo?.TenSach || item.MaSach}'?`)) return;
      try {
        const res = await theoDoiService.xacNhanTra(item._id);
        this.$refs.toast.show(res.message || "Đã xác nhận trả sách và hoàn lại kho.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || "Không thể xác nhận trả sách.";
        this.$refs.toast.show(msg, "error");
      }
    },
    openLossModal(item) {
      this.selectedLossItem = item;
      this.lossReason = "Độc giả làm mất sách vật lý";
      this.showLossModal = true;
    },
    async confirmLoss() {
      if (!this.selectedLossItem) return;
      try {
        const res = await theoDoiService.baoMat(this.selectedLossItem._id, this.lossReason);
        this.showLossModal = false;
        this.$refs.toast.show(res.message || "Đã ghi nhận mất sách.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || "Lỗi khi báo mất sách.";
        this.$refs.toast.show(msg, "error");
      }
    },
    async handleDelete(item) {
      if (!confirm("Bạn có chắc chắn muốn xóa phiếu lưu trữ này?")) return;
      try {
        await theoDoiService.delete(item._id);
        this.$refs.toast.show("Đã xóa phiếu lưu trữ.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show("Không thể xóa phiếu.", "error");
      }
    }
  }
};
</script>
