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
          <div class="col-md-6 mb-2 mb-md-0">
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
          <div class="col-md-6 text-md-end small text-muted">
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
            <thead>
              <tr>
                <th>Bìa</th>
                <th style="min-width: 120px;">Mã</th>
                <th>Tên sách & Tác giả</th>
                <th>NXB</th>
                <th>Năm XB</th>
                <th style="min-width: 140px;">Tồn kho</th>
                <th style="min-width: 110px;">Đơn giá</th>
                <th class="text-end" style="min-width: 160px;">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in filteredBooks" :key="book._id">
                <td style="width: 50px;">
                  <div class="manager-book-thumbnail ath-book-spine">
                    <span class="manager-book-thumbnail-fallback" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        <path d="M8 7h8M8 11h8" />
                      </svg>
                    </span>
                    <img v-if="book.HinhAnh" :src="book.HinhAnh" :alt="book.TenSach"
                      @error="$event.target.style.opacity = '0'" />
                  </div>
                </td>
                <!-- Thêm text-nowrap để mã sách luôn nằm trên 1 dòng -->
                <td class="font-mono-code fw-bold text-dark text-nowrap">{{ book.MaSach }}</td>
                <td>
                  <strong class="font-serif-headline text-dark d-block" style="font-size: 0.95rem;">{{ book.TenSach
                  }}</strong>
                  <small class="text-muted fst-italic">{{ book.TacGia }}</small>
                </td>
                <td>
                  <span class="badge bg-light text-dark border" :title="book.MaNXB">
                    {{ getPublisherName(book.MaNXB) }}
                  </span>
                </td>
                <td class="small text-nowrap">{{ book.NamXuatBan || '—' }}</td>
                <td>
                  <!-- Quick Adjust Quantity (+ / -) -->
                  <div class="d-flex align-items-center">
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
                <!-- Thêm text-nowrap để giá tiền và ký hiệu đ không bị rớt dòng -->
                <td class="font-mono-code small text-nowrap">{{ formatCurrency(book.DonGia) }}</td>
                <!-- Bọc các nút hành động trong flex-nowrap để luôn nằm ngang, ngay ngắn -->
                <td class="text-end">
                  <div class="d-flex align-items-center justify-content-end gap-1 flex-nowrap">
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

            <div class="mb-2">
              <label class="small fw-bold mb-1">Đường dẫn ảnh bìa (URL):</label>
              <input type="url" class="ath-input" v-model="form.HinhAnh" placeholder="https://..." />
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
        TenSach: "",
        TacGia: "",
        MaNXB: "",
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
    getPublisherName(maNxb) {
      const p = this.publishers.find(item => item.MaNXB === maNxb);
      return p ? p.TENNXB : (maNxb || "—");
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
        TenSach: "",
        TacGia: "",
        MaNXB: this.publishers[0]?.MaNXB || "",
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
  min-width: 960px;
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
