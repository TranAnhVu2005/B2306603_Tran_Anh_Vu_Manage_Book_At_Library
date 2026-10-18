<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-wrapper" role="alert" aria-live="assertive">
        <div class="toast-shell">
          <div class="toast-core" :class="type === 'error' ? 'is-error' : 'is-success'">
            <!-- Icon -->
            <span class="toast-icon" aria-hidden="true">
              <svg v-if="type === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
            </span>

            <!-- Message -->
            <span class="toast-message">{{ message }}</span>

            <!-- Close -->
            <button class="toast-close" type="button" @click="visible = false" aria-label="Đóng thông báo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: "ToastNotification",
  data() {
    return {
      visible: false,
      message: "",
      type: "success",
      timeoutId: null,
    };
  },
  methods: {
    show(message, type = "success", duration = 3500) {
      this.message = message;
      this.type = type;
      this.visible = true;
      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => { this.visible = false; }, duration);
    }
  }
};
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  z-index: 2000;
  pointer-events: none;
  max-width: calc(100vw - 2rem);
}

/* Double-Bezel Toast */
.toast-shell {
  padding: 4px;
  border-radius: 999px;
  background: var(--tray, rgba(28,25,23,0.04));
  box-shadow: inset 0 0 0 1px var(--hair, rgba(28,25,23,0.08));
  pointer-events: auto;
}

.toast-core {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.65rem 0.65rem 1rem;
  border-radius: calc(999px - 4px);
  min-width: min(260px, calc(100vw - 3rem));
  max-width: 400px;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.14), 0 12px 24px -8px rgba(0,0,0,0.3);
}
.toast-core.is-success {
  background: var(--primary, #143529);
  color: #FBF9F2;
}
.toast-core.is-error {
  background: var(--accent, #8C3D28);
  color: #FBF9F2;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 0.84rem;
  font-weight: 500;
  font-family: var(--font-sans, system-ui, sans-serif);
  line-height: 1.4;
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.12);
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.35s var(--ease-spring);
}
.toast-close:hover { background: rgba(255,255,255,0.24); }

/* Transition */
.toast-enter-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.4s var(--ease-out);
}
.toast-leave-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s var(--ease-out);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.94);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

@media (max-width: 575.98px) {
  .toast-wrapper {
    right: 1rem;
    bottom: 1rem;
  }

  .toast-core { padding-left: 0.75rem; }
}
</style>
