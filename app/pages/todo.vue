<script setup>
import { ref, watch } from 'vue';

// Get Supabase client
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const newTask = ref('');
const tasks = ref([]);
const loading = ref(true);
const errorMessage = ref('');

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

// Set up realtime subscription
let realtimeChannel;

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
  
  // Realtime updates - subscribed to user's own tasks
  realtimeChannel = supabase
    .channel('public:task_test')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'task_test',
        filter: `user_id=eq.${user.value?.id}`
      },
      () => fetchTasks()
    )
    .subscribe();
});

onUnmounted(() => {
  supabase.removeChannel(realtimeChannel);
});
</script>

<script>
// Define the layout for this page
export default {
  layout: 'd-basic-page'
}
</script>

<template>
  <div>
    <d-nav />
    <h1 class="text-3xl font-bold mb-6">Todo List</h1>
    
    <!-- User not logged in message -->
    <div v-if="!user" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
      Please log in to manage your tasks.
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ errorMessage }}
    </div>
    
    <!-- Add task form -->
    <div v-if="user" class="flex mb-6">
      <d-input 
        v-model="newTask" 
        placeholder="Add a new task..."
        class="flex-grow mr-2"
        @keyup.enter="addTask"
      />
      <d-button @click="addTask">Add</d-button>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="loading && user" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <!-- Tasks list -->
    <div v-else-if="tasks.length > 0">
      <ul class="space-y-3">
        <li v-for="task in tasks" :key="task.id" class="bg-white shadow rounded-lg p-4 flex justify-between items-center">
          <span>{{ task.name }}</span>
          
          <div class="flex space-x-2">
            <d-button variant="secondary" @click="deleteTask(task.id)">Delete</d-button>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="user" class="text-center py-8 text-gray-500">
      No tasks yet. Add one above!
    </div>
  </div>
</template>
