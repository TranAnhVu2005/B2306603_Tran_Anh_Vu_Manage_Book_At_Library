<template>
  <div class="notification-wrap" ref="root">
    <button ref="trigger" class="notification-trigger" type="button" aria-label="Thông báo" :aria-expanded="isOpen" @click="toggle">
      <i class="fas fa-bell" aria-hidden="true"></i>
      <span v-if="unreadCount" class="notification-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
    <section v-if="isOpen" class="notification-panel" :style="panelStyle" aria-label="Thông báo của bạn">
      <header class="notification-heading">
        <strong>Thông báo</strong>
        <button v-if="unreadCount" type="button" class="mark-all" @click="markAllRead">Đánh dấu đã đọc</button>
      </header>
      <p v-if="loading" class="notification-empty">Đang tải thông báo…</p>
      <p v-else-if="!items.length" class="notification-empty">Bạn chưa có thông báo nào.</p>
      <button v-for="item in items" :key="item._id" type="button" class="notification-item"
        :class="{ unread: !item.DaDoc }" @click="markRead(item)">
        <span class="notification-dot" :class="{ visible: !item.DaDoc }"></span>
        <span class="notification-copy">
          <strong>{{ item.TieuDe }}</strong>
          <span>{{ item.NoiDung }}</span>
          <time>{{ formatTime(item.ThoiGian) }}</time>
        </span>
      </button>
      <p v-if="error" class="notification-error">Không thể tải thông báo. Hãy thử mở lại bảng này.</p>
    </section>
  </div>
</template>

<script>
import thongBaoService from "../services/thongbao.service";
import authService from "../services/auth.service";

export default {
  name: "NotificationBell",
  data: () => ({ items: [], unreadCount: 0, isOpen: false, loading: false, error: false, timer: null, syncingUser: false, panelStyle: null }),
  created() {
    this.refresh();
    this.timer = window.setInterval(this.refresh, 30000);
    document.addEventListener("click", this.onOutsideClick);
    window.addEventListener("focus", this.refresh);
    window.addEventListener("resize", this.positionPanel);
    window.addEventListener("scroll", this.positionPanel, true);
  },
  beforeUnmount() {
    window.clearInterval(this.timer);
    document.removeEventListener("click", this.onOutsideClick);
    window.removeEventListener("focus", this.refresh);
    window.removeEventListener("resize", this.positionPanel);
    window.removeEventListener("scroll", this.positionPanel, true);
  },
  methods: {
    async refresh() {
      if (!localStorage.getItem("token")) return;
      try {
        const response = await thongBaoService.getMine();
        this.items = response.data || [];
        this.unreadCount = response.unreadCount || 0;
        this.error = false;
        await this.syncReaderCardStatus();
      } catch {
        this.error = true;
      }
    },
    async syncReaderCardStatus() {
      const user = authService.getUser();
      if (this.syncingUser || !authService.isReader(user)) return;

      const cardStateEvents = new Set(["THE_GO_DANH_SACH_DEN", "THE_KHOA", "THE_MO_KHOA", "THE_VAO_DANH_SACH_DEN"]);
      const latestEvent = this.items.find(item => cardStateEvents.has(item.LoaiThongBao));
      if (!latestEvent) return;

      const expectedStatus = {
        THE_GO_DANH_SACH_DEN: "HoatDong",
        THE_KHOA: "Khoa",
        THE_VAO_DANH_SACH_DEN: "DanhSachDen",
      }[latestEvent.LoaiThongBao];
      if (expectedStatus && user.TrangThaiThe === expectedStatus) return;
      if (latestEvent.LoaiThongBao === "THE_MO_KHOA" && user.TrangThaiThe !== "Khoa") return;

      this.syncingUser = true;
      try {
        await authService.fetchMe();
      } catch {
        // Borrow actions re-check the server state before displaying eligibility.
      } finally {
        this.syncingUser = false;
      }
    },
    async toggle(event) {
      event.stopPropagation();
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        await this.$nextTick();
        this.positionPanel();
        this.loading = true;
        await this.refresh();
        this.loading = false;
      } else {
        this.panelStyle = null;
      }
    },
    positionPanel() {
      if (!this.isOpen || !this.$refs.trigger || window.innerWidth > 767) {
        this.panelStyle = null;
        return;
      }
      const trigger = this.$refs.trigger.getBoundingClientRect();
      const width = Math.min(360, Math.max(0, window.innerWidth - 24));
      const left = Math.max(12, Math.min(trigger.right - width, window.innerWidth - width - 12));
      const top = Math.max(12, Math.min(trigger.bottom + 10, window.innerHeight - 160));
      this.panelStyle = {
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        right: "auto",
        width: `${width}px`,
        maxHeight: `${Math.max(160, Math.min(440, window.innerHeight - top - 12))}px`,
      };
    },
    async markRead(item) {
      if (item.DaDoc) return;
      try {
        await thongBaoService.markRead(item._id);
        item.DaDoc = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      } catch { this.error = true; }
    },
    async markAllRead() {
      try {
        await thongBaoService.markAllRead();
        this.items.forEach((item) => { item.DaDoc = true; });
        this.unreadCount = 0;
      } catch { this.error = true; }
    },
    onOutsideClick(event) {
      if (this.$refs.root && !this.$refs.root.contains(event.target)) this.isOpen = false;
    },
    formatTime(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
    },
  },
};
</script>

