## ADDED Requirements

### Requirement: Export the current card as a high-resolution PNG
系统 SHALL 将当前模板、繁体文字、Libian 字体和所有插图图层绘制为 PNG。正方形模板 MUST 导出为 1600×1600 像素，竖版模板 MUST 导出为 827×1169 像素；导出内容 MUST 与当前预览的模板、文字和图层顺序一致。

#### Scenario: Export square card
- **WHEN** 用户在正方形模板中请求下载
- **THEN** 系统下载一张 1600×1600 像素 PNG，且其文字和插图布局与预览一致

#### Scenario: Export portrait card
- **WHEN** 用户在竖版模板中请求下载
- **THEN** 系统下载一张 827×1169 像素 PNG，且其文字和插图布局与预览一致

### Requirement: Provide recoverable export feedback
系统 SHALL 在生成或编码 PNG 时显示进行中状态并阻止重复导出。系统 MUST 在失败后保留用户输入和图层编辑状态，并显示可识别错误。

#### Scenario: Export is in progress
- **WHEN** 系统正在绘制或编码 PNG
- **THEN** 系统显示生成中状态并暂时禁用重复下载操作

#### Scenario: Export fails
- **WHEN** Canvas 绘制或 PNG 编码失败
- **THEN** 系统结束进行中状态、保留当前编辑内容并允许用户修正后重试

### Requirement: Release generated resources
系统 MUST 在下载完成、重新导出、删除插图或页面卸载时释放不再使用的对象 URL、Blob 和 Canvas 资源。

#### Scenario: Replace a generated result
- **WHEN** 用户重新导出或离开编辑器
- **THEN** 系统释放上一轮生成结果占用的临时资源
