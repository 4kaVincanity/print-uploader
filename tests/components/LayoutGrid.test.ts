import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import LayoutGrid from '../../src/components/LayoutGrid.vue'
import { useEditorStore } from '../../src/store/editor'
import type { ImageEntry } from '../../src/store/editor.types'

function fakeImage(id: string): ImageEntry {
  return {
    id,
    file: new File(['x'], `${id}.png`, { type: 'image/png' }),
    name: `${id}.png`,
    url: `blob:${id}`,
    width: 1000,
    height: 1500,
    decoded: document.createElement('img'),
    crop: { zoom: 1, offsetX: 0, offsetY: 0 },
    dateStamp: null,
  }
}

describe('LayoutGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nine stable slots and deletes an occupied image', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    const wrapper = mount(LayoutGrid, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          CropCanvas: true,
          VueDraggable: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.findAll('.grid-slot')).toHaveLength(9)
    await wrapper.get('[aria-label="删除第 1 张图片"]').trigger('click')
    expect(store.imageCount).toBe(0)
  })

  it('provides keyboard buttons for ordering and reset', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    store.slots[1]!.image = fakeImage('second')
    store.selectImage('first')
    const wrapper = mount(LayoutGrid, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          CropCanvas: true,
          VueDraggable: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.get('[aria-label="向后移动图片"]').trigger('click')
    expect(store.slots[1]!.image?.id).toBe('first')
    await wrapper.get('[aria-label="重置图片裁剪"]').trigger('click')
    expect(store.slots[1]!.image?.crop).toEqual({ zoom: 1, offsetX: 0, offsetY: 0 })
  })

  it('emits the clicked empty slot index for targeted uploads', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    const wrapper = mount(LayoutGrid, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          CropCanvas: true,
          VueDraggable: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.findAll('.empty-slot-button')[1]!.trigger('click')
    expect(wrapper.emitted('add')).toEqual([[2]])
  })

  it('emits duplicate and drop events from slots', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    const wrapper = mount(LayoutGrid, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          CropCanvas: true,
          VueDraggable: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.get('[aria-label="复制第 1 张图片"]').trigger('click')
    expect(wrapper.emitted('duplicate')).toEqual([[0]])
  })

  it('adds and configures a date for only the selected image', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    store.slots[1]!.image = fakeImage('second')
    store.selectImage('first')
    const wrapper = mount(LayoutGrid, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          CropCanvas: true,
          DateStamp: true,
          VueDraggable: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.get('[aria-label="添加第 1 张图片的日期"]').trigger('click')
    expect(store.slots[0]!.image?.dateStamp).not.toBeNull()
    expect(store.slots[1]!.image?.dateStamp).toBeNull()
    expect(wrapper.get('[aria-label="显示图片日期"]').attributes('aria-checked')).toBe('true')
  })

  it('provides a unified date switch and position controls', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    store.slots[1]!.image = fakeImage('second')
    const wrapper = mount(LayoutGrid, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          CropCanvas: true,
          DateStamp: true,
          VueDraggable: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.get('[aria-label="统一显示图片日期"]').trigger('click')
    expect(store.images.every((image) => image.dateStamp)).toBe(true)
    await wrapper.get('[aria-label="统一日期横向位置"]').setValue('30')
    await wrapper.get('[aria-label="统一日期横向位置"]').trigger('change')
    expect(store.images.map((image) => image.dateStamp?.position.x)).toEqual([0.3, 0.3])
  })
})
