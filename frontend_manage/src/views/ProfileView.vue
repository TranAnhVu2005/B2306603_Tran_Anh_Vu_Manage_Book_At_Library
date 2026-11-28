<template>
  <div class="vg-page">
    <div>
      <!-- ===== PAGE HEADER ===== -->
      <div class="vg-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 reveal" data-reveal>
        <div>
          <span class="vg-section-label">Hồ Sơ Nhân Viên</span>
          <h1 class="page-title">Thông Tin Tài Khoản</h1>
        </div>
      </div>

      <!-- Not logged in -->
      <div v-if="!currentUser" class="vg-shell reveal" data-reveal
        style="max-width: 480px; margin: 4rem auto; text-align: center;">
        <div class="vg-core empty-state">
          <div class="empty-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 class="empty-title">Vui lòng đăng nhập</h2>
          <p class="empty-sub">Bạn cần đăng nhập để xem thông tin hồ sơ của mình.</p>
          <router-link to="/login" class="ath-btn-primary text-decoration-none">
            Đăng nhập ngay
            <span class="btn-island" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </router-link>
        </div>
      </div>

      <!-- Main content -->
      <div v-else class="profile-layout">
        <!-- ===== LEFT: Staff Card ===== -->
        <aside class="reveal" data-reveal>
          <div class="vg-shell reader-card-shell">
            <div class="vg-core reader-card">
              <div class="reader-card-top">
                <div class="vg-avatar shadow-sm overflow-hidden">
                  <img v-if="profileAvatarUrl" :src="profileAvatarUrl" :alt="displayName" class="profile-avatar-img"
                    @error="onAvatarError" />
                  <span v-else>{{ userInitials }}</span>
                </div>
                <h2 class="reader-name">{{ displayName }}</h2>
                <span class="reader-code font-mono-code">Mã nhân viên: {{ staffInfo?.MSNV || currentUser.MSNV }}</span>
                <span class="ath-badge mt-3" :class="isAdmin ? 'ath-badge-out' : 'ath-badge-available'">
                  {{ isAdmin ? "QUẢN TRỊ VIÊN" : "THỦ THƯ" }}
                </span>
              </div>

              <div class="reader-info-list">
                <div class="reader-info-row">
                  <span class="reader-info-label">Số điện thoại</span>
                  <span class="reader-info-val font-mono-code">{{ staffInfo?.SoDienThoai || "—" }}</span>
                </div>
                <div class="reader-info-row border-0">
                  <span class="reader-info-label">Địa chỉ</span>
                  <span class="reader-info-val reader-address text-truncate" :title="staffInfo?.DiaChi">{{
                    staffInfo?.DiaChi || "—" }}</span>
                </div>
              </div>

              <button v-if="staffInfo?._id" class="ath-btn-outline profile-edit-button" type="button"
                @click="openProfileEditor">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </aside>

        <!-- ===== RIGHT: Staff Account Details ===== -->
        <div class="borrows-panel reveal reveal-d1" data-reveal>
          <div class="vg-shell">
            <div class="vg-core p-4 p-md-5">
              <span class="vg-section-label">Tài khoản nhân viên</span>
              <h2 class="panel-title mb-2">Thông tin cơ bản</h2>
              <p class="empty-sub mb-4 text-start">
                Bạn có thể tự cập nhật họ tên, số điện thoại, địa chỉ và ảnh đại diện. Mã nhân viên và chức vụ được quản
                lý
                riêng, không thể thay đổi tại trang cá nhân.
              </p>
              <div class="reader-info-list border-top pt-3">
                <div class="reader-info-row">
                  <span class="reader-info-label">Mã nhân viên</span>
                  <span class="reader-info-val font-mono-code">{{ staffInfo?.MSNV || "—" }}</span>
                </div>
                <div class="reader-info-row border-0">
                  <span class="reader-info-label">Chức vụ</span>
                  <span class="reader-info-val fw-semibold">
                    {{ staffInfo?.ChucVu === "ADMIN" ? "Quản trị viên" : "Thủ thư" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile editor modal -->
    <div v-if="showEditProfileModal" class="ath-modal-overlay" @click.self="closeProfileEditor">
      <div class="ath-modal-content profile-editor-modal shadow-lg" role="dialog" aria-modal="true"
        aria-labelledby="profile-editor-title">
        <div class="ath-modal-inner">
          <div class="modal-head">
            <div>
              <span class="vg-section-label">Thông tin cá nhân</span>
              <h2 id="profile-editor-title" class="modal-title">Chỉnh sửa hồ sơ</h2>
            </div>
            <button type="button" class="modal-close" @click="closeProfileEditor" aria-label="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form class="modal-body profile-editor-form" @submit.prevent="saveProfile">

            <!-- Khu vực tải ảnh đại diện -->
            <div class="profile-avatar-upload-section mb-4 text-center">
              <div class="vg-avatar shadow-sm mx-auto mb-2 overflow-hidden position-relative"
                style="width: 84px; height: 84px; font-size: 1.8rem;">
                <img v-if="avatarPreview || profileAvatarUrl" :src="avatarPreview || profileAvatarUrl"
                  alt="Ảnh đại diện xem trước" class="profile-avatar-img" @error="onEditorAvatarError" />
                <span v-else>{{ userInitials }}</span>
              </div>
              <div>
                <label class="ath-btn-outline btn-sm d-inline-flex align-items-center gap-1 style-pointer mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Tải ảnh đại diện mới
                  <input type="file" ref="avatarInput" accept="image/jpeg,image/png,image/webp" class="d-none" @change="onAvatarChange" />
                </label>
              </div>
              <div v-if="selectedAvatarFile" class="small text-success mt-1 fw-semibold">
                Đã chọn: {{ selectedAvatarFile.name }}
              </div>
            </div>

            <div class="profile-form-grid">
              <label class="profile-form-field profile-form-field-wide">
                <span>Họ và tên</span>
                <input v-model.trim="profileForm.HoTenNV" class="ath-input" type="text" autocomplete="name" required
                  maxlength="150" />
              </label>
              <label class="profile-form-field profile-form-field-wide">
                <span>Số điện thoại</span>
                <input v-model.trim="profileForm.SoDienThoai" class="ath-input" type="tel" autocomplete="tel"
                  maxlength="20" />
              </label>
              <label class="profile-form-field profile-form-field-wide">
                <span>Địa chỉ</span>
                <input v-model.trim="profileForm.DiaChi" class="ath-input" type="text" autocomplete="street-address"
                  maxlength="250" />
              </label>
            </div>
            <p class="profile-editor-note">Mã nhân viên và chức vụ không thể chỉnh sửa tại đây.</p>
            <div class="profile-editor-actions">
              <button class="ath-btn-outline" type="button" :disabled="savingProfile"
                @click="closeProfileEditor">Hủy</button>
              <button class="ath-btn-primary" type="submit" :disabled="savingProfile">
                {{ savingProfile ? "Đang lưu..." : "Lưu thay đổi" }}
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
import authService from "../services/auth.service";
import nhanVienService from "../services/nhanvien.service";
import { prepareImageUpload } from "../utils/image-upload.util";

export default {
  name: "ProfileView",
  components: { ToastNotification },
  data() {
    return {
      currentUser: null,
      staffInfo: null,
      loading: false,
      showEditProfileModal: false,
      savingProfile: false,
      selectedAvatarFile: null,
      avatarPreview: null,
      avatarLoadError: false,
      avatarSelectionVersion: 0,
      previousBodyOverflow: "",
      profileForm: {
        HoTenNV: "",
        DiaChi: "",
        SoDienThoai: "",
      },
      revealObserver: null,
    };
  },
  computed: {
    isAdmin() {
      return authService.isAdmin(this.staffInfo);
    },
    displayName() {
      return authService.getDisplayName(this.staffInfo || this.currentUser);
    },
    userInitials() {
      if (!this.currentUser) return "NV";
      const name = this.displayName || this.currentUser.MSNV || "";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    },
    profileAvatarUrl() {
      if (this.avatarLoadError) return "";
      const path = this.staffInfo?.AnhDaiDien || this.currentUser?.AnhDaiDien;
      if (!path) return "";
      if (path.startsWith("https://")) return path;
      if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) return "";
      return `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${path}`;
    },
  },
  watch: {
    showEditProfileModal(isOpen) {
      if (isOpen) {
        this.previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", this.handleProfileEditorKeydown);
      } else {
        document.body.style.overflow = this.previousBodyOverflow;
        document.removeEventListener("keydown", this.handleProfileEditorKeydown);
      }
    },
  },
  created() {
    this.currentUser = authService.getUser();
    if (this.currentUser) this.fetchData();
  },
  mounted() { this.initReveal(); },
  beforeUnmount() {
    if (this.revealObserver) this.revealObserver.disconnect();
    this.releaseAvatarPreview();
    if (this.showEditProfileModal) {
      document.body.style.overflow = this.previousBodyOverflow;
      document.removeEventListener("keydown", this.handleProfileEditorKeydown);
    }
  },
  methods: {
    initReveal() {
      if (this.revealObserver) this.revealObserver.disconnect();
      this.revealObserver = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); this.revealObserver.unobserve(e.target); } }),
        { threshold: 0.08 }
      );
      this.$el.querySelectorAll("[data-reveal]").forEach(el => this.revealObserver.observe(el));
    },
    async fetchData() {
      this.loading = true;
      this.avatarLoadError = false;
      try {
        const user = await authService.fetchMe();
        if (!user) throw new Error("Không thể tải hồ sơ người dùng.");
        this.currentUser = user;
        this.staffInfo = user;
      } catch (err) {
        this.$refs.toast?.show(err.response?.data?.message || err.message || "Lỗi khi tải thông tin hồ sơ.", "error");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initReveal());
      }
    },
    onAvatarError() {
      this.avatarLoadError = true;
    },
    onEditorAvatarError() {
      if (this.avatarPreview) {
        this.selectedAvatarFile = null;
        this.releaseAvatarPreview();
        if (this.$refs.avatarInput) this.$refs.avatarInput.value = "";
        this.$refs.toast?.show("Trình duyệt không thể xem trước ảnh. Hãy chọn lại tệp JPEG, PNG hoặc WebP hợp lệ.", "error");
      } else {
        this.avatarLoadError = true;
      }
    },
    releaseAvatarPreview() {
      this.avatarPreview = null;
    },
    async onAvatarChange(event) {
      const file = event.target.files[0];
      const version = ++this.avatarSelectionVersion;
      if (!file) return;

      try {
        const { file: normalizedFile, previewUrl } = await prepareImageUpload(file);
        if (version !== this.avatarSelectionVersion) return;
        this.releaseAvatarPreview();
        this.selectedAvatarFile = normalizedFile;
        this.avatarPreview = previewUrl;
        this.avatarLoadError = false;
      } catch (error) {
        if (version !== this.avatarSelectionVersion) return;
        this.releaseAvatarPreview();
        this.selectedAvatarFile = null;
        event.target.value = "";
        this.$refs.toast?.show(error.message || "Không thể đọc tệp ảnh đã chọn.", "error");
      }
    },
    openProfileEditor() {
      const profile = this.staffInfo;
      if (!profile?._id) {
        this.$refs.toast?.show("Không tìm thấy định danh hồ sơ để cập nhật.", "error");
        return;
      }
      this.selectedAvatarFile = null;
      this.releaseAvatarPreview();
      if (this.$refs.avatarInput) this.$refs.avatarInput.value = "";

      this.profileForm = {
        HoTenNV: profile.HoTenNV || "",
        SoDienThoai: profile.SoDienThoai || "",
        DiaChi: profile.DiaChi || "",
      };
      this.showEditProfileModal = true;
    },
    closeProfileEditor() {
      if (!this.savingProfile) {
        this.showEditProfileModal = false;
        this.selectedAvatarFile = null;
        this.releaseAvatarPreview();
      }
    },
    handleProfileEditorKeydown(event) {
      if (event.key === "Escape") this.closeProfileEditor();
    },
    async saveProfile() {
      this.savingProfile = true;
      try {
        const profile = this.staffInfo;
        const formData = new FormData();

        formData.append("HoTenNV", this.profileForm.HoTenNV);
        if (this.profileForm.SoDienThoai) formData.append("SoDienThoai", this.profileForm.SoDienThoai);
        if (this.profileForm.DiaChi) formData.append("DiaChi", this.profileForm.DiaChi);

        if (this.selectedAvatarFile) {
          formData.append("AnhDaiDien", this.selectedAvatarFile);
        }

        const result = await nhanVienService.update(profile._id, formData);

        if (!result?.data) throw new Error("Máy chủ không trả về hồ sơ sau khi cập nhật.");

        this.staffInfo = result.data;
        this.currentUser = result.data;
        authService.setUser(result.data);
        this.avatarLoadError = false;

        this.showEditProfileModal = false;
        this.selectedAvatarFile = null;
        this.releaseAvatarPreview();
        this.$refs.toast?.show(result.message || "Cập nhật hồ sơ thành công.");
      } catch (err) {
        this.$refs.toast?.show(err.response?.data?.message || err.message || "Không thể cập nhật hồ sơ.", "error");
      } finally {
        this.savingProfile = false;
      }
    },
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

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.style-pointer {
  cursor: pointer;
}

