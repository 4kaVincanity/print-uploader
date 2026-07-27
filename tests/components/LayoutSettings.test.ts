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
    expect(inputs).toHaveLength(2)
    expect(inputs[0]!.element.value).toBe('0')
    expect(inputs[1]!.element.value).toBe('0')

    await inputs[0]!.setValue('12')
    await inputs[0]!.trigger('change')
    await inputs[1]!.setValue('6')
    await inputs[1]!.trigger('change')

    expect(store.layoutSettings).toEqual({ marginMm: 12, gapMm: 6 })
  })
})
