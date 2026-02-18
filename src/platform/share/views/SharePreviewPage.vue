<template>
  <div
    class="dark-theme flex h-screen min-h-0 flex-col font-inter bg-base-background text-text-primary"
  >
    <main
      class="flex min-h-0 flex-1 flex-col items-center justify-start overflow-auto px-4 py-6 sm:px-6 sm:py-8"
    >
      <template v-if="error">
        <section
          class="w-full max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center shadow-interface"
        >
          <h2 class="mb-2 text-lg font-semibold text-destructive">
            {{ errorTitle }}
          </h2>
          <p class="mb-4 text-sm text-text-secondary">{{ error }}</p>
          <Button variant="secondary" size="lg" as="a" :href="appUrl">
            {{ $t('share.preview.openInComfy') }}
          </Button>
        </section>
      </template>
      <template v-else-if="passwordRequired">
        <section
          class="w-full max-w-md rounded-2xl border border-interface-stroke bg-interface-panel-surface p-6 shadow-interface"
        >
          <h2 class="mb-1 text-lg font-semibold text-text-primary">
            {{ meta?.name ?? $t('share.title') }}
          </h2>
          <p class="mb-4 text-sm text-text-secondary">
            {{ $t('share.description') }}
          </p>
          <input
            v-model="passwordInput"
            type="password"
            :placeholder="$t('share.requirePassword')"
            class="mb-2 w-full rounded-lg border border-interface-stroke bg-comfy-input px-3 py-2.5 text-sm text-comfy-input-foreground outline-none placeholder:text-text-secondary focus:ring-2 focus:ring-primary-background/40"
            @keydown.enter="submitPassword"
            @input="passwordError = null"
          />
          <p v-if="passwordError" class="mb-4 text-sm text-destructive">
            {{ passwordError }}
          </p>
          <Button
            variant="primary"
            size="lg"
            class="w-full"
            @click="submitPassword"
          >
            {{ $t('g.continue') }}
          </Button>
        </section>
      </template>
      <template v-else-if="meta">
        <section
          class="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-interface-stroke bg-interface-panel-surface p-6 shadow-interface sm:gap-5 sm:p-8"
        >
          <div
            v-if="meta.preview_image_url"
            class="flex min-h-0 max-h-[45vh] shrink-0 overflow-hidden rounded-xl border border-interface-stroke bg-interface-panel-surface"
          >
            <img
              :src="meta.preview_image_url"
              :alt="meta.name"
              class="h-full w-full object-contain"
            />
          </div>
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-text-primary">
              {{ meta.name }}
            </h1>
            <p v-if="meta.description" class="text-sm text-text-secondary">
              {{ meta.description }}
            </p>
          </div>
          <div
            class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary"
          >
            <span>{{
              $t('share.preview.nodes', { count: meta.node_count ?? 0 })
            }}</span>
            <span>{{
              $t('share.preview.models', {
                count: (meta.required_models ?? []).length
              })
            }}</span>
            <span v-if="typeof meta.view_count === 'number'">{{
              $t('share.preview.viewCount', meta.view_count)
            }}</span>
          </div>
          <div
            class="rounded-lg border border-interface-stroke bg-interface-panel-hover-surface/50 px-4 py-3"
          >
            <ShareDependencyList
              :required-nodes="meta.required_nodes ?? []"
              :required-models="meta.required_models ?? []"
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            class="w-full sm:w-auto"
            @click="openInComfy"
          >
            {{ $t('share.preview.openInComfy') }}
          </Button>
        </section>
      </template>
      <template v-else>
        <div
          class="flex w-full max-w-2xl items-center justify-center rounded-2xl border border-interface-stroke bg-interface-panel-surface py-12 shadow-interface"
        >
          <p class="text-sm text-text-secondary">{{ $t('g.loading') }}...</p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getShare } from '@/platform/share/api/shareApi'
