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
        <div class="ath-card p-3 border-left border-warning" style="border-left-width: 4px !important; cursor: pointer;" @click="activeTab = 'pending'">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Chờ xét duyệt</small>
          <strong class="font-mono-code h4 text-warning mb-0">{{ pendingList.length }}</strong> đơn
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3 mb-md-0">
        <div class="ath-card p-3 border-left border-success" style="border-left-width: 4px !important; cursor: pointer;" @click="activeTab = 'borrowing'">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Đang lưu hành</small>
          <strong class="font-mono-code h4 text-success mb-0">{{ borrowingList.length }}</strong> cuốn
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3 mb-md-0">
        <div class="ath-card p-3 border-left border-danger" style="border-left-width: 4px !important; cursor: pointer;" @click="activeTab = 'borrowing'; onlyOverdue = true">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Quá hạn trả</small>
          <strong class="font-mono-code h4 text-danger mb-0">{{ overdueList.length }}</strong> cuốn
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="ath-card p-3 border-left border-dark" style="border-left-width: 4px !important; cursor: pointer;" @click="activeTab = 'completed'">
          <small class="text-muted text-uppercase d-block" style="font-size: 0.7rem;">Đã hoàn tất / Mất</small>
          <strong class="font-mono-code h4 text-dark mb-0">{{ completedList.length }}</strong> phiếu
        </div>
      </div>
    </div>

    <!-- Main Card Container -->
    <div class="ath-card p-3 p-md-4">
      <!-- Top Bar: Tabs & Search Filter -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom gap-2" style="border-color: var(--paper-border) !important;">
        <!-- Tabs Navigation -->
        <ul class="nav nav-pills mb-2 mb-md-0">
          <li class="nav-item">
            <button class="btn btn-sm mr-2" 
                    :class="activeTab === 'pending' ? 'ath-btn-primary' : 'ath-btn-outline'"
                    @click="activeTab = 'pending'; onlyOverdue = false">
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
                    @click="activeTab = 'completed'; onlyOverdue = false">
              <i class="fas fa-history mr-1"></i> Lịch sử ({{ completedList.length }})
            </button>
          </li>
        </ul>

        <!-- Filter Search & Overdue Toggle -->
        <div class="d-flex align-items-center">
          <div v-if="activeTab === 'borrowing'" class="custom-control custom-checkbox mr-3 select-none">
            <input type="checkbox" class="custom-control-input" id="overdueCheck" v-model="onlyOverdue" />
            <label class="custom-control-label small font-weight-bold text-danger cursor-pointer" for="overdueCheck">
              Chỉ trễ hạn
            </label>
          </div>
          <input type="text" 
                 class="ath-input form-control form-control-sm" 
                 style="width: 200px;" 
                 v-model="search" 
                 placeholder="Lọc độc giả, mã sách..." />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải dữ liệu lưu chiểu...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredDisplayList.length === 0" class="text-center py-5">
        <i class="fas fa-clipboard-check text-muted mb-2" style="font-size: 2.5rem;"></i>
        <h6 class="font-serif-headline font-weight-bold">Không có bản ghi nào phù hợp</h6>
        <p class="text-muted small mb-0">Hệ thống đang ở trạng thái đồng bộ.</p>
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
            <tr v-for="item in filteredDisplayList" :key="item._id">
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
                  <span class="badge badge-danger" style="font-size: 0.65rem;">Quá hạn!</span>
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
                  <button class="ath-action-btn ath-action-btn-success mr-1" 
                          title="Duyệt đơn và trừ kho" 
                          @click="handleApprove(item)">
                    <i class="fas fa-check text-success"></i> Duyệt
                  </button>
                  <button class="ath-action-btn ath-action-btn-danger" 
                          title="Từ chối đơn" 
                          @click="openRejectModal(item)">
                    <i class="fas fa-times text-danger"></i> Từ chối
                  </button>
                </template>

                <!-- If Borrowing -->
                <template v-else-if="item.TrangThai === 'DangMuon'">
                  <button class="ath-action-btn ath-action-btn-success mr-1" 
                          title="Xác nhận trả sách và cộng kho" 
                          @click="handleReturn(item)">
                    <i class="fas fa-undo text-success"></i> Đã trả
                  </button>
                  <button class="ath-action-btn ath-action-btn-danger" 
                          title="Báo mất sách và phạt tiền" 
                          @click="openLossModal(item)">
                    <i class="fas fa-exclamation-triangle text-danger"></i> Báo mất
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

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="ath-modal-overlay" @click.self="showRejectModal = false">
      <div class="ath-modal-content p-4">
        <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style="border-color: var(--paper-border) !important;">
          <h5 class="font-serif-headline font-weight-bold text-danger mb-0">
            <i class="fas fa-times-circle mr-1"></i> Từ Chối Yêu Cầu Mượn Sách
          </h5>
          <button type="button" class="close text-muted" @click="showRejectModal = false">&times;</button>
        </div>
        <p class="small text-muted mb-3" v-if="selectedRejectItem">
          Bạn đang từ chối yêu cầu mượn cuốn <strong>{{ selectedRejectItem.sachInfo?.TenSach || selectedRejectItem.MaSach }}</strong> của độc giả <strong>{{ selectedRejectItem.docGiaInfo ? `${selectedRejectItem.docGiaInfo.HoLot} ${selectedRejectItem.docGiaInfo.Ten}` : selectedRejectItem.MaDocGia }}</strong>.
        </p>
        <div class="form-group mb-3">
          <label class="small font-weight-bold mb-1">Lý do từ chối:</label>
          <select class="ath-input mb-2" v-model="rejectReason">
            <option value="Độc giả đã đạt định mức tối đa 3 cuốn đang mượn">Độc giả đã đạt định mức tối đa 3 cuốn đang mượn</option>
            <option value="Sách đang được thu hồi để kiểm kê / phục chế">Sách đang được thu hồi để kiểm kê / phục chế</option>
            <option value="Thông tin thẻ độc giả chưa hoàn tất xác thực">Thông tin thẻ độc giả chưa hoàn tất xác thực</option>
            <option value="Khác">Lý do khác (tự nhập)...</option>
          </select>
          <input v-if="rejectReason === 'Khác'" 
                 type="text" 
                 class="ath-input" 
                 v-model="customRejectReason" 
                 placeholder="Nhập lý do cụ thể..." />
        </div>
        <div class="d-flex justify-content-end align-items-center pt-2 border-top" style="border-color: var(--paper-border) !important;">
          <button class="ath-btn-outline mr-2" @click="showRejectModal = false">Hủy</button>
          <button class="ath-btn-danger" @click="confirmReject">Xác nhận Từ chối</button>
        </div>
      </div>
    </div>

    <!-- Loss Modal -->
    <div v-if="showLossModal" class="ath-modal-overlay" @click.self="showLossModal = false">
      <div class="ath-modal-content p-4">
        <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style="border-color: var(--paper-border) !important;">
          <h5 class="font-serif-headline font-weight-bold text-danger mb-0">
            <i class="fas fa-exclamation-triangle mr-2"></i> Xác Nhận Báo Mất Sách
          </h5>
          <button type="button" class="close text-muted" @click="showLossModal = false">&times;</button>
        </div>
        <p class="small text-muted mb-3">
          Khi báo mất, tồn kho sẽ <strong>không được cộng lại</strong>. Hệ thống sẽ tự động phạt độc giả số tiền bằng đúng đơn giá cuốn sách và tăng số lần vi phạm lên 1 (đạt 3 lần sẽ tự động khóa thẻ Blacklist).
        </p>
        <div class="form-group mb-3">
          <label class="small font-weight-bold mb-1">Lý do / Tình trạng ghi nhận:</label>
          <input type="text" class="ath-input" v-model="lossReason" placeholder="VD: Độc giả làm rơi mất sách trong quá trình di chuyển..." />
        </div>
        <div class="d-flex justify-content-end align-items-center pt-2 border-top" style="border-color: var(--paper-border) !important;">
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
      search: "",
      onlyOverdue: false,
      showLossModal: false,
      selectedLossItem: null,
      lossReason: "Độc giả làm mất sách vật lý",
      showRejectModal: false,
      selectedRejectItem: null,
      rejectReason: "Độc giả đã đạt định mức tối đa 3 cuốn đang mượn",
      customRejectReason: "",
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
      if (this.activeTab === "borrowing") {
        if (this.onlyOverdue) return this.overdueList;
        return this.borrowingList;
      }
      return this.completedList;
    },
    filteredDisplayList() {
      if (!this.search.trim()) return this.currentDisplayList;
      const q = this.search.toLowerCase();
      return this.currentDisplayList.filter(item => {
        const readerName = item.docGiaInfo ? `${item.docGiaInfo.HoLot} ${item.docGiaInfo.Ten}`.toLowerCase() : "";
        const bookName = item.sachInfo ? item.sachInfo.TenSach.toLowerCase() : "";
        return item.MaDocGia.toLowerCase().includes(q) ||
               item.MaSach.toLowerCase().includes(q) ||
               readerName.includes(q) ||
               bookName.includes(q);
      });
    }
  },
  watch: {
    showLossModal(val) {
      this.syncModalScroll(val || this.showRejectModal);
    },
    showRejectModal(val) {
      this.syncModalScroll(val || this.showLossModal);
    }
  },
  beforeUnmount() {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  created() {
    this.fetchData();
  },
  methods: {
    syncModalScroll(isOpen) {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", this.handleKeyDown);
      } else {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", this.handleKeyDown);
      }
    },
    handleKeyDown(e) {
      if (e.key === "Escape") {
        this.showLossModal = false;
        this.showRejectModal = false;
      }
    },
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
    openRejectModal(item) {
      this.selectedRejectItem = item;
      this.rejectReason = "Độc giả đã đạt định mức tối đa 3 cuốn đang mượn";
      this.customRejectReason = "";
      this.showRejectModal = true;
    },
    async confirmReject() {
      if (!this.selectedRejectItem) return;
      const finalReason = this.rejectReason === "Khác" ? (this.customRejectReason.trim() || "Không đủ điều kiện") : this.rejectReason;
      try {
        const res = await theoDoiService.tuChoi(this.selectedRejectItem._id, finalReason);
        this.showRejectModal = false;
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
