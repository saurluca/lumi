<script setup>
const route = useRoute();
</script>

<template>
  <nav class="flex justify-between items-center w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 shadow-md rounded-b-lg">
    <h2 class="text-2xl font-bold text-white">
      <span class="mr-1">✨</span>Lumi App
    </h2>
    <ul class="flex space-x-6">
      <li>
        <NuxtLink to="/" class="text-white font-medium transition duration-300 ease-in-out hover:text-blue-200 relative" :class="{ 'after:absolute after:h-0.5 after:w-full after:bg-white after:bottom-[-4px] after:left-0': route.path === '/' }">
          Home
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/todo" class="text-white font-medium transition duration-300 ease-in-out hover:text-blue-200 relative" :class="{ 'after:absolute after:h-0.5 after:w-full after:bg-white after:bottom-[-4px] after:left-0': route.path === '/todo' }">
          Todo
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template> 