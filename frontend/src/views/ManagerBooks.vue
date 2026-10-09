<template>
  <div class="py-4">
    <!-- Header Page -->
    <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style="border-color: var(--paper-border) !important;">
      <div>
        <span class="text-uppercase small font-weight-bold" style="color: var(--primary); letter-spacing: 0.05em;">
          Quản Lý Kho Thư Viện
        </span>
        <h2 class="font-serif-headline font-weight-bold text-dark mb-0">
          Danh Mục Đầu Sách & Tồn Kho
        </h2>
      </div>
      <div>
        <button class="ath-btn-primary mr-2" @click="openCreateModal">
          <i class="fas fa-plus mr-1"></i> Thêm sách mới
        </button>
        <button class="ath-btn-outline" @click="fetchData">
          <i class="fas fa-sync-alt mr-1"></i> Làm mới
        </button>
      </div>
    </div>

    <!-- Search & Statistics Box -->
    <div class="ath-card p-3 mb-4">
      <div class="row align-items-center">
        <div class="col-md-6 mb-2 mb-md-0">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                <i class="fas fa-search text-muted"></i>
              </span>
            </div>
            <input type="text" 
                   class="form-control ath-input border-left-0" 
                   v-model="search" 
                   placeholder="Lọc theo tên sách, tác giả, mã sách, NXB..." />
            <div class="input-group-append" v-if="search">
              <button class="btn btn-outline-secondary" type="button" @click="search = ''" style="border-color: var(--paper-border);">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-6 text-md-right small text-muted">
          Tổng số đầu sách: <strong>{{ books.length }}</strong> • Tổng số lượng trong kho: <strong class="text-success">{{ totalQuantity }} quyển</strong>
        </div>
      </div>
    </div>

    <!-- Table of Books -->
    <div class="ath-card p-3 p-md-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách sách...</p>
      </div>

      <div v-else-if="filteredBooks.length === 0" class="text-center py-5">
        <i class="fas fa-book-open text-muted mb-2" style="font-size: 2.5rem;"></i>
        <h6 class="font-serif-headline font-weight-bold">Không tìm thấy sách nào phù hợp</h6>
        <p class="text-muted small mb-0">Vui lòng thử lại với từ khóa khác.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="ath-table">
          <thead>
            <tr>
              <th>Bìa</th>
              <th>Mã</th>
              <th>Tên sách & Tác giả</th>
              <th>NXB</th>
              <th>Năm XB</th>
              <th style="min-width: 130px;">Tồn kho</th>
              <th>Đơn giá</th>
              <th class="text-right" style="min-width: 140px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book._id">
              <td style="width: 50px;">
                <div class="position-relative overflow-hidden ath-book-spine" style="width: 38px; height: 50px; background-color: var(--paper-subtle);">
                  <img v-if="book.HinhAnh" 
                       :src="book.HinhAnh" 
                       :alt="book.TenSach"
                       class="w-100 h-100" 
                       style="object-fit: cover;" 
                       @error="e => e.target.style.display = 'none'" />
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center text-muted" style="font-size: 0.8rem;">
                    <i class="fas fa-book"></i>
                  </div>
                </div>
              </td>
              <td class="font-mono-code font-weight-bold text-dark">{{ book.MaSach }}</td>
              <td>
                <strong class="font-serif-headline text-dark d-block" style="font-size: 0.95rem;">{{ book.TenSach }}</strong>
                <small class="text-muted font-italic">{{ book.TacGia }}</small>
              </td>
              <td><span class="badge badge-light border">{{ book.MaNXB }}</span></td>
              <td class="small">{{ book.NamXuatBan || '—' }}</td>
              <td>
                <!-- Quick Adjust Quantity (+ / -) -->
                <div class="d-flex align-items-center">
                  <button class="ath-action-btn py-0 px-2 mr-1" 
                          :disabled="book.SoQuyen <= 0"
                          @click="quickAdjustStock(book, -1)" 
                          title="Bớt 1 cuốn">
                    -
                  </button>
                  <span class="font-weight-bold font-mono-code mx-1" :class="book.SoQuyen > 0 ? 'text-success' : 'text-danger'">
                    {{ book.SoQuyen }}
                  </span>
                  <button class="ath-action-btn py-0 px-2 ml-1" 
                          @click="quickAdjustStock(book, 1)" 
                          title="Thêm 1 cuốn">
                    +
                  </button>
                </div>
              </td>
              <td class="font-mono-code small">{{ formatCurrency(book.DonGia) }}</td>
              <td class="text-right">
                <button class="ath-action-btn mr-1" @click="openEditModal(book)" title="Chỉnh sửa">
                  <i class="fas fa-edit text-secondary"></i> Sửa
                </button>
                <button class="ath-action-btn ath-action-btn-danger" @click="handleDelete(book)" title="Xóa sách">
                  <i class="fas fa-trash-alt text-danger"></i> Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Book Modal -->
    <div v-if="showModal" class="ath-modal-overlay" @click.self="showModal = false">
      <div class="ath-modal-content p-4" style="max-width: 620px;">
        <div class="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
          <h5 class="font-serif-headline font-weight-bold mb-0">
            {{ isEditing ? 'Chỉnh Sửa Thông Tin Sách' : 'Thêm Sách Mới Vào Kho' }}
          </h5>
          <button type="button" class="close" @click="showModal = false">&times;</button>
        </div>

        <form @submit.prevent="saveBook">
          <div class="row">
            <div class="col-md-4 form-group mb-2">
              <label class="small font-weight-bold mb-1">Mã sách:</label>
              <input type="text" class="ath-input" v-model="form.MaSach" :disabled="isEditing" placeholder="VD: S07" required />
            </div>
            <div class="col-md-8 form-group mb-2">
              <label class="small font-weight-bold mb-1">Tên cuốn sách:</label>
              <input type="text" class="ath-input" v-model="form.TenSach" placeholder="VD: Lập trình Vue 3..." required />
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 form-group mb-2">
              <label class="small font-weight-bold mb-1">Tác giả:</label>
              <input type="text" class="ath-input" v-model="form.TacGia" placeholder="VD: Nguyễn Văn A" required />
            </div>
            <div class="col-md-6 form-group mb-2">
              <label class="small font-weight-bold mb-1">Nhà xuất bản:</label>
              <select class="ath-input" v-model="form.MaNXB" required>
                <option v-for="nxb in publishers" :key="nxb.MaNXB" :value="nxb.MaNXB">
                  {{ nxb.TenNXB }} ({{ nxb.MaNXB }})
                </option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="col-md-4 form-group mb-2">
              <label class="small font-weight-bold mb-1">Số quyển tồn kho:</label>
              <input type="number" class="ath-input" min="0" v-model.number="form.SoQuyen" required />
            </div>
            <div class="col-md-4 form-group mb-2">
              <label class="small font-weight-bold mb-1">Đơn giá (VND):</label>
              <input type="number" class="ath-input" min="0" step="1000" v-model.number="form.DonGia" required />
            </div>
            <div class="col-md-4 form-group mb-2">
              <label class="small font-weight-bold mb-1">Năm XB:</label>
              <input type="number" class="ath-input" min="1900" max="2030" v-model.number="form.NamXuatBan" />
            </div>
          </div>

          <div class="form-group mb-2">
            <label class="small font-weight-bold mb-1">Đường dẫn ảnh bìa (URL):</label>
            <input type="url" class="ath-input" v-model="form.HinhAnh" placeholder="https://..." />
          </div>

          <div class="form-group mb-3">
            <label class="small font-weight-bold mb-1">Tóm tắt nội dung:</label>
            <textarea class="ath-input" rows="2" v-model="form.MoTa" placeholder="Giới thiệu sơ lược..."></textarea>
          </div>

          <div class="d-flex justify-content-end align-items-center pt-2 border-top">
            <button type="button" class="ath-btn-outline mr-2" @click="showModal = false">Hủy</button>
            <button type="submit" class="ath-btn-primary" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin mr-1"></i>
              {{ isEditing ? 'Cập Nhật' : 'Lưu Sách Mới' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import nxbService from "../services/nhaxuatban.service";

export default {
  name: "ManagerBooks",
  components: {
    ToastNotification,
  },
  data() {
    return {
      books: [],
      publishers: [],
      loading: false,
      search: "",
      showModal: false,
      isEditing: false,
      saving: false,
      form: {
        MaSach: "",
        TenSach: "",
        TacGia: "",
        MaNXB: "NXB01",
        SoQuyen: 5,
        DonGia: 85000,
        NamXuatBan: 2024,
        HinhAnh: "",
        MoTa: "",
      },
    };
  },
  computed: {
    totalQuantity() {
      return this.books.reduce((acc, b) => acc + (b.SoQuyen || 0), 0);
    },
    filteredBooks() {
      if (!this.search.trim()) return this.books;
      const q = this.search.toLowerCase();
      return this.books.filter(b => 
        b.TenSach.toLowerCase().includes(q) ||
        b.TacGia.toLowerCase().includes(q) ||
        b.MaSach.toLowerCase().includes(q) ||
        b.MaNXB.toLowerCase().includes(q)
      );
    }
  },
  watch: {
    showModal(val) {
      if (val) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", this.handleKeyDown);
      } else {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", this.handleKeyDown);
      }
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
    handleKeyDown(e) {
      if (e.key === "Escape") this.showModal = false;
    },
    async fetchData() {
      this.loading = true;
      try {
        const [booksRes, nxbRes] = await Promise.all([
          sachService.getAll(),
          nxbService.getAll(),
        ]);
        this.books = booksRes;
        this.publishers = nxbRes;
        if (this.publishers.length > 0 && !this.form.MaNXB) {
          this.form.MaNXB = this.publishers[0].MaNXB;
        }
      } catch (err) {
        this.$refs.toast?.show("Lỗi khi tải dữ liệu sách.", "error");
      } finally {
        this.loading = false;
      }
    },
    formatCurrency(val) {
      if (!val) return "0 ₫";
      return Number(val).toLocaleString("vi-VN") + " ₫";
    },
    async quickAdjustStock(book, delta) {
      const newStock = (book.SoQuyen || 0) + delta;
      if (newStock < 0) return;
      try {
        await sachService.update(book._id || book.MaSach, { SoQuyen: newStock });
        book.SoQuyen = newStock;
        this.$refs.toast.show(`Đã cập nhật tồn kho cuốn '${book.TenSach}': ${newStock} quyển.`);
      } catch (err) {
        this.$refs.toast.show("Không thể cập nhật số lượng.", "error");
      }
    },
    openCreateModal() {
      this.isEditing = false;
      this.form = {
        MaSach: `S0${this.books.length + 1}`,
        TenSach: "",
        TacGia: "",
        MaNXB: this.publishers[0]?.MaNXB || "NXB01",
        SoQuyen: 5,
        DonGia: 100000,
        NamXuatBan: new Date().getFullYear(),
        HinhAnh: "",
        MoTa: "",
      };
      this.showModal = true;
    },
    openEditModal(book) {
      this.isEditing = true;
      this.form = { ...book };
      this.showModal = true;
    },
    async saveBook() {
      this.saving = true;
      try {
        if (this.isEditing) {
          await sachService.update(this.form._id || this.form.MaSach, this.form);
          this.$refs.toast.show("Cập nhật sách thành công!");
        } else {
          await sachService.create(this.form);
          this.$refs.toast.show("Thêm sách mới thành công!");
        }
        this.showModal = false;
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể lưu thông tin sách.";
        this.$refs.toast.show(msg, "error");
      } finally {
        this.saving = false;
      }
    },
    async handleDelete(book) {
      if (!confirm(`Xác nhận xóa cuốn sách '${book.TenSach}' (${book.MaSach})?`)) return;
      try {
        await sachService.delete(book._id || book.MaSach);
        this.$refs.toast.show("Đã xóa cuốn sách.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể xóa sách.";
        this.$refs.toast.show(msg, "error", 4500);
      }
    }
  }
};
</script>
