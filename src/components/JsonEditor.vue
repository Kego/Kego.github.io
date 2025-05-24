<template>
  <div class="json-editor">
    <div class="editor-toolbar">
      <button class="button" @click="formatJson">格式化</button>
      <button class="button" @click="minifyJson">压缩</button>
      <button class="button" @click="copyToClipboard" :disabled="!jsonInput">复制</button>
      <button class="button secondary" @click="clear">清除</button>
    </div>
    <div class="editor-container">
      <div class="editor-section">
        <textarea
          v-model="jsonInput"
          class="editor-textarea"
          placeholder="请输入 JSON 字符串..."
          @input="validateJson"
          spellcheck="false"
        ></textarea>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      <div class="editor-section">
        <div class="editor-preview" v-html="highlightedJson"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import { useClipboard } from '@vueuse/core'

// 注册 JSON 语言
hljs.registerLanguage('json', json)

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const jsonInput = ref(props.modelValue || '')
const formattedJson = ref('')
const error = ref('')
const isValid = ref(false)
const { copy } = useClipboard()

// 高亮显示
const highlightedJson = computed(() => {
  if (!jsonInput.value) return ''
  try {
    const parsed = JSON.parse(jsonInput.value)
    const formatted = JSON.stringify(parsed, null, 2)
    return hljs.highlight(formatted, { language: 'json' }).value
  } catch (e) {
    return hljs.highlight(jsonInput.value, { language: 'json' }).value
  }
})

// 验证 JSON
function validateJson() {
  try {
    if (!jsonInput.value.trim()) {
      error.value = ''
      isValid.value = false
      return
    }
    JSON.parse(jsonInput.value)
    error.value = ''
    isValid.value = true
    emit('update:modelValue', jsonInput.value)
  } catch (e) {
    error.value = '无效的 JSON 格式'
    isValid.value = false
  }
}

// 格式化 JSON
function formatJson() {
  try {
    const parsed = JSON.parse(jsonInput.value)
    formattedJson.value = JSON.stringify(parsed, null, 2)
    jsonInput.value = formattedJson.value
    error.value = ''
  } catch (e) {
    error.value = '无效的 JSON 格式'
    formattedJson.value = ''
  }
}

// 压缩 JSON
function minifyJson() {
  try {
    const parsed = JSON.parse(jsonInput.value)
    formattedJson.value = JSON.stringify(parsed)
    jsonInput.value = formattedJson.value
    error.value = ''
  } catch (e) {
    error.value = '无效的 JSON 格式'
    formattedJson.value = ''
  }
}

// 清除内容
function clear() {
  jsonInput.value = ''
  formattedJson.value = ''
  error.value = ''
  isValid.value = false
  emit('update:modelValue', '')
}

// 复制到剪贴板
async function copyToClipboard() {
  try {
    await copy(jsonInput.value)
    alert('已复制到剪贴板')
  } catch (err) {
    alert('复制失败')
  }
}

// 监听输入变化
watch(jsonInput, validateJson)

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== jsonInput.value) {
    jsonInput.value = newValue || ''
    validateJson()
  }
})
</script>

<style scoped>
.json-editor {
  width: 100%;
}

.editor-toolbar {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.editor-container {
  display: flex;
  gap: 1rem;
  min-height: 400px;
}

.editor-section {
  flex: 1;
  min-width: 0; /* 防止 flex 子项溢出 */
  display: flex;
  flex-direction: column;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #333;
  caret-color: #000;
  outline: none;
  box-sizing: border-box;
}

.editor-preview {
  flex: 1;
  width: 100%;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: auto;
  white-space: pre;
  box-sizing: border-box;
}

.editor-preview :deep(.hljs) {
  background: transparent;
}

.editor-preview :deep(.hljs-key) {
  color: #881391;
}

.editor-preview :deep(.hljs-string) {
  color: #1a1aa6;
}

.editor-preview :deep(.hljs-number) {
  color: #1c00cf;
}

.editor-preview :deep(.hljs-literal) {
  color: #0000ff;
}

.editor-preview :deep(.hljs-punctuation) {
  color: #333;
}

.error {
  color: #f44336;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
    min-height: auto;
  }

  .editor-section {
    min-height: 300px;
  }

  .editor-textarea,
  .editor-preview {
    min-height: 300px;
  }
}
</style> 