/* Layout */
.profile-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 1.75rem;
  align-items: flex-start;
}

.profile-layout>* {
  min-width: 0;
}

.borrows-panel {
  min-width: 0;
}

@media (max-width: 991px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

/* Reader card */
.reader-card-shell {
  height: 100%;
}

.reader-card {
  padding: 2rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.profile-edit-button {
  width: 100%;
  margin-top: 1.25rem;
  border-radius: 999px !important;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s var(--ease-spring);
}

.reader-card-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--paper-border);
  margin-bottom: 1.25rem;
}

.vg-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark, #0d3b2c));
  color: #fff;
  font-family: var(--font-serif);
  font-size: 1.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(15, 44, 34, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.reader-name {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0.95rem 0 0.25rem;
  line-height: 1.3;
}

.reader-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-muted);
  background: var(--paper-subtle, #f4f6f4);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--paper-border);
}

.reader-info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.reader-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--paper-border);
  font-size: 0.85rem;
  gap: 0.75rem;
}

.reader-info-label {
  color: var(--ink-muted);
  flex-shrink: 0;
  font-weight: 500;
}

.reader-info-val {
  min-width: 0;
  color: var(--ink-primary);
  font-weight: 600;
  overflow-wrap: anywhere;
  text-align: right;
}

.reader-address {
  max-width: 170px;
}

