<script>
  import AppHeader from './components/AppHeader.vue';
  import AppFooter from './components/AppFooter.vue';

  export default {
    components: {
      AppHeader,
      AppFooter,
    },
  };
</script>

<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <AppHeader />
    <main class="flex-grow-1 py-3 container">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<style>
/* Base overrides */
#app {
  background-color: var(--paper);
  color: var(--ink-primary);
}
</style>