# OpenAI 启动画面

暖白档案式 OpenAI / Codex 开场，环形刻度和底部细线缓慢展开，随后透出当前 Woodfish 背景并用 450ms 淡入聊天。纯 DOM / CSS，无视频、声音或联网请求。

默认关闭，只在 Codex 运行。设置 → 外观 → Woodfish 中打开「OpenAI 启动画面」，每个页面播放一次。点击「跳过」「进入工作区」或按 Esc 可提前离开；效果刷新或参数调整不会在同一页面再次遮住聊天。重新打开窗口页面后可再次播放。窗口后台加载或系统减少动态时跳过开场。

`duration`：停留秒数，默认 4，范围 2–8。可在设置页滑块、效果目录的 `params.json` 或 `user.css` 中调整：

```css
:root { --woodfish-openai-startup-duration: 3s; }
```

背景沿用「窗口背景」中的图片，关闭启动效果不会关闭背景。当前版本仍只支持静态 JPG / PNG / WebP；此效果不会把静态图变为动态视频，也不会在 Codex 的第一个窗口出现之前替换原生启动页。

预览：仓库根目录启动静态 HTTP 服务，打开 `docs/playground/openai-startup.html`。预览使用同一份插件代码和样式，右上角可重播、选择本机图片。