.text-danger {
  color: var(--status-out) !important;
}

.text-warning {
  color: var(--status-scarce) !important;
}

.text-success {
  color: var(--status-available) !important;
}

.danh-sach-den-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: 1.25rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: #FDF2F1;
  color: var(--status-out);
  font-size: 0.78rem;
  line-height: 1.55;
  box-shadow: inset 0 0 0 1px rgba(143, 40, 34, 0.18);
}

/* Borrows panel */
.borrows-tabs {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--paper-border);
  background: rgba(248, 250, 248, 0.5);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 0.65rem;
  background: rgba(255, 255, 255, 0.25);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.vg-tab.is-active .tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.vg-tab:not(.is-active) .tab-count {
  background: var(--paper-border);
  color: var(--ink-muted);
}

.borrows-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1.5rem;
  gap: 0.85rem;
  text-align: center;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--paper-subtle, #f4f6f4);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--paper-border);
}

.state-text {
  font-size: 0.9rem;
  color: var(--ink-muted);
  margin: 0;
}

.borrows-table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

/* Table polishing */
.ath-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.ath-table th {
  background: var(--paper-subtle, #f8faf8);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--paper-border);
}

.ath-table td {
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid var(--paper-border);
  background: #fff;
}

.ath-table tbody tr:last-child td {
  border-bottom: none;
}

.ath-table tbody tr {
  transition: background-color 0.2s ease;
}

.ath-table tbody tr:hover td {
  background-color: rgba(248, 250, 248, 0.8);
}

.book-link {
  text-decoration: none;
  color: var(--ink-primary);
  font-size: 0.9rem;
  font-family: var(--font-serif);
  font-weight: 600;
  transition: color 0.25s;
  display: block;
}

.book-link:hover {
  color: var(--primary);
}

.overdue-text {
  color: var(--status-out);
  font-weight: 700;
}

.boi-thuong {
  font-size: 0.82rem;
  color: var(--status-out);
  margin-top: 0.3rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4.5rem 2rem;
  gap: 1.1rem;
}

.empty-title {
  font-family: var(--font-serif);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0;
}

.empty-sub {
  font-size: 0.9rem;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.5;
}

/* Modal */
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.35rem 1.75rem;
  border-bottom: 1px solid var(--paper-border);
  background: rgba(248, 250, 248, 0.6);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--paper-border);
  background: #fff;
  cursor: pointer;
  color: var(--ink-secondary);
  transition: all 0.25s var(--ease-spring);
}

