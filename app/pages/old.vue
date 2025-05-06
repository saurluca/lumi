<script setup>
import { ref, watch, computed } from 'vue';

// Get Supabase client
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const newTask = ref('');
const tasks = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const progress = ref(0);

// Compute rocket position based on progress
const rocketPosition = computed(() => {
  // Scale the movement to be more visible
  // Move upward as progress increases, max movement of 250px
  const maxMovement = 250;
  const movement = (progress.value / 100) * maxMovement;
  return `translateY(${-movement}px)`;
});

// Add some subtle hover effect on the rocket
const isHovering = ref(false);

// Fetch all tasks for the current user
const fetchTasks = async () => {
  if (!user.value) return;
  
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from('task_test')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    tasks.value = data;
    
    // Calculate progress based on completed tasks
    if (data.length > 0) {
      const completedTasks = data.filter(task => task.is_complete).length;
      progress.value = Math.round((completedTasks / data.length) * 100);
    } else {
      progress.value = 0;
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error fetching tasks:', error);
  } finally {
    loading.value = false;
  }
};

// Add a new task with the current user's ID
const addTask = async () => {
  if (!newTask.value.trim() || !user.value) return;
  
  try {
    const { error } = await supabase
      .from('task_test')
      .insert([{ 
        name: newTask.value.trim(),
        user_id: user.value.id
      }]);
    
    if (error) throw error;
    
    newTask.value = '';
    await fetchTasks();
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error adding task:', error);
  }
};

// Delete a task
const deleteTask = async (id) => {
  try {
    const { error } = await supabase
      .from('task_test')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id); // Ensure only deleting user's own tasks
    
    if (error) throw error;
    
    // Update the local tasks array
    tasks.value = tasks.value.filter(task => task.id !== id);
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error deleting task:', error);
  }
};

// Toggle task completion
const toggleTaskCompletion = async (task) => {
  try {
    const { data, error } = await supabase
      .from('task_test')
      .update({ is_complete: !task.is_complete })
      .eq('id', task.id)
      .eq('user_id', user.value.id)
      .select();
    
    console.log('Supabase response - data:', data, 'error:', error);
    
    if (error) throw error;
    
    // Update locally
    const index = tasks.value.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks.value[index].is_complete = !tasks.value[index].is_complete;
      
      // Recalculate progress
      const completedTasks = tasks.value.filter(task => task.is_complete).length;
      progress.value = Math.round((completedTasks / tasks.value.length) * 100);
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error updating task:', error);
  }
};

// Watch for user changes
watch(user, () => {
  if (user.value) {
    fetchTasks();
  } else {
    tasks.value = [];
  }
});

onMounted(() => {
  if (user.value) {
    fetchTasks();
  }
});
</script>


<template>
<div class="flex justify-center items-center h-screen p-4">
  <div class="bg-gray-300 rounded-lg w-1/2 p-4 m-4 h-full">
      <h1 class="text-2xl font-bold">Tasks</h1>
      <div class="flex flex-col space-y-4 h-full">
        <UInput 
          v-model="newTask" 
          placeholder="Add a new task" 
          @keyup.enter="addTask"
        />
        <UButton @click="addTask">Add</UButton>
        
        <div v-if="loading" class="flex justify-center">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
        </div>
        
        <div v-else-if="tasks.length === 0" class="text-center text-gray-500">
          No tasks yet. Add one above!
        </div>
        
        <ul v-else class="space-y-2 overflow-y-auto flex-grow">
          <li v-for="task in tasks" :key="task.id" class="bg-white p-3 rounded-md shadow flex justify-between items-center">
            <div class="flex items-center gap-2">
              <UCheckbox 
                :modelValue="!!task.is_complete" 
                @update:modelValue="toggleTaskCompletion(task)" 
              />
              <div>
                <span :class="{ 'line-through': task.is_complete }">{{ task.name }}</span>
              </div>
            </div>
            <UButton icon="i-heroicons-trash" color="red" variant="ghost" @click="deleteTask(task.id)" />
          </li>
        </ul>

        <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
          <strong class="font-bold">Error: </strong>
          <span class="block sm:inline">{{ errorMessage }}</span>
          <UButton icon="i-heroicons-x-mark" color="red" variant="ghost" class="absolute top-0 right-0" @click="errorMessage = ''" />
        </div>
      </div>
  </div>
  <div class="bg-gray-300 rounded-lg w-1/2 p-4 m-4 h-full">
      <div class="flex flex-col justify-center items-center h-full space-y-4">
        <div class="relative h-64 flex items-end">
          <img 
            src="@/assets/rocket.svg" 
            alt="Rocket Icon" 
            class="w-24 h-auto transition-all duration-1000 hover:scale-110"
            :style="{ 
              transform: rocketPosition,
              filter: `drop-shadow(0 5px 15px rgba(59, 130, 246, ${progress.value / 200}))`
            }"
          >
        </div>
        <div class="w-full max-w-md">
          <UProgress v-model="progress" color="primary" :min="0" :max="100" />
          <div class="text-center mt-2">{{ progress }}% Complete</div>
        </div>
      </div>
  </div>
</div>
</template>
