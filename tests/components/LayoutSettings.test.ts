import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import LayoutSettings from '../../src/components/LayoutSettings.vue'
import { useEditorStore } from '../../src/store/editor'

describe('LayoutSettings', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows full-page defaults and updates the Pinia settings', async () => {
    const store = useEditorStore()
    const wrapper = mount(LayoutSettings, {
      global: { plugins: [ElementPlus] },
    })
    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(3)
    expect(inputs[1]!.element.value).toBe('0')
    expect(inputs[2]!.element.value).toBe('0')

    await inputs[1]!.setValue('12')
    await inputs[1]!.trigger('change')
    await inputs[2]!.setValue('6')
    await inputs[2]!.trigger('change')

    expect(store.layoutSettings).toEqual({ sizeId: 'a4', marginMm: 12, gapMm: 6 })
  })
})
