<template>
  <header class="header-shell w-100 border-bottom sticky-top shadow-sm"
    style="border-color: var(--paper-border) !important;">
    <!-- Top Announcement Bar (Hero Banner phong cách học thuật hiện đại) -->
    <div class="w-100 py-4 px-3 text-white announcement-banner">
      <div class="container d-flex justify-content-between align-items-center">
        <!-- Tiêu đề hệ thống với kích thước linh hoạt theo màn hình -->
        <div class="text-truncate pe-2">
          <span class="fw-bold text-uppercase banner-text-shadow banner-title d-inline-flex align-items-center">
            <i class="fas fa-university me-2.5 banner-mark"></i>
            <span class="d-none d-sm-inline">Library Book Management System</span>
            <span class="d-inline d-sm-none">Library</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="container header-navigation-shell py-2.5 align-items-center position-relative">
      <!-- Cột 1: Brand Logo & Nhận diện thương hiệu -->
      <div class="header-brand d-flex align-items-center">
        <router-link to="/"
          class="d-flex align-items-center justify-content-center text-decoration-none ath-brand-logo-btn"
          title="Trang chủ Thư viện Học thuật">
          <img src="@/assets/library_logo.png" alt="Logo Thư Viện" class="ath-header-logo" style="
              width: 42px;
              height: 42px;
              object-fit: contain;
              filter: drop-shadow(0 2px 6px rgba(20, 53, 41, 0.16));
              transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            " />
        </router-link>
      </div>

      <!-- Cột 2: Cụm điều hướng chính (Căn giữa thanh thoát) -->
      <nav class="header-primary-nav d-none d-lg-flex align-items-center" style="gap: 0.35rem;">
        <!-- Tra cứu sách -->
        <router-link to="/" class="ath-nav-link text-nowrap d-inline-flex align-items-center"
          active-class="active fw-semibold text-primary bg-light" exact>
          Tra cứu sách
        </router-link>

        <!-- Hồ sơ cá nhân -->
        <router-link v-if="user" to="/profile" class="ath-nav-link text-nowrap d-inline-flex align-items-center"
          active-class="active fw-semibold text-primary bg-light">
          Hồ sơ cá nhân
        </router-link>

        <!-- Dropdown Nghiệp vụ Thủ thư -->
        <div v-if="isStaffOrAdmin" class="dropdown ath-nav-item" ref="managerDropdown">
          <button
            class="ath-nav-link text-nowrap dropdown-toggle bg-transparent border-0 d-inline-flex align-items-center"
            :class="{ 'active fw-semibold text-primary bg-light': isManagerActive }" type="button"
            @click="toggleManagerMenu" aria-expanded="isManagerMenuOpen">
            Nghiệp vụ thủ thư
          </button>
          <div class="dropdown-menu shadow-lg border-0 mt-2 rounded-3 p-2 animate-fade"
            :class="{ show: isManagerMenuOpen }" style="min-width: 230px;">
            <router-link to="/manager/borrows" class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center"
              @click="isManagerMenuOpen = false">
              <i class="fas fa-clipboard-check me-2 text-success" style="width: 18px"></i>
              Duyệt mượn & Trả sách
            </router-link>
            <router-link to="/manager/books" class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center"
              @click="isManagerMenuOpen = false">
              <i class="fas fa-layer-group me-2 text-primary" style="width: 18px"></i>
              Quản lý kho sách
            </router-link>
            <router-link to="/manager/publishers" class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center"
              @click="isManagerMenuOpen = false">
              <i class="fas fa-building me-2 text-secondary" style="width: 18px"></i>
              Quản lý Nhà xuất bản
            </router-link>
          </div>
        </div>

        <!-- Dropdown Quản trị Hệ thống -->
        <div v-if="isAdmin" class="dropdown ath-nav-item" ref="adminDropdown">
          <button
            class="ath-nav-link text-nowrap dropdown-toggle bg-transparent border-0 d-inline-flex align-items-center fw-bold text-danger"
            :class="{ 'active bg-light': isAdminActive }" type="button" @click="toggleAdminMenu"
            aria-expanded="isAdminMenuOpen">
            Quản trị người dùng
          </button>
          <div class="dropdown-menu shadow-lg border-0 mt-2 rounded-3 p-2 animate-fade"
            :class="{ show: isAdminMenuOpen }" style="min-width: 230px;">
            <router-link to="/admin/users" class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center"
              @click="isAdminMenuOpen = false">
              Phân quyền & Tài khoản
            </router-link>
            <router-link to="/admin/users?filter=danhsachden"
              class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center" @click="isAdminMenuOpen = false">
              Danh sách đen
            </router-link>
            <router-link to="/admin/users?filter=locked"
              class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center" @click="isAdminMenuOpen = false">
              Danh sách thẻ bị khóa
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Cột 3: User Account Actions & Mobile Toggle -->
      <div class="header-actions d-flex align-items-center gap-2">
        <!-- Logged in State -->
        <template v-if="user">
          <NotificationBell />
          <div class="dropdown" ref="userDropdown">
            <button
              class="btn btn-outline-secondary dropdown-toggle py-1.5 px-3 d-flex align-items-center border-opacity-50"
              type="button" @click="toggleMenu">
              <img v-if="profileAvatarUrl" :src="profileAvatarUrl" :alt="displayName" class="rounded-circle me-2"
                style="width: 24px; height: 24px; object-fit: cover;" @error="avatarLoadError = true" />
              <i v-else class="fas fa-user-circle me-2 text-secondary fs-5"></i>
              <span class="fw-bold text-truncate" style="max-width: 120px;">{{ authService.getDisplayName(user) ||
                authService.getIdentifier(user) }}</span>
              <span v-if="authService.getRole(user) === 'ADMIN'" class="badge bg-danger ms-2 px-2 py-1 d-none d-md-inline"
                style="font-size: 0.65rem;">QUẢN TRỊ VIÊN</span>
              <span v-else-if="authService.getRole(user) === 'MANAGER'" class="badge bg-success ms-2 px-2 py-1 d-none d-md-inline"
                style="font-size: 0.65rem;">THỦ THƯ</span>
              <span v-else class="badge bg-light text-dark border ms-2 d-none d-md-inline px-2 py-1"
                style="font-size: 0.65rem;">ĐỘC GIẢ</span>
            </button>
            <div class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 rounded-3 p-2 animate-fade"
              :class="{ show: isMenuOpen }" style="min-width: 250px;">
              <div class="px-3 py-2.5 mb-1 rounded-2 bg-light border-0">
                <small class="text-muted d-block" style="font-size: 0.68rem">Đang đăng nhập với tư cách:</small>
                <strong class="d-block text-dark text-truncate">{{ authService.getDisplayName(user) ||
                  authService.getIdentifier(user) }}</strong>
                <small class="font-monospace text-muted" style="font-size: 0.72rem;">{{ authService.getIdentifier(user)
                }}</small>
              </div>
              <router-link to="/profile" class="dropdown-item py-2 px-3 rounded-2" @click="isMenuOpen = false">
                <i class="fas fa-id-badge me-2 text-muted"></i>
                Hồ sơ cá nhân
              </router-link>
              <div v-if="isStaffOrAdmin" class="dropdown-divider my-1"></div>
              <router-link v-if="isStaffOrAdmin" to="/manager/borrows" class="dropdown-item py-2 px-3 rounded-2"
                @click="isMenuOpen = false">
                <i class="fas fa-clipboard-check me-2 text-muted"></i> Bảng duyệt mượn trả
              </router-link>
              <router-link v-if="isStaffOrAdmin" to="/manager/books" class="dropdown-item py-2 px-3 rounded-2"
                @click="isMenuOpen = false">
                <i class="fas fa-layer-group me-2 text-muted"></i> Quản lý kho sách
              </router-link>
              <router-link v-if="isStaffOrAdmin" to="/manager/publishers" class="dropdown-item py-2 px-3 rounded-2"
                @click="isMenuOpen = false">
                <i class="fas fa-building me-2 text-muted"></i> Quản lý nhà xuất bản
              </router-link>
              <router-link v-if="isAdmin" to="/admin/users" class="dropdown-item py-2 px-3 rounded-2 text-danger"
                @click="isMenuOpen = false">
                <i class="fas fa-shield-alt me-2"></i> Phân quyền & Danh sách đen
              </router-link>
              <div class="dropdown-divider my-1"></div>
              <button class="dropdown-item py-2 px-3 rounded-2 text-danger fw-bold" @click="handleLogout">
                <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
              </button>
            </div>
          </div>
        </template>

        <!-- Guest State (Đăng nhập / Đăng ký đồng bộ kích thước và căn chỉnh) -->
        <template v-else>
          <router-link to="/login"
            class="me-lg-2 btn btn-outline-secondary text-decoration-none py-1.5 px-3 rounded-pill d-inline-flex align-items-center">
            <i class="fas fa-sign-in-alt me-1.5"></i> Đăng nhập
          </router-link>
          <router-link to="/register"
            class="btn btn-primary text-decoration-none py-1.5 px-3 rounded-pill d-none d-sm-inline-flex align-items-center shadow-sm">
            <i class="fas fa-id-card me-1.5"></i> Đăng ký
          </router-link>
        </template>

        <!-- Mobile Hamburger Button -->
        <button class="btn btn-outline-secondary d-lg-none py-1.5 px-2.5 rounded-2"
          style="border-color: var(--paper-border)" type="button" @click="isMobileNavOpen = !isMobileNavOpen"
          aria-label="Toggle navigation" :aria-expanded="isMobileNavOpen" aria-controls="mobile-navigation">
          <i :class="isMobileNavOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer Backdrop -->
    <div v-if="isMobileNavOpen" class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
      style="z-index: 1025;" @click="isMobileNavOpen = false"></div>

    <!-- Mobile Navigation Drawer -->
    <div v-if="isMobileNavOpen" id="mobile-navigation"
      class="d-lg-none border-top px-4 py-3 shadow-lg bg-white position-absolute w-100 mobile-navigation-drawer"
      style="z-index: 1030;">
      <div class="nav flex-column gap-1">
        <router-link to="/" class="nav-link text-dark py-2.5 px-3 rounded-2" @click="isMobileNavOpen = false">
          <i class="fas fa-search me-2 text-success"></i> Tra cứu sách
        </router-link>

        <router-link v-if="user" to="/profile" class="nav-link text-dark py-2.5 px-3 rounded-2"
          @click="isMobileNavOpen = false">
          <i class="fas fa-address-card me-2 text-info"></i>
          Hồ sơ cá nhân
        </router-link>

        <template v-if="isStaffOrAdmin">
          <div class="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold"
            style="font-size: 0.68rem; letter-spacing: 0.05em">
            Khu Vực Quản Trị & Thủ Thư
          </div>
          <router-link to="/manager/borrows" class="nav-link text-primary py-2.5 px-3 rounded-2"
            @click="isMobileNavOpen = false">
            <i class="fas fa-tasks me-2"></i> Duyệt mượn & Trả sách
          </router-link>
          <router-link to="/manager/books" class="nav-link text-primary py-2.5 px-3 rounded-2"
            @click="isMobileNavOpen = false">
            <i class="fas fa-book me-2"></i> Quản lý kho sách
          </router-link>
          <router-link to="/manager/publishers" class="nav-link text-primary py-2.5 px-3 rounded-2"
            @click="isMobileNavOpen = false">
            <i class="fas fa-building me-2"></i> Danh mục Nhà xuất bản
          </router-link>
          <router-link v-if="isAdmin" to="/admin/users" class="nav-link text-danger py-2.5 px-3 rounded-2"
            @click="isMobileNavOpen = false">
            <i class="fas fa-users-cog me-2"></i> Phân quyền Admin & Danh sách đen
          </router-link>
          <router-link v-if="isAdmin" to="/admin/users?filter=locked" class="nav-link text-danger py-2.5 px-3 rounded-2"
            @click="isMobileNavOpen = false">
            <i class="fas fa-lock me-2"></i> Danh sách thẻ bị khóa
          </router-link>
        </template>

        <div v-if="!user" class="pt-3">
          <router-link to="/register"
            class="btn btn-primary w-100 py-2.5 text-decoration-none shadow-sm rounded-pill text-center d-block"
            @click="isMobileNavOpen = false">
            <i class="fas fa-id-card me-1"></i> Đăng ký thẻ độc giả mới
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import authService from "../services/auth.service";
import NotificationBell from "./NotificationBell.vue";

