# OpenAI 启动效果与龙娘背景实施计划

**目标**：在当前 Codex 的 Woodfish 中加入 OpenAI / Codex 开场，使用提供的静态龙娘图作为聊天背景。

**设计**：暖白档案式开场显示 OpenAI、CODEX 和装饰性网格，约 4 秒后交叉淡出至聊天背景。提供始终可见的跳过按钮和 Esc 快捷键；减少动态时立即结束，首次注入后每个页面只播放一次。背景使用现有上传和静态模糊机制，图片保持本机保存。不开动态视频功能。

**技术**：Woodfish 效果插件（CommonJS JavaScript、CSS、effect.json）、现有 Codex background CLI、Jest / jsdom。

**执行**：按用户要求由当前主代理直接完成，不使用子代理。在现有 checkout 的 `feat/monorepo-theme-core` 分支工作。

- [x] 新增 `packages/effects/src/__tests__/openaiStartup.test.ts`：验证自动退场、点击跳过、Esc、重复注入、减少动态、dispose 和单次退场；先运行观察缺失插件导致失败。
- [x] 新增 `packages/effects/builtin/openai-startup/` 的 manifest、实现、CSS 和中文说明：使用 `ctx.layer`、`ctx.on`、`ctx.later`；不改宿主 DOM，不联网，不阻塞启动。
- [x] 更新效果清单测试和自动生成的 CSS 变量清单；新增独立预览页，使用同一插件代码与 CSS。
- [x] 更新 README、`docs/CHANGELOG.md`，记录启用、关闭和静态背景限制。
- [x] 运行插件测试、已有 effects 测试、相关编译与格式检查，使用浏览器检查开场及淡出。
- [x] 备份本机 Woodfish 设置，用现有已安装 CLI 保存原图并启用背景，复制经过验证的插件并开启它，读取运行状态和实际界面验证。

**验收**：OpenAI 开场自动结束且可跳过；不因效果刷新反复遮住聊天；龙娘图已保存为 Woodfish 自有副本；背景透出 22%，面板遮罩约 65%，面板模糊 14px；启动和背景设置有可恢复备份。

## 验证记录

- effects 22 项、renderer-runtime 34 项、adapter-codex 63 项，共 119 项测试通过。新插件行覆盖率 100%、函数覆盖率 100%、分支覆盖率 93.75%。
- effects 与 adapter-codex 的 TypeScript 构建、effects 测试类型检查、相关文件 Prettier 检查及 effects ESLint 通过。
- `node apps/desktop-cli/scripts/build.js` 与 `--check` 均通过；未修改生成的渲染器资源。
- 独立浏览器预览观察到开场、图片渐入和自动退场；当前应用截图确认龙娘背景已显示，CLI 报告 `openai-startup` 与 `background` 运行中。
- 未关闭或重启当前 Codex，因此没有实测整次应用冷启动；插件属于页面加载后的覆盖层，不接管原生窗口出现前的启动过程。
- 本机图片保存为 `29e1009b0c03`（1402×1122 PNG），首次修改前设置位于 `local/openai-dragon/backup-20261116-105142-807`。个人图片、备份和截图均由 `.gitignore` 排除。
- 仓库指定的 pnpm 安装遇到联网失败与进程异常退出，最终使用 npm 安装已声明依赖与 CLI 的 `smol-toml@1.9.1`，通过本机 workspace junction 解析共享包；未改 package.json 或 pnpm-lock.yaml。
