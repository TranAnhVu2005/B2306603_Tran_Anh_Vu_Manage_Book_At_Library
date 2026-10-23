<template>
  <div v-if="show" class="bm-overlay" @click.self="$emit('close')">
    <!-- Double-Bezel: outer shell -->
    <div
      class="bm-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bm-title"
    >
      <!-- Double-Bezel: inner core (Editorial Split) -->
      <div class="bm-core">
        <!-- ============ LEFT: book plate ============ -->
        <aside class="bm-plate">
          <div class="bm-plate-top">
            <span class="bm-pill">Xác thực thông tin</span>
            <h2 id="bm-title" class="bm-title">Xác nhận đăng ký mượn sách</h2>
          </div>

          <div class="bm-plate-book" v-if="book">
            <!-- Ảnh bìa: lớp bìa dự phòng nằm dưới, ảnh thật phủ lên trên -->
            <div class="bm-cover">
              <div class="bm-cover-fb" aria-hidden="true">
                <span class="bm-fb-code">{{ book.MaSach }}</span>
                <span class="bm-fb-title">{{ book.TenSach }}</span>
                <span class="bm-fb-author">{{ book.TacGia }}</span>
              </div>
              <img
                v-if="book.HinhAnh && String(book.HinhAnh).trim()"
                :src="book.HinhAnh"
                :alt="book.TenSach"
                class="bm-cover-img"
                @error="$event.target.style.display = 'none'"
              />
              <span class="bm-cover-spine" aria-hidden="true"></span>
            </div>

            <div class="bm-book-info">
              <span class="bm-plate-label">Tựa sách</span>
              <h3 class="bm-book-title">{{ book.TenSach }}</h3>
              <p class="bm-book-author">
                Tác giả: <em>{{ book.TacGia }}</em>
              </p>
              <div class="bm-book-tags">
                <span class="bm-code">Mã: {{ book.MaSach }}</span>
                <span class="bm-code" v-if="book.MaNXB">{{ book.MaNXB }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- ============ RIGHT: details + actions ============ -->
        <section class="bm-panel">
          <button
            type="button"
            class="bm-close"
            aria-label="Đóng"
            @click="$emit('close')"
          >
            <svg class="bm-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div class="bm-body" v-if="book">
            <!-- Borrow terms -->
            <dl class="bm-terms">
              <div class="bm-term">
                <dt>
                  <svg class="bm-ico" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
                    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
                  </svg>
                  Thời hạn mượn
                </dt>
                <dd>14 ngày kể từ thời điểm được duyệt</dd>
              </div>
              <div class="bm-term">
                <dt>
                  <svg class="bm-ico" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 20.5s6.5-5.6 6.5-10.5a6.5 6.5 0 10-13 0c0 4.9 6.5 10.5 6.5 10.5z" />
                    <circle cx="12" cy="10" r="2.3" />
                  </svg>
                  Địa điểm nhận sách
                </dt>
                <dd>Thư viện đại học Cần Thơ (Trung tâm học liệu cũ) – Tầng trệt</dd>
              </div>
            </dl>

            <!-- Reader (tự động nhận diện tài khoản đang đăng nhập) -->
            <section class="bm-field">
              <span class="bm-field-label">Thông tin độc giả đăng ký</span>
              <div class="bm-tray">
                <div class="bm-reader">
                  <div class="bm-reader-avatar" aria-hidden="true">
                    <svg class="bm-ico" viewBox="0 0 24 24">
                      <circle cx="12" cy="8.5" r="3.6" />
                      <path d="M5 20c.9-3.6 3.7-5.4 7-5.4s6.1 1.8 7 5.4" />
                    </svg>
                  </div>
                  <div class="bm-reader-info">
                    <strong class="bm-reader-name">
                      {{ loggedInUser ? authService.getDisplayName(loggedInUser) : 'Đang tải thông tin...' }}
                    </strong>
                    <small class="bm-reader-sub">
                      Mã thẻ: <b class="bm-code-strong">{{ loggedInUser ? authService.getIdentifier(loggedInUser) : '—' }}</b>
                      <span class="bm-dot">•</span>
                      SĐT: {{ loggedInUser ? (authService.getPhone(loggedInUser) || '—') : '—' }}
                    </small>
                  </div>
                </div>
              </div>
              <small class="bm-hint">
                <svg class="bm-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 11v5M12 8v.01" />
                </svg>
                Định mức thư viện: tối đa 03 cuốn đang lưu hành cùng thời điểm.
              </small>
            </section>

            <!-- Note -->
            <section class="bm-field">
              <label class="bm-field-label" for="bm-note">
                Ghi chú <span class="bm-optional">(nếu có)</span>
              </label>
              <div class="bm-tray bm-tray-input">
                <input
                  id="bm-note"
                  type="text"
                  class="bm-input"
                  v-model="note"
                  placeholder="Ví dụ: Cần mượn phục vụ làm tiểu luận nghiên cứu..."
                />
              </div>
            </section>

            <!-- Notice -->
            <aside class="bm-notice">
              <svg class="bm-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4.5l8.5 14.5h-17L12 4.5z" />
                <path d="M12 10.5v3.6M12 16.8v.01" />
              </svg>
              <p>
                Yêu cầu sẽ ở trạng thái <strong>Chờ duyệt</strong>. Sau khi thủ thư xét duyệt,
                bạn vui lòng đến quầy nhận sách vật lý.
              </p>
            </aside>
          </div>

          <!-- Footer -->
          <footer class="bm-footer">
            <button type="button" class="bm-btn bm-btn-ghost" @click="$emit('close')">
              Hủy bỏ
            </button>
            <button
              type="button"
              class="bm-btn bm-btn-primary group"
              :disabled="submitting"
              @click="handleConfirm"
            >
              <span v-if="submitting" class="bm-spin" aria-hidden="true"></span>
              <template v-else>
                <span>Gửi yêu cầu mượn</span>
                <!-- Button-in-Button trailing icon -->
                <span class="bm-btn-island" aria-hidden="true">
                  <svg class="bm-ico" viewBox="0 0 24 24">
                    <path d="M7.5 16.5l9-9M9 7.5h7.5V15" />
                  </svg>
                </span>
              </template>
            </button>
          </footer>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import authService from "../services/auth.service";

export default {
  name: "BorrowModal",
  data() {
    return {
      authService,
      readerCode: "",
      note: "Đăng ký mượn trực tuyến",
      submitting: false,
      loggedInUser: null,
    };
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    book: {
      type: Object,
      default: null,
    }
  },
  emits: ["close", "confirm"],
  watch: {
    show(val) {
      if (val) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", this.handleKeyDown);
        this.submitting = false;
        this.loggedInUser = authService.getUser();
        if (this.loggedInUser) {
          this.readerCode = authService.getIdentifier(this.loggedInUser);
        }
      } else {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", this.handleKeyDown);
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  methods: {
    handleKeyDown(e) {
      if (e.key === "Escape") {
        this.$emit("close");
      }
    },
    handleConfirm() {
      // Tự động lấy mã độc giả từ session đăng nhập hiện tại
      if (!this.readerCode.trim() && this.loggedInUser) {
        this.readerCode = authService.getIdentifier(this.loggedInUser);
      }

      if (!this.readerCode.trim()) {
        alert("Không tìm thấy thông tin định danh độc giả. Vui lòng đăng nhập lại!");
        return;
      }
      
      this.submitting = true;
      this.$emit("confirm", {
        maDocGia: this.readerCode.trim(),
        maSach: this.book.MaSach,
        ghiChu: this.note.trim()
      });
    }
  }
};
</script>

<style scoped>
/* =====================================================
   Editorial Luxury × Editorial Split
   Tokens (cục bộ, kế thừa bảng màu Athenaeum)
   ===================================================== */
.bm-overlay {
  --paper: #FAF9F5;
  --paper-2: #F4F2EB;
  --card: #FFFFFF;
  --ink: #1C1917;
  --ink-2: #4A463F;
  --ink-muted: #787368;
  --primary: #143529;
  --primary-2: #1d4e3d;
  --accent: #8C3D28;
  --ok: #23694C;
  --hair: rgba(28, 25, 23, 0.08);
  --tray: rgba(28, 25, 23, 0.04);
  --ease: cubic-bezier(0.32, 0.72, 0, 1);
  --serif: var(--font-serif, 'Newsreader', 'PP Editorial New', Georgia, serif);
  --sans: var(--font-sans, 'Plus Jakarta Sans', 'Geist', system-ui, sans-serif);
  --mono: var(--font-mono, 'Geist Mono', ui-monospace, Menlo, monospace);

  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(20, 24, 22, 0.58);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-family: var(--sans);
  animation: bm-fade 0.5s var(--ease) both;
}

/* ===== Double-Bezel: outer shell ===== */
.bm-shell {
  width: 100%;
  max-width: 900px;
  padding: 6px;
  border-radius: 2rem;
  background: rgba(250, 249, 245, 0.55);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.35),
    0 50px 100px -30px rgba(8, 20, 14, 0.55);
  animation: bm-pop 0.7s var(--ease) both;
}

/* ===== Double-Bezel: inner core ===== */
.bm-core {
  display: flex;
  align-items: stretch;
  max-height: calc(100dvh - 2rem - 12px);
  border-radius: calc(2rem - 6px);
  background: var(--paper);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    0 0 0 1px var(--hair);
  overflow: hidden;
  color: var(--ink);
}

/* ===== LEFT: plate ===== */
.bm-plate {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.5rem;
  padding: 2.25rem 2rem;
  color: #F3F0E6;
  background:
    radial-gradient(120% 70% at 0% 0%, rgba(54, 120, 92, 0.38), transparent 60%),
    radial-gradient(90% 60% at 100% 100%, rgba(140, 61, 40, 0.22), transparent 65%),
    var(--primary);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
  flex: 0 0 41.666%;
  min-width: 0;
  overflow-y: auto;
}
/* film-grain (phần này không cuộn) */
.bm-plate::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.bm-plate > * {
  position: relative;
  z-index: 1;
}

.bm-pill {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #E8D9C4;
}
.bm-title {
  margin: 1.1rem 0 0;
  font-family: var(--serif);
  font-size: clamp(1.7rem, 2.6vw, 2.15rem);
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: #FBF9F2;
}

.bm-plate-book {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.bm-book-info { min-width: 0; }
.bm-book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* ===== Ảnh bìa sách ===== */
.bm-cover {
  position: relative;
  flex-shrink: 0;
  width: clamp(8.5rem, 46%, 10.5rem);
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 3px 12px 12px 3px;
  background: var(--paper-2);
  box-shadow:
    0 34px 44px -20px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.14);
}
.bm-cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* gáy sách */
.bm-cover-spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 10px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.3),
    rgba(255, 255, 255, 0.16) 45%,
    rgba(0, 0, 0, 0.05)
  );
}
/* bìa dự phòng (giấy ngà, mực in) */
.bm-cover-fb {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1rem 0.8rem 0.9rem 1.4rem;
  background:
    radial-gradient(100% 60% at 100% 0%, rgba(140, 61, 40, 0.14), transparent 65%),
    var(--paper-2);
  color: var(--ink);
}
.bm-cover-fb::before {
  content: "";
  position: absolute;
  inset: 8px 8px 8px 15px;
  border-radius: 2px 8px 8px 2px;
  box-shadow: inset 0 0 0 1px rgba(28, 25, 23, 0.14);
  pointer-events: none;
}
.bm-fb-code {
  position: relative;
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}
.bm-fb-title {
  position: relative;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--serif);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.bm-fb-author {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--serif);
  font-size: 0.68rem;
  font-style: italic;
  color: var(--ink-muted);
}
.bm-plate-label {
  display: block;
  margin-bottom: 0.6rem;
  font-family: var(--mono);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(243, 240, 230, 0.55);
}
.bm-book-title {
  margin: 0 0 0.7rem;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.3;
  color: #FFFFFF;
}
.bm-book-author {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: rgba(243, 240, 230, 0.72);
}
.bm-book-author em {
  font-family: var(--serif);
  font-size: 0.98rem;
  color: #F3F0E6;
}
.bm-code {
  display: inline-block;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  font-family: var(--mono);
  font-size: 0.72rem;
  color: #E8D9C4;
}

