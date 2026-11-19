<template>
  <div class="neo-chatbox-root">
    <!-- Nút mở khung chat nổi góc dưới phải -->
    <button
      type="button"
      class="neo-chat-launcher"
      :class="{ 'is-open': isOpen, 'is-icon-only': !isOpen }"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-label="isOpen ? 'Đóng Trợ lý AI Thư viện' : 'Mở Trợ lý AI Thư viện'"
      :title="isOpen ? 'Đóng trợ lý' : 'Trợ lý Thư viện AI'"
      @click="toggleChat"
    >
      <img
        v-if="!isOpen"
        :src="chatIcon"
        alt="Trợ lý Thư viện AI"
        class="neo-chat-launcher-img"
      />
      <template v-else>
        <span class="launcher-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </span>
        <span class="launcher-text">Đóng trợ lý</span>
      </template>
    </button>

    <!-- Khung cửa sổ chat Neo-brutalism -->
    <section
      v-if="isOpen"
      class="neo-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Trợ lý AI Thư viện CTU"
    >
      <!-- Header -->
      <header class="neo-chat-header">
        <div class="neo-chat-brand">
          <span class="neo-chat-avatar" aria-hidden="true">AI</span>
          <div class="neo-chat-title-wrap">
            <h2 class="neo-chat-title">Trợ lý Thư viện CTU</h2>
            <p class="neo-chat-subtitle">Tra cứu sách, thể loại, nghiệp vụ &amp; duyệt đền bù PayOS</p>
          </div>
        </div>
        <div class="neo-chat-header-actions">
          <button
            type="button"
            class="neo-chat-icon-btn"
            title="Làm mới cuộc trò chuyện"
            aria-label="Làm mới cuộc trò chuyện"
            @click="resetConversation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
          <button
            type="button"
            class="neo-chat-icon-btn"
            title="Thu gọn"
            aria-label="Thu gọn cửa sổ chat"
            @click="isOpen = false"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Danh sách câu hỏi gợi ý nhanh -->
      <div class="neo-chat-chips" aria-label="Gợi ý câu hỏi nhanh">
        <button
          v-for="chip in quickPrompts"
          :key="chip.label"
          type="button"
          class="neo-chat-chip"
          :disabled="loading"
          @click="sendQuickPrompt(chip.prompt)"
        >
          {{ chip.label }}
        </button>
      </div>

      <!-- Nội dung hội thoại -->
      <div ref="messagesContainer" class="neo-chat-messages" aria-live="polite">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="neo-chat-row"
          :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
        >
          <div class="neo-chat-bubble">
            <div class="neo-chat-text">
              <template v-for="(block, bIndex) in parseBlocks(msg.text)" :key="bIndex">
                <h3 v-if="block.type === 'heading'" class="chat-block-heading">
                  <template v-for="(seg, sIdx) in block.segments" :key="sIdx">
                    <strong v-if="seg.bold">{{ seg.text }}</strong>
                    <code v-else-if="seg.code" class="chat-inline-code">{{ seg.text }}</code>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </h3>
                <div v-else-if="block.type === 'bullet'" class="chat-block-bullet">
                  <span class="bullet-dot" aria-hidden="true">▪</span>
                  <span>
                    <template v-for="(seg, sIdx) in block.segments" :key="sIdx">
                      <strong v-if="seg.bold">{{ seg.text }}</strong>
                      <code v-else-if="seg.code" class="chat-inline-code">{{ seg.text }}</code>
                      <span v-else>{{ seg.text }}</span>
                    </template>
                  </span>
                </div>
                <p v-else class="chat-block-paragraph">
                  <template v-for="(seg, sIdx) in block.segments" :key="sIdx">
                    <strong v-if="seg.bold">{{ seg.text }}</strong>
                    <code v-else-if="seg.code" class="chat-inline-code">{{ seg.text }}</code>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </p>
              </template>
            </div>

            <!-- Danh sách thẻ sách gợi ý trực tiếp -->
            <div v-if="msg.suggestedBooks && msg.suggestedBooks.length" class="neo-chat-books">
              <div class="neo-chat-books-label">SÁCH TRONG KHO ({{ msg.suggestedBooks.length }})</div>
              <router-link
                v-for="book in msg.suggestedBooks"
                :key="book.MaSach"
                :to="`${bookDetailPrefix}/${book.MaSach}`"
                class="neo-chat-book-card text-decoration-none"
              >
                <div class="neo-chat-book-top">
                  <span class="neo-chat-book-code font-mono-code">{{ book.MaSach }}</span>
                  <span
                    class="neo-chat-book-stock"
                    :class="book.SoQuyen > 0 ? 'in-stock' : 'out-stock'"
                  >
                    {{ book.SoQuyen > 0 ? `Còn ${book.SoQuyen} quyển` : "Tạm hết" }}
                  </span>
                </div>
                <div class="neo-chat-book-title">{{ book.TenSach }}</div>
                <div class="neo-chat-book-meta">
                  {{ book.TacGia }} · {{ book.TenTheLoai }} · {{ Number(book.DonGia || 0).toLocaleString("vi-VN") }} ₫
                </div>
                <div v-if="book.MoTa" class="neo-chat-book-desc">{{ book.MoTa }}</div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Trạng thái đang trả lời -->
        <div v-if="loading" class="neo-chat-row is-assistant">
          <div class="neo-chat-bubble neo-chat-typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="ms-1 small fw-bold">Trợ lý đang tra cứu dữ liệu thư viện...</span>
          </div>
        </div>
      </div>

      <!-- Khung nhập tin nhắn -->
      <form class="neo-chat-input-bar" @submit.prevent="handleSend">
        <input
          ref="chatInput"
          v-model="draft"
          type="text"
          class="neo-chat-input"
          placeholder="Hỏi về kho sách, thể loại, duyệt đền bù PayOS..."
          maxlength="1000"
          :disabled="loading"
          aria-label="Nội dung câu hỏi gửi trợ lý thư viện"
        />
        <button
          type="submit"
          class="neo-chat-send-btn"
          :disabled="loading || !draft.trim()"
          aria-label="Gửi tin nhắn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import chatbotService from "../services/chatbot.service";
