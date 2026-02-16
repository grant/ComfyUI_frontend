/**
 * Types for workflow share links (template sharing).
 */

/** Shortcode length required by the backend (8 alphanumeric chars). */
export const SHARE_SHORTCODE_LENGTH = 8

export type ShareExpiresIn = 'never' | '7d' | '30d'

export interface CreateShareOptions {
  workflow: object
  name: string
  description?: string
  expiresIn?: ShareExpiresIn
  password?: string
  isPublic?: boolean
  previewBlob?: Blob | null
}

export interface CreateShareResponse {
  shortcode: string
  url: string
  expires_at: string | null
}

export interface SharePreviewMeta {
  shortcode: string
  name: string
  description: string | null
  node_count: number
  preview_image_url: string | null
  required_nodes: string[]
  required_models: string[]
  created_at: string
  author?: { name: string; avatar_url?: string }
  password_required?: boolean
  view_count?: number
  import_count?: number
}

export interface ShareFull extends SharePreviewMeta {
  workflow?: object
}

export interface ShareListItem {
  shortcode: string
  name: string
  views: number
  imports: number
  created_at: string
  expires_at: string | null
}

export interface ListSharesResponse {
  shares: ShareListItem[]
}