/* ===== RIGHT: panel ===== */
.bm-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
}

.bm-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: var(--tray);
  color: var(--ink-2);
  cursor: pointer;
  transition: transform 0.6s var(--ease), background-color 0.4s var(--ease);
}
.bm-close:hover {
  background: rgba(28, 25, 23, 0.09);
  transform: rotate(90deg);
}
.bm-close:active { transform: rotate(90deg) scale(0.94); }
.bm-close:focus-visible,
.bm-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.bm-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 3.25rem 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.bm-body > * { flex-shrink: 0; }

/* Terms */
.bm-terms {
  margin: 0;
  border-radius: 1.25rem;
  background: var(--paper-2);
  box-shadow: inset 0 0 0 1px var(--hair);
}
.bm-term {
  display: grid;
  grid-template-columns: 10.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.95rem 1.2rem;
}
.bm-term + .bm-term { box-shadow: inset 0 1px 0 var(--hair); }
.bm-term dt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--ink-muted);
}
.bm-term dt .bm-ico { color: var(--primary); }
.bm-term dd {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--ink);
}

/* Fields */
.bm-field { display: flex; flex-direction: column; gap: 0.6rem; }
.bm-field-label {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--ink);
}
.bm-optional { font-weight: 400; color: var(--ink-muted); }

