<template>
  <div class="container">
    <div class="card">
      <h2 class="title">JSON 格式化工具</h2>
      <JsonEditor v-model="jsonContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonEditor from '../../components/JsonEditor.vue'

const jsonContent = ref('')
</script>

<style scoped>
.controls {
  margin-bottom: 1rem;
}

.editor-container {
  margin-bottom: 1rem;
}

.result-container {
  margin-top: 1rem;
}

.result-container h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}
</style>