<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CropTransform, ImageEntry } from '../store/editor.types'
import { panCrop } from '../utils/crop'
import { drawCroppedImage } from '../utils/render'

const props = withDefaults(
  defineProps<{
    image: ImageEntry
    interactive?: boolean
    label?: string
  }>(),
  {
    interactive: false,
    label: '图片裁剪预览',
  },
)

const emit = defineEmits<{
  updateCrop: [crop: CropTransform]
  select: []
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let observer: ResizeObserver | null = null
let pointerId: number | null = null
let pointerX = 0
let pointerY = 0

function draw(): void {
  const element = canvas.value
  if (!element) return
  const bounds = element.getBoundingClientRect()
  const cssWidth = Math.max(1, Math.round(bounds.width || 300))
  const cssHeight = Math.max(1, Math.round(bounds.height || 420))
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.round(cssWidth * ratio)
  const height = Math.round(cssHeight * ratio)

  if (element.width !== width || element.height !== height) {
    element.width = width
    element.height = height
  }

  const context = element.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, width, height)
  drawCroppedImage(context, props.image, 0, 0, width, height)
}

function onPointerDown(event: PointerEvent): void {
  emit('select')
  if (!props.interactive) return
  pointerId = event.pointerId
  pointerX = event.clientX
  pointerY = event.clientY
  canvas.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!props.interactive || pointerId !== event.pointerId || !canvas.value) return
  const bounds = canvas.value.getBoundingClientRect()
  const deltaX = event.clientX - pointerX
  const deltaY = event.clientY - pointerY
  pointerX = event.clientX
  pointerY = event.clientY
  emit(
    'updateCrop',
    panCrop(
      props.image.crop,
      (-deltaX / Math.max(bounds.width, 1)) * 2,
      (-deltaY / Math.max(bounds.height, 1)) * 2,
    ),
  )
}

function onPointerUp(event: PointerEvent): void {
  if (pointerId !== event.pointerId) return
  canvas.value?.releasePointerCapture(event.pointerId)
  pointerId = null
}

watch(
  () => [props.image.id, props.image.crop.zoom, props.image.crop.offsetX, props.image.crop.offsetY],
  () => void nextTick(draw),
)

onMounted(() => {
  observer = new ResizeObserver(draw)
  if (canvas.value) observer.observe(canvas.value)
  void nextTick(draw)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <canvas
    ref="canvas"
    class="crop-canvas"
    :class="{ 'crop-canvas--interactive': interactive }"
    :aria-label="label"
    role="img"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  />
</template>

<style scoped>
.crop-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: #edf0f2;
}

.crop-canvas--interactive {
  cursor: grab;
  touch-action: none;
}

.crop-canvas--interactive:active {
  cursor: grabbing;
}
</style>
