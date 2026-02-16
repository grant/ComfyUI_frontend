<template>
  <div class="flex min-h-screen flex-col bg-background-default">
    <header
      class="flex h-14 shrink-0 items-center justify-between border-b border-interface-stroke bg-comfy-menu-bg px-4"
    >
      <span class="text-lg font-medium text-foreground">ComfyUI</span>
      <a :href="appUrl" class="text-sm text-primary hover:underline">
        {{
          isAuthenticated === false
            ? $t('share.preview.signInToImport')
            : $t('share.preview.openInComfy')
        }}
      </a>
    </header>
    <main class="flex flex-1 flex-col items-center gap-6 p-6">
      <template v-if="error">
        <div
          class="w-full max-w-md space-y-2 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center"
        >
          <h2 class="text-lg font-semibold text-destructive">
            {{ errorTitle }}
          </h2>
          <p class="text-sm text-muted-foreground">{{ error }}</p>
          <a :href="appUrl" class="inline-block text-primary hover:underline">{{
            $t('share.preview.openInComfy')
          }}</a>
        </div>
      </template>
      <template v-else-if="passwordRequired">
        <div
          class="w-full max-w-md rounded-lg border border-interface-stroke bg-secondary-background p-6"
        >
          <h2 class="mb-2 text-lg font-semibold">
            {{ meta?.name ?? $t('share.title') }}
          </h2>
          <p class="mb-4 text-sm text-muted-foreground">
            {{ $t('share.description') }}
          </p>
          <input
            v-model="passwordInput"
            type="password"
            :placeholder="$t('share.requirePassword')"
            class="mb-4 w-full rounded border border-interface-stroke bg-background-default px-3 py-2 text-foreground"
            @keydown.enter="submitPassword"
          />
          <button
            class="w-full rounded bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            @click="submitPassword"
          >
            {{ $t('g.continue') }}
          </button>
        </div>
      </template>
      <template v-else-if="meta">
        <div class="w-full max-w-2xl space-y-4">
          <div
            v-if="meta.preview_image_url"
            class="overflow-hidden rounded-lg border border-interface-stroke bg-secondary-background"
          >
            <img
              :src="meta.preview_image_url"
              :alt="meta.name"
              class="h-auto w-full object-contain"
            />
          </div>
          <h1 class="text-xl font-semibold text-foreground">{{ meta.name }}</h1>
          <p v-if="meta.description" class="text-muted-foreground">
            {{ meta.description }}
          </p>
          <div class="flex gap-4 text-sm text-muted-foreground">
            <span>{{
              $t('share.preview.nodes', { count: meta.node_count ?? 0 })
            }}</span>
            <span>{{
              $t('share.preview.models', {
                count: (meta.required_models ?? []).length
              })
            }}</span>
            <span v-if="typeof meta.view_count === 'number'">{{
              $t(
                'share.preview.viewCount',
                { count: meta.view_count },
                meta.view_count
              )
            }}</span>
          </div>
          <ShareDependencyList
            :required-nodes="meta.required_nodes ?? []"
            :required-models="meta.required_models ?? []"
          />
          <a
            :href="importUrl"
            class="inline-block rounded bg-primary px-4 py-2 text-primary-foreground no-underline hover:opacity-90"
          >
            {{ $t('share.preview.openInComfy') }}
          </a>
        </div>
      </template>
      <template v-else>
        <p class="text-muted-foreground">{{ $t('g.loading') }}...</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getShare } from '@/platform/share/api/shareApi'
import type { SharePreviewMeta } from '@/platform/share/types/share'
import ShareDependencyList from '@/platform/share/components/ShareDependencyList.vue'
import { isCloud } from '@/platform/distribution/types'
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore'
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

const SHORTCODE_LENGTH = 8

const authStore = isCloud ? useFirebaseAuthStore() : null
const isAuthenticated = computed(() =>
  authStore ? authStore.isAuthenticated : true
)

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
      return
    }
    meta.value = data as SharePreviewMeta
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('share.notFoundDetail')
  }
}

function submitPassword() {
  if (passwordInput.value.trim()) load({ password: passwordInput.value.trim() })
}

onMounted(() => load())
watch(shortcode, () => load(), { immediate: false })
</script>
