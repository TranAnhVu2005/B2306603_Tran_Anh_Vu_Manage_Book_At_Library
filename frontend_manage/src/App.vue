<script>
  import AppHeader from './components/ManagerHeader.vue';
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
    <main class="app-main container flex-grow-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<style>
#app {
  background-color: var(--paper);
  color: var(--ink-primary);
}

.app-main {
  min-width: 0;
  padding-top: clamp(1.25rem, 3vw, 2rem);
  padding-bottom: clamp(1.75rem, 4vw, 3rem);
}
</style>
