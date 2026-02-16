import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShareStore = defineStore('share', () => {
  const shareDialogVisible = ref(false)
  const shareManagementVisible = ref(false)

  function openShareDialog() {
    shareDialogVisible.value = true
  }

  function openShareManagement() {
    shareManagementVisible.value = true
  }

  return {
    shareDialogVisible,
    shareManagementVisible,
    openShareDialog,
    openShareManagement
  }
})
