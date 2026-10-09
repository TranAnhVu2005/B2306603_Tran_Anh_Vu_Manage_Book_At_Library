<template>
  <div v-if="visible" class="ath-toast-wrapper">
    <div class="ath-toast d-flex align-items-center shadow-lg" :class="type === 'error' ? 'ath-toast-error' : 'ath-toast-success'">
      <i v-if="type === 'error'" class="fas fa-exclamation-circle mr-2" style="font-size: 1.1rem;"></i>
      <i v-else class="fas fa-check-circle mr-2" style="font-size: 1.1rem;"></i>
      <span class="small font-weight-500">{{ message }}</span>
      <button type="button" class="close ml-3 text-white" style="opacity: 0.8; font-size: 1rem;" @click="visible = false">
        <span>&times;</span>
      </button>
    </div>
  </div>
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
      this.timeoutId = setTimeout(() => {
        this.visible = false;
      }, duration);
    }
  }
};
</script>

<style scoped>
.ath-toast-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  animation: athToastFadeIn 0.25s ease-out;
}

.ath-toast {
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  color: #ffffff;
  min-width: 280px;
  max-width: 420px;
}

.ath-toast-success {
  background-color: var(--primary);
  border: 1px solid var(--primary-dark);
}

.ath-toast-error {
  background-color: var(--accent);
  border: 1px solid #722e1c;
}

@keyframes athToastFadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
