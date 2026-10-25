<template>
  <div class="page-shell">
    <header class="page-heading">
      <div><span class="eyebrow">QUẢN TRỊ NHÂN SỰ</span><h1>Duyệt hồ sơ nhân viên</h1><p>Chỉ hồ sơ được duyệt mới tạo tài khoản thủ thư và có thể đăng nhập.</p></div>
      <button class="ath-btn-outline" type="button" :disabled="loading" @click="load">Làm mới</button>
    </header>
    <section class="application-list" aria-live="polite">
      <div v-if="loading" class="empty-state">Đang tải hồ sơ...</div>
      <div v-else-if="applications.length === 0" class="empty-state">Hiện không có hồ sơ đang chờ duyệt.</div>
      <article v-for="application in applications" :key="application._id" class="application-card">
        <div class="identity">
          <span class="status">Chờ duyệt</span>
          <h2>{{ application.HoTenNV }}</h2>
          <p><strong>Số điện thoại:</strong> {{ application.SoDienThoai }}</p>
          <p><strong>Địa chỉ:</strong> {{ application.DiaChi || "Chưa cung cấp" }}</p>
          <p class="submitted-at">Gửi lúc {{ formatDate(application.ThoiGianGui) }}</p>
        </div>
        <div class="actions">
          <button class="ath-btn-primary" type="button" :disabled="busyId === application._id" @click="approve(application)">Duyệt & tạo tài khoản</button>
          <button class="ath-btn-outline" type="button" :disabled="busyId === application._id" @click="reject(application)">Từ chối hồ sơ</button>
        </div>
      </article>
    </section>
    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "@/components/ToastNotification.vue";
import staffApplicationService from "@/services/staff-application.service";

export default {
  components: { ToastNotification },
  data: () => ({ applications: [], loading: false, busyId: null }),
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try { this.applications = await staffApplicationService.getAll(); }
      catch (error) { this.$refs.toast?.show(error.response?.data?.message || "Không thể tải hồ sơ đăng ký.", "error"); }
      finally { this.loading = false; }
    },
    formatDate(value) {
      if (!value) return "—";
      return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    },
    async approve(application) {
      if (!window.confirm(`Duyệt hồ sơ của ${application.HoTenNV} và tạo tài khoản thủ thư?`)) return;
      this.busyId = application._id;
      try {
        const response = await staffApplicationService.approve(application._id);
        this.$refs.toast.show(`${response.message} Mã nhân viên: ${response.data.MSNV}.`);
        await this.load();
      } catch (error) { this.$refs.toast.show(error.response?.data?.message || "Không thể duyệt hồ sơ.", "error"); }
      finally { this.busyId = null; }
    },
    async reject(application) {
      const reason = window.prompt(`Lý do từ chối hồ sơ của ${application.HoTenNV}:`);
      if (reason === null) return;
      if (!reason.trim()) { this.$refs.toast.show("Cần nhập lý do từ chối.", "error"); return; }
      this.busyId = application._id;
      try {
        const response = await staffApplicationService.reject(application._id, reason.trim());
        this.$refs.toast.show(response.message);
        await this.load();
      } catch (error) { this.$refs.toast.show(error.response?.data?.message || "Không thể từ chối hồ sơ.", "error"); }
      finally { this.busyId = null; }
    },
  },
};
</script>

<style scoped>
.page-shell { display:grid; gap:1.25rem; max-width:1100px; margin:0 auto; padding:clamp(1rem,3vw,2rem); }
.page-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; border-bottom:1px solid var(--paper-border,#d8d2c3); padding-bottom:1rem; }
.eyebrow { color:var(--accent,#f0b900); font-size:.72rem; font-weight:800; letter-spacing:.12em; }
h1 { margin:.35rem 0; font-family:var(--font-serif); font-size:clamp(1.5rem,3vw,2.1rem); }
.page-heading p,.application-card p { margin:.25rem 0; color:var(--ink-muted,#696969); }
.application-list { display:grid; gap:1rem; }
.application-card { display:flex; align-items:center; justify-content:space-between; gap:1.5rem; padding:1.25rem; background:var(--paper,#fffdf4); border:2px solid var(--ink-primary,#171717); border-radius:14px; box-shadow:4px 4px 0 var(--ink-primary,#171717); }
.identity h2 { margin:.65rem 0; font-size:1.2rem; }
.status { display:inline-block; padding:.2rem .55rem; color:#684a00; background:#fff1b8; border:1px solid #a67b00; border-radius:4px; font-size:.76rem; font-weight:700; }
.submitted-at { margin-top:.6rem !important; font-size:.85rem; }
.actions { display:flex; flex-wrap:wrap; gap:.65rem; }
.empty-state { padding:2rem; text-align:center; background:var(--paper,#fffdf4); border:2px solid var(--ink-primary,#171717); border-radius:12px; }
@media(max-width:650px) { .page-heading,.application-card { align-items:stretch; flex-direction:column; } .actions > button { width:100%; } }
</style>
