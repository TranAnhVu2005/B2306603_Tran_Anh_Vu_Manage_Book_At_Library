<template>
  <div class="py-5 text-center">
    <div class="vg-shell not-found-shell">
      <div class="vg-core not-found-core">
        <span class="eyebrow">Lỗi điều hướng</span>
        <div class="font-serif-headline not-found-code">404</div>
        <h1 class="font-serif-headline not-found-title">Không tìm thấy trang yêu cầu</h1>
        <p class="not-found-copy">
          Trang bạn đang tìm kiếm không tồn tại hoặc tài liệu đã được chuyển sang danh mục lưu trữ khác.
        </p>
        <router-link to="/" class="ath-btn-primary text-decoration-none">
          Quay về trang chủ
          <span class="btn-island" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFound"
};
</script>

<style scoped>
.not-found-shell {
  width: min(100%, 560px);
  margin: clamp(1rem, 5vw, 3rem) auto;
}

.not-found-core {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(2rem, 7vw, 4rem) clamp(1.25rem, 5vw, 3rem);
  text-align: center;
}

.not-found-code {
  margin: 1rem 0 0.25rem;
  color: var(--primary);
  font-size: clamp(4rem, 16vw, 6rem);
  font-weight: 700;
  line-height: 0.95;
}

.not-found-title {
  margin: 0.75rem 0;
  color: var(--ink-primary);
  font-size: clamp(1.35rem, 5vw, 1.8rem);
  font-weight: 700;
}

.not-found-copy {
  max-width: 28rem;
  margin: 0 0 1.5rem;
  color: var(--ink-muted);
  line-height: 1.7;
}
</style>