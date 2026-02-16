<template>
  <Dialog
    :visible="visible"
    :header="$t('share.manageLinks')"
    modal
    dismissable-mask
    class="w-full max-w-2xl"
    @update:visible="(v: boolean) => $emit('update:visible', v)"
  >
    <div v-if="loading" class="py-8 text-center text-muted-foreground">
      {{ $t('g.loading') }}...
    </div>
    <div v-else-if="error" class="py-4 text-destructive">{{ error }}</div>
    <ul v-else-if="shares.length" class="list-none space-y-2 pl-0">
      <li
        v-for="s in shares"
        :key="s.shortcode"
        class="flex items-center justify-between rounded border border-interface-stroke bg-secondary-background px-4 py-3"
      >
        <div>
          <span class="font-medium">{{ s.name }}</span>
          <a
            :href="shareUrl(s.shortcode)"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-2 text-sm text-primary hover:underline"
          >
            {{ $t('share.pathPrefix') }}{{ s.shortcode }}
          </a>
          <div class="mt-1 text-xs text-muted-foreground">
            {{
              $t('share.viewsAndImports', {
                views: s.views,
                imports: s.imports
              })
            }}
          </div>
        </div>
        <button
          type="button"
          class="rounded border border-interface-stroke px-2 py-1 text-sm hover:bg-secondary-background"
          :disabled="deleting === s.shortcode"
          @click="deleteOne(s.shortcode)"
        >
          {{ deleting === s.shortcode ? $t('g.loading') : $t('g.delete') }}
        </button>
      </li>
    </ul>
    <p v-else class="py-4 text-muted-foreground">
      {{ $t('g.noResultsFound') }}
    </p>
    <template #footer>
      <button
        type="button"
        class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
        @click="$emit('update:visible', false)"
      >
        {{ $t('g.close') }}
      </button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { listMyShares, deleteShare } from '@/platform/share/api/shareApi'
import type { ShareListItem } from '@/platform/share/types/share'
import { useToastStore } from '@/platform/updates/common/toastStore'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ visible: boolean }>()
defineEmits<{ (e: 'update:visible', v: boolean): void }>()

const { t } = useI18n()
const toast = useToastStore()
const shares = ref<ShareListItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const deleting = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await listMyShares()
    shares.value = res.shares ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load shares'
  } finally {
    loading.value = false
  }
}

function shareUrl(shortcode: string): string {
  return `${window.location.origin}/share/${shortcode}`
}

async function deleteOne(shortcode: string) {
  deleting.value = shortcode
  try {
    await deleteShare(shortcode)
    shares.value = shares.value.filter((s) => s.shortcode !== shortcode)
    toast.add({ severity: 'success', summary: t('g.success'), life: 2000 })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('g.error'),
      detail: e instanceof Error ? e.message : 'Failed to delete',
      life: 3000
    })
  } finally {
    deleting.value = null
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) load()
  }
)
</script>
