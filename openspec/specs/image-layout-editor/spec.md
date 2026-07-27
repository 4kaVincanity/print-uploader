# image-layout-editor Specification

## Purpose
定义浏览器本地图片版面编辑器的核心行为，包括支持格式的图片导入、九张图片容量限制、固定 3x3 格位展示、拖拽与无障碍排序、删除替换、裁剪调整，以及图片数据仅在本地处理的要求。

## Requirements

### Requirement: Import supported images
系统 SHALL 允许用户从本地设备选择 JPG、PNG 或 WebP 图片，并将成功解码的图片添加到版面编辑器。

#### Scenario: Import valid images
- **WHEN** 用户选择一张或多张可成功解码的 JPG、PNG 或 WebP 图片
- **THEN** 系统将图片按选择顺序添加到第一个可用网格位置

#### Scenario: Import from a selected empty slot
- **WHEN** 用户点击一个空格位并选择一张或多张有效图片
- **THEN** 系统将首张成功解码的图片添加到用户点击的格位，其余图片继续添加到可用格位

#### Scenario: Reject unsupported or unreadable input
- **WHEN** 用户选择不支持的文件类型或无法解码的图片
- **THEN** 系统拒绝该文件、保留其他有效图片，并显示可识别的错误信息

### Requirement: Enforce the nine-image limit
系统 MUST 将当前版面中的图片数量限制为九张。

#### Scenario: Selection exceeds remaining capacity
- **WHEN** 用户选择的有效图片数量超过当前剩余位置数量
- **THEN** 系统只添加能够填入剩余位置的图片，并告知用户其余图片未被添加

### Requirement: Present a fixed 3x3 layout
系统 SHALL 将版面显示为三列三行的九个稳定位置，并在图片不足九张时显示空位。

#### Scenario: Fewer than nine images are present
- **WHEN** 当前版面包含少于九张图片
- **THEN** 系统在对应顺序的位置显示图片，并将其余位置显示为可添加图片的空位

### Requirement: Reorder images by dragging
系统 SHALL 允许用户使用鼠标或触摸拖拽调整图片顺序，并 MUST 为键盘用户提供等价的可访问排序操作。

#### Scenario: Move an image to another occupied position
- **WHEN** 用户将一张图片拖放到另一个已占用位置
- **THEN** 系统重新排列受影响的图片，并保留每张图片各自的裁剪参数

#### Scenario: Move an image to an empty position
- **WHEN** 用户将一张图片拖放到一个空位
- **THEN** 系统把该图片移动到目标位置并留下原位置空位

### Requirement: Remove and replace images
系统 SHALL 允许用户删除任意图片，并在空位继续添加新图片。

#### Scenario: Remove an image
- **WHEN** 用户触发某张图片的删除操作
- **THEN** 系统移除该图片、释放相关临时资源，并保留一个可继续添加图片的空位

### Requirement: Adjust image crop
系统 SHALL 使用铺满格子的方式显示图片，并允许用户调整单张图片的缩放和位置。系统 MUST 限制变换范围，使格子内不会因调整而暴露空白区域。

#### Scenario: Adjust zoom and position
- **WHEN** 用户缩放或移动某张图片
- **THEN** 系统立即更新该图片的裁剪视图，并将变换参数与该图片的稳定标识关联

#### Scenario: Attempt to move beyond crop bounds
- **WHEN** 用户尝试将图片移动到会暴露格子空白的位置
- **THEN** 系统将偏移约束在仍能完全覆盖格子的最近有效位置

### Requirement: Keep image data local
系统 MUST 在浏览器本地读取和处理所选图片，不得为完成编辑或导出工作流而将图片上传到服务器。

#### Scenario: Complete an editing session
- **WHEN** 用户导入、排序、调整并删除图片
- **THEN** 所有图片内容和编辑参数仅保存在当前浏览器会话中