import chatIcon from "../assets/chat_icon.webp";

const INITIAL_GREETING =
  "Xin chào! Mình là **Trợ lý Thư viện CTU** trên Cổng Quản lý. Mình nắm rõ toàn bộ danh mục kho sách, thể loại, tóm tắt nội dung sách và quy trình nghiệp vụ Thủ thư / Quản trị viên (bao gồm duyệt chuyển khoản đền bù mất sách qua PayOS).";

export default {
  name: "LibraryChatbox",
  props: {
    bookDetailPrefix: {
      type: String,
      default: "/catalog/books",
    },
  },
  data() {
    return {
      chatIcon,
      isOpen: false,
      draft: "",
      loading: false,
      messages: [
        {
          role: "assistant",
          text: INITIAL_GREETING,
          suggestedBooks: [],
        },
      ],
      quickPrompts: [
        { label: "Thống kê vận hành", prompt: "Kiểm tra thống kê phiếu mượn và các giao dịch đền bù PayOS đang chờ duyệt trong hệ thống." },
        { label: "Các thể loại sách", prompt: "Thư viện hiện có những thể loại sách nào và số lượng đầu sách mỗi thể loại?" },
        { label: "Tư vấn & Mô tả sách", prompt: "Gợi ý các đầu sách nổi bật đang còn trong kho kèm mô tả nội dung." },
        { label: "Quy trình duyệt PayOS", prompt: "Giải thích quy trình độc giả báo mất sách, chuyển khoản PayOS và quản trị viên xét duyệt đền bù." },
      ],
    };
  },
  mounted() {
    window.addEventListener("keydown", this.handleGlobalKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleGlobalKeydown);
  },
  methods: {
    toggleChat() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$nextTick(() => {
          this.scrollToBottom();
          this.$refs.chatInput?.focus();
        });
      }
    },
    handleGlobalKeydown(event) {
      if (event.key === "Escape" && this.isOpen) {
        this.isOpen = false;
      }
    },
    resetConversation() {
      this.messages = [
        {
          role: "assistant",
          text: INITIAL_GREETING,
          suggestedBooks: [],
        },
      ];
      this.draft = "";
      this.$nextTick(() => this.scrollToBottom());
    },
    sendQuickPrompt(promptText) {
      if (this.loading) return;
      this.draft = promptText;
      this.handleSend();
    },
    async handleSend() {
      const text = this.draft.trim();
      if (!text || this.loading) return;

      const historyPayload = this.messages
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      this.messages.push({
        role: "user",
        text,
        suggestedBooks: [],
      });
      this.draft = "";
      this.loading = true;
      this.$nextTick(() => this.scrollToBottom());

      try {
        const res = await chatbotService.ask(text, historyPayload);
        const data = res?.data || {};
        this.messages.push({
          role: "assistant",
          text: data.reply || "Mình đã ghi nhận câu hỏi nhưng chưa có dữ liệu trả lời phù hợp.",
          suggestedBooks: Array.isArray(data.suggestedBooks) ? data.suggestedBooks : [],
        });
      } catch (err) {
        const errMsg =
          err.response?.data?.message ||
          "Không thể kết nối với trợ lý thư viện lúc này. Vui lòng thử lại sau giây lát.";
        this.messages.push({
          role: "assistant",
          text: errMsg,
          suggestedBooks: [],
        });
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          this.scrollToBottom();
          this.$refs.chatInput?.focus();
        });
      }
    },
    scrollToBottom() {
      const el = this.$refs.messagesContainer;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },
    parseInlineSegments(line) {
      const segments = [];
      const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ text: line.slice(lastIndex, match.index), bold: false, code: false });
        }
        const token = match[0];
        if (token.startsWith("**") && token.endsWith("**")) {
          segments.push({ text: token.slice(2, -2), bold: true, code: false });
        } else if (token.startsWith("`") && token.endsWith("`")) {
          segments.push({ text: token.slice(1, -1), bold: false, code: true });
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        segments.push({ text: line.slice(lastIndex), bold: false, code: false });
      }
      return segments.length ? segments : [{ text: line, bold: false, code: false }];
    },
    parseBlocks(rawText) {
      const lines = String(rawText || "").split(/\r?\n/);
      const blocks = [];
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (/^#{1,4}\s+/.test(trimmed)) {
          blocks.push({
            type: "heading",
            segments: this.parseInlineSegments(trimmed.replace(/^#{1,4}\s+/, "")),
          });
        } else if (/^([-*•]|\d+\.)\s+/.test(trimmed)) {
          blocks.push({
            type: "bullet",
            segments: this.parseInlineSegments(trimmed.replace(/^([-*•]|\d+\.)\s+/, "")),
          });
        } else {
          blocks.push({
            type: "paragraph",
            segments: this.parseInlineSegments(trimmed),
          });
        }
      }
      return blocks;
    },
  },
};
</script>

