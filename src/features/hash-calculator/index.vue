<template>
  <div class="container">
    <div class="card">
      <h2 class="title">文件哈希计算工具</h2>
      <div class="file-input-container">
        <div class="file-drop-zone" 
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'is-dragover': isDragover }"
          role="button"
          tabindex="0"
          aria-label="拖拽文件到这里或点击选择文件"
          @keydown.enter="fileInput?.click()"
        >
          <input
            type="file"
            @change="onFileChange"
            class="file-input"
            ref="fileInput"
            accept="*/*"
            aria-label="选择文件"
          />
          <div class="drop-zone-content">
            <p>拖拽文件到这里或点击选择文件</p>
            <p class="drop-zone-hint">支持任意类型的文件</p>
          </div>
        </div>
      </div>

      <div v-if="selectedFile" class="file-info">
        <div class="file-info-header">
          <h3>文件信息</h3>
          <button 
            class="button secondary" 
            @click="clearFile"
            aria-label="清除已选择的文件"
          >清除文件</button>
        </div>
        <div class="file-info-content">
          <p><strong>文件名：</strong>{{ selectedFile.name }}</p>
          <p><strong>大小：</strong>{{ formatFileSize(selectedFile.size) }}</p>
          <p><strong>类型：</strong>{{ selectedFile.type || '未知' }}</p>
        </div>
      </div>

      <div class="hash-options" v-if="selectedFile">
        <h3>选择哈希算法：</h3>
        <div class="algorithm-buttons" role="group" aria-label="哈希算法选择">
          <button
            v-for="algo in algorithms"
            :key="algo.value"
            class="button"
            :class="{ active: selectedAlgorithm === algo.value }"
            @click="calculateHash(algo.value)"
            :disabled="isLoading || !isSecureContext"
            :aria-pressed="selectedAlgorithm === algo.value"
            :aria-label="`使用${algo.label}计算哈希值`"
          >
            {{ isLoading && selectedAlgorithm === algo.value ? '计算中...' : algo.label }}
          </button>
        </div>
        <p v-if="!isSecureContext" class="error">
          Web Crypto API 需要安全上下文（HTTPS）才能使用。请使用 HTTPS 访问此页面。
        </p>
        <p v-else-if="!isWebCryptoSupported()" class="error">
          当前浏览器不支持 Web Crypto API，请使用现代浏览器访问。
        </p>
      </div>

      <div v-if="hash" class="hash-result-container">
        <h3>计算结果：</h3>
        <div class="hash-result">
          <div class="hash-value">
            <span class="hash-label">{{ selectedAlgorithm }}:</span>
            <code>{{ hash }}</code>
          </div>
          <button 
            class="button" 
            @click="copyHash"
            aria-label="复制哈希值到剪贴板"
          >复制哈希值</button>
        </div>
      </div>

      <div v-if="error" class="error" role="alert">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useDebounceFn } from '@vueuse/core'
import MD5 from 'crypto-js/md5'
import CryptoJS from 'crypto-js'

interface FileWithHash extends File {
  hash?: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<FileWithHash | null>(null)
const hash = ref('')
const error = ref('')
const selectedAlgorithm = ref('SHA-256')
const isDragover = ref(false)
const isLoading = ref(false)
const { copy } = useClipboard()

// 检查是否在安全上下文中
const isSecureContext = ref(false)

// 在组件挂载时检查安全上下文
onMounted(() => {
  isSecureContext.value = window.isSecureContext
})

const algorithms = [
  { label: 'MD5', value: 'MD5' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-384', value: 'SHA-384' },
  { label: 'SHA-512', value: 'SHA-512' },
  { label: 'SHA-1', value: 'SHA-1' }
]

// 检查浏览器是否支持 Web Crypto API
function isWebCryptoSupported(): boolean {
  if (!isSecureContext.value) {
    error.value = 'Web Crypto API 需要安全上下文（HTTPS）才能使用。请使用 HTTPS 访问此页面。'
    return false
  }
  return window.crypto && window.crypto.subtle !== undefined
}

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件选择
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    handleFile(input.files[0])
  }
}

// 处理拖拽
function handleDragOver(event: DragEvent) {
  isDragover.value = true
}

function handleDragLeave(event: DragEvent) {
  isDragover.value = false
}

function handleDrop(event: DragEvent) {
  isDragover.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    handleFile(files[0])
  }
}

// 处理文件
function handleFile(file: File) {
  selectedFile.value = file
  error.value = ''
  hash.value = ''
}

// 清除文件
function clearFile() {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  selectedFile.value = null
  hash.value = ''
  error.value = ''
}

// 使用防抖处理哈希计算
const debouncedCalculateHash = useDebounceFn(async (algorithm: string) => {
  if (!selectedFile.value) return

  try {
    isLoading.value = true
    selectedAlgorithm.value = algorithm

    if (algorithm === 'MD5') {
      // 使用 crypto-js 计算 MD5
      const buffer = await selectedFile.value.arrayBuffer()
      const wordArray = CryptoJS.lib.WordArray.create(buffer)
      hash.value = MD5(wordArray).toString()
    } else {
      // 使用 Web Crypto API 计算其他哈希
      if (!isSecureContext.value) {
        throw new Error('Web Crypto API 需要安全上下文（HTTPS）才能使用。请使用 HTTPS 访问此页面。')
      }

      if (!isWebCryptoSupported()) {
        throw new Error('当前浏览器不支持 Web Crypto API，请使用现代浏览器访问。')
      }

      const buffer = await selectedFile.value.arrayBuffer()
      const digest = await window.crypto.subtle.digest(algorithm, buffer)
      const hashArray = Array.from(new Uint8Array(digest))
      hash.value = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : '计算哈希值时出错'
    console.error('Hash calculation error:', err)
  } finally {
    isLoading.value = false
  }
}, 300)

// 替换原来的 calculateHash 函数
const calculateHash = debouncedCalculateHash

// 复制哈希值
async function copyHash() {
  try {
    await copy(hash.value)
    // 使用更友好的提示方式
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = '已复制哈希值到剪贴板'
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.remove()
    }, 2000)
  } catch (err) {
    error.value = '复制失败，请手动复制'
  }
}
</script>

<style scoped>
.file-input-container {
  margin-bottom: 1rem;
}

.file-drop-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.file-drop-zone.is-dragover {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.drop-zone-content {
  pointer-events: none;
}

.drop-zone-hint {
  color: #666;
  font-size: 0.9em;
  margin-top: 0.5rem;
}

.file-info {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.file-info-header h3 {
  margin: 0;
}

.file-info-content {
  display: grid;
  gap: 0.5rem;
}

.file-info-content p {
  margin: 0;
}

.hash-options {
  margin: 1rem 0;
}

.algorithm-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.button.active {
  background-color: #2196F3;
}

.hash-result-container {
  margin-top: 1rem;
}

.hash-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.hash-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hash-label {
  color: #666;
  font-weight: 500;
}

.hash-value code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  background: #fff;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  15% { opacity: 1; transform: translate(-50%, 0); }
  85% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -20px); }
}
</style>