# OpenAI 启动画面

v4 修复第二幕斜体 OpenAI 的金属填色裁切：扩展渐变绘制边界并补偿外边距，覆盖 `p` 的下伸笔画和 `I` 的右侧倾斜笔画；描边副本同步对齐，字号与周围布局保持原值。沿用 v3 的完整两幕、扫描、环光、刻度、波形与 HUD 轨道流光：

1. 黑底 OpenAI 标识亮起，扫光后洗白。
2. 暖白技术档案底板：左上品牌、中央中英状态、底部日志与细进度。
3. 「需要访问许可」等待授予；「身份资料确认」显示展示名称 / 0001 / L3，等待确认。
4. 请求 → 读取 → 三层环形准星核验 → WELCOME TO / OPENAI CODEX。
5. 色散揭幕，当前背景图在右侧显影，左侧金属 OpenAI 大字、工作模式文案、HUD；扫描后缓慢推近。
6. 900ms 交叉叠化，归还聊天界面和输入焦点。

默认关闭，只在 Codex 运行。外观 → Woodfish 中开启「OpenAI 启动画面」。前两步点击按钮或按 Enter / 空格继续；右上角 SKIP 或 Esc 随时跳过。第二幕另有「进入工作区」。每页面一次，热更新不会再次遮挡聊天；后台首次加载或减少动态时跳过。等待超过两分钟自动离开；停用时清理节点、计时器与事件。

许可、身份、编号、访问级别都是开场演出，不申请真实系统权限，不读取账户或工作区内容。在设置中修改「展示名称」即可同步身份卡和欢迎文案，无需修改代码。

| 参数                 | 默认  | 范围 / 行为                                                                                  |
| -------------------- | ----- | -------------------------------------------------------------------------------------------- |
| `duration`           | 26 秒 | 12–40 秒，所有自动段按比例缩放；不计等待确认和末尾 900ms 叠化                                |
| `requireInteraction` | true  | 前两步等待确认；false 时全程自动                                                             |
| `displayName`        | 访客  | 展示名称，最多 48 个 Unicode 码点，空值回退默认值；只在设置或 `params.json` 修改，不映射 CSS |

可在设置页、`params.json` 或 `user.css` 调整：

```css
:root {
  --woodfish-openai-startup-duration: 26s;
  --woodfish-openai-startup-require-interaction: 1;
}
```

第二幕沿用 `--woodfish-background-image`，关闭启动效果不关闭聊天背景。仅支持当前 Woodfish 的静态 JPG / PNG / WebP，扫描与推近不会使人物本身活动；未加入参考片原声。只在页面加载后显示覆盖层，不接管原生窗口出现前的启动。无联网请求、外部字体、视频解码或持续画布循环；退场后不留动画。

预览：在仓库根目录启动静态 HTTP 服务，打开 `docs/playground/openai-startup.html`。下方可重播、换本机图片或定位单幕。逐幕定位暂停预览时钟，CSS 动效仍可观察；「完整播放」恢复正常流程。预览与实际使用同一份插件代码和样式。

## 来源与许可

参考视频：用户提供的 `dl.mp4`，对应 [BV1wspE6EE8b](https://www.bilibili.com/video/BV1wspE6EE8b/)。个人图片和视频不随仓库发布。

第一幕的步骤、技术档案排版和准星设计参考 [6shenhonghong9/dsh-startup-screen](https://github.com/6shenhonghong9/dsh-startup-screen)，在 Woodfish ctx 生命周期内重写。保留其 MIT 许可如下：

```text
MIT License

Copyright (c) 2026 沈宏宏

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

OpenAI 标识路径取自 [Simple Icons 13.21.0](https://github.com/simple-icons/simple-icons/blob/13.21.0/icons/openai.svg)，图标包以 [CC0-1.0](https://github.com/simple-icons/simple-icons/blob/13.21.0/LICENSE.md) 发布。标识内联在插件中，无需联网加载。