<style scoped>
.neo-chatbox-root {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1045;
  font-family: "Be Vietnam Pro", system-ui, -apple-system, sans-serif;
}

.neo-chat-launcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 10px 16px;
  background: #fdc800;
  color: #111111;
  border: 2.5px solid #111111;
  border-radius: 10px;
  box-shadow: 4px 4px 0 #111111;
  font-weight: 800;
  font-size: 0.88rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.16s ease;
}

.neo-chat-launcher.is-icon-only {
  width: 60px;
  height: 60px;
  min-height: 60px;
  padding: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #fffdf2;
  justify-content: center;
}

.neo-chat-launcher-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.neo-chat-launcher:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #111111;
  background: #ffe047;
}

.neo-chat-launcher:active,
.neo-chat-launcher.is-open {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #111111;
}

.neo-chat-launcher:focus-visible {
  outline: 3px solid #432dd7;
  outline-offset: 2px;
}

.launcher-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.neo-chat-panel {
  position: fixed;
  right: 18px;
  bottom: 74px;
  width: min(420px, calc(100vw - 24px));
  height: min(610px, calc(100vh - 102px));
  display: flex;
  flex-direction: column;
  background: #fffdf2;
  color: #111111;
  border: 3px solid #111111;
  border-radius: 14px;
  box-shadow: 6px 6px 0 #111111;
  overflow: hidden;
}

.neo-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  background: #432dd7;
  color: #ffffff;
  border-bottom: 2.5px solid #111111;
}

.neo-chat-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.neo-chat-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fdc800;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 8px;
  box-shadow: 2px 2px 0 #111111;
  font-weight: 900;
  font-size: 0.82rem;
}

.neo-chat-title-wrap {
  min-width: 0;
}

.neo-chat-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.neo-chat-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.62rem;
  font-weight: 800;
  background: #fdc800;
  color: #111111;
  border: 1.5px solid #111111;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

.neo-chat-subtitle {
  margin: 2px 0 0;
  font-size: 0.73rem;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.neo-chat-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.neo-chat-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fffdf2;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 7px;
  box-shadow: 2px 2px 0 #111111;
  cursor: pointer;
}

.neo-chat-icon-btn:hover {
  background: #fdc800;
}

.neo-chat-icon-btn:focus-visible {
  outline: 2px solid #fdc800;
  outline-offset: 2px;
}

.neo-chat-chips {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f2e3;
  border-bottom: 2px solid #111111;
  overflow-x: auto;
  scrollbar-width: thin;
}

