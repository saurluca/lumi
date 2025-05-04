<script setup>

const count = ref(0);

function increment() {
    count.value++;
}

function decrement() {
    count.value--;
}

function reset() {
    count.value = 0;
}   

</script>

<template>
  <div class="text-white w-screen h-screen flex justify-center items-center flex-col">
    <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" @click="increment">
      Increment
    </button>
    <div class="text-4xl">{{ count }}</div>
    <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" @click="decrement">
      Decrement
    </button>
    <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" @click="reset">
      Reset
    </button>
  </div>
</template>