<template>
  <div ref="root" class="filter-picker" @focusout="handleFocusOut">
    <button
      ref="trigger"
      class="catalog-filter-select filter-picker-trigger"
      type="button"
      :aria-label="`${ariaLabel}: ${selectedLabel}`"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggleMenu"
      @keydown.down.prevent="openMenu"
      @keydown.up.prevent="openMenu"
      @keydown.esc.prevent="closeMenu(true)"
    >
      <span>{{ selectedLabel }}</span>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" /></svg>
    </button>

    <div
      v-if="isOpen"
      class="filter-picker-menu"
      role="listbox"
      :aria-label="ariaLabel"
      @keydown.down.prevent="moveActiveOption(1)"
      @keydown.up.prevent="moveActiveOption(-1)"
      @keydown.home.prevent="focusOption(0)"
      @keydown.end.prevent="focusOption(options.length - 1)"
      @keydown.esc.prevent.stop="closeMenu(true)"
    >
      <button
        v-for="(option, index) in options"
        :key="option.value"
        :ref="(element) => setOptionRef(element, index)"
        class="filter-picker-option"
        :class="{ 'is-selected': option.value === modelValue }"
        type="button"
        role="option"
        :aria-selected="option.value === modelValue"
        @click="chooseOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "CatalogFilterSelect",
  props: {
    modelValue: { type: String, default: "all" },
    options: { type: Array, default: () => [] },
    ariaLabel: { type: String, required: true },
  },
  emits: ["update:modelValue"],
  data() {
    return { isOpen: false, activeIndex: 0, optionRefs: [] };
  },
  computed: {
    selectedLabel() {
      return this.options.find((option) => option.value === this.modelValue)?.label || this.options[0]?.label || "Chọn";
    },
  },
  mounted() {
    document.addEventListener("pointerdown", this.handleOutsidePointer);
  },
  beforeUnmount() {
    document.removeEventListener("pointerdown", this.handleOutsidePointer);
  },
  methods: {
    toggleMenu() {
      if (this.isOpen) this.closeMenu(true);
      else this.openMenu();
    },
    openMenu() {
      if (this.isOpen || !this.options.length) return;
      this.isOpen = true;
      const selectedIndex = this.options.findIndex((option) => option.value === this.modelValue);
      this.activeIndex = selectedIndex < 0 ? 0 : selectedIndex;
      this.$nextTick(() => this.optionRefs[this.activeIndex]?.focus());
    },
    closeMenu(returnFocus = false) {
      this.isOpen = false;
      if (returnFocus) this.$nextTick(() => this.$refs.trigger?.focus());
    },
    chooseOption(value) {
      this.$emit("update:modelValue", value);
      this.closeMenu(true);
    },
    setOptionRef(element, index) {
      if (element) this.optionRefs[index] = element;
    },
    focusOption(index) {
      if (!this.options.length) return;
      this.activeIndex = Math.max(0, Math.min(index, this.options.length - 1));
      this.$nextTick(() => this.optionRefs[this.activeIndex]?.focus());
    },
    moveActiveOption(direction) {
      const nextIndex = (this.activeIndex + direction + this.options.length) % this.options.length;
      this.focusOption(nextIndex);
    },
    handleOutsidePointer(event) {
      if (this.isOpen && !this.$refs.root?.contains(event.target)) this.closeMenu();
    },
    handleFocusOut(event) {
      if (this.isOpen && !this.$refs.root?.contains(event.relatedTarget)) this.closeMenu();
    },
  },
};
</script>

<style scoped>
.filter-picker, .filter-picker * { box-sizing: border-box; }
.filter-picker { position: relative; width: 100%; min-width: 0; }
.filter-picker-trigger { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; width: 100%; min-width: 0; min-height: 44px; padding: 0.55rem 0.75rem; border: 2px solid var(--ink-primary); border-radius: 0.65rem; background: var(--paper-subtle); color: var(--ink-primary); box-shadow: 2px 2px 0 var(--ink-primary); font: inherit; font-size: 0.82rem; font-weight: 600; text-align: left; cursor: pointer; transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease; }
.filter-picker-trigger:hover { border-color: var(--neo-violet); }
.filter-picker-trigger:focus-visible { outline: 2px solid var(--neo-violet); outline-offset: 2px; box-shadow: 1px 1px 0 var(--ink-primary); transform: translate(1px, 1px); }
.filter-picker-trigger span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filter-picker-trigger svg { flex: 0 0 auto; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.filter-picker-menu { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; display: grid; width: 100%; max-height: min(280px, 45vh); overflow-y: auto; overscroll-behavior: contain; padding: 4px; border: 2px solid var(--ink-primary); border-radius: 10px; background: var(--paper); box-shadow: 3px 3px 0 var(--ink-primary); }
.filter-picker-option { width: 100%; min-height: 38px; padding: 8px 10px; border: 0; border-radius: 5px; background: transparent; color: var(--ink-primary); font: inherit; font-size: 0.82rem; font-weight: 600; line-height: 1.35; text-align: left; cursor: pointer; }
.filter-picker-option:hover, .filter-picker-option.is-selected { background: var(--neo-yellow); color: var(--ink-primary); }
.filter-picker-option:focus-visible { outline: 2px solid var(--neo-violet); outline-offset: -2px; }
</style>
