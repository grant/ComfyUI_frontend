<template>
  <div class="flex gap-2">
    <input
      :value="url"
      readonly
      class="flex-1 rounded border border-interface-stroke bg-background-default px-3 py-2 text-sm text-foreground"
    />
    <button
      type="button"
      class="rounded border border-interface-stroke bg-secondary-background px-3 py-2 text-sm hover:bg-secondary-background/80"
      @click="copy"
    >
      {{ copied ? $t('share.copied') : $t('share.copyLink') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToastStore } from '@/platform/updates/common/toastStore'

const props = defineProps<{ url: string }>()
const { t } = useI18n()
const copied = ref(false)
const toast = useToastStore()

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    toast.add({ severity: 'success', summary: t('share.copied'), life: 2000 })
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.add({ severity: 'warn', summary: t('g.warning'), life: 2000 })
  }
}
</script>
