<template>
  <header class="w-100 bg-white border-bottom border-light sticky-top shadow-sm" style="border-color: var(--paper-border) !important;">
    <!-- Top Announcement Bar -->
    <div class="py-1 px-3 text-white d-flex justify-content-between align-items-center" style="background-color: var(--primary-dark); font-size: 0.75rem;">
      <div class="container d-flex justify-content-between align-items-center">
        <div>
          <span class="text-uppercase font-weight-bold" style="color: #A6C4B6; letter-spacing: 0.05em;">Học Phần CT449 — Phát Triển Ứng Dụng Web</span>
          <span class="mx-2 text-muted">|</span>
          <span>Khoa CNTT&TT — Đại Học Cần Thơ</span>
        </div>
        <div class="d-none d-md-block">
          <span class="mr-3"><i class="fas fa-book-reader mr-1"></i> Định mức mượn: <strong>03 cuốn</strong> / độc giả</span>
          <span><i class="far fa-clock mr-1"></i> Phục vụ: 07:30 — 17:00</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="container py-2 d-flex justify-content-between align-items-center">
      <!-- Brand Logo -->
      <router-link to="/" class="d-flex align-items-center text-decoration-none text-dark">
        <div class="d-flex align-items-center justify-content-center mr-3 font-weight-bold" 
             style="width: 40px; height: 40px; background-color: var(--primary); color: #fff; font-family: var(--font-serif); font-size: 1.4rem; border-radius: 4px;">
          A
        </div>
        <div>
          <div class="font-serif-headline h5 mb-0 font-weight-bold" style="letter-spacing: 0.05em; color: var(--ink-primary);">
            ATHENAEUM
          </div>
          <small class="text-uppercase text-muted" style="font-size: 0.65rem; letter-spacing: 0.1em;">
            Thư Viện Học Thuật & Quản Lý Mượn Sách
          </small>
        </div>
      </router-link>

      <!-- Center Links -->
      <nav class="d-none d-lg-flex align-items-center">
        <router-link to="/" class="nav-link font-weight-500 text-dark px-3" active-class="text-success font-weight-bold">
          <i class="fas fa-search mr-1"></i> Tra cứu sách
        </router-link>

        <router-link v-if="user" to="/profile" class="nav-link font-weight-500 text-dark px-3" active-class="text-success font-weight-bold">
          <i class="fas fa-address-card mr-1"></i> Sách đang mượn
        </router-link>

        <!-- Manager / Admin Links -->
        <template v-if="isStaffOrAdmin">
          <router-link to="/manager/borrows" class="nav-link font-weight-500 px-3" active-class="text-success font-weight-bold" style="color: var(--primary);">
            <i class="fas fa-tasks mr-1"></i> Duyệt mượn & Trả sách
          </router-link>

          <router-link to="/manager/books" class="nav-link font-weight-500 px-3" active-class="text-success font-weight-bold" style="color: var(--primary);">
            <i class="fas fa-book mr-1"></i> Kho sách
          </router-link>

          <router-link to="/manager/publishers" class="nav-link font-weight-500 px-3" active-class="text-success font-weight-bold" style="color: var(--primary);">
            <i class="fas fa-building mr-1"></i> Nhà xuất bản
          </router-link>

          <router-link v-if="isAdmin" to="/admin/users" class="nav-link font-weight-500 text-danger px-3" active-class="font-weight-bold">
            <i class="fas fa-users-cog mr-1"></i> Phân quyền Admin
          </router-link>
        </template>
      </nav>

      <!-- User Account Actions -->
      <div class="d-flex align-items-center">
        <template v-if="user">
          <div class="dropdown mr-2">
            <button class="btn ath-btn-outline dropdown-toggle py-1 px-3 d-flex align-items-center" type="button" id="userMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" @click="toggleMenu">
              <i class="fas fa-user-circle mr-2 text-secondary" style="font-size: 1.1rem;"></i>
              <span class="font-weight-bold">{{ user.fullName || user.username }}</span>
              <span v-if="user.role === 'ADMIN'" class="badge badge-danger ml-2">ADMIN</span>
              <span v-else-if="user.role === 'MANAGER'" class="badge badge-success ml-2">THỦ THƯ</span>
              <span v-else class="badge badge-light border ml-2">ĐỘC GIẢ</span>
            </button>
            <div class="dropdown-menu dropdown-menu-right shadow-sm mt-2" :class="{ show: isMenuOpen }">
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
        <template v-else>
          <router-link to="/login" class="ath-btn-outline mr-2 text-decoration-none">
            <i class="fas fa-sign-in-alt mr-1"></i> Đăng nhập
          </router-link>
          <router-link to="/register" class="ath-btn-primary text-decoration-none">
            <i class="fas fa-id-card mr-1"></i> Đăng ký thẻ
          </router-link>
        </template>
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
  },
  watch: {
    $route() {
      this.checkUser();
      this.isMenuOpen = false;
    }
  },
  methods: {
    checkUser() {
      this.user = authService.getUser();
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    handleLogout() {
      authService.logout();
      this.user = null;
      this.isMenuOpen = false;
      this.$router.push("/login");
    }
  }
};
</script>