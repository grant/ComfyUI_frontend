<template>
  <div class="inline-block rounded border border-interface-stroke bg-white p-2">
    <canvas ref="canvasRef" class="block" :width="size" :height="size" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = withDefaults(
  defineProps<{ url: string; size?: number }>(),
  { size: 160 }
)
const canvasRef = ref<HTMLCanvasElement | null>(null)

async function render() {
  if (!canvasRef.value || !props.url) return
  try {
    await QRCode.toCanvas(canvasRef.value, props.url, {
      width: props.size,
      margin: 1
    })
  } catch (e) {
    console.warn('QR code generation failed', e)
  }
}

onMounted(render)
watch(() => [props.url, props.size], render)
</script>