<style scoped>
.notification-wrap { position: relative; flex: 0 0 auto; }
.notification-trigger { position: relative; width: 42px; height: 42px; border: 2px solid var(--neo-ink,#111); border-radius: 8px; background: var(--neo-paper,#fffdf2); color: var(--neo-ink,#111); box-shadow: 2px 2px 0 var(--neo-ink,#111); }
.notification-trigger:hover { background: var(--neo-yellow,#fdc800); }
.notification-count { position: absolute; top: -7px; right: -7px; min-width: 19px; height: 19px; padding: 0 4px; border: 1px solid #fffdf2; border-radius: 10px; background: #b42318; color: white; font: 700 11px/17px "Be Vietnam Pro", sans-serif; }
.notification-panel { position: absolute; z-index: 1100; top: calc(100% + 10px); right: 0; width: min(360px, calc(100vw - 24px)); max-height: min(440px, 70vh); overflow-y: auto; border: 2px solid var(--neo-ink,#111); border-radius: 10px; background: var(--neo-paper,#fffdf2); color: var(--neo-ink,#111); box-shadow: 4px 4px 0 var(--neo-ink,#111); }
.notification-heading { position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid #d9d4c5; background: var(--neo-paper,#fffdf2); }
.mark-all { border: 0; background: none; color: #432dd7; font: 600 12px "Be Vietnam Pro",sans-serif; }
.notification-item { display: flex; gap: 10px; width: 100%; padding: 12px 14px; border: 0; border-bottom: 1px solid #e7e2d5; background: transparent; color: inherit; text-align: left; }
.notification-item:hover,.notification-item.unread { background: #fff7d6; }
.notification-dot { flex: 0 0 8px; width: 8px; height: 8px; margin-top: 7px; border-radius: 50%; background: transparent; }
.notification-dot.visible { background: #432dd7; }
.notification-copy { display: grid; gap: 4px; min-width: 0; }
.notification-copy strong { font-size: 13px; }
.notification-copy span { color: #494640; font-size: 12px; line-height: 1.5; }
.notification-copy time,.notification-empty,.notification-error { color: #716d64; font-size: 11px; }
.notification-empty,.notification-error { margin: 0; padding: 18px; text-align: center; }
.notification-error { color: #a11b14; }
@media(max-width:767.98px) { .notification-panel { box-sizing: border-box; width: min(360px, calc(100vw - 24px)); } }
</style>