import type { SharePreviewMeta } from '@/platform/share/types/share'
import { SHARE_PASSWORD_STORAGE_KEY_PREFIX } from '@/platform/share/types/share'
import ShareDependencyList from '@/platform/share/components/ShareDependencyList.vue'
import Button from '@/components/ui/button/Button.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const shortcode = computed(() =>
  String((route.params.shortcode as string) ?? '')
    .replace(/\/$/, '')
    .trim()
)
const meta = ref<SharePreviewMeta | null>(null)
const error = ref<string | null>(null)
const isInvalidShortcodeError = ref(false)
const errorTitle = computed(() =>
  isInvalidShortcodeError.value ? t('share.invalidLink') : t('share.notFound')
)
const passwordRequired = ref(false)
const passwordInput = ref('')
const passwordError = ref<string | null>(null)

const SHORTCODE_LENGTH = 8
const DEFAULT_TITLE = 'ComfyUI'

function setShareMeta(shareMeta: SharePreviewMeta | null) {
  const title = shareMeta?.name?.trim() || DEFAULT_TITLE
  const description = (shareMeta?.description || 'Shared workflow')
    .trim()
    .slice(0, 200)
  const image = shareMeta?.preview_image_url || ''
  const url = typeof window !== 'undefined' ? window.location.href : ''

  document.title = title
  const setMeta = (attr: string, value: string, isProperty = false) => {
    const key = isProperty ? 'property' : 'name'
    let el = document.querySelector(`meta[${key}="${attr}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(key, attr)
      document.head.appendChild(el)
    }
    el.setAttribute('content', value)
  }
  setMeta('og:title', title, true)
  setMeta('og:description', description, true)
  setMeta('og:image', image, true)
  setMeta('og:url', url, true)
  setMeta('og:type', 'website', true)
  setMeta('twitter:card', 'summary_large_image')
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
  setMeta('twitter:image', image)
}

const appUrl = computed(() => {
  const base =
    window.location.origin +
    (window.location.pathname.replace(/\/share\/.*$/, '') || '/')
  return base.endsWith('/') ? base : base + '/'
})

const importUrl = computed(() => {
  const base = appUrl.value
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}share=${shortcode.value}`
})

function isValidShortcode(code: string): boolean {
  return code.length === SHORTCODE_LENGTH && /^[a-zA-Z0-9]+$/.test(code)
}

async function load(opt?: { password?: string }) {
  const code = shortcode.value
  if (!code) return
  error.value = null
  meta.value = null
  passwordRequired.value = false
  passwordError.value = null
  if (!isValidShortcode(code)) {
    isInvalidShortcodeError.value = true
    error.value = t('share.invalidLinkDetail')
    return
  }
  isInvalidShortcodeError.value = false
  try {
    const data = await getShare(code, {
      includeWorkflow: false,
      password: opt?.password
    })
    if (data.password_required) {
      passwordRequired.value = true
      meta.value = data as SharePreviewMeta
      if (opt?.password) passwordError.value = t('share.badPassword')
      return
    }
    meta.value = data as SharePreviewMeta
    // Store password so "Open in ComfyUI" can load the workflow without re-prompting; app clears after import
    if (opt?.password) {
      try {
        sessionStorage.setItem(
          `${SHARE_PASSWORD_STORAGE_KEY_PREFIX}${code}`,
          opt.password
        )
      } catch {
        // Ignore quota/private mode
      }
    }
    // After correct password, show preview; user clicks "Open in ComfyUI" to enter app
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('share.notFoundDetail')
  }
}

function submitPassword() {
  if (passwordInput.value.trim()) load({ password: passwordInput.value.trim() })
}

function openInComfy() {
  window.location.href = importUrl.value
}

onMounted(() => load())
watch(shortcode, () => load(), { immediate: false })
// Keep document title and OG/Twitter meta in sync when share data is available (e.g. after load or password unlock).
// Helps JS-aware crawlers and in-app navigation; server-rendered HTML already has meta for non-JS crawlers.
watch(
  () => meta.value,
  (m) => {
    if (m) setShareMeta(m)
  },
  { immediate: true }
)
onUnmounted(() => {
  document.title = DEFAULT_TITLE // Reset when leaving the share page
})
</script>
