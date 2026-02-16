/**
 * Composable for creating and managing share links.
 */
import { ref } from 'vue'
import { createShare } from '@/platform/share/api/shareApi'
import type { CreateShareResponse, ShareExpiresIn } from '@/platform/share/types/share'
import { useToastStore } from '@/platform/updates/common/toastStore'
import { app } from '@/scripts/app'
import { useI18n } from 'vue-i18n'

const SHORTCODE_LENGTH = 8
const SHORTCODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateShortcode(): string {
  return Array.from(
    { length: SHORTCODE_LENGTH },
    () => SHORTCODE_CHARS[Math.floor(Math.random() * SHORTCODE_CHARS.length)]
  ).join('')
}

export function useShareLink() {
  const { t } = useI18n()
  const toast = useToastStore()
  const creating = ref(false)
  const shareUrl = ref<string | null>(null)

  async function capturePreviewBlob(): Promise<Blob | null> {
    try {
      const canvas = app?.canvas?.canvas
      if (!canvas || typeof canvas.toBlob !== 'function') return null
      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })
    } catch {
      return null
    }
  }

  async function createShareLink(options: {
    name: string
    description?: string
    expiresIn?: ShareExpiresIn
    password?: string
    isPublic?: boolean
    includePreview?: boolean
  }): Promise<CreateShareResponse | null> {
    // Use the graph currently on the canvas (active workflow) so sharing from a tab shares that tab's workflow.
    // Use serialize() so the stored format matches what loadGraphData/configure expect (0.4 schema), avoiding blank graph on import.
    const graph = app?.canvas?.graph ?? app?.rootGraph
    const workflow = graph?.serialize?.()
    if (!workflow) {
      toast.add({ severity: 'error', summary: t('g.error'), detail: 'No workflow to share', life: 3000 })
      return null
    }
    creating.value = true
    shareUrl.value = null
    try {
      let previewBlob: Blob | null = null
      if (options.includePreview !== false) {
        previewBlob = await capturePreviewBlob()
      }
      const res = await createShare(workflow, {
        name: options.name,
        description: options.description,
        expiresIn: options.expiresIn ?? 'never',
        password: options.password,
        isPublic: options.isPublic ?? true,
        previewBlob
      })
      shareUrl.value = res.url
      toast.add({ severity: 'success', summary: t('share.copied'), detail: t('share.title'), life: 2000 })
      return res
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: t('g.error'),
        detail: e instanceof Error ? e.message : 'Failed to create share',
        life: 4000
      })
      return null
    } finally {
      creating.value = false
    }
  }

  return { creating, shareUrl, createShareLink, generateShortcode }
}
