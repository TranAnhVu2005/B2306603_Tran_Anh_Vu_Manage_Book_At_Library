<template>
  <header class="w-100 bg-white border-bottom sticky-top shadow-sm" style="border-color: var(--paper-border) !important;">
    <!-- Top Announcement Bar -->
    <div class="py-1 px-3 text-white" style="background-color: var(--primary-dark); font-size: 0.75rem;">
      <div class="container d-flex justify-content-between align-items-center">
        <div class="text-truncate">
          <span class="text-uppercase font-weight-bold" style="color: #A6C4B6; letter-spacing: 0.05em;">Học Phần CT449 — Phát Triển Ứng Dụng Web</span>
          <span class="mx-2 text-muted d-none d-sm-inline">|</span>
          <span class="d-none d-sm-inline">Khoa CNTT&TT — Đại Học Cần Thơ</span>
        </div>
        <div class="d-none d-md-flex align-items-center">
          <span class="mr-3"><i class="fas fa-book-reader mr-1"></i> Định mức: <strong>03 cuốn</strong> / độc giả</span>
          <span><i class="far fa-clock mr-1"></i> Phục vụ: 07:30 — 17:00</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="container py-2 d-flex justify-content-between align-items-center">
      <!-- Brand Logo -->
      <router-link to="/" class="d-flex align-items-center text-decoration-none text-dark">
        <div class="d-flex align-items-center justify-content-center mr-2 mr-sm-3 font-weight-bold shadow-sm" 
             style="width: 38px; height: 38px; background-color: var(--primary); color: #fff; font-family: var(--font-serif); font-size: 1.35rem; border-radius: 4px;">
          A
        </div>
        <div>
          <div class="font-serif-headline h5 mb-0 font-weight-bold" style="letter-spacing: 0.04em; color: var(--ink-primary); line-height: 1.1;">
            ATHENAEUM
          </div>
          <small class="text-uppercase text-muted d-none d-sm-block" style="font-size: 0.65rem; letter-spacing: 0.08em;">
            Thư Viện Học Thuật & Quản Lý Mượn Sách
          </small>
        </div>
      </router-link>

      <!-- Desktop Navigation Links -->
      <nav class="d-none d-lg-flex align-items-center">
        <router-link to="/" class="ath-nav-link" active-class="active" exact>
          <i class="fas fa-search mr-1 text-muted"></i> Tra cứu sách
        </router-link>

        <router-link v-if="user" to="/profile" class="ath-nav-link" active-class="active">
          <i class="fas fa-address-card mr-1 text-muted"></i> Sách đang mượn
        </router-link>

        <!-- Manager / Admin Links -->
        <template v-if="isStaffOrAdmin">
          <router-link to="/manager/borrows" class="ath-nav-link" active-class="active">
            <i class="fas fa-tasks mr-1 text-muted"></i> Duyệt mượn & Trả sách
          </router-link>

          <router-link to="/manager/books" class="ath-nav-link" active-class="active">
            <i class="fas fa-book mr-1 text-muted"></i> Kho sách
          </router-link>

          <router-link to="/manager/publishers" class="ath-nav-link" active-class="active">
            <i class="fas fa-building mr-1 text-muted"></i> Nhà xuất bản
          </router-link>

          <router-link v-if="isAdmin" to="/admin/users" class="ath-nav-link" active-class="active" style="color: var(--accent);">
            <i class="fas fa-users-cog mr-1" style="color: var(--accent);"></i> Phân quyền Admin
          </router-link>
        </template>
      </nav>

      <!-- User Account Actions & Mobile Toggle -->
      <div class="d-flex align-items-center">
        <!-- Logged in State -->
        <template v-if="user">
          <div class="dropdown mr-2" ref="userDropdown">
            <button class="btn ath-btn-outline dropdown-toggle py-1 px-2 px-sm-3 d-flex align-items-center" 
                    type="button" 
                    @click="toggleMenu">
              <i class="fas fa-user-circle mr-1 mr-sm-2 text-secondary" style="font-size: 1.1rem;"></i>
              <span class="font-weight-bold text-truncate" style="max-width: 130px;">{{ user.fullName || user.username }}</span>
              <span v-if="user.role === 'ADMIN'" class="badge badge-danger ml-1 ml-sm-2" style="font-size: 0.7rem;">ADMIN</span>
              <span v-else-if="user.role === 'MANAGER'" class="badge badge-success ml-1 ml-sm-2" style="font-size: 0.7rem;">THỦ THƯ</span>
              <span v-else class="badge badge-light border ml-1 ml-sm-2 d-none d-sm-inline" style="font-size: 0.7rem;">ĐỘC GIẢ</span>
            </button>
            <div class="dropdown-menu dropdown-menu-right shadow mt-2" :class="{ show: isMenuOpen }">
              <div class="px-3 py-2 border-bottom" style="background-color: var(--paper-subtle);">
                <small class="text-muted d-block" style="font-size: 0.7rem;">Đang đăng nhập:</small>
                <strong class="d-block text-dark">{{ user.fullName || user.username }}</strong>
                <small class="font-mono-code text-muted">{{ user.username }}</small>
              </div>
              <router-link to="/profile" class="dropdown-item py-2" @click="isMenuOpen = false">
                <i class="fas fa-id-badge mr-2 text-muted"></i> Thẻ độc giả & Mượn sách
              </router-link>
              <div v-if="isStaffOrAdmin" class="dropdown-divider"></div>
              <router-link v-if="isStaffOrAdmin" to="/manager/borrows" class="dropdown-item py-2" @click="isMenuOpen = false">
                <i class="fas fa-clipboard-check mr-2 text-muted"></i> Bảng duyệt mượn trả
              </router-link>
              <router-link v-if="isStaffOrAdmin" to="/manager/books" class="dropdown-item py-2" @click="isMenuOpen = false">
                <i class="fas fa-layer-group mr-2 text-muted"></i> Quản lý kho sách
              </router-link>
              <router-link v-if="isStaffOrAdmin" to="/manager/publishers" class="dropdown-item py-2" @click="isMenuOpen = false">
                <i class="fas fa-building mr-2 text-muted"></i> Quản lý nhà xuất bản
              </router-link>
              <router-link v-if="isAdmin" to="/admin/users" class="dropdown-item py-2 text-danger" @click="isMenuOpen = false">
                <i class="fas fa-shield-alt mr-2"></i> Phân quyền & Blacklist
              </router-link>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item py-2 text-danger" @click="handleLogout">
                <i class="fas fa-sign-out-alt mr-2"></i> Đăng xuất
              </button>
            </div>
          </div>
        </template>

        <!-- Guest State -->
        <template v-else>
          <router-link to="/login" class="ath-btn-outline mr-2 text-decoration-none py-1 px-2 px-sm-3">
            <i class="fas fa-sign-in-alt mr-1"></i> Đăng nhập
          </router-link>
          <router-link to="/register" class="ath-btn-primary text-decoration-none py-1 px-2 px-sm-3 d-none d-sm-inline-flex">
            <i class="fas fa-id-card mr-1"></i> Đăng ký
          </router-link>
        </template>

        <!-- Mobile Hamburger Button -->
        <button class="btn btn-outline-secondary d-lg-none ml-1 py-1 px-2" 
                style="border-color: var(--paper-border);"
                type="button" 
                @click="isMobileNavOpen = !isMobileNavOpen"
                aria-label="Toggle navigation">
          <i :class="isMobileNavOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer Backdrop -->
    <div v-if="isMobileNavOpen" class="ath-drawer-backdrop d-lg-none" @click="isMobileNavOpen = false"></div>

    <!-- Mobile Navigation Drawer -->
    <div v-if="isMobileNavOpen" 
         class="d-lg-none border-top px-3 py-3 shadow-lg bg-white position-relative" 
         style="border-color: var(--paper-border) !important; z-index: 1030;">
      <div class="nav flex-column">
        <router-link to="/" class="nav-link text-dark py-2 border-bottom" @click="isMobileNavOpen = false">
          <i class="fas fa-search mr-2 text-success"></i> Tra cứu sách
        </router-link>

        <router-link v-if="user" to="/profile" class="nav-link text-dark py-2 border-bottom" @click="isMobileNavOpen = false">
          <i class="fas fa-address-card mr-2 text-info"></i> Thẻ độc giả & Sách đang mượn
        </router-link>

        <template v-if="isStaffOrAdmin">
          <div class="px-3 pt-3 pb-1 text-uppercase text-muted font-weight-bold" style="font-size: 0.68rem; letter-spacing: 0.05em;">
            Khu Vực Quản Trị & Thủ Thư
          </div>
          <router-link to="/manager/borrows" class="nav-link py-2 border-bottom" style="color: var(--primary);" @click="isMobileNavOpen = false">
            <i class="fas fa-tasks mr-2"></i> Duyệt mượn & Trả sách
          </router-link>
          <router-link to="/manager/books" class="nav-link py-2 border-bottom" style="color: var(--primary);" @click="isMobileNavOpen = false">
            <i class="fas fa-book mr-2"></i> Quản lý kho sách
          </router-link>
          <router-link to="/manager/publishers" class="nav-link py-2 border-bottom" style="color: var(--primary);" @click="isMobileNavOpen = false">
            <i class="fas fa-building mr-2"></i> Danh mục Nhà xuất bản
          </router-link>
          <router-link v-if="isAdmin" to="/admin/users" class="nav-link text-danger py-2 border-bottom" @click="isMobileNavOpen = false">
            <i class="fas fa-users-cog mr-2"></i> Phân quyền Admin & Blacklist
          </router-link>
        </template>

        <div v-if="!user" class="pt-3">
          <router-link to="/register" class="ath-btn-primary w-100 py-2 text-decoration-none" @click="isMobileNavOpen = false">
            <i class="fas fa-id-card mr-1"></i> Đăng ký thẻ độc giả mới
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import authService from "../services/auth.service";

export default {
  name: "AppHeader",
  data() {
    return {
      user: null,
      isMenuOpen: false,
      isMobileNavOpen: false,
    };
  },
  computed: {
    isStaffOrAdmin() {
      return this.user && (this.user.role === "MANAGER" || this.user.role === "ADMIN");
    },
    isAdmin() {
      return this.user && this.user.role === "ADMIN";
    }
  },
  created() {
    this.checkUser();
    document.addEventListener("click", this.handleDocumentClick);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleDocumentClick);
  },
  watch: {
    $route() {
      this.checkUser();
      this.isMenuOpen = false;
      this.isMobileNavOpen = false;
    }
  },
  methods: {
    checkUser() {
      this.user = authService.getUser();
    },
    toggleMenu(e) {
      e.stopPropagation();
      this.isMenuOpen = !this.isMenuOpen;
    },
    handleDocumentClick(e) {
      if (this.$refs.userDropdown && !this.$refs.userDropdown.contains(e.target)) {
        this.isMenuOpen = false;
      }
    },
    handleLogout() {
      authService.logout();
      this.user = null;
      this.isMenuOpen = false;
      this.isMobileNavOpen = false;
      this.$router.push("/login");
    }
  }
};
</script>