/**
 * Share link API: create, get, list, update, delete.
 * Works against current origin (localhost or cloud).
 */
import { api } from '@/scripts/api'
import type {
  CreateShareResponse,
  ListSharesResponse,
  ShareExpiresIn,
  ShareFull,
  SharePreviewMeta
} from '@/platform/share/types/share'

const SHARE_BASE = '/share'

export async function createShare(
  workflow: object,
  options: {
    name: string
    description?: string
    expiresIn?: ShareExpiresIn
    password?: string
    isPublic?: boolean
    previewBlob?: Blob | null
  }
): Promise<CreateShareResponse> {
  const {
    name,
    description = '',
    expiresIn = 'never',
    password = '',
    isPublic = true,
    previewBlob
  } = options

  if (previewBlob) {
    const form = new FormData()
    form.append('workflow_json', JSON.stringify(workflow))
    form.append('name', name)
    if (description) form.append('description', description)
    form.append('expires_in', expiresIn)
    if (password) form.append('password', password)
    form.append('preview', previewBlob, 'preview.png')
    const res = await api.fetchApi(SHARE_BASE, {
      method: 'POST',
      body: form
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error ?? `Failed to create share: ${res.status}`)
    }
    return res.json()
  }

  const res = await api.fetchApi(SHARE_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow_json: workflow,
      name,
      description: description || undefined,
      expires_in: expiresIn,
      password: password || undefined,
      is_public: isPublic
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to create share: ${res.status}`)
  }
  return res.json()
}

export async function getShare(
  shortcode: string,
  options?: { includeWorkflow?: boolean; password?: string }
): Promise<ShareFull | SharePreviewMeta> {
  const params = new URLSearchParams()
  if (options?.includeWorkflow) params.set('include_workflow', '1')
  if (options?.password) params.set('password', options.password)
  const q = params.toString()
  const route = `${SHARE_BASE}/${encodeURIComponent(shortcode)}${q ? `?${q}` : ''}`
  const url = api.apiURL(route)
  const headers: HeadersInit = {}
  if (options?.password) headers['X-Share-Password'] = options.password
  const res = await fetch(url, { headers, cache: 'no-cache' })
  if (!res.ok) {
    if (res.status === 404) throw new Error('Share not found or expired')
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err?.message ?? err?.error ?? `Failed to load share: ${res.status}`
    )
  }
  const data = await res.json()
  if (data.workflow_json) data.workflow = data.workflow_json
  return data
}

export async function listMyShares(): Promise<ListSharesResponse> {
  const res = await api.fetchApi(SHARE_BASE)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to list shares: ${res.status}`)
  }
  return res.json()
}

export async function deleteShare(shortcode: string): Promise<void> {
  const res = await api.fetchApi(
    `${SHARE_BASE}/${encodeURIComponent(shortcode)}`,
    {
      method: 'DELETE'
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to delete share: ${res.status}`)
  }
}

/** Record that a share was imported (increments import_count). Fire-and-forget; does not throw. */
export async function recordShareImport(shortcode: string): Promise<void> {
  try {
    const url = api.apiURL(
      `${SHARE_BASE}/${encodeURIComponent(shortcode)}/import`
    )
    await fetch(url, { method: 'POST', cache: 'no-cache' })
  } catch {
    // Best-effort analytics; ignore errors
  }
}
