## ADDED Requirements

### Requirement: Import local illustrations into either template
系统 SHALL 允许用户向正方形或竖版豆卡模板导入多张 JPG、PNG、WebP、HEIF 或 HEIC 插图。系统 MUST 仅在浏览器当前会话内处理 JPG、PNG 和 WebP；HEIF/HEIC MUST 由项目内 Express 服务在内存中转为 PNG，且不得持久保存源文件。

#### Scenario: Import illustrations
- **WHEN** 用户选择一张或多张可解码的受支持图片
- **THEN** 系统将每张图片作为独立插图图层加入当前模板画布；HEIF/HEIC 图片先被转换为 PNG

#### Scenario: Reject unreadable illustration
- **WHEN** 用户选择无法解码或不支持的文件
- **THEN** 系统拒绝该文件、保留其余有效插图，并显示可识别错误

### Requirement: Freely position and scale illustrations
系统 SHALL 允许用户选中任意插图并在画布内拖拽位置、等比缩放大小。系统 MUST 在操作后立即更新预览，并在导出中使用相同变换。

#### Scenario: Drag an illustration
- **WHEN** 用户拖动选中的插图
- **THEN** 系统将插图移动到拖放位置且不改变其他图层

#### Scenario: Resize an illustration
- **WHEN** 用户操作选中插图的缩放控制点
- **THEN** 系统等比更新该插图的大小且不改变其余图层

### Requirement: Manage illustration layer order and removal
系统 SHALL 允许用户将插图置于其他图层之前或之后，并删除任意插图。系统 MUST 提供不依赖纯拖拽的图层操作方式。

#### Scenario: Reorder overlapping illustrations
- **WHEN** 用户将一个插图图层置顶或下移
- **THEN** 预览与导出按新的层级顺序绘制重叠区域

#### Scenario: Remove an illustration
- **WHEN** 用户删除一个插图图层
- **THEN** 系统从画布和图层列表移除它、释放相关临时资源，并保留其他图层
