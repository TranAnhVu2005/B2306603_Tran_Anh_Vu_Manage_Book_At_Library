<template>
  <section class="resource-404" role="status" aria-labelledby="resource-404-title">
    <div class="vg-core resource-404-card">
      <span class="eyebrow">TÀI NGUYÊN KHÔNG TỒN TẠI</span>
      <strong class="resource-404-code" aria-hidden="true">404</strong>
      <h1 id="resource-404-title">{{ title }}</h1>
      <p>{{ message }}</p>
      <div class="resource-404-actions">
        <router-link to="/catalog" class="ath-btn-primary text-decoration-none">Tra cứu sách</router-link>
        <router-link to="/login" class="ath-btn-outline text-decoration-none">Về cổng nhân viên</router-link>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "ResourceNotFound",
  props: {
    title: { type: String, default: "Không tìm thấy sách" },
    message: { type: String, default: "Ấn phẩm có thể không tồn tại hoặc đã được gỡ khỏi danh mục." },
  },
};
</script>

<style scoped>
.resource-404 { max-width: 640px; margin: clamp(2rem, 8vh, 5rem) auto; }
.resource-404-card { display:flex; flex-direction:column; align-items:center; padding:clamp(1.5rem,5vw,3rem); text-align:center; }
.resource-404-code { margin:.5rem 0 0; color:var(--primary,#fdc800); font-size:clamp(4.5rem,18vw,7rem); line-height:1; letter-spacing:-.06em; }
.resource-404 h1 { margin:.75rem 0; font-size:clamp(1.35rem,4vw,1.8rem); }
.resource-404 p { max-width:34rem; color:var(--ink-muted); line-height:1.7; }
.resource-404-actions { display:flex; justify-content:center; flex-wrap:wrap; gap:.8rem; margin-top:.5rem; }
@media (max-width:420px) { .resource-404-actions { width:100%; flex-direction:column; } .resource-404-actions :deep(a) { justify-content:center; } }
</style>