/* Double-Bezel mini: tray + core */
.bm-tray {
  padding: 4px;
  border-radius: 1.4rem;
  background: var(--tray);
  box-shadow: inset 0 0 0 1px var(--hair);
  transition: box-shadow 0.5s var(--ease);
}
.bm-reader,
.bm-input {
  border-radius: calc(1.4rem - 4px);
  background: var(--card);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.9);
}
.bm-reader {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
}
.bm-reader-avatar {
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--paper-2);
  color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--hair);
}
.bm-reader-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.bm-reader-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bm-reader-sub {
  font-family: var(--mono);
  font-size: 0.74rem;
  color: var(--ink-muted);
}
.bm-code-strong { font-weight: 600; color: var(--ok); }
.bm-dot { margin: 0 0.4rem; color: #C9C3B4; }

.bm-tray-input:focus-within {
  box-shadow: inset 0 0 0 1px rgba(20, 53, 41, 0.35), 0 0 0 4px rgba(20, 53, 41, 0.08);
}
.bm-input {
  display: block;
  width: 100%;
  padding: 0.8rem 1rem;
  border: 0;
  outline: none;
  font-family: var(--sans);
  font-size: 0.9rem;
  color: var(--ink);
}
.bm-input::placeholder { color: #A7A294; }

.bm-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--ink-muted);
}
.bm-hint .bm-ico { margin-top: 0.1rem; color: var(--primary); }

