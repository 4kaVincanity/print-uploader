import { describe, expect, it } from 'vitest'
import { parseBeanText } from '../../src/utils/beanTextParser'

describe('parseBeanText', () => {
  it('fills the bean fields from pasted labelled text', () => {
    expect(parseBeanText(`盧旺達 烏邦圖\n\n品種 / 紅波旁\n標高 / 1800 米\n生產處理 / DWF厭氧水洗\n焙煎度 / 淺焙\n花香 / 柚子 / 葡萄 / 核果`)).toMatchObject({
      name: '盧旺達 烏邦圖', variety: '紅波旁', altitude: '1800 米', process: 'DWF厭氧水洗', roast: '淺焙', flavor: '柚子 / 葡萄 / 核果',
    })
  })
})
