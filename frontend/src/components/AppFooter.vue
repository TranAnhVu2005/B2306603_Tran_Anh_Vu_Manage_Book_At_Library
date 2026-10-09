<template>
  <footer class="w-100 text-light py-5 mt-auto" style="background-color: #181614; border-top: 1px solid #292524;">
    <div class="container">
      <div class="row pb-4 mb-4" style="border-bottom: 1px solid #292524;">
        <!-- Col 1: Identity -->
        <div class="col-lg-4 col-md-6 mb-4 mb-lg-0">
          <div class="d-flex align-items-center mb-3">
            <div class="d-flex align-items-center justify-content-center mr-2 font-weight-bold" 
                 style="width: 32px; height: 32px; background-color: #fff; color: #181614; font-family: var(--font-serif); font-size: 1.2rem; border-radius: 3px;">
              A
            </div>
            <span class="font-serif-headline h5 mb-0 text-white font-weight-bold">ATHENAEUM</span>
          </div>
          <p class="text-muted small leading-relaxed" style="color: #A8A29E !important;">
            Hệ thống Quản lý Mượn Sách & Lưu trữ Học liệu Thư viện. Dự án thuộc Học phần CT449 — Phát Triển Ứng Dụng Web, Khoa Công Nghệ Thông Tin & Truyền Thông, Đại Học Cần Thơ.
          </p>
        </div>

        <!-- Col 2: Nội quy -->
        <div class="col-lg-3 col-md-6 mb-4 mb-lg-0">
          <h6 class="text-uppercase font-weight-bold mb-3" style="font-size: 0.75rem; letter-spacing: 0.1em; color: #fff;">
            Nội Quy Mượn Sách
          </h6>
          <ul class="list-unstyled small text-muted mb-0" style="color: #A8A29E !important; line-height: 2;">
            <li><i class="fas fa-check text-success mr-2"></i> Định mức tối đa: 03 cuốn / thẻ</li>
            <li><i class="fas fa-check text-success mr-2"></i> Thời hạn mượn tiêu chuẩn: 14 ngày</li>
            <li><i class="fas fa-exclamation-triangle text-warning mr-2"></i> Vi phạm 3 lần: Khóa thẻ Blacklist</li>
            <li><i class="fas fa-info-circle text-info mr-2"></i> Bồi hoàn theo đơn giá nếu làm mất</li>
          </ul>
        </div>

        <!-- Col 3: Phân hệ -->
        <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
          <h6 class="text-uppercase font-weight-bold mb-3" style="font-size: 0.75rem; letter-spacing: 0.1em; color: #fff;">
            Phân Hệ
          </h6>
          <ul class="list-unstyled small text-muted mb-0" style="line-height: 2;">
            <li><router-link to="/" class="text-muted text-decoration-none">Tra cứu sách</router-link></li>
            <li><router-link to="/profile" class="text-muted text-decoration-none">Hồ sơ độc giả</router-link></li>
            <li><router-link to="/manager/borrows" class="text-muted text-decoration-none">Cổng thủ thư</router-link></li>
            <li><router-link to="/admin/users" class="text-muted text-decoration-none">Quản trị Admin</router-link></li>
          </ul>
        </div>

        <!-- Col 4: Liên hệ -->
        <div class="col-lg-3 col-md-6">
          <h6 class="text-uppercase font-weight-bold mb-3" style="font-size: 0.75rem; letter-spacing: 0.1em; color: #fff;">
            Thông Tin Liên Hệ
          </h6>
          <p class="small text-muted mb-1" style="color: #A8A29E !important;">
            <i class="fas fa-map-marker-alt mr-2"></i> Khu II, Đường 3/2, P. Xuân Khánh, Q. Ninh Kiều, TP. Cần Thơ
          </p>
          <p class="small text-muted mb-1" style="color: #A8A29E !important;">
            <i class="fas fa-envelope mr-2"></i> ctu_library@ctu.edu.vn
          </p>
          <p class="small text-muted mb-0" style="color: #A8A29E !important;">
            <i class="fas fa-phone-alt mr-2"></i> (0292) 3832 663
          </p>
        </div>
      </div>

      <!-- Copyright -->
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-muted">
        <div>
          © 2026 Athenaeum Library Management System. Đồ án CT449 MEVN Stack.
        </div>
        <div class="mt-2 mt-sm-0">
          <span class="mr-3">Express 5 + MongoDB Native</span>
          <span>Vue 3 + Vite</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "AppFooter"
};
</script>
