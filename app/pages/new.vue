<script setup>
import { ref, watch, computed } from 'vue';

// Get Supabase client
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

// Create audio instances
const launchSound = new Audio('/assets/wuuui.mp3');
const completionSounds = [
  new Audio('/assets/GoodJob.mp3'),
  new Audio('/assets/Nice.mp3'),
  new Audio('/assets/Yes.mp3')
];

// Function to play random completion sound
const playRandomCompletionSound = () => {
  const randomSound = completionSounds[Math.floor(Math.random() * completionSounds.length)];
  randomSound.currentTime = 0;
  randomSound.play()
    .catch(error => console.error('Error playing completion sound:', error));
};

// Task management
const newTask = ref('');
const tasks = ref([]);
const loading = ref(true);
const addingTask = ref(false);
const isLaunching = ref(false);

// Check if all tasks are complete
const allTasksComplete = computed(() => {
  return tasks.value.length > 0 && tasks.value.every(task => task.is_complete);
});

// Launch function
const handleLaunch = () => {
  if (!allTasksComplete.value) return;
  console.log('All tasks complete, playing sound...');
  
  // Set current progress as CSS variable for animation
  const rocketElement = document.querySelector('.rocket-container');
  if (rocketElement) {
    rocketElement.style.setProperty('--rocket-progress', rocketProgress.value);
  }
  
  // Set launching state
  isLaunching.value = true;
  
  // Play launch sound
  launchSound.currentTime = 0; // Reset sound to start
  launchSound.play()
    .catch(error => console.error('Error playing sound:', error));
    
  // Reset launch state after animation completes
  setTimeout(() => {
    isLaunching.value = false;
  }, 2000); // Match the animation duration
};

// Rocket progress state
const rocketProgress = computed(() => {
  if (!tasks.value.length) return 0;
  const completedTasks = tasks.value.filter(task => task.is_complete).length;
  return Math.round((completedTasks / tasks.value.length) * 100);
});

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
    console.error('Error fetching tasks:', error);
  } finally {
    loading.value = false;
  }
};

// Generate a temporary ID
const generateTempId = () => {
  return 'temp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
};

// Add a new task (optimistic update)
const addTask = async () => {
  if (!newTask.value.trim() || !user.value) return;
  
  // Create a temporary task and add it immediately
  const tempTask = {
    id: generateTempId(),
    name: newTask.value.trim(),
    user_id: user.value.id,
    is_complete: false,
    created_at: new Date().toISOString()
  };
  
  // Optimistically add to the UI
  tasks.value = [tempTask, ...tasks.value];
  
  // Clear input field immediately
  const taskContent = newTask.value.trim();
  newTask.value = '';
  
  try {
    addingTask.value = true;
    
    // Send to server
    const { data, error } = await supabase
      .from('task_test')
      .insert([{ 
        name: taskContent,
        user_id: user.value.id
      }])
      .select();
    
    if (error) throw error;
    
    // Replace temp task with real one from server
    if (data && data[0]) {
      const index = tasks.value.findIndex(t => t.id === tempTask.id);
      if (index !== -1) {
        tasks.value[index] = data[0];
      }
    }
  } catch (error) {
    // Remove temp task on error
    tasks.value = tasks.value.filter(t => t.id !== tempTask.id);
    console.error('Error adding task:', error);
    
    // Restore input if there was an error
    newTask.value = taskContent;
  } finally {
    addingTask.value = false;
  }
};

// Delete a task (optimistic update)
const deleteTask = async (id) => {
  // Save task for possible restoration
  const taskIndex = tasks.value.findIndex(t => t.id === id);
  const deletedTask = tasks.value[taskIndex];
  
  // Optimistically remove from UI
  tasks.value = tasks.value.filter(task => task.id !== id);
  
  // Only send request to server for real tasks (not temporary ones)
  if (typeof id === 'string' && id.startsWith('temp_')) {
    return; // No need to delete temporary tasks from the server
  }
  
  try {
    const { error } = await supabase
      .from('task_test')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id);
    
    if (error) throw error;
  } catch (error) {
    // Restore task on error
    if (taskIndex !== -1) {
      tasks.value.splice(taskIndex, 0, deletedTask);
    }
    console.error('Error deleting task:', error);
  }
};

