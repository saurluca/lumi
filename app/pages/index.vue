<script setup>
import { ref } from 'vue';

// Simple counter for button interaction
const count = ref(0);
</script>


<template>
  <div class="flex flex-col space-y-8">
    <div class="flex flex-col items-center justify-center space-y-8">
      <h1 class="text-4xl font-bold text-center">Hello World!</h1>
      <UButton>Click me</UButton>
    </div>
  </div>
</template>
