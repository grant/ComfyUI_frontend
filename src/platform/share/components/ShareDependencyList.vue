<template>
  <div class="space-y-3 font-inter">
    <h3 class="text-sm font-semibold text-text-primary">
      {{ $t('share.preview.requiredModels') }}
    </h3>
    <ul
      v-if="requiredModels.length"
      class="list-inside list-disc space-y-0.5 text-sm text-text-secondary"
    >
      <li v-for="(m, i) in requiredModels" :key="i">{{ m }}</li>
    </ul>
    <p v-else class="text-sm text-text-secondary">
      {{ $t('share.preview.noModels') }}
    </p>
    <h3
      v-if="requiredNodes.length"
      class="mt-4 text-sm font-semibold text-text-primary"
    >
      {{ $t('share.preview.requiredNodes') }}
    </h3>
    <ul
      v-if="requiredNodes.length"
      class="list-inside list-disc space-y-0.5 text-sm text-text-secondary"
    >
      <li v-for="(n, i) in requiredNodes" :key="i">{{ n }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  requiredNodes: string[]
  requiredModels: string[]
}>()
</script>