// Toggle task completion (optimistic update)
const toggleTaskCompletion = async (task) => {
  // Get and save the current state
  const taskIndex = tasks.value.findIndex(t => t.id === task.id);
  const previousState = task.is_complete;
  const updatedState = !previousState;
  
  // Update UI immediately
  if (taskIndex !== -1) {
    tasks.value[taskIndex].is_complete = updatedState;
    
    // Play sound only when completing a task (not when unchecking)
    if (updatedState) {
      playRandomCompletionSound();
    }
  }
  
  // Only send request to server for real tasks (not temporary ones)
  if (typeof task.id === 'string' && task.id.startsWith('temp_')) {
    return; // No need to update temporary tasks on the server
  }
  
  try {
    const { data, error } = await supabase
      .from('task_test')
      .update({ is_complete: updatedState })
      .eq('id', task.id)
      .select();
    
    if (error) throw error;
  } catch (error) {
    // Revert to previous state on error
    if (taskIndex !== -1) {
      tasks.value[taskIndex].is_complete = previousState;
    }
    console.error('Error updating task:', error);
  }
};

// Watch for user changes
watch(user, () => {
  if (user.value) {
    fetchTasks();
  } else {
    router.push('/login');
  }
});

onMounted(() => {
  if (user.value) {
    fetchTasks();
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <!-- Space background -->
  <div class="space-background">
    <!-- Stars -->
    <div class="stars-container">
      <div class="stars stars1"></div>
      
      <!-- Add shooting stars -->
      <div class="shooting-star shooting-star-1"></div>
      <div class="shooting-star shooting-star-2"></div>
      <div class="shooting-star shooting-star-3"></div>
    </div>
    
    <!-- Moon -->
    <div class="moon">
      <div class="crater crater1"></div>
      <div class="crater crater2"></div>
      <div class="crater crater3"></div>
      <div class="crater crater4"></div>
      <div class="crater crater5"></div>
    </div>
    
    <!-- Content container -->
    <UContainer class="content-container max-w-3xl px-4 py-8">
      <!-- Header -->
      <div class="mb-8 text-center" v-if="!isLaunching">
        <h1 class="text-3xl font-bold text-white text-shadow-lg mb-2">Lumi Rocket Adventures</h1>
        <p class="text-blue-200 text-shadow-sm">Complete tasks to fuel your rocket!</p>
      </div>
      <div class="mb-8 text-center" v-else>
        <div class="h-[110px]"></div>
      </div>

      <!-- Rocket Progress Visualization -->
      <div class="mb-8 relative">
        <div class="flex justify-center mb-4">
          <UButton 
            v-if="!isLaunching"
            class="progress-badge z-50"
            :class="{
              'progress-badge-complete': allTasksComplete,
              'cursor-pointer hover:scale-105 transform transition-transform': allTasksComplete,
              'cursor-default': !allTasksComplete
            }"
            @click="handleLaunch"
          >
            <span class="text-lg font-bold text-white">
              {{ rocketProgress }}% Ready for Launch!
            </span>
          </UButton>
        </div>
        
        <div class="relative h-80 flex justify-center items-end">
          <!-- Planet surface -->
          <div class="planet-surface"></div>
          
          <!-- Launch platform -->
          <div class="launch-platform">
            <div class="platform-light"></div>
            <div class="platform-light"></div>
            <div class="platform-light"></div>
          </div>
          
          <!-- Rocket SVG -->
          <div 
            class="rocket-container" 
            :class="{ 'launching': isLaunching }"
            :style="{
              transform: `translateY(${-rocketProgress * 0.7}%)`,
              animation: isLaunching ? 'launch 2.1s cubic-bezier(0.45, 0, 0.55, 1) forwards' : 'none'
            }"
          >
            <svg width="120" height="200" viewBox="0 0 120 200" class="rocket-svg">
              <!-- Flames -->
              <g v-if="rocketProgress > 0" class="flame">
                <path d="M45,180 Q60,210 75,180 Z" fill="url(#flame-gradient)" class="flame-outer">
                  <animate attributeName="d" values="M45,180 Q60,210 75,180 Z; M45,180 Q60,220 75,180 Z; M45,180 Q60,210 75,180 Z" dur="0.8s" repeatCount="indefinite" />
                </path>
                <path d="M50,180 Q60,200 70,180 Z" fill="#FFF" class="flame-inner" opacity="0.8">
                  <animate attributeName="d" values="M50,180 Q60,200 70,180 Z; M50,180 Q60,210 70,180 Z; M50,180 Q60,200 70,180 Z" dur="0.5s" repeatCount="indefinite" />
                </path>
              </g>
              
              <!-- Rocket body with gradients -->
              <defs>
                <linearGradient id="body-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#2563EB" />
                  <stop offset="100%" stop-color="#4F46E5" />
                </linearGradient>
                <linearGradient id="window-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#DBEAFE" />
                  <stop offset="100%" stop-color="#93C5FD" />
                </linearGradient>
                <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#FEF3C7" />
                  <stop offset="50%" stop-color="#F59E0B" />
                  <stop offset="100%" stop-color="#DC2626" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              <!-- Rocket body -->
              <g class="rocket-body">
                <!-- Bottom fins -->
                <path d="M30,160 L40,130 L40,160 Z" fill="#1E40AF" />
                <path d="M80,160 L80,130 L90,160 Z" fill="#1E40AF" />
                
                <!-- Main body -->
                <rect x="40" y="80" width="40" height="80" fill="url(#body-gradient)" rx="4" />
                
                <!-- Top cone -->
                <path d="M40,80 Q60,30 80,80 Z" fill="url(#body-gradient)" />
                
                <!-- Side fins -->
                <path d="M25,120 L40,110 L40,130 Z" fill="#1E40AF" />
                <path d="M95,120 L80,110 L80,130 Z" fill="#1E40AF" />
                
                <!-- Windows -->
                <circle cx="60" cy="65" r="12" fill="url(#window-gradient)" />
                <circle cx="60" cy="100" r="6" fill="url(#window-gradient)" />
                <circle cx="60" cy="130" r="6" fill="url(#window-gradient)" />
                
                <!-- Decoration -->
                <rect x="57" y="80" width="6" height="80" fill="#1E40AF" />
              </g>
              
              <!-- Smoke particles when rocket is moving -->
              <g v-if="rocketProgress > 0" class="smoke">
                <circle cx="50" r="3" fill="#CBD5E1" opacity="0.7">
                  <animate attributeName="cy" values="180;220" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="70" r="4" fill="#CBD5E1" opacity="0.7">
                  <animate attributeName="cy" values="180;220" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="60" r="5" fill="#CBD5E1" opacity="0.7">
                  <animate attributeName="cy" values="180;220" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>
          </div>
          
          <!-- Progress track -->
          <div class="progress-path"></div>
        </div>
      </div>

      <!-- Add task form -->
      <div class="task-form mb-6">
        <h2 class="text-xl font-bold text-white text-shadow-sm mb-4">
          Mission Tasks
        </h2>
        
        <form @submit.prevent="addTask" class="flex items-center gap-2 mb-4">
          <UInput
            v-model="newTask"
            placeholder="Add a new task..."
            :disabled="addingTask"
            class="task-input flex-grow"
            autofocus
          />
          <UButton
            type="submit"
            :loading="addingTask"
            :disabled="!newTask.trim()"
            color="green"
            variant="solid"
            icon="i-heroicons-rocket-launch"
            class="font-bold shadow-lg transition-all duration-300 ease-in-out bg-green-400"
          >
            Add
          </UButton>
        </form>
      </div>

      <!-- Task list -->
      <div class="space-y-3 task-list">
        <UCard
          v-if="loading"
          class="task-card-loading p-2 animate-pulse"
        >
          <USkeleton class="h-6 w-full mb-2" />
          <USkeleton class="h-6 w-3/4" />
        </UCard>
        
        <template v-else-if="tasks.length">
          <UCard
            v-for="task in tasks"
            :key="task.id"
            class="task-card border-l-4 transition-all"
            :class="[
              task.is_complete ? 'task-complete' : 'task-incomplete',
              (typeof task.id === 'string' && task.id.startsWith('temp_')) ? 'task-temp' : ''
            ]"
          >
            <div class="flex items-center gap-3">
              <UCheckbox
                :model-value="task.is_complete"
                @update:model-value="() => toggleTaskCompletion(task)"
                class="task-checkbox"
              />
              <span
                class="task-name flex-grow"
                :class="{ 'line-through': task.is_complete }"
              >
                {{ task.name }}
              </span>
              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="md"
                @click="deleteTask(task.id)"
                class="text-red-500 p-1 hover:bg-red-900 hover:text-black-600 transition-colors duration-200"
              />
            </div>
          </UCard>
        </template>
        
        <UAlert
          v-else
          title="No tasks yet"
          description="Add some tasks to fuel your rocket for the journey!"
          color="blue"
          variant="soft"
          icon="i-heroicons-information-circle"
          class="empty-state"
        />
      </div>
    </UContainer>
  </div>
