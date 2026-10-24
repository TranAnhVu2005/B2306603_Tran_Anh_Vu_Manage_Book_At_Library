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
.bm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 20px;
  background: rgb(17 17 17 / 72%);
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  animation: bm-fade .16s ease-out both;
}

.bm-shell {
  width: min(100%, 1040px);
  padding: 0;
  border: 3px solid var(--neo-ink, #111);
  border-radius: 12px;
  background: var(--neo-paper, #fffdf2);
  box-shadow: 8px 8px 0 var(--neo-ink, #111);
  animation: bm-pop .18s ease-out both;
}

.bm-core {
  display: flex;
  align-items: stretch;
  max-height: min(780px, calc(100dvh - 46px));
  overflow: hidden;
  border-radius: 8px;
  color: var(--neo-ink, #111);
  background: var(--neo-paper, #fffdf2);
}

.bm-plate {
  position: relative;
  display: flex;
  flex: 0 0 37%;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  min-width: 0;
  overflow-y: auto;
  padding: clamp(20px, 3vw, 36px) clamp(18px, 2.7vw, 32px);
  color: var(--neo-paper, #fffdf2);
  background: var(--neo-violet, #432dd7);
  border-right: 3px solid var(--neo-ink, #111);
}

.bm-plate-top,
.bm-plate-book,
.bm-body > *,
.bm-footer {
  animation: bm-item .2s ease-out both;
}
.bm-plate-book { animation-delay: .04s; }
.bm-plate-top,
.bm-plate-book,
.bm-body > *,
.bm-footer { position: relative; z-index: 1; }

.bm-pill {
  display: inline-flex;
  max-width: 100%;
  padding: 6px 10px;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 5px;
  color: var(--neo-ink, #111);
  background: var(--neo-yellow, #fdc800);
  box-shadow: 3px 3px 0 var(--neo-ink, #111);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  line-height: 1.25;
  text-transform: uppercase;
}

.bm-title {
  margin: 22px 0 0;
  color: var(--neo-paper, #fffdf2);
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  font-size: clamp(24px, 3vw, 38px);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}

.bm-plate-book { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.bm-book-info { min-width: 0; }
.bm-book-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.bm-cover {
  position: relative;
  flex: 0 0 auto;
  width: clamp(124px, 46%, 176px);
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 4px;
  background: var(--neo-paper, #fffdf2);
  box-shadow: 5px 5px 0 var(--neo-ink, #111);
}
.bm-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bm-cover-spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 9px;
  pointer-events: none;
  background: linear-gradient(90deg, rgb(0 0 0 / 42%), rgb(255 255 255 / 20%) 48%, transparent);
}
.bm-cover-fb {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 10px 10px 18px;
  color: var(--neo-ink, #111);
  background: var(--neo-yellow, #fdc800);
}
.bm-cover-fb::before {
  position: absolute;
  inset: 8px 8px 8px 14px;
  border: 1px solid var(--neo-ink, #111);
  content: '';
  pointer-events: none;
}
.bm-fb-code, .bm-fb-title, .bm-fb-author { position: relative; }
.bm-fb-code, .bm-code { font-family: var(--font-mono, ui-monospace, monospace); }
.bm-fb-code { font-size: 10px; font-weight: 800; overflow-wrap: anywhere; }
.bm-fb-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.bm-fb-author { overflow: hidden; font-size: 10px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.bm-plate-label {
  display: block;
  margin-bottom: 8px;
  color: rgb(255 253 242 / 76%);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.bm-book-title {
  margin: 0 0 8px;
  color: var(--neo-paper, #fffdf2);
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  font-size: clamp(19px, 2vw, 25px);
  font-weight: 850;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.bm-book-author { margin: 0 0 14px; color: rgb(255 253 242 / 84%); font-size: 14px; line-height: 1.5; }
.bm-book-author em { color: var(--neo-yellow, #fdc800); font-weight: 700; }
.bm-code {
  display: inline-flex;
  max-width: 100%;
  padding: 5px 8px;
  border: 1.5px solid var(--neo-ink, #111);
  border-radius: 4px;
  color: var(--neo-ink, #111);
  background: var(--neo-yellow, #fdc800);
  font-size: 11px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.bm-panel { position: relative; display: flex; flex: 1 1 0; flex-direction: column; min-width: 0; min-height: 0; }
.bm-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 5px;
  color: var(--neo-ink, #111);
  background: var(--neo-yellow, #fdc800);
  box-shadow: 3px 3px 0 var(--neo-ink, #111);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
}
.bm-close:hover { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--neo-ink, #111); }
.bm-close:active { transform: translate(3px, 3px); box-shadow: none; }
.bm-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow-y: auto;
  padding: 68px clamp(18px, 3vw, 36px) 22px;
}
.bm-body > * { flex-shrink: 0; }

.bm-terms {
  margin: 0;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 7px;
  background: #fff4b8;
  box-shadow: 3px 3px 0 var(--neo-ink, #111);
}
.bm-term { display: grid; grid-template-columns: minmax(132px, .8fr) 1.2fr; gap: 12px; align-items: start; padding: 14px 16px; }
.bm-term + .bm-term { border-top: 2px solid var(--neo-ink, #111); }
.bm-term dt { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--neo-ink, #111); font-size: 13px; font-weight: 750; }
.bm-term dt .bm-ico { color: var(--neo-violet, #432dd7); }
.bm-term dd { margin: 0; color: var(--neo-ink, #111); font-size: 14px; font-weight: 750; line-height: 1.45; overflow-wrap: anywhere; }
.bm-field { display: flex; flex-direction: column; gap: 8px; }
.bm-field-label { margin: 0; color: var(--neo-ink, #111); font-size: 14px; font-weight: 800; }
.bm-optional { color: #514d43; font-weight: 500; }
.bm-tray { min-width: 0; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.bm-reader {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 6px;
  background: #fff;
  box-shadow: 3px 3px 0 var(--neo-ink, #111);
}
.bm-reader-avatar {
  display: inline-flex;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 5px;
  color: var(--neo-ink, #111);
  background: var(--neo-yellow, #fdc800);
}
.bm-reader-info { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.bm-reader-name { overflow: hidden; color: var(--neo-ink, #111); font-size: 15px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.bm-reader-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 6px; color: #514d43; font-family: var(--font-mono, ui-monospace, monospace); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.bm-code-strong { color: var(--neo-violet, #432dd7); font-weight: 850; }
.bm-dot { color: #514d43; }
.bm-tray-input { border: 2px solid var(--neo-ink, #111); border-radius: 6px; background: #fff; box-shadow: 3px 3px 0 var(--neo-ink, #111); }
.bm-tray-input:focus-within { border-color: var(--neo-violet, #432dd7); box-shadow: 3px 3px 0 var(--neo-violet, #432dd7); }
.bm-input { display: block; width: 100%; min-height: 52px; padding: 12px 14px; border: 0; border-radius: 4px; outline: 0; color: var(--neo-ink, #111); background: transparent; font: inherit; font-size: 15px; }
.bm-input::placeholder { color: #625f67; }
.bm-hint { display: flex; align-items: flex-start; gap: 8px; color: #514d43; font-size: 12px; line-height: 1.5; }
.bm-hint .bm-ico { flex: 0 0 auto; margin-top: 1px; color: var(--neo-violet, #432dd7); }
.bm-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 6px;
  color: var(--neo-ink, #111);
  background: #fff4b8;
  box-shadow: 3px 3px 0 var(--neo-ink, #111);
}
.bm-notice .bm-ico { flex: 0 0 auto; margin-top: 2px; color: var(--neo-ink, #111); }
.bm-notice p { margin: 0; font-size: 13px; line-height: 1.55; }
.bm-notice strong { font-weight: 850; }

.bm-footer {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px clamp(18px, 3vw, 36px) 20px;
  border-top: 2px solid var(--neo-ink, #111);
  background: var(--neo-paper, #fffdf2);
}
.bm-btn {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 2px solid var(--neo-ink, #111);
  border-radius: 6px;
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background-color .12s ease;
}
.bm-btn:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: none; }
.bm-btn-ghost { padding: 10px 18px; color: var(--neo-ink, #111); background: #fff; box-shadow: 3px 3px 0 var(--neo-ink, #111); }
.bm-btn-ghost:hover { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--neo-ink, #111); background: #f0eddf; }
.bm-btn-primary { padding: 6px 8px 6px 16px; color: var(--neo-ink, #111); background: var(--neo-yellow, #fdc800); box-shadow: 4px 4px 0 var(--neo-ink, #111); }
.bm-btn-primary:hover:not(:disabled) { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--neo-ink, #111); background: #ffda32; }
.bm-btn-primary:disabled { color: #514d43; background: #e7e2d4; box-shadow: 2px 2px 0 var(--neo-ink, #111); cursor: wait; }
.bm-btn-island { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border: 2px solid var(--neo-ink, #111); border-radius: 4px; color: #fff; background: var(--neo-violet, #432dd7); }
.bm-spin { width: 18px; height: 18px; border: 2px solid rgb(17 17 17 / 35%); border-top-color: var(--neo-ink, #111); border-radius: 50%; animation: bm-rot .7s linear infinite; }
.bm-ico { width: 18px; height: 18px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.bm-btn-island .bm-ico { width: 16px; height: 16px; }
.bm-close:focus-visible, .bm-btn:focus-visible, .bm-input:focus-visible { outline: 3px solid var(--neo-violet, #432dd7); outline-offset: 3px; }

@keyframes bm-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes bm-pop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bm-item { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bm-rot { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .bm-overlay, .bm-shell, .bm-plate-top, .bm-plate-book, .bm-body > *, .bm-footer { animation: none; }
  .bm-close, .bm-btn { transition: none; }
}

@media (max-width: 767.98px) {
  .bm-overlay { align-items: flex-end; padding: 0; }
  .bm-shell { width: 100%; max-width: none; border-bottom: 0; border-radius: 12px 12px 0 0; box-shadow: 0 -4px 0 var(--neo-ink, #111); }
  .bm-core { position: relative; flex-direction: column; max-height: 96dvh; border-radius: 8px 8px 0 0; }
  .bm-plate { flex: 0 0 auto; gap: 12px; max-height: 27dvh; overflow: hidden; padding: 14px 16px 12px; border-right: 0; border-bottom: 3px solid var(--neo-ink, #111); }
  .bm-plate-top { padding-right: 44px; }
  .bm-pill { padding: 4px 8px; font-size: 9px; box-shadow: 2px 2px 0 var(--neo-ink, #111); }
  .bm-title { margin-top: 8px; font-size: clamp(19px, 5.6vw, 26px); line-height: 1.12; }
  .bm-plate-book { flex-direction: row; align-items: center; gap: 12px; min-height: 0; }
  .bm-cover { width: 64px; max-height: 88px; border-width: 1.5px; box-shadow: 3px 3px 0 var(--neo-ink, #111); }
  .bm-cover-fb { padding: 6px 5px 5px 9px; }
  .bm-cover-fb::before { inset: 4px 4px 4px 8px; }
  .bm-fb-title { font-size: 9px; -webkit-line-clamp: 4; }
  .bm-fb-code, .bm-fb-author { display: none; }
  .bm-cover-spine { width: 5px; }
  .bm-plate-label { margin-bottom: 4px; font-size: 8px; }
  .bm-book-title { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; margin-bottom: 4px; font-size: 15px; line-height: 1.25; }
  .bm-book-author { margin-bottom: 6px; font-size: 11px; }
  .bm-book-author em { font-size: inherit; }
  .bm-book-tags { gap: 5px; }
  .bm-code { padding: 3px 5px; font-size: 9px; }
  .bm-panel { position: static; flex: 1 1 auto; min-height: 0; }
  .bm-close { top: 10px; right: 10px; width: 32px; height: 32px; }
  .bm-body { gap: 12px; padding: 14px 16px 16px; }
  .bm-term { grid-template-columns: minmax(92px, .75fr) 1.25fr; gap: 8px; padding: 10px; }
  .bm-term dt { gap: 5px; font-size: 11px; }
  .bm-term dd { font-size: 12px; }
  .bm-reader { gap: 9px; padding: 9px; box-shadow: 2px 2px 0 var(--neo-ink, #111); }
  .bm-reader-avatar { flex-basis: 34px; width: 34px; height: 34px; }
  .bm-reader-name { font-size: 13px; }
  .bm-reader-sub { font-size: 10px; }
  .bm-hint { font-size: 11px; }
  .bm-notice { gap: 8px; padding: 10px; box-shadow: 2px 2px 0 var(--neo-ink, #111); }
  .bm-notice p { font-size: 11px; }
  .bm-footer { flex-wrap: nowrap; gap: 9px; padding: 12px 16px max(14px, env(safe-area-inset-bottom)); }
  .bm-btn { min-height: 44px; gap: 7px; font-size: 12px; }
  .bm-btn-ghost { flex: 0 0 auto; padding: 8px 12px; }
  .bm-btn-primary { flex: 1 1 auto; min-width: 0; justify-content: space-between; padding: 5px 6px 5px 10px; }
  .bm-btn-island { width: 30px; height: 30px; }
}

@media (max-width: 360px) {
  .bm-plate { max-height: 25dvh; }
  .bm-cover { width: 56px; }
  .bm-term { grid-template-columns: 1fr; gap: 3px; }
  .bm-term dd { padding-left: 23px; }
  .bm-reader-sub { font-size: 9px; }
  .bm-footer { gap: 7px; }
  .bm-btn-ghost { padding-inline: 9px; }
  .bm-btn-primary { font-size: 11px; }
}
</style>
