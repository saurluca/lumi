<script setup lang="ts">
// code here
</script>

<template>
  <div class="flex h-full max-h-screen flex-col sm:flex-row">
    <d-sidebar />
    <main class="flex-1 overflow-scroll p-2">
      <slot></slot>
    </main>
  </div>
</template>