</template>

<style>
/* Space background */
.space-background {
  min-height: 100vh;
  background: linear-gradient(to bottom, #0f172a, #1e1b4b, #312e81);
  position: relative;
  overflow: hidden;
  padding: 20px 0;
}

/* Stars animation */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: 200px 200px;
  opacity: 0;
}

/* Individual star layers with different sizes and speeds */
.stars1 {
  background-image: 
    radial-gradient(1px 1px at 25% 5%, white, transparent),
    radial-gradient(1px 1px at 50% 15%, white, transparent),
    radial-gradient(1px 1px at 75% 25%, white, transparent),
    radial-gradient(1px 1px at 20% 35%, white, transparent),
    radial-gradient(1px 1px at 35% 45%, white, transparent),
    radial-gradient(1px 1px at 65% 55%, white, transparent),
    radial-gradient(1px 1px at 85% 75%, white, transparent),
    radial-gradient(1px 1px at 10% 85%, white, transparent),
    radial-gradient(1px 1px at 45% 95%, white, transparent);
  animation: stars-animation 100s linear infinite, twinkle 8s ease-in-out infinite alternate;
  opacity: 0.7;
}

/* Add some shining stars */
.stars:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(4px 4px at 15% 20%, #FFFFFF, transparent),
    radial-gradient(4px 4px at 35% 40%, #FFFFFF, transparent),
    radial-gradient(4px 4px at 55% 60%, #FFFFFF, transparent),
    radial-gradient(4px 4px at 75% 80%, #FFFFFF, transparent),
    radial-gradient(5px 5px at 25% 70%, rgba(255, 230, 230, 0.9), transparent),
    radial-gradient(5px 5px at 45% 30%, rgba(230, 255, 230, 0.9), transparent),
    radial-gradient(5px 5px at 65% 10%, rgba(230, 230, 255, 0.9), transparent),
    radial-gradient(5px 5px at 85% 50%, rgba(255, 230, 255, 0.9), transparent);
  animation: shine 10s ease-in-out infinite alternate;
}

/* Shooting stars */
.shooting-star {
  position: absolute;
  width: 100px;
  height: 1px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transform-origin: right center;
  z-index: 2;
}

.shooting-star-1 {
  top: 10%;
  left: 30%;
  transform: rotate(45deg);
  animation: shooting-star 8s linear infinite 2s;
}

.shooting-star-2 {
  top: 20%;
  left: 60%;
  transform: rotate(15deg);
  animation: shooting-star 10s linear infinite 5s;
}

.shooting-star-3 {
  top: 40%;
  left: 10%;
  transform: rotate(30deg);
  animation: shooting-star 12s linear infinite 7s;
}

/* Animations */
@keyframes stars-animation {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(1000px);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes shine {
  0%, 100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shooting-star {
  0% {
    transform: translateX(0) translateY(0) rotate(45deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  15% {
    transform: translateX(-300px) translateY(300px) rotate(45deg);
    opacity: 0;
  }
  100% {
    opacity: 0;
    transform: translateX(-300px) translateY(300px) rotate(45deg);
  }
}

/* Moon */
.moon {
  position: absolute;
  top: 50px;
  right: 50px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #FBBF24, #E5E7EB);
  box-shadow: 0 0 30px rgba(252, 211, 77, 0.6);
  z-index: 3;
}

.crater {
  position: absolute;
  border-radius: 50%;
  background: rgba(209, 213, 219, 0.8);
}

.crater1 {
  width: 30px;
  height: 30px;
  top: 25px;
  left: 35px;
}

.crater2 {
  width: 22px;
  height: 22px;
  top: 65px;
  left: 22px;
}

.crater3 {
  width: 18px;
  height: 18px;
  top: 30px;
  left: 75px;
}

/* Add a couple more craters for a more detailed moon */
.crater4 {
  width: 15px;
  height: 15px;
  top: 75px;
  left: 75px;
  background: rgba(209, 213, 219, 0.7);
}

.crater5 {
  width: 10px;
  height: 10px;
  top: 50px;
  left: 60px;
  background: rgba(209, 213, 219, 0.9);
}

/* Content container */
.content-container {
  position: relative;
  z-index: 10;
  backdrop-filter: blur(4px);
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Text shadow utilities */
.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.text-shadow-lg {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Progress badge */
.progress-badge {
  background: linear-gradient(45deg, #1E40AF, #3B82F6);
  border-radius: 20px;
  padding: 8px 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 10px rgba(59, 130, 246, 0.5);
  transition: all 0.3s ease;
}

.progress-badge-complete {
  background: linear-gradient(45deg, #059669, #10B981);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.5);
}

.progress-badge-complete:hover {
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4), 0 0 25px rgba(16, 185, 129, 0.6);
}

/* Planet surface */
.planet-surface {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: linear-gradient(transparent, #64748b);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  transform: scaleX(1.5);
}

/* Launch platform */
.launch-platform {
  position: absolute;
  bottom: 20px;
  width: 120px;
  height: 20px;
  background: #334155;
  border-radius: 10px;
  z-index: 20;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.platform-light {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FCD34D;
  animation: blink 2s infinite alternate;
}

.platform-light:nth-child(2) {
  animation-delay: 0.3s;
}

.platform-light:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes blink {
  0%, 80% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(252, 211, 77, 0.8);
  }
  100% {
    opacity: 0.4;
    box-shadow: 0 0 0 rgba(252, 211, 77, 0);
  }
}

/* Rocket container */
.rocket-container {
  position: absolute;
  bottom: 40px;
  z-index: 30;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
  --current-y: 0%;
  will-change: transform, opacity;
}

.rocket-container.launching {
  --current-y: calc(-0.1% * var(--rocket-progress, 0));
}

/* Rocket SVG */
.rocket-svg {
  transform-origin: center bottom;
}

/* Flame animation */
.flame {
  filter: url(#glow);
  transform-origin: center bottom;
  animation: flame-flicker 0.5s infinite alternate;
}

@keyframes flame-flicker {
  0% {
    transform: scaleX(1) scaleY(1);
  }
  100% {
    transform: scaleX(1.05) scaleY(1.05);
  }
}

/* Progress path */
.progress-path {
  position: absolute;
  bottom: 40px;
  width: 2px;
  height: 80%;
  background: linear-gradient(to top, rgba(59, 130, 246, 0.6), transparent);
  z-index: 5;
}

/* Task form */
.task-form {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  padding: 16px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.task-input {
  background: rgba(30, 41, 59, 0.8) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  color: white !important;
}

.add-task-btn {
  transition: all 0.3s ease;
}

.add-task-btn:hover {
  transform: translateY(-2px);
}

/* Task cards */
.task-card {
  background: rgba(30, 41, 59, 0.7) !important;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.task-incomplete {
  border-left-color: #3B82F6 !important;
}

.task-complete {
  border-left-color: #10B981 !important;
  background: rgba(16, 185, 129, 0.1) !important;
}

.task-temp {
  animation: pulse 2s infinite;
  border-style: dashed;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.task-name {
  color: white;
  transition: all 0.3s ease;
}

.task-checkbox {
  transform: scale(1.1);
}


/* Empty state */
.empty-state {
  background: rgba(30, 58, 138, 0.3) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .moon {
    width: 60px;
    height: 60px;
    top: 20px;
    right: 20px;
  }
  
  .crater1 {
    width: 15px;
    height: 15px;
    top: 10px;
    left: 18px;
  }
  
  .crater2 {
    width: 10px;
    height: 10px;
    top: 35px;
    left: 10px;
  }
  
  .crater3 {
    width: 8px;
    height: 8px;
    top: 15px;
    left: 35px;
  }
}

/* Modify launching animation */
@keyframes launch {
  0% {
    transform: translateY(var(--current-y));
    opacity: 1;
  }
  15% {
    transform: translateY(calc(var(--current-y) + 5%));
    opacity: 1;
  }
  85% {
    transform: translateY(-100vh);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh);
    opacity: 0;
  }
}

/* Enhance flame animation during launch */
.launching .flame {
  animation: launch-flame 0.1s infinite alternate;
  transform-origin: center bottom;
  transform: scale(2);
}

@keyframes launch-flame {
  0% {
    transform: scaleX(1) scaleY(2);
  }
  100% {
    transform: scaleX(2.5) scaleY(2.8);
  }
}
</style>
