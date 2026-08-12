## ADDED Requirements

### Requirement: Navigate between the existing layout tool and the card generator
系统 SHALL 在原 A4 九宫格排版页面提供进入咖啡豆卡生成页面的明确入口，并在豆卡页面提供返回原 A4 九宫格工具的入口。系统 MUST 保留原九宫格页面的既有功能和编辑工作流。

#### Scenario: Open the card generator from the layout tool
- **WHEN** 用户在原 A4 九宫格页面点击咖啡豆卡生成入口
- **THEN** 系统进入独立的咖啡豆卡生成页面且原九宫格功能仍可再次访问

#### Scenario: Return to the layout tool
- **WHEN** 用户在咖啡豆卡生成页面点击返回入口
- **THEN** 系统返回原 A4 九宫格页面

### Requirement: Select and manage saved bean records
系统 SHALL 从豆子资料库显示可选择的记录列表。用户 MUST 能选择一条记录以回填全部咖啡豆字段，并能创建、修改及删除资料库记录；这些操作不得影响九宫格工具的编辑状态。

#### Scenario: Quickly fill from a saved record
- **WHEN** 用户从已保存豆子列表选择一条记录
- **THEN** 系统使用该记录的名称、品种/批次、海拔、处理法、烘焙度、风味和店铺名称回填豆卡字段

#### Scenario: Save a new bean record
- **WHEN** 用户提交当前填写的有效豆子资料作为新记录
- **THEN** 系统将记录持久保存并在选择列表中显示它

#### Scenario: Update or delete a bean record
- **WHEN** 用户更新或删除一条已保存记录
- **THEN** 系统持久保存对应变更，并在成功后更新选择列表

#### Scenario: Bean library operation fails
- **WHEN** 资料库请求失败或服务端拒绝无效数据
- **THEN** 系统保留当前表单内容、显示可识别错误，并允许用户重试

### Requirement: Edit coffee-bean card content in Traditional Chinese
系统 SHALL 提供咖啡豆名称、品种/批次、标高/海拔、生产处理、烘焙度、风味描述与店铺名称的可编辑字段，并将其即时渲染到当前豆卡模板。系统 MUST 保留用户输入的繁体中文字符，不得进行简繁转换。

#### Scenario: Enter bean information
- **WHEN** 用户输入或修改任一咖啡豆字段
- **THEN** 当前模板预览立即显示对应的最新繁体中文内容

### Requirement: Fill fields from pasted bean text
系统 SHALL 提供粘贴文本辨识功能。系统 MUST 将首个非空白行识别为咖啡豆名称，并将“标签 / 内容”格式的品种、标高、生产处理、焙煎度及花香/风味行填入对应字段。

#### Scenario: Paste a labelled bean description
- **WHEN** 用户粘贴豆名和多行“标签 / 内容”格式的文字并触发辨识
- **THEN** 系统将识别到的值填入对应字段，并立即更新卡片预览

#### Scenario: Leave an optional field empty
- **WHEN** 用户清空一个字段
- **THEN** 系统不显示该字段的占位文案，且其余内容仍按模板规则渲染

### Requirement: Provide two reference-faithful templates
系统 SHALL 提供正方形与竖版模板。两者 MUST 使用白色背景、Libian 字体、黑色主要文字及红色风味文字，并遵循已提供参考图的文字顺序、对齐、留白与视觉层级；正方形模板 MUST 为 1:1，竖版模板 MUST 为 827×1169 像素比例，以完整显示于既有九宫格的单元格内。

#### Scenario: Select square template
- **WHEN** 用户选择正方形模板
- **THEN** 系统显示 1:1 的文字布局，名称位于上部、字段依次位于中段、店铺名称位于底部

#### Scenario: Select portrait template
- **WHEN** 用户选择竖版模板
- **THEN** 系统显示与九宫格单元格比例一致的竖版文字布局，并在名称上方预留插图展示空间

### Requirement: Use the bundled Libian typeface
系统 MUST 从应用内置的 `Libian.ttc` 加载字体，并用于卡片预览和导出中的所有文字。

#### Scenario: Font loads successfully
- **WHEN** 用户打开豆卡编辑器且字体资源可用
- **THEN** 预览和导出均使用 Libian 字体绘制文字

#### Scenario: Font cannot load
- **WHEN** 字体资源未能加载或无法用于 Canvas 绘制
- **THEN** 系统保留编辑内容、显示可识别错误，并阻止导出不一致的图片
