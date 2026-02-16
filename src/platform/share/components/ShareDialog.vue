<template>
  <Dialog
    :visible="visible"
    :header="$t('share.title')"
    modal
    dismissable-mask
    class="w-full max-w-md"
    @update:visible="(v: boolean) => $emit('update:visible', v)"
  >
    <p class="mb-4 text-sm text-muted-foreground">
      {{ $t('share.description') }}
    </p>
    <div v-if="result" class="space-y-4">
      <ShareLinkInput :url="result.url" />
      <div class="flex justify-center">
        <ShareQRCode :url="result.url" />
      </div>
    </div>
    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">{{
          $t('share.expires')
        }}</label>
        <select
          v-model="expiresIn"
          class="w-full rounded border border-interface-stroke bg-background-default px-3 py-2 text-foreground"
        >
          <option value="never">{{ $t('share.never') }}</option>
          <option value="7d">{{ $t('share.expires7d') }}</option>
          <option value="30d">{{ $t('share.expires30d') }}</option>
        </select>
      </div>
      <label class="flex cursor-pointer items-center gap-2">
        <input
          v-model="requirePassword"
          type="checkbox"
          class="rounded border-interface-stroke"
        />
        <span class="text-sm">{{ $t('share.requirePassword') }}</span>
      </label>
      <input
        v-if="requirePassword"
        v-model="password"
        type="password"
        :placeholder="$t('share.passwordPlaceholder')"
        class="w-full rounded border border-interface-stroke bg-background-default px-3 py-2 text-foreground"
      />
      <div class="flex justify-between items-center">
        <button
          type="button"
          class="rounded px-3 py-2 text-sm text-primary hover:underline"
          @click="openManagement"
        >
          {{ $t('share.manageLinks') }}
        </button>
        <button
          type="submit"
          class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          :disabled="creating"
        >
          {{ creating ? $t('g.loading') : $t('share.createLink') }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import ShareLinkInput from './ShareLinkInput.vue'
import ShareQRCode from './ShareQRCode.vue'
import { useShareLink } from '@/platform/share/composables/useShareLink'
import type { CreateShareResponse } from '@/platform/share/types/share'
import { useWorkflowStore } from '@/platform/workflow/management/stores/workflowStore'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'openManagement'): void
}>()

const workflowStore = useWorkflowStore()
const { creating, createShareLink } = useShareLink()
const result = ref<CreateShareResponse | null>(null)
const expiresIn = ref<'never' | '7d' | '30d'>('never')
const requirePassword = ref(false)
const password = ref('')

const workflowName = ref('')
watch(
  () => props.visible,
  (v) => {
    if (v) {
      result.value = null
      const w = workflowStore.activeWorkflow
      workflowName.value =
        (w && 'key' in w ? w.key : 'Untitled')?.replace(/\.json$/, '') ||
        'Untitled'
    }
  }
)

async function submit() {
  const res = await createShareLink({
    name: workflowName.value,
    expiresIn: expiresIn.value,
    password: requirePassword.value ? password.value : undefined,
    includePreview: true
  })
  if (res) result.value = res
}

function openManagement() {
  emit('openManagement')
}
</script>
