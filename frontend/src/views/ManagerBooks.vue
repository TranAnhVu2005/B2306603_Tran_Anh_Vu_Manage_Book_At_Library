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
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Search Box -->
    <div class="ath-card p-3 mb-4">
      <div class="row align-items-center">
        <div class="col-md-6 mb-2 mb-md-0">
          <input type="text" class="form-control ath-input" v-model="search" placeholder="Lọc theo tên sách, tác giả, mã sách..." />
        </div>
        <div class="col-md-6 text-md-right small text-muted">
          Tổng số đầu sách: <strong>{{ books.length }}</strong> • Tổng số lượng trong kho: <strong>{{ totalQuantity }} quyển</strong>
        </div>
      </div>
    </div>

    <!-- Table of Books -->
    <div class="ath-card p-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="text-muted small mt-2">Đang tải danh sách sách...</p>
      </div>

      <div v-else-if="filteredBooks.length === 0" class="text-center py-5">
        <p class="text-muted mb-0">Không tìm thấy sách nào phù hợp.</p>
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
              <th>Tồn kho</th>
              <th>Đơn giá</th>
              <th class="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book._id">
              <td style="width: 50px;">
                <img :src="book.HinhAnh || defaultCover" 
                     :alt="book.TenSach"
                     class="rounded border" 
                     style="width: 38px; height: 50px; object-fit: cover;"
                     @error="e => e.target.src = defaultCover" />
              </td>
              <td class="font-mono-code font-weight-bold text-dark">{{ book.MaSach }}</td>
              <td>
                <strong class="font-serif-headline text-dark d-block">{{ book.TenSach }}</strong>
                <small class="text-muted font-italic">{{ book.TacGia }}</small>
              </td>
              <td><span class="badge badge-light border">{{ book.MaNXB }}</span></td>
              <td class="small">{{ book.NamXuatBan || '—' }}</td>
              <td>
                <span :class="book.SoQuyen > 0 ? 'text-success font-weight-bold' : 'text-danger font-weight-bold'">
                  {{ book.SoQuyen }} cuốn
                </span>
              </td>
              <td class="font-mono-code small">{{ formatCurrency(book.DonGia) }}</td>
              <td class="text-right">
                <button class="btn btn-sm btn-outline-secondary py-1 px-2 mr-1" @click="openEditModal(book)" title="Chỉnh sửa">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger py-1 px-2" @click="handleDelete(book)" title="Xóa sách">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Book Modal -->
    <div v-if="showModal" class="ath-modal-overlay" @click.self="showModal = false">
      <div class="ath-modal-content p-4" style="max-width: 600px;">
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
      defaultCover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
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
