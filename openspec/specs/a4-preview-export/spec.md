# a4-preview-export Specification

## Purpose
定义图片版面在 A4 竖版页面中的预览与导出行为，包括页面边距和图片间距配置、结果失效管理、打印分辨率 PNG 生成、进度与错误反馈，以及临时浏览器资源的释放要求。

## Requirements

### Requirement: Render an A4 portrait preview
系统 SHALL 按 A4 竖版比例展示完整页面预览，并使用与导出相同的 3x3 布局、白色背景以及用户当前选择的页面边距和图片间距。

#### Scenario: Generate preview with arranged images
- **WHEN** 用户点击生成预览且版面中至少有一张有效图片
- **THEN** 系统显示包含当前图片顺序、裁剪效果和空位的完整 A4 页面预览

#### Scenario: Generate preview with no images
- **WHEN** 用户在版面为空时点击生成预览
- **THEN** 系统不生成可下载结果，并提示用户先添加至少一张图片

### Requirement: Configure page margin and image gap
系统 SHALL 允许用户设置同时作用于页面四边的统一边距，以及同时作用于所有行列的统一图片间距。页面边距 MUST 支持 0 至 30 mm，图片间距 MUST 支持 0 至 20 mm，两个参数 SHALL 以 1 mm 为调整步长。

#### Scenario: Use full-page defaults
- **WHEN** 用户首次打开应用且尚未调整版面参数
- **THEN** 系统使用 0 mm 页面边距和 0 mm 图片间距，使 3x3 网格铺满完整 A4 页面

#### Scenario: Adjust layout spacing
- **WHEN** 用户在允许范围内修改页面边距或图片间距
- **THEN** 系统立即使用新参数重新计算编辑区和 A4 页面预览中的九个格位

#### Scenario: Reject an out-of-range setting
- **WHEN** 用户尝试输入超出允许范围的页面边距或图片间距
- **THEN** 系统将参数限制在最近的有效值，并显示最终生效的数值

### Requirement: Invalidate stale generated output
系统 MUST 在已生成预览后发生图片添加、删除、排序、裁剪、页面边距或图片间距变化时，将该预览和对应下载结果标记为过期。

#### Scenario: Edit after preview generation
- **WHEN** 用户在生成预览后修改任何影响版面的内容
- **THEN** 系统阻止下载旧结果，并要求用户重新生成预览

### Requirement: Export a print-resolution PNG
系统 SHALL 从原始图片生成恰好 2480 x 3508 像素的 PNG 文件，并按照预览中确认的布局绘制所有图片。

#### Scenario: Download confirmed layout
- **WHEN** 用户已生成最新预览并点击下载
- **THEN** 系统下载一张 2480 x 3508 像素的 PNG，其图片顺序、裁剪、空位以及当前页面边距和图片间距与预览一致

#### Scenario: Preserve quality from original images
- **WHEN** 系统生成下载文件
- **THEN** 系统直接使用原始解码图片绘制高分辨率画布，而不是放大屏幕预览或 DOM 截图

#### Scenario: Close confirmation after download
- **WHEN** 用户在确认弹窗中点击下载且下载成功触发
- **THEN** 系统关闭确认弹窗并返回版面编辑界面

### Requirement: Communicate generation progress and failures
系统 SHALL 在高分辨率预览或导出生成期间显示忙碌状态、阻止重复触发，并在失败时提供可恢复的错误提示。

#### Scenario: Generation is in progress
- **WHEN** 系统正在解码图片或绘制导出画布
- **THEN** 系统显示生成中状态并暂时禁用重复生成和下载操作

#### Scenario: Generation fails
- **WHEN** 图片解码、Canvas 绘制或 PNG 编码失败
- **THEN** 系统停止忙碌状态、保留当前编辑内容，并提示用户重试或替换有问题的图片

### Requirement: Release generated resources
系统 MUST 在下载完成、重新生成或页面卸载时释放不再使用的 Canvas、对象 URL 和下载 Blob 资源。

#### Scenario: Replace a generated result
- **WHEN** 用户重新生成预览或离开应用
- **THEN** 系统释放先前生成结果占用的临时浏览器资源
