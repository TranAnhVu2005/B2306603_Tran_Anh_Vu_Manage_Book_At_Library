<template>
  <div class="vg-page manager-catalog-page">
    <!-- Header Page -->
    <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <span class="vg-section-label">
          Quản Lý Kho Thư Viện
        </span>
        <h1 class="manager-page-title">
          Danh Mục Đầu Sách & Tồn Kho
        </h1>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button v-if="isAdmin" class="ath-btn-outline" type="button" @click="toggleDeletedView">
          {{ showDeleted ? "Xem sách đang hoạt động" : "Sách đã xóa mềm" }}
        </button>
        <button class="ath-btn-primary" @click="openCreateModal">
          <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm sách mới
        </button>
        <button class="ath-btn-outline" @click="fetchData">
          <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M5.6 9a7 7 0 0 1 11.9-2L20 12M4 12l2.5 5a7 7 0 0 0 11.9-2" />
          </svg>
          Làm mới
        </button>
      </div>
    </div>

    <!-- Search & Statistics Box -->
    <div class="vg-shell manager-filter-shell">
      <div class="vg-core p-3 p-md-4">
        <div class="row align-items-center">
          <div class="col-md-5 mb-2 mb-md-0">
            <div class="input-group">
              <span class="input-group-text bg-white" style="border-color: var(--paper-border);">
                <svg class="ui-icon text-muted" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4.5 4.5" />
                </svg>
              </span>
              <input type="text" class="form-control ath-input border-start-0" v-model="search"
                placeholder="Lọc theo tên sách, tác giả, mã sách, NXB..." />
              <button v-if="search" class="btn btn-outline-secondary" type="button" @click="search = ''"
                style="border-color: var(--paper-border);">
                <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>
          <div class="col-md-4 mb-2">
            <label class="small fw-bold mb-1" for="book-genre-filter">Lọc theo thể loại</label>
            <select id="book-genre-filter" class="ath-input" v-model="selectedGenre">
              <option value="all">Tất cả thể loại</option>
              <option v-for="genre in genres" :key="genre.MaTheLoai" :value="genre.MaTheLoai">{{ genre.TenTheLoai }}</option>
            </select>
          </div>
          <div class="col-md-3 text-md-end small text-muted">
            Tổng số đầu sách: <strong>{{ books.length }}</strong> • Tổng số lượng trong kho: <strong
              class="text-success">{{ totalQuantity }} quyển</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Table of Books -->
    <div class="vg-shell">
      <div class="vg-core p-3 p-md-4">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-success" role="status"></div>
          <p class="text-muted small mt-2">Đang tải danh sách sách...</p>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="text-center py-5">
          <svg class="ui-icon empty-state-icon text-muted mb-2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h8M8 11h8" />
          </svg>
          <h6 class="font-serif-headline fw-bold">Không tìm thấy sách nào phù hợp</h6>
          <p class="text-muted small mb-0">Vui lòng thử lại với từ khóa khác.</p>
        </div>

        <div v-else class="table-responsive manager-books-table-wrap">
          <table class="ath-table manager-books-table align-middle">
            <colgroup>
              <col class="manager-col-cover" />
              <col class="manager-col-code" />
              <col class="manager-col-content" />
              <col class="manager-col-catalog" />
              <col class="manager-col-edition" />
              <col class="manager-col-stock" />
              <col class="manager-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Bìa</th>
                <th>Mã sách</th>
                <th>Tên sách & Tác giả</th>
                <th>NXB / Thể loại</th>
                <th>Năm XB / Đơn giá</th>
                <th>Tồn kho</th>
                <th class="text-end manager-actions-heading">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in filteredBooks" :key="book._id" :class="{ 'manager-book-deleted-row': book.deleted }">
                <td style="width: 50px;">
                  <div class="manager-book-thumbnail ath-book-spine">
                    <span class="manager-book-thumbnail-fallback" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        <path d="M8 7h8M8 11h8" />
                      </svg>
                    </span>
                    <!-- Hiển thị ảnh bìa từ đường dẫn của server -->
                    <img v-if="book.HinhAnh" :src="assetUrl(book.HinhAnh)" :alt="book.TenSach"
                      @error="$event.target.style.opacity = '0'" />
                  </div>
                </td>
                <td class="font-mono-code fw-bold text-dark text-nowrap">{{ book.MaSach }}</td>
                <td>
                  <strong class="font-serif-headline text-dark d-block" style="font-size: 0.95rem;">{{ book.TenSach
                    }}</strong>
                  <span v-if="book.deleted" class="badge bg-secondary-subtle text-secondary-emphasis">Đã xóa mềm · {{ formatDate(book.DeletedAt) }}</span>
                  <small class="text-muted fst-italic">{{ book.TacGia }}</small>
                </td>
                <td>
                  <div class="manager-book-metadata">
                    <div class="manager-book-metadata-row" :title="getPublisherName(book.MaNXB)">
                      <span class="manager-book-metadata-label">NXB</span>
                      <span class="manager-book-metadata-value">{{ getPublisherName(book.MaNXB) }}</span>
                    </div>
                    <div class="manager-book-metadata-row" :title="getGenreName(book.MaTheLoai)">
                      <span class="manager-book-metadata-label">Thể loại</span>
                      <span class="manager-book-metadata-value">{{ getGenreName(book.MaTheLoai) }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="manager-book-edition">
                    <span class="manager-book-year">{{ book.NamXuatBan || '—' }}</span>
                    <span class="manager-book-price">{{ formatCurrency(book.DonGia) }}</span>
                  </div>
                </td>
                <td>
                  <span v-if="book.deleted" class="text-muted small">Đã ẩn khỏi mượn/tra cứu</span>
                  <div v-else class="d-flex align-items-center">
                    <button class="ath-action-btn py-0 px-2 me-1" :disabled="book.SoQuyen <= 0"
                      @click="quickAdjustStock(book, -1)" title="Bớt 1 cuốn">
                      -
                    </button>
                    <span class="fw-bold font-mono-code mx-1"
                      :class="book.SoQuyen > 0 ? 'text-success' : 'text-danger'">
                      {{ book.SoQuyen }}
                    </span>
                    <button class="ath-action-btn py-0 px-2 ms-1" @click="quickAdjustStock(book, 1)"
                      title="Thêm 1 cuốn">
                      +
                    </button>
                  </div>
                </td>
                <td class="text-end manager-actions-cell">
                  <div class="d-flex align-items-center justify-content-end gap-1 flex-nowrap">
                    <button v-if="book.deleted && isAdmin" class="ath-action-btn px-2" @click="restoreBook(book)" title="Khôi phục sách">
                      <i class="fas fa-rotate-left" aria-hidden="true"></i> Khôi phục
                    </button>
                    <template v-else-if="!book.deleted">
                    <button class="ath-action-btn px-2" @click="openEditModal(book)" title="Chỉnh sửa">
                      <svg class="ui-icon text-secondary" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                      </svg> Sửa
                    </button>
                    <button class="ath-action-btn ath-action-btn-danger px-2" @click="handleDelete(book)"
                      title="Xóa sách">
                      <svg class="ui-icon text-danger" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                      </svg> Xóa
                    </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit Book Modal -->
    <div v-if="showModal" class="ath-modal-overlay" @click.self="showModal = false">
      <div class="ath-modal-content manager-book-modal" style="max-width: 620px;">
        <div class="ath-modal-inner manager-modal-inner">
          <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
            <h2 class="font-serif-headline fw-bold mb-0 manager-modal-title">
              {{ isEditing ? 'Chỉnh Sửa Thông Tin Sách' : 'Thêm Sách Mới Vào Kho' }}
            </h2>
            <button type="button" class="btn-close" aria-label="Đóng" @click="showModal = false"></button>
          </div>

          <form @submit.prevent="saveBook">
            <div class="row">
              <div class="col-md-8 mb-2">
                <label class="small fw-bold mb-1">Tên cuốn sách:</label>
                <input type="text" class="ath-input" v-model="form.TenSach" placeholder="VD: Lập trình Vue 3..."
                  required />
              </div>
            </div>

            <div class="mb-2">
              <label class="small fw-bold mb-1" for="book-genre">Thể loại:</label>
              <select id="book-genre" class="ath-input" v-model="form.MaTheLoai" required>
                <option disabled value="">Chọn thể loại</option>
                <option v-for="genre in genres" :key="genre.MaTheLoai" :value="genre.MaTheLoai">{{ genre.TenTheLoai }}</option>
              </select>
            </div>

            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="small fw-bold mb-1">Tác giả:</label>
                <input type="text" class="ath-input" v-model="form.TacGia" placeholder="VD: Nguyễn Văn A" required />
              </div>
              <div class="col-md-6 mb-2">
                <label class="small fw-bold mb-1">Nhà xuất bản:</label>
                <select class="ath-input" v-model="form.MaNXB" required>
                  <option v-for="nxb in publishers" :key="nxb.MaNXB" :value="nxb.MaNXB">
                    {{ nxb.TENNXB }} ({{ nxb.MaNXB }})
                  </option>
                </select>
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-2">
                <label class="small fw-bold mb-1">Số quyển tồn kho:</label>
                <input type="number" class="ath-input" min="0" v-model.number="form.SoQuyen" required />
              </div>
              <div class="col-md-4 mb-2">
                <label class="small fw-bold mb-1">Đơn giá (VND):</label>
                <input type="number" class="ath-input" min="0" step="1000" v-model.number="form.DonGia" required />
              </div>
              <div class="col-md-4 mb-2">
                <label class="small fw-bold mb-1">Năm XB:</label>
                <input type="number" class="ath-input" min="1900" max="2030" v-model.number="form.NamXuatBan" />
              </div>
            </div>

            <!-- Trường tải ảnh lên thay cho thẻ input URL cũ -->
            <div class="mb-2">
              <label class="small fw-bold mb-1">Ảnh bìa sách (Tải lên từ thiết bị):</label>
              <!-- Thuộc tính accept="image/*" giới hạn chỉ được chọn các file ảnh -->
              <input type="file" ref="fileInput" class="form-control ath-input" style="padding: 0.5rem 1rem;"
                accept="image/*" @change="onFileChange" />

              <!-- Hiển thị gợi ý nếu đang ở trạng thái sửa sách và đã có ảnh cũ -->
              <div v-if="isEditing && form.HinhAnh && !selectedFile" class="mt-2 small text-muted">
                Đang sử dụng ảnh bìa hiện tại. Chọn file mới nếu muốn thay đổi.
              </div>
              <!-- Hiển thị tên file sau khi chọn xong -->
              <div v-if="selectedFile" class="mt-2 small text-success">
                Đã chọn: {{ selectedFile.name }}
              </div>
            </div>

            <div class="mb-3">
              <label class="small fw-bold mb-1">Tóm tắt nội dung:</label>
              <textarea class="ath-input" rows="2" v-model="form.MoTa" placeholder="Giới thiệu sơ lược..."></textarea>
            </div>

            <div class="d-flex justify-content-end align-items-center pt-2 border-top">
              <button type="button" class="ath-btn-outline me-2" @click="showModal = false">Hủy</button>
              <button type="submit" class="ath-btn-primary" :disabled="saving">
                <span v-if="saving" class="vg-spinner vg-spinner-inline me-1" aria-hidden="true"></span>
                {{ isEditing ? 'Cập Nhật' : 'Lưu Sách Mới' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "../components/ToastNotification.vue";
import sachService from "../services/sach.service";
import nxbService from "../services/nhaxuatban.service";
import theloaiService from "../services/theloai.service";
import authService from "../services/auth.service";

export default {
  name: "ManagerBooks",
  components: {
    ToastNotification,
  },
  data() {
    return {
      books: [],
      publishers: [],
      genres: [],
      loading: false,
      search: "",
      selectedGenre: "all",
      showDeleted: false,
      showModal: false,
      isEditing: false,
      saving: false,
      selectedFile: null, // Lưu trữ file ảnh người dùng vừa chọn
      form: {
        TenSach: "",
        TacGia: "",
        MaNXB: "",
        MaTheLoai: "",
        SoQuyen: 5,
        DonGia: 85000,
        NamXuatBan: 2024,
        HinhAnh: "",
        MoTa: "",
      },
    };
  },
  computed: {
    isAdmin() { return authService.isAdmin(); },
    totalQuantity() {
      return this.books.filter((book) => !book.deleted).reduce((acc, book) => acc + (book.SoQuyen || 0), 0);
    },
    filteredBooks() {
      const selectedBooks = this.selectedGenre === "all" ? this.books : this.books.filter((book) => book.MaTheLoai === this.selectedGenre);
      if (!this.search.trim()) return selectedBooks;
      const q = this.search.toLowerCase();
      return selectedBooks.filter(b =>
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
    assetUrl(path) {
      if (typeof path !== "string") return "";
      if (/^https:\/\//i.test(path)) return path;
      if (!path.startsWith("/uploads/")) return "";
      return `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${path}`;
    },
    handleKeyDown(e) {
      if (e.key === "Escape") this.showModal = false;
    },
    async fetchData() {
      this.loading = true;
      try {
        const [booksRes, nxbRes, genresRes] = await Promise.all([
          sachService.getAll(this.showDeleted && this.isAdmin ? { includeDeleted: "true" } : {}),
          nxbService.getAll(),
          theloaiService.getAll(),
        ]);
        this.books = booksRes;
        this.publishers = nxbRes;
        this.genres = genresRes;
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
    formatDate(value) {
      return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value)) : "";
    },
    toggleDeletedView() {
      this.showDeleted = !this.showDeleted;
      this.fetchData();
    },
    async restoreBook(book) {
      if (!confirm(`Khôi phục sách '${book.TenSach}' (${book.MaSach}) vào danh mục đang hoạt động?`)) return;
      try {
        await sachService.restore(book._id || book.MaSach);
        this.$refs.toast.show("Đã khôi phục sách.");
        this.fetchData();
      } catch (err) {
        this.$refs.toast.show(err.response?.data?.message || "Không thể khôi phục sách.", "error");
      }
    },
    getPublisherName(maNxb) {
      const p = this.publishers.find(item => item.MaNXB === maNxb);
      return p ? p.TENNXB : (maNxb || "—");
    },
    getGenreName(code) {
      return this.genres.find((genre) => genre.MaTheLoai === code)?.TenTheLoai || "Chưa phân loại";
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

    // Hàm bắt sự kiện khi người dùng chọn file ảnh
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      } else {
        this.selectedFile = null;
      }
    },

    openCreateModal() {
      this.isEditing = false;
      this.selectedFile = null; // Làm trống file đã chọn
      if (this.$refs.fileInput) this.$refs.fileInput.value = ""; // Xóa hiển thị tên file ở input

      this.form = {
        TenSach: "",
        TacGia: "",
        MaNXB: this.publishers[0]?.MaNXB || "",
        MaTheLoai: this.genres[0]?.MaTheLoai || "",
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
      this.selectedFile = null; // Làm trống file đã chọn
      if (this.$refs.fileInput) this.$refs.fileInput.value = ""; // Xóa hiển thị tên file ở input

      this.form = { ...book };
      this.showModal = true;
    },

    // Tinh chỉnh hàm lưu để sử dụng FormData thay vì JSON thông thường
    async saveBook() {
      this.saving = true;
      try {
        // Tạo một đối tượng FormData để chứa dữ liệu text và file nhị phân (hình ảnh)
        const formData = new FormData();
        formData.append("TenSach", this.form.TenSach);
        formData.append("TacGia", this.form.TacGia);
        formData.append("MaNXB", this.form.MaNXB);
        formData.append("MaTheLoai", this.form.MaTheLoai);
        formData.append("SoQuyen", this.form.SoQuyen);
        formData.append("DonGia", this.form.DonGia);

        if (this.form.NamXuatBan) formData.append("NamXuatBan", this.form.NamXuatBan);
        if (this.form.MoTa) formData.append("MoTa", this.form.MoTa);

        // Đính kèm file vật lý nếu người dùng có chọn file
        if (this.selectedFile) {
          formData.append("HinhAnh", this.selectedFile);
        }

        // Backend Axios ở `sach.service.js` sẽ tự động cấu hình multipart/form-data
        if (this.isEditing) {
          await sachService.update(this.form._id || this.form.MaSach, formData);
          this.$refs.toast.show("Cập nhật sách thành công!");
        } else {
          await sachService.create(formData);
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
        this.$refs.toast.show("Đã chuyển sách sang trạng thái xóa mềm.");
        this.fetchData();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể xóa sách.";
        this.$refs.toast.show(msg, "error", 4500);
      }
    }
  }
};
</script>

<style scoped>
.manager-catalog-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  min-width: 0;
}

.manager-catalog-page>* {
  min-width: 0;
}

.manager-page-title {
  margin: 0;
  color: var(--ink-primary);
  font-family: var(--font-serif);
  font-size: clamp(1.55rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.manager-filter-shell {
  margin-bottom: 0.25rem;
}

.manager-book-modal {
  padding: 6px;
}

.manager-modal-inner {
  padding: 1.5rem;
}

.manager-modal-title {
  font-size: clamp(1.1rem, 3vw, 1.35rem);
}

.manager-books-table-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.manager-books-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.manager-books-table th,
.manager-books-table td {
  overflow-wrap: anywhere;
}

.manager-books-table th {
  white-space: normal;
}

.manager-col-cover { width: 58px; }
.manager-col-code { width: 118px; }
.manager-col-content { width: 20%; }
.manager-col-catalog { width: 23%; }
.manager-col-edition { width: 15%; }
.manager-col-stock { width: 112px; }
.manager-col-actions { width: 188px; }

.manager-book-metadata,
.manager-book-edition {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}

.manager-book-metadata-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
}

.manager-book-metadata-label {
  flex: 0 0 auto;
  color: var(--ink-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.manager-book-metadata-value {
  min-width: 0;
  overflow: hidden;
  color: var(--ink-primary);
  font-size: 0.8rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manager-book-year,
.manager-book-price {
  white-space: nowrap;
}

.manager-book-year {
  color: var(--ink-muted);
  font-size: 0.78rem;
}

.manager-book-price {
  color: var(--ink-primary);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
}

.manager-actions-heading,
.manager-actions-cell {
  position: sticky;
  right: 0;
  z-index: 2;
  background: var(--paper, #fffdf2);
  box-shadow: -5px 0 0 -3px var(--ink-primary, #111);
}

.manager-actions-heading {
  z-index: 3;
}

.manager-actions-cell > div {
  justify-content: flex-end;
  flex-wrap: wrap !important;
  row-gap: 0.4rem;
}

@media (max-width: 1199.98px) {
  .manager-books-table {
    min-width: 980px;
  }
}

.manager-book-thumbnail {
  position: relative;
  width: 38px;
  height: 50px;
  overflow: hidden;
  background: var(--paper-subtle);
}

.manager-book-thumbnail-fallback,
.manager-book-thumbnail img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.empty-state-icon {
  width: 2.5rem;
  height: 2.5rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.vg-spinner-inline {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

.manager-book-thumbnail-fallback {
  display: grid;
  place-items: center;
  color: var(--ink-muted);
}

.manager-book-thumbnail-fallback svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.manager-book-thumbnail img {
  object-fit: cover;
  transition: opacity 0.5s var(--ease-spring);
}

@media (max-width: 575.98px) {
  .manager-modal-inner {
    padding: 1rem;
  }

  .manager-catalog-page {
    gap: 1rem;
  }
}
</style>
