<script setup>
</script>

<template>
  <header class="bg-blue-600 text-white shadow-md">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold">Lumi App</h1>
      <nav>
        <ul class="flex space-x-4">
          <li><NuxtLink to="/" class="hover:underline">Home</NuxtLink></li>
          <li><NuxtLink to="/todo" class="hover:underline">Todo</NuxtLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>