/* Notice */
.bm-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.95rem 1.1rem;
  border-radius: 1.25rem;
  background: #FBF3E4;
  box-shadow: inset 0 0 0 1px rgba(154, 91, 24, 0.18);
  color: #7A4A12;
}
.bm-notice .bm-ico { margin-top: 0.1rem; color: #9A5B18; }
.bm-notice p { margin: 0; font-size: 0.8rem; line-height: 1.6; }
.bm-notice strong { font-weight: 700; color: #5E3609; }

/* ===== Footer ===== */
.bm-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 2rem 1.4rem;
  background: linear-gradient(to top, var(--paper) 70%, rgba(250, 249, 245, 0));
  box-shadow: 0 -1px 0 var(--hair);
}
.bm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 0;
  border-radius: 999px;
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.6s var(--ease),
    background-color 0.5s var(--ease),
    box-shadow 0.6s var(--ease),
    color 0.4s var(--ease);
}
.bm-btn:active:not(:disabled) { transform: scale(0.98); }

.bm-btn-ghost {
  padding: 0.8rem 1.6rem;
  background: var(--tray);
  color: var(--ink-2);
  font-weight: 500;
}
.bm-btn-ghost:hover { background: rgba(28, 25, 23, 0.08); color: var(--ink); }

.bm-btn-primary {
  padding: 0.4rem 0.4rem 0.4rem 1.6rem;
  background: var(--primary);
  color: #FBF9F2;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.18),
    0 12px 24px -10px rgba(20, 53, 41, 0.55);
}
.bm-btn-primary:hover:not(:disabled) {
  background: var(--primary-2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.22),
    0 18px 30px -12px rgba(20, 53, 41, 0.6);
}
.bm-btn-primary:disabled {
  opacity: 0.75;
  cursor: not-allowed;
  padding: 0.8rem 2.2rem;
}
.bm-btn-island {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  transition: transform 0.6s var(--ease), background-color 0.5s var(--ease);
}
.bm-btn-primary:hover:not(:disabled) .bm-btn-island {
  transform: translate(2px, -1px) scale(1.06);
  background: rgba(255, 255, 255, 0.2);
}
.bm-spin {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: bm-rot 0.8s linear infinite;
}