.neo-chat-chip {
  flex-shrink: 0;
  padding: 5px 10px;
  background: #fffdf2;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 7px;
  box-shadow: 2px 2px 0 #111111;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.14s ease, transform 0.14s ease;
}

.neo-chat-chip:hover:not(:disabled) {
  background: #fdc800;
  transform: translateY(-1px);
}

.neo-chat-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.neo-chat-messages {
  flex: 1 1 auto;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fffdf2;
}

.neo-chat-row {
  display: flex;
  width: 100%;
}

.neo-chat-row.is-user {
  justify-content: flex-end;
}

.neo-chat-row.is-assistant {
  justify-content: flex-start;
}

.neo-chat-bubble {
  max-width: 90%;
  padding: 10px 12px;
  border: 2px solid #111111;
  border-radius: 10px;
  font-size: 0.84rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.neo-chat-row.is-user .neo-chat-bubble {
  background: #fdc800;
  color: #111111;
  box-shadow: 3px 3px 0 #111111;
  font-weight: 600;
}

.neo-chat-row.is-assistant .neo-chat-bubble {
  background: #ffffff;
  color: #111111;
  box-shadow: 3px 3px 0 #111111;
}

.chat-block-heading {
  font-size: 0.88rem;
  font-weight: 800;
  margin: 0 0 6px;
  padding-bottom: 4px;
  border-bottom: 2px solid #111111;
  color: #111111;
}

.chat-block-paragraph {
  margin: 0 0 6px;
}

.chat-block-paragraph:last-child {
  margin-bottom: 0;
}

.chat-block-bullet {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0 0 5px;
}

.bullet-dot {
  color: #432dd7;
  font-weight: 900;
  line-height: 1.4;
}

.chat-inline-code {
  padding: 1px 5px;
  background: #f3efe0;
  border: 1px solid #111111;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #111111;
}

.neo-chat-books {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 2px dashed #111111;
  display: grid;
  gap: 8px;
}

.neo-chat-books-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #432dd7;
}

.neo-chat-book-card {
  display: block;
  padding: 8px 10px;
  background: #fffdf2;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 8px;
  box-shadow: 2px 2px 0 #111111;
  transition: transform 0.14s ease, background-color 0.14s ease;
}

.neo-chat-book-card:hover {
  background: #fff6c2;
  transform: translate(-1px, -1px);
}

.neo-chat-book-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 3px;
}

.neo-chat-book-code {
  font-size: 0.7rem;
  font-weight: 700;
  color: #432dd7;
}

.neo-chat-book-stock {
  font-size: 0.66rem;
  font-weight: 800;
  padding: 1px 6px;
  border: 1.5px solid #111111;
  border-radius: 4px;
}

.neo-chat-book-stock.in-stock {
  background: #d1fae5;
  color: #065f46;
}

.neo-chat-book-stock.out-stock {
  background: #fee2e2;
  color: #991b1b;
}

.neo-chat-book-title {
  font-weight: 800;
  font-size: 0.83rem;
  color: #111111;
  margin-bottom: 2px;
}

.neo-chat-book-meta {
  font-size: 0.73rem;
  font-weight: 600;
  color: #374151;
}

.neo-chat-book-desc {
  margin-top: 4px;
  font-size: 0.72rem;
  color: #4b5563;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.neo-chat-typing {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  background: #432dd7;
  border: 1px solid #111111;
  border-radius: 50%;
  animation: chatPulse 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chatPulse {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 1; }
}

.neo-chat-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f5f2e3;
  border-top: 2.5px solid #111111;
}

.neo-chat-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  background: #ffffff;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 500;
}

.neo-chat-input:focus {
  outline: 2.5px solid #432dd7;
  outline-offset: 1px;
}

.neo-chat-send-btn {
  flex-shrink: 0;
  width: 42px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fdc800;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 8px;
  box-shadow: 2px 2px 0 #111111;
  cursor: pointer;
}

.neo-chat-send-btn:hover:not(:disabled) {
  background: #ffe047;
}

.neo-chat-send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 575.98px) {
  .neo-chatbox-root {
    right: 12px;
    bottom: 12px;
  }

  .neo-chat-panel {
    right: 12px;
    left: 12px;
    bottom: 66px;
    width: auto;
    height: min(540px, calc(100vh - 88px));
  }

  .neo-chat-launcher {
    padding: 8px 13px;
    font-size: 0.82rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .neo-chat-launcher,
  .neo-chat-chip,
  .neo-chat-book-card,
  .typing-dot {
    transition: none;
    animation: none;
  }
}
</style>
