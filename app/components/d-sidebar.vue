<script setup>
const route = useRoute();
</script>

<template>
  <div class="bg-gray-300 min-h-screen w-48 p-4 border-r">
    <h1 class="text-xl font-bold mb-6">Lumi App</h1>
    <nav>
      <ul class="space-y-3">
        <li>
          <NuxtLink to="/" class="block py-2 px-3 rounded bg-gray-200 hover:bg-gray-400 transition-colors duration-200 text-center" :class="{ 'bg-blue-500 text-white hover:bg-blue-600': route.path === '/' }">
            Home
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/todo" class="block py-2 px-3 rounded bg-gray-200 hover:bg-gray-400 transition-colors duration-200 text-center" :class="{ 'bg-blue-500 text-white hover:bg-blue-600': route.path === '/todo' }">
            Todo
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