/* ===== Icons: ultra-light line ===== */
.bm-ico {
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bm-btn-island .bm-ico { width: 1rem; height: 1rem; }

/* ===== Motion (chỉ transform / opacity) ===== */
@keyframes bm-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes bm-pop {
  from { opacity: 0; transform: translateY(24px) scale(0.975); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bm-item {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bm-rot { to { transform: rotate(360deg); } }

.bm-plate-top,
.bm-plate-book,
.bm-body > *,
.bm-footer {
  animation: bm-item 0.9s var(--ease) both;
}
.bm-plate-top { animation-delay: 0.12s; }
.bm-plate-book { animation-delay: 0.22s; }
.bm-body > :nth-child(1) { animation-delay: 0.16s; }
.bm-body > :nth-child(2) { animation-delay: 0.22s; }
.bm-body > :nth-child(3) { animation-delay: 0.28s; }
.bm-body > :nth-child(4) { animation-delay: 0.34s; }
.bm-footer { animation-delay: 0.4s; }

@media (prefers-reduced-motion: reduce) {
  .bm-overlay, .bm-shell, .bm-plate-top, .bm-plate-book,
  .bm-body > *, .bm-footer { animation: none; }
  .bm-btn, .bm-btn-island, .bm-close { transition: none; }
}

/* ===== Mobile: xếp dọc, w-full, bỏ bố cục bất đối xứng ===== */
@media (max-width: 767.98px) {
  .bm-overlay { align-items: flex-end; padding: 0; }
  .bm-shell {
    max-width: none;
    padding: 4px;
    border-radius: 1.75rem 1.75rem 0 0;
  }
  .bm-core {
    flex-direction: column;
    max-height: 94dvh;
    border-radius: calc(1.75rem - 4px) calc(1.75rem - 4px) 0 0;
  }
  .bm-plate {
    flex: 0 0 auto;
    overflow-y: visible;
    gap: 1.25rem;
    padding: 1.5rem 1rem 1.25rem;
  }
  .bm-title { font-size: 1.5rem; margin-top: 0.8rem; }
  .bm-plate-book {
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }
  .bm-cover {
    width: 5.5rem;
    border-radius: 2px 8px 8px 2px;
    box-shadow:
      0 18px 24px -14px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.14);
  }
  .bm-cover-fb { padding: 0.6rem 0.45rem 0.55rem 0.9rem; }
  .bm-cover-fb::before { inset: 5px 5px 5px 10px; }
  .bm-fb-title { font-size: 0.62rem; -webkit-line-clamp: 4; }
  .bm-fb-code, .bm-fb-author { display: none; }
  .bm-cover-spine { width: 6px; }
  .bm-book-title { font-size: 1.15rem; margin-bottom: 0.45rem; }
  .bm-book-author { margin-bottom: 0.7rem; }
  .bm-core { position: relative; }
  .bm-panel { position: static; }
  .bm-close {
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.12);
    color: #F3F0E6;
  }
  .bm-body { padding: 1.25rem 1rem 1rem; gap: 1.25rem; }
  .bm-term { grid-template-columns: 1fr; gap: 0.3rem; }
  .bm-footer { padding: 0.9rem 1rem 1.1rem; }
  .bm-footer .bm-btn-ghost { flex: 0 0 auto; }
  .bm-footer .bm-btn-primary { flex: 1; justify-content: space-between; }
}
</style>