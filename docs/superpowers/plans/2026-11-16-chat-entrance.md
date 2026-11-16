# 聊天分层入场实施计划

**目标：** OpenAI 开场结束后按已确认方案用约 1.8 秒分层展开进入聊天。

**架构：** 在 `openai-startup` 现有离场生命周期内标记根节点，CSS 使用现有 Codex data 属性选取主区、侧栏、消息与输入框。沿用 ctx 计时和事件清理；跳过保持快速，减少动态与后台直接取消。

**技术：** 现有 JavaScript 插件、CSS keyframes、Jest/jsdom、独立 HTML 预览。按用户要求由当前主代理直接执行。

- [x] 在 `packages/effects/src/__tests__/openaiStartup.test.ts` 添加入口时序、跳过与清理测试，运行 `node node_modules/jest/bin/jest.js --config packages/effects/jest.config.js --runInBand openaiStartup` 确认新增测试失败。
- [x] 修改 `packages/effects/builtin/openai-startup/effect.js` 的正常离场与第二幕入口；在 `effect.css` 添加隔离的 CSS 动效，并将 manifest 升至 v5。
- [x] 用原测试命令确认生命周期测试通过，再运行 effects 包完整测试、类型检查及格式检查。
- [x] 更新 `docs/playground/openai-startup.html`，使用实际宿主 data 属性模拟布局，加入进入聊天定位；通过浏览器观察生产插件的过渡与结束状态。
- [x] 更新插件 README、根 README 和 `docs/CHANGELOG.md`，记录触发条件、1.8 秒时长与减少动态行为。
- [x] 将验证后的四个插件文件备份并同步至本机效果目录，保留参数与背景，通过现有 CLI 查询加载状态；同步需要目录写入批准时按权限工具申请。

## 验证结果

2026-11-16：effects 包 38 项测试全部通过。启动插件行覆盖率 97.44%、分支覆盖率 86.6%；effects 类型检查、格式检查、lint 和 `git diff --check` 通过。CLI 构建及 `--check` 通过。

浏览器中的独立预览确认六类区块的实际 animation 名称、延迟、时长均匹配方案；结束后根节点状态、覆盖层与动画清除。实际 Codex 已热加载新版插件，CLI 回报运行中；未重启当前聊天，实际开场仍按每页面一次播放。

本机旧插件备份：`local/chat-entrance/backup-20261116-150857-446/`。只更新四个插件文件，SHA256 与源码一致，原 `params.json` 哈希未改变。

## 提交前完整检查

2026-11-16：全仓库 66 个测试套件、557 项单元测试通过；compile、themes:check、runtime:check、codex:check、dsh:check、format:check、lint、pre-publish 和 VSIX 打包通过。VSIX 含 80 个文件和内置 CLI，约 899 KB。

VS Code 1.146.0 集成测试使用原编译测试套件，在本机同版本编辑器的独立临时副本上通过（exit 0），由官方 `runTests` API 指定副本路径；原编辑器安装不参与测试。首次官方下载较慢，因此改用副本完成验证。

环境维护：pnpm 的运行前自动安装异常退出，检查时仅在进程中设为警告，按包名定位工作区以避开含空格路径的筛选问题。系统 Node 24.11.1 上的 VSCE 异常退出；使用随附 Node 24.22.1 和临时安装的同版本 VSCE 3.9.2 完成发布前与打包检查，工具链接随后恢复。未修改依赖声明、锁文件或全局配置；临时工具、测试编辑器副本和验证脚本不提交。
