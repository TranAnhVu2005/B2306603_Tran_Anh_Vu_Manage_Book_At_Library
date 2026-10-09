<template>
  <div class="pb-5">
    <!-- Hero Bibliographic Section -->
    <section class="py-4 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div class="row align-items-center">
        <div class="col-lg-8">
          <div class="d-flex align-items-center mb-2 font-mono-code text-uppercase small" style="color: var(--primary); letter-spacing: 0.05em;">
            <i class="fas fa-feather-alt mr-2"></i>
            <span>Mục lục & Tra cứu Thư viện Học thuật</span>
          </div>
          <h1 class="font-serif-headline font-weight-bold mb-2 text-dark" style="font-size: 2.4rem; letter-spacing: -0.01em;">
            Kho Tri Thức & Học Liệu Thư Viện
          </h1>
          <p class="font-italic text-muted mb-0 lead" style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--ink-secondary) !important;">
            Hệ thống quản lý lưu trữ ấn bản học thuật, giáo trình chuẩn hóa và tư liệu nghiên cứu. Hỗ trợ độc giả tra cứu trực tuyến và đăng ký mượn lưu chiểu nhanh chóng.
          </p>
        </div>
        <div class="col-lg-4 text-lg-right mt-3 mt-lg-0">
          <div class="p-3 border rounded d-inline-block text-left" style="background-color: #fff; border-color: var(--paper-border) !important; min-width: 240px;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small text-muted font-weight-bold text-uppercase" style="font-size: 0.7rem;">Tổng số đầu sách:</span>
              <strong class="font-mono-code h5 mb-0" style="color: var(--primary);">{{ books.length }}</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small text-muted font-weight-bold text-uppercase" style="font-size: 0.7rem;">Sẵn sàng mượn:</span>
              <strong class="font-mono-code text-success">{{ availableBooksCount }}</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="small text-muted font-weight-bold text-uppercase" style="font-size: 0.7rem;">Hạn mức cá nhân:</span>
              <span class="badge badge-light border font-mono-code">03 cuốn</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Filters Container -->
      <div class="ath-card p-3 p-md-4 mt-4">
        <div class="row align-items-center">
          <!-- Keyword Search -->
          <div class="col-lg-6 col-md-12 mb-3 mb-lg-0">
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text bg-white border-right-0" style="border-color: var(--paper-border);">
                  <i class="fas fa-search text-muted"></i>
                </span>
              </div>
              <input type="text" 
                     class="form-control border-left-0 ath-input" 
                     v-model="searchKeyword" 
                     placeholder="Tìm theo tên sách, tác giả hoặc mã sách..." 
                     @input="handleSearch" />
              <div class="input-group-append" v-if="searchKeyword">
                <button class="btn btn-outline-secondary" type="button" @click="clearSearch" style="border-color: var(--paper-border);">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Publisher Filter -->
          <div class="col-lg-3 col-md-6 mb-3 mb-lg-0">
            <select class="form-control ath-input" v-model="selectedPublisher" @change="fetchBooks">
              <option value="all">Tất cả Nhà xuất bản</option>
              <option v-for="nxb in publishers" :key="nxb.MaNXB" :value="nxb.MaNXB">
                {{ nxb.TenNXB }} ({{ nxb.MaNXB }})
              </option>
            </select>
          </div>

          <!-- Availability Checkbox -->
          <div class="col-lg-3 col-md-6 d-flex align-items-center justify-content-lg-end">
            <div class="custom-control custom-checkbox select-none">
              <input type="checkbox" class="custom-control-input" id="availCheck" v-model="availableOnly" @change="fetchBooks" />
              <label class="custom-control-label small font-weight-bold text-dark cursor-pointer" for="availCheck">
                Chỉ hiện sách còn kho
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Books Grid Section -->
    <section>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="font-serif-headline font-weight-bold mb-0 text-dark">
          Danh Mục Ấn Bản Lưu Chiểu ({{ filteredBooks.length }})
        </h5>
        <button class="btn btn-sm ath-btn-outline" @click="fetchBooks">
          <i class="fas fa-sync-alt mr-1"></i> Làm mới
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh mục sách...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBooks.length === 0" class="ath-card text-center py-5 px-3">
        <i class="fas fa-book-open text-muted mb-3" style="font-size: 3rem;"></i>
        <h6 class="font-serif-headline font-weight-bold">Không tìm thấy cuốn sách nào</h6>
        <p class="text-muted small mb-3">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bỏ chọn bộ lọc.</p>
        <button class="ath-btn-primary" @click="resetFilters">
          <i class="fas fa-redo mr-1"></i> Đặt lại bộ lọc
        </button>
      </div>

      <!-- Books Grid -->
      <div v-else class="row">
        <div class="col-lg-4 col-md-6 mb-4" v-for="book in filteredBooks" :key="book._id">
          <BookCard :book="book" @borrow="openBorrowModal" />
        </div>
      </div>
    </section>

    <!-- Borrow Modal -->
    <BorrowModal :show="showBorrowModal" 
                 :book="selectedBook" 
                 @close="showBorrowModal = false" 
                 @confirm="submitBorrowRequest" />

    <!-- Toast Notification -->
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
  components: {
    BookCard,
    BorrowModal,
    ToastNotification,
  },
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
    };
  },
  computed: {
    availableBooksCount() {
      return this.books.filter(b => b.SoQuyen > 0).length;
    },
    filteredBooks() {
      return this.books.filter(book => {
        const matchesKeyword = !this.searchKeyword.trim() || 
          book.TenSach.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          book.TacGia.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          book.MaSach.toLowerCase().includes(this.searchKeyword.toLowerCase());

        const matchesPublisher = this.selectedPublisher === "all" || book.MaNXB === this.selectedPublisher;
        const matchesAvailability = !this.availableOnly || book.SoQuyen > 0;

        return matchesKeyword && matchesPublisher && matchesAvailability;
      });
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [booksRes, nxbRes] = await Promise.all([
          sachService.getAll(),
          nxbService.getAll(),
        ]);
        this.books = booksRes;
        this.publishers = nxbRes;
      } catch (err) {
        this.$refs.toast.show("Lỗi khi kết nối đến máy chủ thư viện.", "error");
      } finally {
        this.loading = false;
      }
    },
    async fetchBooks() {
      try {
        const params = {};
        if (this.selectedPublisher !== "all") params.maNxb = this.selectedPublisher;
        if (this.availableOnly) params.availableOnly = "true";
        this.books = await sachService.getAll(params);
      } catch (err) {
        this.$refs.toast.show("Lỗi khi tải danh sách sách.", "error");
      }
    },
    handleSearch() {
      // computed filteredBooks tự động phản hồi
    },
    clearSearch() {
      this.searchKeyword = "";
    },
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
      this.selectedBook = book;
      this.showBorrowModal = true;
    },
    async submitBorrowRequest(payload) {
      try {
        const result = await theoDoiService.dangKyMuon({
          MaDocGia: payload.maDocGia,
          MaSach: payload.maSach,
          GhiChu: payload.ghiChu,
        });
        this.showBorrowModal = false;
        this.$refs.toast.show(result.message || "Gửi yêu cầu mượn thành công! Vui lòng chờ xét duyệt.");
        this.fetchBooks();
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || "Không thể gửi yêu cầu mượn.";
        this.$refs.toast.show(errMsg, "error", 4500);
      }
    }
  }
};
</script>
