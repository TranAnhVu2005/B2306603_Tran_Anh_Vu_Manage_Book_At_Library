<template>
  <footer
    class="w-100 text-light py-5 mt-auto"
    style="background-color: #181614; border-top: 1px solid #292524"
  >
    <div class="container">
      <div class="row pb-3 mb-4" style="border-bottom: 1px solid #292524">
        <!-- Col 1: Identity -->
        <div class="col-lg-4 col-md-6 mb-4 mb-lg-0">
          <div class="d-flex align-items-center mb-3">
            <img
              src="@/assets/library_logo.png"
              alt="Logo Thư Viện"
              class="me-2"
              style="width: 36px; height: 36px; object-fit: contain; filter: brightness(1.05);"
            />
            <span
              class="font-serif-headline h5 mb-0 text-white fw-bold"
              >Library Book Management System</span
            >
          </div>
          <p
            class="text-muted small leading-relaxed"
            style="color: #a8a29e !important"
          >
            Hệ thống quản lý mượn sách thư viện được phát triển bởi sinh viên
            Trần Anh Vũ. Thuộc trường Công nghệ thông tin và Truyền thông. Đại
            học Cần Thơ
          </p>
        </div>

        <!-- Col 2: Nội quy -->
        <div class="col-lg-4 col-md-6 mb-4 mb-lg-0">
          <h6
            class="text-uppercase fw-bold mb-3"
            style="font-size: 0.75rem; letter-spacing: 0.1em; color: #fff"
          >
            Nội Quy Mượn Sách
          </h6>
          <ul
            class="list-unstyled small text-muted mb-0"
            style="color: #a8a29e !important; line-height: 2"
          >
            <li>- Mỗi thẻ được mượn tối đa 03 quyển sách</li>
            <li>- Thời hạn mượn tiêu chuẩn: 14 ngày</li>
            <li>
              - Vi phạm (làm mất sách hoặc trễ hạn trả sách) 3 lần sẽ bị khóa
              thẻ
            </li>
            <li>- Bồi hoàn theo đơn giá nếu làm mất</li>
          </ul>
        </div>

        <!-- Col 4: Liên hệ -->
        <div class="col-lg-4 col-md-6">
          <h6
            class="text-uppercase fw-bold mb-3"
            style="font-size: 0.75rem; letter-spacing: 0.1em; color: #fff"
          >
            Thông Tin Liên Hệ
          </h6>
          <p class="small text-muted mb-1 footer-contact" style="color: #a8a29e !important">
            <i class="fas fa-map-marker-alt me-2"></i> Khu II, Đường 3/2, P.
            Xuân Khánh, Q. Ninh Kiều, TP. Cần Thơ
          </p>
          <p class="small text-muted mb-1 footer-contact" style="color: #a8a29e !important">
            <i class="fas fa-envelope me-2"></i> trananhvu314159@gmail.com
          </p>
          <p class="small text-muted mb-0 footer-contact" style="color: #a8a29e !important">
            <i class="fas fa-phone-alt me-2"></i> 0359906510
          </p>
        </div>
      </div>

      <!-- Copyright -->
      <div
        class="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-muted"
      >
        <div>© Library Book Management System</div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "AppFooter",
};
</script>

<style scoped>
.footer-contact { overflow-wrap: anywhere; }
</style>
