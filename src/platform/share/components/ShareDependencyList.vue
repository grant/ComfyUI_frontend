<template>
  <div class="space-y-2">
    <h3 class="text-sm font-medium text-foreground">{{ $t('share.preview.requiredModels') }}</h3>
    <ul v-if="requiredModels.length" class="list-inside list-disc text-sm text-muted-foreground">
      <li v-for="(m, i) in requiredModels" :key="i">{{ m }}</li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">{{ $t('share.preview.noModels') }}</p>
    <h3 v-if="requiredNodes.length" class="mt-4 text-sm font-medium text-foreground">{{ $t('share.preview.requiredNodes') }}</h3>
    <ul v-if="requiredNodes.length" class="list-inside list-disc text-sm text-muted-foreground">
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
