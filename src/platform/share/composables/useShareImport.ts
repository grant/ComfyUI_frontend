/**
 * Composable for importing a shared workflow by shortcode.
 */
import { ref } from 'vue'
import { getShare, recordShareImport } from '@/platform/share/api/shareApi'
import { SHARE_SHORTCODE_LENGTH } from '@/platform/share/types/share'
import { app } from '@/scripts/app'
import { useToastStore } from '@/platform/updates/common/toastStore'
import { useI18n } from 'vue-i18n'

function isValidShortcode(code: string): boolean {
  const trimmed = code.trim()
  return (
    trimmed.length === SHARE_SHORTCODE_LENGTH && /^[a-zA-Z0-9]+$/.test(trimmed)
  )
}

export function useShareImport() {
  const { t } = useI18n()
  const toast = useToastStore()
  const importing = ref(false)

  async function importShare(
    shortcode: string,
    password?: string
  ): Promise<boolean> {
    if (!app?.loadGraphData) return false
    const code = shortcode.trim()
    if (!isValidShortcode(code)) {
      toast.add({
        severity: 'error',
        summary: t('g.error'),
        detail: t('share.invalidLink'),
        life: 4000
      })
      return false
    }
    importing.value = true
    try {
      const data = await getShare(code, { includeWorkflow: true, password })
      let workflow: unknown =
        (data as { workflow?: unknown }).workflow ??
        (data as { workflow_json?: unknown }).workflow_json
      if (typeof workflow === 'string') {
        try {
          workflow = JSON.parse(workflow) as object
        } catch {
          workflow = null
        }
      }
      if (
        !workflow ||
        typeof workflow !== 'object' ||
        Array.isArray(workflow)
      ) {
        toast.add({
          severity: 'error',
          summary: t('g.error'),
          detail: t('share.import.missingDeps'),
          life: 4000
        })
        return false
      }
      // Ensure we have a graph shape configure() expects (nodes array at top level)
      const graphData = workflow as Record<string, unknown>
      const nodes = Array.isArray(graphData.nodes)
        ? graphData.nodes
        : Array.isArray(
              (graphData as { graph?: { nodes?: unknown[] } }).graph?.nodes
            )
          ? (graphData as { graph: { nodes: unknown[] } }).graph.nodes
          : []
      const payload = { ...graphData, nodes }
      await app.loadGraphData(payload as never, true, true, null, {
        showMissingNodesDialog: true,
        showMissingModelsDialog: true
      })
      toast.add({
        severity: 'success',
        summary: t('share.import.success'),
        life: 3000
      })
      void recordShareImport(code)
      return true
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: t('g.error'),
        detail: e instanceof Error ? e.message : 'Failed to import share',
        life: 4000
      })
      return false
    } finally {
      importing.value = false
    }
  }

  return { importing, importShare }
}
