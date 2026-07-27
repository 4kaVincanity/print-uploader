# A4 图片排版工具

一个完全在浏览器本地运行的 A4 图片排版工具。最多导入九张 JPG、PNG 或 WebP 图片，按 3x3 网格调整顺序和裁剪区域，确认预览后下载 2480 x 3508 像素的 PNG。

## 开发命令

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## 打印参数

- 页面：A4 竖版
- 输出：PNG，2480 x 3508 像素
- 网格：3 列 x 3 行
- 页面边距：默认 0 mm，可调整为 0 至 30 mm
- 图片间距：默认 0 mm，可调整为 0 至 20 mm
- 建议打印设置：A4、100% 或适合页面

## 目录结构

- `src/pages/`：页面级业务组合
- `src/components/`：可复用组件
- `src/api/`：统一接口访问边界
- `src/store/`：Pinia 跨页面状态
- `src/utils/`：纯工具函数
- `src/config/index.ts`：项目配置
- `src/assets/`：构建资源与主题样式
- `src/public/`：公共静态资源
- `src/style/`：全局样式入口

## 浏览器限制

- 图片只保存在当前浏览器会话，刷新页面后不会恢复。
- 单张图片限制为 25 MB；九张超高分辨率图片可能占用较多内存。
- PNG 文件具有对应 300 DPI 的像素尺寸，但部分打印软件不会读取或保留 PNG 的物理 DPI 信息，请在打印对话框中明确选择 A4。
- 推荐使用当前版本的 Chrome、Edge、Firefox 或 Safari。较旧浏览器可能不支持 Canvas PNG 编码、Pointer Events 或 WebP 解码。
- 下载完成后应用会释放生成文件占用的临时内存；如需再次下载，请重新生成预览。