.modal-close:hover {
  background: var(--paper-subtle);
  color: var(--ink-primary);
  transform: scale(1.05);
}

.modal-body {
  padding: 1.75rem;
}

.modal-sub {
  font-size: 0.86rem;
  color: var(--ink-muted);
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.profile-editor-modal {
  width: min(100% - 2rem, 640px);
}

.profile-editor-form {
  padding: 1.5rem 1.75rem 1.75rem;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.15rem;
}

.profile-form-field {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
  color: var(--ink-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.profile-form-field-wide {
  grid-column: 1 / -1;
}

.profile-form-field .ath-input {
  min-width: 0;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--paper-border);
  transition: all 0.2s ease;
}

.profile-form-field .ath-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(15, 44, 34, 0.12);
}

.profile-editor-note {
  margin: 1.25rem 0 0;
  color: var(--ink-muted);
  font-size: 0.78rem;
  line-height: 1.6;
  background: var(--paper-subtle, #f8faf8);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px dashed var(--paper-border);
}

.profile-editor-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--paper-border);
}

.profile-editor-actions button {
  border-radius: 999px !important;
  padding: 0.6rem 1.4rem;
  font-weight: 600;
}

.profile-editor-actions button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.qr-wrap {
  display: inline-block;
  padding: 1.25rem;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06), inset 0 0 0 1px var(--paper-border);
  margin-bottom: 1rem;
}

.btn-island {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  flex-shrink: 0;
  transition: transform 0.5s var(--ease-spring), background 0.4s;
}

.ath-btn-primary:hover .btn-island {
  transform: translate(2px, -1px) scale(1.08);
  background: rgba(255, 255, 255, 0.22);
}

@media (max-width: 575.98px) {
  .vg-page-header {
    align-items: flex-start !important;
  }

  .page-title {
    font-size: clamp(1.45rem, 7vw, 1.8rem);
  }

  .reader-card {
    padding: 1.5rem 1.15rem;
  }

  .reader-address {
    max-width: 55%;
  }

  .borrows-tabs {
    padding: 0.85rem;
  }

  .borrows-tabs .vg-tabs {
    gap: 0.35rem;
  }

  .borrows-tabs .vg-tab {
    padding-inline: 0.7rem;
  }

  .profile-editor-form {
    padding: 1.15rem;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
  }

  .profile-form-field-wide {
    grid-column: auto;
  }

  .profile-editor-actions {
    flex-direction: column-reverse;
  }

  .profile-editor-actions button {
    width: 100%;
  }
}
</style>
