<script setup>
import { ref } from 'vue';

// Simple counter for button interaction
const count = ref(0);
</script>

<script>
// Define the layout for this page
export default {
  layout: 'd-basic-page'
}
</script>

<template>
  <div class="flex flex-col space-y-8">
    <d-nav />
    <div class="flex flex-col items-center justify-center space-y-8">
      <h1 class="text-4xl font-bold text-center">Hello World!</h1>
      <p class="text-xl text-gray-600 text-center">Welcome to your Lumi application</p>
      
      <div class="flex space-x-4">
        <d-button @click="count++">
          Clicked {{ count }} times
        </d-button>
        
        <d-button variant="secondary" @click="count = 0">
          Reset
        </d-button>
      </div>
    </div>
  </div>
</template>
