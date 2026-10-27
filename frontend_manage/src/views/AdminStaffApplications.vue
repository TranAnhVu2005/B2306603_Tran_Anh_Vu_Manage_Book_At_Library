<template>
  <div class="page-shell" @keydown.esc.window="closeReviewDialog()">
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
          <button class="ath-btn-primary" type="button" :disabled="busyId === application._id" @click="openApprove(application)">Duyệt & tạo tài khoản</button>
          <button class="ath-btn-outline" type="button" :disabled="busyId === application._id" @click="openReject(application)">Từ chối hồ sơ</button>
        </div>
      </article>
    </section>

    <div v-if="dialogMode" class="review-overlay" @click.self="closeReviewDialog()">
      <section class="review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title"
        aria-describedby="review-dialog-description">
        <header class="review-dialog-header">
          <div>
            <span class="dialog-eyebrow">DUYỆT HỒ SƠ NHÂN VIÊN</span>
            <h2 id="review-dialog-title">{{ dialogMode === 'approve' ? 'Xác nhận duyệt hồ sơ' : 'Từ chối hồ sơ đăng ký' }}</h2>
          </div>
          <button class="dialog-close" type="button" aria-label="Đóng hộp thoại" :disabled="!!busyId" @click="closeReviewDialog()">×</button>
        </header>

        <div class="review-dialog-body" v-if="selectedApplication">
          <div class="applicant-summary">
            <strong>{{ selectedApplication.HoTenNV }}</strong>
            <span>{{ selectedApplication.SoDienThoai }}</span>
          </div>

          <template v-if="dialogMode === 'approve'">
            <p id="review-dialog-description">Duyệt hồ sơ sẽ tạo tài khoản nhân viên cho ứng viên. Hãy xác nhận thông tin trước khi tiếp tục.</p>
            <div class="decision-note">Sau khi được duyệt, ứng viên có thể đăng nhập bằng số điện thoại đã đăng ký.</div>
          </template>

          <template v-else>
            <p id="review-dialog-description">Nhập lý do cụ thể để ứng viên biết vì sao hồ sơ chưa được chấp thuận.</p>
            <label class="reason-label" for="staff-application-reason">Lý do từ chối <span aria-hidden="true">*</span></label>
            <textarea id="staff-application-reason" ref="reasonInput" v-model="rejectionReason" class="reason-input"
              rows="4" maxlength="500" required aria-describedby="reason-help reason-count"
              placeholder="Ví dụ: Hồ sơ còn thiếu thông tin xác minh..." @input="reasonError = ''"></textarea>
            <div class="reason-meta">
              <small id="reason-help">Lý do sẽ được lưu trong hồ sơ và hiển thị cho ứng viên khi tra cứu kết quả.</small>
              <small id="reason-count">{{ rejectionReason.length }}/500</small>
            </div>
            <p v-if="reasonError" class="reason-error" role="alert">{{ reasonError }}</p>
          </template>
        </div>

        <footer class="review-dialog-footer">
          <button class="ath-btn-outline" type="button" :disabled="!!busyId" @click="closeReviewDialog()">Hủy</button>
          <button ref="confirmButton" :class="dialogMode === 'approve' ? 'ath-btn-primary' : 'ath-btn-danger'"
            type="button" :disabled="!!busyId" @click="submitReview">
            <span v-if="busyId">Đang xử lý…</span>
            <span v-else>{{ dialogMode === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối' }}</span>
          </button>
        </footer>
      </section>
    </div>
    <ToastNotification ref="toast" />
  </div>
</template>

<script>
import ToastNotification from "@/components/ToastNotification.vue";
import staffApplicationService from "@/services/staff-application.service";

export default {
  components: { ToastNotification },
  data: () => ({ applications: [], loading: false, busyId: null, dialogMode: null, selectedApplication: null, rejectionReason: "", reasonError: "", previousBodyOverflow: "" }),
  beforeUnmount() { document.body.style.overflow = this.previousBodyOverflow; },
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
    openApprove(application) {
      this.selectedApplication = application;
      this.dialogMode = "approve";
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      this.$nextTick(() => this.$refs.confirmButton?.focus());
    },
    openReject(application) {
      this.selectedApplication = application;
      this.dialogMode = "reject";
      this.rejectionReason = "";
      this.reasonError = "";
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      this.$nextTick(() => this.$refs.reasonInput?.focus());
    },
    closeReviewDialog(force = false) {
      if (this.busyId && !force) return;
      this.dialogMode = null;
      this.selectedApplication = null;
      this.rejectionReason = "";
      this.reasonError = "";
      document.body.style.overflow = this.previousBodyOverflow;
    },
    async submitReview() {
      if (!this.selectedApplication || !this.dialogMode || this.busyId) return;
      const application = this.selectedApplication;
      const mode = this.dialogMode;
      const reason = this.rejectionReason.trim();
      if (mode === "reject" && !reason) {
        this.reasonError = "Vui lòng nhập lý do từ chối hồ sơ.";
        this.$refs.reasonInput?.focus();
        return;
      }
      this.busyId = application._id;
      try {
        if (mode === "approve") {
          const response = await staffApplicationService.approve(application._id);
          this.closeReviewDialog(true);
          this.$refs.toast.show(`${response.message} Mã nhân viên: ${response.data.MSNV}.`);
        } else {
          const response = await staffApplicationService.reject(application._id, reason);
          this.closeReviewDialog(true);
          this.$refs.toast.show(response.message);
        }
        await this.load();
      } catch (error) {
        this.$refs.toast.show(error.response?.data?.message || (mode === "approve" ? "Không thể duyệt hồ sơ." : "Không thể từ chối hồ sơ."), "error");
      }
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
.review-overlay { position:fixed; inset:0; z-index:1200; display:grid; place-items:center; overflow-y:auto; padding:clamp(12px,4vw,28px); background:rgb(17 17 17 / 68%); }
.review-dialog { width:min(100%,560px); max-height:min(90dvh,760px); overflow-y:auto; border:2px solid var(--neo-ink,#111); border-radius:12px; background:var(--neo-paper,#fffdf2); color:var(--neo-ink,#111); box-shadow:6px 6px 0 var(--neo-ink,#111); }
.review-dialog-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:20px 22px 16px; border-bottom:1px solid #d8d2c3; }
.dialog-eyebrow { display:inline-block; margin-bottom:6px; padding:2px 6px; background:var(--neo-yellow,#fdc800); font-size:.68rem; font-weight:850; letter-spacing:.08em; }
.review-dialog-header h2 { margin:0; font-size:clamp(1.2rem,4vw,1.55rem); font-weight:850; }
.dialog-close { flex:0 0 36px; width:36px; height:36px; border:2px solid var(--neo-ink,#111); border-radius:8px; background:var(--neo-paper,#fffdf2); color:var(--neo-ink,#111); font-size:1.35rem; line-height:1; }
.review-dialog-body { display:grid; gap:14px; padding:20px 22px; }
.review-dialog-body p { margin:0; color:#494640; line-height:1.6; }
.applicant-summary { display:grid; gap:4px; padding:12px 14px; border:1px solid #d8d2c3; border-radius:8px; background:#fff8d9; }
.applicant-summary strong { font-size:1.05rem; }
.applicant-summary span,.reason-meta small { color:#625f67; font-size:.84rem; overflow-wrap:anywhere; }
.decision-note { padding:12px 14px; border-left:4px solid var(--neo-yellow,#fdc800); background:#fff8d9; color:#494640; line-height:1.5; }
.reason-label { font-weight:750; }
.reason-label span { color:#b42318; }
.reason-input { width:100%; min-height:112px; resize:vertical; padding:11px 12px; border:2px solid var(--neo-ink,#111); border-radius:8px; background:#fff; color:var(--neo-ink,#111); box-shadow:2px 2px 0 var(--neo-ink,#111); font:inherit; }
.reason-input:focus-visible { border-color:var(--neo-violet,#432dd7); outline:3px solid var(--neo-violet,#432dd7); outline-offset:2px; }
.reason-meta { display:flex; justify-content:space-between; gap:12px; }
.reason-meta small:first-child { max-width:78%; line-height:1.45; }
.reason-error { color:#a11b14 !important; font-weight:700; }
.review-dialog-footer { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:12px; padding:16px 22px 22px; border-top:1px solid #d8d2c3; }
.review-dialog-footer button { min-height:44px; }
@media(max-width:480px) { .review-dialog-header,.review-dialog-body { padding-left:16px; padding-right:16px; } .review-dialog-footer { padding:14px 16px 18px; } .review-dialog-footer button { flex:1 1 100%; } .reason-meta { flex-direction:column; gap:4px; } .reason-meta small:first-child { max-width:none; } }
@media(max-width:650px) { .page-heading,.application-card { align-items:stretch; flex-direction:column; } .actions > button { width:100%; } }
</style>
