<template>
  <header
    class="w-100 bg-white border-bottom sticky-top shadow-sm"
    style="border-color: var(--paper-border) !important"
  >
    <!-- Top Announcement Bar -->
    <div
      class="py-1 px-3 text-white"
      style="background-color: var(--primary-dark); font-size: 0.75rem"
    >
      <div class="container d-flex justify-content-between align-items-center">
        <div class="text-truncate">
          <span
            class="text-uppercase font-weight-bold"
            style="color: #a6c4b6; letter-spacing: 0.05em"
          >
            Library Book Management System
          </span>
        </div>
        <div class="d-none d-md-flex align-items-center">
          <span
            ><i class="far fa-clock mr-1"></i>Thư viện hoạt động trực tiếp từ
            07:00 - 22:00, trực tuyến 24/7</span
          >
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="container py-2 d-flex align-items-center position-relative">
      <!-- Cột 1: Brand Logo độc lập (Bên trái) -->
      <div class="d-flex align-items-center">
        <router-link
          to="/"
          class="d-flex align-items-center justify-content-center text-decoration-none ath-brand-logo-btn"
          title="Trang chủ Thư viện Học thuật"
        >
          <img
            src="@/assets/logoweb.png"
            alt="Logo Thư Viện"
            class="ath-header-logo"
            style="
              width: 44px;
              height: 44px;
              object-fit: contain;
              filter: drop-shadow(0 2px 6px rgba(20, 53, 41, 0.16));
              transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            "
          />
        </router-link>
      </div>

      <!-- Cột 2: Cụm điều hướng chính (Căn giữa cân đối, khoảng cách thoáng đãng) -->
      <nav class="d-none d-lg-flex align-items-center mx-auto" style="gap: 0.5rem">
        <!-- Mục dùng chung cho tất cả vai trò: Tra cứu sách -->
        <router-link
          to="/"
          class="ath-nav-link text-nowrap"
          active-class="active"
          exact
        >
          <i class="fas fa-search mr-1 text-muted"></i> Tra cứu sách
        </router-link>

        <!-- Mục dành cho Độc giả đã đăng nhập -->
        <router-link
          v-if="user"
          to="/profile"
          class="ath-nav-link text-nowrap"
          active-class="active"
        >
          <i class="fas fa-address-card mr-1 text-muted"></i> Sách đang mượn
        </router-link>

        <!-- Dropdown Nghiệp vụ Thủ thư (Dành cho Thủ thư & Admin) -->
        <div
          v-if="isStaffOrAdmin"
          class="dropdown ath-nav-item"
          ref="managerDropdown"
        >
          <button
            class="ath-nav-link text-nowrap dropdown-toggle bg-transparent border-0 d-inline-flex align-items-center"
            :class="{ active: isManagerActive }"
            type="button"
            @click="toggleManagerMenu"
            aria-expanded="isManagerMenuOpen"
          >
            <i class="fas fa-book-reader mr-1 text-muted"></i> Nghiệp vụ Thủ thư
          </button>
          <div
            class="dropdown-menu shadow mt-1"
            :class="{ show: isManagerMenuOpen }"
          >
            <router-link
              to="/manager/borrows"
              class="dropdown-item py-2 d-flex align-items-center"
              @click="isManagerMenuOpen = false"
            >
              <i
                class="fas fa-clipboard-check mr-2 text-success"
                style="width: 18px"
              ></i>
              Duyệt mượn & Trả sách
            </router-link>
            <router-link
              to="/manager/books"
              class="dropdown-item py-2 d-flex align-items-center"
              @click="isManagerMenuOpen = false"
            >
              <i
                class="fas fa-layer-group mr-2 text-primary"
                style="width: 18px"
              ></i>
              Quản lý kho sách
            </router-link>
            <router-link
              to="/manager/publishers"
              class="dropdown-item py-2 d-flex align-items-center"
              @click="isManagerMenuOpen = false"
            >
              <i
                class="fas fa-building mr-2 text-secondary"
                style="width: 18px"
              ></i>
              Quản lý Nhà xuất bản
            </router-link>
          </div>
        </div>

        <!-- Dropdown Quản trị Hệ thống (Dành riêng cho Super Admin) -->
        <div v-if="isAdmin" class="dropdown ath-nav-item" ref="adminDropdown">
          <button
            class="ath-nav-link text-nowrap dropdown-toggle bg-transparent border-0 d-inline-flex align-items-center"
            :class="{ active: isAdminActive }"
            type="button"
            @click="toggleAdminMenu"
            aria-expanded="isAdminMenuOpen"
            style="color: var(--accent)"
          >
            <i class="fas fa-shield-alt mr-1"></i> Quản trị Hệ thống
          </button>
          <div
            class="dropdown-menu shadow mt-1"
            :class="{ show: isAdminMenuOpen }"
          >
            <router-link
              to="/admin/users"
              class="dropdown-item py-2 d-flex align-items-center"
              @click="isAdminMenuOpen = false"
            >
              <i
                class="fas fa-users-cog mr-2 text-danger"
                style="width: 18px"
              ></i>
              Phân quyền & Tài khoản
            </router-link>
            <router-link
              to="/admin/users?filter=blacklist"
              class="dropdown-item py-2 d-flex align-items-center"
              @click="isAdminMenuOpen = false"
            >
              <i
                class="fas fa-user-slash mr-2 text-warning"
                style="width: 18px"
              ></i>
              Danh sách vi phạm (Blacklist)
            </router-link>
          </div>
        </div>
      </nav>

      <!-- User Account Actions & Mobile Toggle -->
      <div class="d-flex align-items-center">
        <!-- Logged in State -->
        <template v-if="user">
          <div class="dropdown mr-2" ref="userDropdown">
            <button
              class="btn ath-btn-outline dropdown-toggle py-1 px-2 px-sm-3 d-flex align-items-center"
              type="button"
              @click="toggleMenu"
            >
              <i
                class="fas fa-user-circle mr-1 mr-sm-2 text-secondary"
                style="font-size: 1.1rem"
              ></i>
              <span
                class="font-weight-bold text-truncate"
                style="max-width: 130px"
                >{{ user.fullName || user.username }}</span
              >
              <span
                v-if="user.role === 'ADMIN'"
                class="badge badge-danger ml-1 ml-sm-2"
                style="font-size: 0.7rem"
                >ADMIN</span
              >
              <span
                v-else-if="user.role === 'MANAGER'"
                class="badge badge-success ml-1 ml-sm-2"
                style="font-size: 0.7rem"
                >THỦ THƯ</span
              >
              <span
                v-else
                class="badge badge-light border ml-1 ml-sm-2 d-none d-sm-inline"
                style="font-size: 0.7rem"
                >ĐỌC GIẢ</span
              >
            </button>
            <div
              class="dropdown-menu dropdown-menu-right shadow mt-2"
              :class="{ show: isMenuOpen }"
            >
              <div
                class="px-3 py-2 border-bottom"
                style="background-color: var(--paper-subtle)"
              >
                <small class="text-muted d-block" style="font-size: 0.7rem"
                  >Đang đăng nhập:</small
                >
                <strong class="d-block text-dark">{{
                  user.fullName || user.username
                }}</strong>
                <small class="font-mono-code text-muted">{{
                  user.username
                }}</small>
              </div>
              <router-link
                to="/profile"
                class="dropdown-item py-2"
                @click="isMenuOpen = false"
              >
                <i class="fas fa-id-badge mr-2 text-muted"></i> Thẻ độc giả &
                Mượn sách
              </router-link>
              <div v-if="isStaffOrAdmin" class="dropdown-divider"></div>
              <router-link
                v-if="isStaffOrAdmin"
                to="/manager/borrows"
                class="dropdown-item py-2"
                @click="isMenuOpen = false"
              >
                <i class="fas fa-clipboard-check mr-2 text-muted"></i> Bảng
                duyệt mượn trả
              </router-link>
              <router-link
                v-if="isStaffOrAdmin"
                to="/manager/books"
                class="dropdown-item py-2"
                @click="isMenuOpen = false"
              >
                <i class="fas fa-layer-group mr-2 text-muted"></i> Quản lý kho
                sách
              </router-link>
              <router-link
                v-if="isStaffOrAdmin"
                to="/manager/publishers"
                class="dropdown-item py-2"
                @click="isMenuOpen = false"
              >
                <i class="fas fa-building mr-2 text-muted"></i> Quản lý nhà xuất
                bản
              </router-link>
              <router-link
                v-if="isAdmin"
                to="/admin/users"
                class="dropdown-item py-2 text-danger"
                @click="isMenuOpen = false"
              >
                <i class="fas fa-shield-alt mr-2"></i> Phân quyền & Blacklist
              </router-link>
              <div class="dropdown-divider"></div>
              <button
                class="dropdown-item py-2 text-danger"
                @click="handleLogout"
              >
                <i class="fas fa-sign-out-alt mr-2"></i> Đăng xuất
              </button>
            </div>
          </div>
        </template>

        <!-- Guest State -->
        <template v-else>
          <router-link
            to="/login"
            class="ath-btn-outline mr-2 text-decoration-none py-1 px-2 px-sm-3"
          >
            <i class="fas fa-sign-in-alt mr-1"></i> Đăng nhập
          </router-link>
          <router-link
            to="/register"
            class="ath-btn-primary text-decoration-none py-1 px-2 px-sm-3 d-none d-sm-inline-flex"
          >
            <i class="fas fa-id-card mr-1"></i> Đăng ký
          </router-link>
        </template>

        <!-- Mobile Hamburger Button -->
        <button
          class="btn btn-outline-secondary d-lg-none ml-1 py-1 px-2"
          style="border-color: var(--paper-border)"
          type="button"
          @click="isMobileNavOpen = !isMobileNavOpen"
          aria-label="Toggle navigation"
        >
          <i :class="isMobileNavOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer Backdrop -->
    <div
      v-if="isMobileNavOpen"
      class="ath-drawer-backdrop d-lg-none"
      @click="isMobileNavOpen = false"
    ></div>

    <!-- Mobile Navigation Drawer -->
    <div
      v-if="isMobileNavOpen"
      class="d-lg-none border-top px-3 py-3 shadow-lg bg-white position-relative"
      style="border-color: var(--paper-border) !important; z-index: 1030"
    >
      <div class="nav flex-column">
        <router-link
          to="/"
          class="nav-link text-dark py-2 border-bottom"
          @click="isMobileNavOpen = false"
        >
          <i class="fas fa-search mr-2 text-success"></i> Tra cứu sách
        </router-link>

        <router-link
          v-if="user"
          to="/profile"
          class="nav-link text-dark py-2 border-bottom"
          @click="isMobileNavOpen = false"
        >
          <i class="fas fa-address-card mr-2 text-info"></i> Thẻ độc giả & Sách
          đang mượn
        </router-link>

        <template v-if="isStaffOrAdmin">
          <div
            class="px-3 pt-3 pb-1 text-uppercase text-muted font-weight-bold"
            style="font-size: 0.68rem; letter-spacing: 0.05em"
          >
            Khu Vực Quản Trị & Thủ Thư
          </div>
          <router-link
            to="/manager/borrows"
            class="nav-link py-2 border-bottom"
            style="color: var(--primary)"
            @click="isMobileNavOpen = false"
          >
            <i class="fas fa-tasks mr-2"></i> Duyệt mượn & Trả sách
          </router-link>
          <router-link
            to="/manager/books"
            class="nav-link py-2 border-bottom"
            style="color: var(--primary)"
            @click="isMobileNavOpen = false"
          >
            <i class="fas fa-book mr-2"></i> Quản lý kho sách
          </router-link>
          <router-link
            to="/manager/publishers"
            class="nav-link py-2 border-bottom"
            style="color: var(--primary)"
            @click="isMobileNavOpen = false"
          >
            <i class="fas fa-building mr-2"></i> Danh mục Nhà xuất bản
          </router-link>
          <router-link
            v-if="isAdmin"
            to="/admin/users"
            class="nav-link text-danger py-2 border-bottom"
            @click="isMobileNavOpen = false"
          >
            <i class="fas fa-users-cog mr-2"></i> Phân quyền Admin & Blacklist
          </router-link>
        </template>

        <div v-if="!user" class="pt-3">
          <router-link
            to="/register"
            class="ath-btn-primary w-100 py-2 text-decoration-none"
            @click="isMobileNavOpen = false"
          >
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
      isManagerMenuOpen: false,
      isAdminMenuOpen: false,
      isMobileNavOpen: false,
    };
  },
  computed: {
    isStaffOrAdmin() {
      return (
        this.user &&
        (this.user.role === "MANAGER" || this.user.role === "ADMIN")
      );
    },
    isAdmin() {
      return this.user && this.user.role === "ADMIN";
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
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleDocumentClick);
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
.ath-brand-logo-btn {
  padding: 4px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.ath-brand-logo-btn:hover {
  background-color: var(--paper-subtle);
  transform: translateY(-1px);
}

.ath-brand-logo-btn:hover .ath-header-logo {
  transform: scale(1.06);
}

.ath-nav-link {
  border-radius: 6px;
  padding: 0.5rem 0.95rem;
}

.ath-nav-link:hover {
  background-color: var(--paper-subtle);
}
</style>
