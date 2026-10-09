<template>
  <div class="py-5 text-center">
    <div class="ath-card p-5 max-w-lg mx-auto" style="max-width: 500px; margin: auto;">
      <div class="font-serif-headline font-weight-bold text-muted mb-2" style="font-size: 5rem; line-height: 1;">
        404
      </div>
      <h4 class="font-serif-headline font-weight-bold text-dark mb-2">
        Không Tìm Thấy Trang Yêu Cầu
      </h4>
      <p class="text-muted small mb-4">
        Trang bạn đang tìm kiếm không tồn tại hoặc tài liệu đã được chuyển sang danh mục lưu trữ khác.
      </p>
      <router-link to="/" class="ath-btn-primary text-decoration-none">
        <i class="fas fa-home mr-1"></i> Quay về Trang chủ
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFound"
};
</script>