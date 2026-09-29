<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DateStampFormat, DateStampPosition, ImageDateStamp } from '../store/editor.types'
import { displayDateStamp, normalizeDateStampPosition } from '../utils/dateStamp'

const props = withDefaults(
  defineProps<{
    dateStamp: ImageDateStamp
    format?: DateStampFormat
    interactive?: boolean
    label?: string
  }>(),
  {
    interactive: false,
    format: 'slash',
    label: '图片日期',
  },
)

const emit = defineEmits<{
  select: []
  updatePosition: [position: DateStampPosition]
}>()

const stamp = ref<HTMLElement | null>(null)
let pointerId: number | null = null
let pointerX = 0
let pointerY = 0
let startPosition: DateStampPosition = { x: 0, y: 0 }

const positionStyle = computed(() => ({
  left: `${props.dateStamp.position.x * 100}%`,
  top: `${props.dateStamp.position.y * 100}%`,
}))
const displayValue = computed(() => displayDateStamp(props.dateStamp.value, props.format))

function onPointerDown(event: PointerEvent): void {
  emit('select')
  if (!props.interactive) return
  pointerId = event.pointerId
  pointerX = event.clientX
  pointerY = event.clientY
  startPosition = { ...props.dateStamp.position }
  stamp.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!props.interactive || pointerId !== event.pointerId || !stamp.value) return
  const bounds = stamp.value.parentElement?.getBoundingClientRect()
  if (!bounds) return
  emit(
    'updatePosition',
    normalizeDateStampPosition({
      x: startPosition.x + (event.clientX - pointerX) / Math.max(bounds.width, 1),
      y: startPosition.y + (event.clientY - pointerY) / Math.max(bounds.height, 1),
    }),
  )
}

function onPointerUp(event: PointerEvent): void {
  if (pointerId !== event.pointerId) return
  stamp.value?.releasePointerCapture(event.pointerId)
  pointerId = null
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.interactive) return
  const step = event.shiftKey ? 0.05 : 0.01
  const delta: Record<string, DateStampPosition> = {
    ArrowLeft: { x: -step, y: 0 },
    ArrowRight: { x: step, y: 0 },
    ArrowUp: { x: 0, y: -step },
    ArrowDown: { x: 0, y: step },
  }
  const movement = delta[event.key]
  if (!movement) return
  event.preventDefault()
  emit('select')
  emit(
    'updatePosition',
    normalizeDateStampPosition({
      x: props.dateStamp.position.x + movement.x,
      y: props.dateStamp.position.y + movement.y,
    }),
  )
}
</script>

<template>
  <button
    v-if="interactive"
    ref="stamp"
    type="button"
    class="date-stamp date-stamp--interactive"
    :style="positionStyle"
    :aria-label="`${label}，拖动或使用方向键调整位置`"
    @pointerdown.stop.prevent="onPointerDown"
    @pointermove.stop.prevent="onPointerMove"
    @pointerup.stop="onPointerUp"
    @pointercancel.stop="onPointerUp"
    @keydown="onKeydown"
  >
    {{ displayValue }}
  </button>
  <span v-else class="date-stamp" :style="positionStyle" aria-hidden="true">
    {{ displayValue }}
  </span>
</template>

<style scoped>
.date-stamp {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  padding: 0.28em 0.52em;
  color: #17191c;
  background: rgb(255 255 255 / 84%);
  border: 0;
  border-radius: 0.28em;
  box-shadow: 0 0.08em 0.24em rgb(0 0 0 / 20%);
  font-family: Libian, serif;
  font-size: 5cqw;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
}

.date-stamp--interactive {
  cursor: grab;
  touch-action: none;
}

.date-stamp--interactive:active {
  cursor: grabbing;
}

.date-stamp--interactive:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
