<template>
  <header class="w-100 border-bottom sticky-top shadow-sm bg-white" style="border-color: var(--paper-border) !important;">
    <div class="w-100 py-3 px-3 text-white announcement-banner">
      <div class="container d-flex justify-content-between align-items-center">
        <strong class="banner-text-shadow">Library Management · Staff Portal</strong>
      </div>
    </div>
    <div class="container py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
      <router-link to="/manager/borrows" class="d-flex align-items-center gap-2 text-decoration-none text-dark fw-bold">
        <img src="@/assets/library_logo.png" alt="Library" width="38" height="38" />
        Khu vực Thủ thư & Quản trị
      </router-link>
      <nav v-if="isStaff" class="d-flex flex-wrap align-items-center gap-2">
        <router-link to="/manager/borrows" class="ath-nav-link text-decoration-none">Mượn & Trả</router-link>
        <router-link to="/manager/books" class="ath-nav-link text-decoration-none">Kho sách</router-link>
        <router-link to="/manager/publishers" class="ath-nav-link text-decoration-none">Nhà xuất bản</router-link>
        <router-link v-if="isAdmin" to="/admin/users" class="ath-nav-link text-decoration-none">Quản trị</router-link>
        <router-link to="/profile" class="ath-nav-link text-decoration-none">Hồ sơ</router-link>
        <button class="btn btn-outline-danger btn-sm rounded-pill px-3" @click="logout">Đăng xuất</button>
      </nav>
      <router-link v-else to="/login" class="btn btn-primary rounded-pill px-3">Đăng nhập nhân viên</router-link>
    </div>
  </header>
</template>

<script>
import authService from "@/services/auth.service";

export default {
  computed: {
    isStaff() { return authService.isStaffOrAdmin(); },
    isAdmin() { return authService.isAdmin(); },
  },
  methods: {
    logout() {
      authService.logout();
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.announcement-banner { background: linear-gradient(110deg, #143529, #345c4b); }
.banner-text-shadow { letter-spacing: .04em; }
.ath-nav-link { border-radius: 999px; padding: .55rem .9rem; color: #334155; font-weight: 600; }
.ath-nav-link:hover, .router-link-active { background: var(--primary-light); color: var(--primary); }
</style>