export default {
  name: "AppHeader",
  components: { NotificationBell },
  data() {
    return {
      authService,
      user: null,
      isMenuOpen: false,
      isManagerMenuOpen: false,
      isAdminMenuOpen: false,
      isMobileNavOpen: false,
      avatarLoadError: false,
    };
  },
  computed: {
    profileAvatarUrl() {
      if (this.avatarLoadError) return "";
      let path = this.user?.AnhDaiDien;
      if (!path) return "";
      if (path.startsWith("https://")) return path;
      if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) return "";
      if (path.startsWith("/public")) {
        path = path.replace("/public", "");
      }
      return `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${path}`;
    },
    displayName() {
      return authService.getDisplayName(this.user);
    },
    isStaffOrAdmin() {
      return false;
    },
    isAdmin() {
      return false;
    },
    isManagerActive() {
      return (
        this.$route.path.startsWith("/manager/borrows") ||
        this.$route.path.startsWith("/manager/books") ||
        this.$route.path.startsWith("/manager/publishers")
      );
    },
    isAdminActive() {
      return this.$route.path.startsWith("/admin");
    },
  },
  created() {
    this.checkUser();
    document.addEventListener("click", this.handleDocumentClick);
    window.addEventListener("auth-user-updated", this.handleAuthUserUpdated);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleDocumentClick);
    window.removeEventListener("auth-user-updated", this.handleAuthUserUpdated);
  },
  watch: {
    $route() {
      this.checkUser();
      this.isMenuOpen = false;
      this.isManagerMenuOpen = false;
      this.isAdminMenuOpen = false;
      this.isMobileNavOpen = false;
    },
  },
  methods: {
    checkUser() {
      this.user = authService.getUser();
      this.avatarLoadError = false;
    },
    handleAuthUserUpdated(event) {
      this.user = event.detail || authService.getUser();
      this.avatarLoadError = false;
    },
    toggleMenu(e) {
      e.stopPropagation();
      this.isManagerMenuOpen = false;
      this.isAdminMenuOpen = false;
      this.isMenuOpen = !this.isMenuOpen;
    },
    toggleManagerMenu(e) {
      e.stopPropagation();
      this.isMenuOpen = false;
      this.isAdminMenuOpen = false;
      this.isManagerMenuOpen = !this.isManagerMenuOpen;
    },
    toggleAdminMenu(e) {
      e.stopPropagation();
      this.isMenuOpen = false;
      this.isManagerMenuOpen = false;
      this.isAdminMenuOpen = !this.isAdminMenuOpen;
    },
    handleDocumentClick(e) {
      if (
        this.$refs.userDropdown &&
        !this.$refs.userDropdown.contains(e.target)
      ) {
        this.isMenuOpen = false;
      }
      if (
        this.$refs.managerDropdown &&
        !this.$refs.managerDropdown.contains(e.target)
      ) {
        this.isManagerMenuOpen = false;
      }
      if (
        this.$refs.adminDropdown &&
        !this.$refs.adminDropdown.contains(e.target)
      ) {
        this.isAdminMenuOpen = false;
      }
    },
    handleLogout() {
      authService.logout();
      this.user = null;
      this.isMenuOpen = false;
      this.isManagerMenuOpen = false;
      this.isAdminMenuOpen = false;
      this.isMobileNavOpen = false;
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
/* Announcement Banner Styling */
.announcement-banner {
  background-image: url('/bookshelf.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgba(17, 17, 17, 0.58);
  background-blend-mode: multiply;
  border-bottom: 2px solid var(--neo-yellow, #fdc800);
}

.header-shell { background-color: var(--neo-paper, #fffdf2) !important; }

.banner-title {
  color: var(--neo-paper, #fffdf2);
  font-size: clamp(1rem, 1.8vw, 1.55rem);
  letter-spacing: 0.055em;
  line-height: 1.25;
}

.banner-mark {
  color: var(--neo-yellow, #fdc800);
}

.header-navigation-shell {
  display: grid;
  grid-template-columns: minmax(72px, 1fr) auto minmax(220px, 1fr);
  min-height: 72px;
  column-gap: clamp(16px, 3vw, 44px);
  background: var(--neo-paper, #fffdf2);
}

.header-brand { justify-self: start; }
.header-primary-nav { justify-self: center; }
.header-actions { justify-self: end; min-width: 0; }

.header-actions > .dropdown > .btn,
.header-actions > .btn {
  min-height: 44px;
  border: 2px solid var(--neo-ink, #111) !important;
  border-radius: 8px !important;
  background: var(--neo-paper, #fffdf2) !important;
  color: var(--neo-ink, #111) !important;
  box-shadow: 3px 3px 0 var(--neo-ink, #111) !important;
  transition: transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s cubic-bezier(.2,.8,.2,1), background-color .18s cubic-bezier(.2,.8,.2,1);
}

.header-actions > .dropdown > .btn:hover,
.header-actions > .btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--neo-ink, #111) !important;
}

.header-actions > .btn-primary {
  background: var(--neo-yellow, #fdc800) !important;
}

.banner-text-shadow {
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
}

.ath-brand-logo-btn {
  padding: 4px;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.ath-brand-logo-btn:hover {
  background-color: var(--paper-subtle, #f8f9fa);
  transform: translateY(-1px);
}

.ath-brand-logo-btn:hover .ath-header-logo {
  transform: scale(1.06);
}

.ath-nav-link {
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: #334155;
  font-weight: 500;
  transition: all 0.2s ease;
}

.ath-nav-link:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.dropdown-item {
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #0f172a;
}

.mobile-navigation-drawer {
  max-height: calc(100dvh - 5.5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
}

@media (max-width: 359.98px) {
  .announcement-banner { padding-block: .8rem !important; }
  .banner-title { font-size: .9rem !important; letter-spacing: .035em !important; }
  .header-navigation-shell { column-gap: 8px; }
  .header-brand .ath-header-logo { width: 36px !important; height: 36px !important; }
  .header-actions > .dropdown > .btn { padding-inline: .5rem !important; }
  .header-actions .fw-bold.text-truncate { max-width: 70px !important; }
}

@media (max-width: 991.98px) {
  .header-navigation-shell {
    grid-template-columns: minmax(42px, auto) minmax(0, 1fr);
    min-height: 68px;
    column-gap: 12px;
  }

  .header-actions { grid-column: 2; grid-row: 1; }
}

@media (min-width: 992px) and (max-width: 1199.98px) {
  .header-navigation-shell { column-gap: 16px; }
  .ath-nav-link { padding-inline: .6rem; }
}
</style>
