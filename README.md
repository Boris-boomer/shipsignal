# ShipSignal

为独立开发者提供从产品验证到转化加速的桌面决策辅助工具。
A desktop decision-assist tool for indie developers - from product validation to conversion acceleration.

## 核心原则 / Core Principles

1. 工具只让决策可追溯，不替开发者做决定
2. 付费信号权重远高于非付费信号
3. 可信度用确定性算法，AI 不参与真假判断
4. 每次归档强制提取至少 3 条学习信号
5. 数据本地 SQLite，离线优先

## 功能 / Features

- 三入口模式：A 有想法 / B 有产品 / C 多产品组合
- 信号记录：来源可验证性 + 付费标记 + 可信度标注
- 决策日志：依据追溯 + 结果验证
- 转化记录：多币种、订阅/一次性
- 学习信号：验证 / 推翻 / 发现
- Harbor：已归档项目的停靠港
- AI 助手：起草、总结、归纳（支持 OpenAI 兼容的所有服务）
- 中英文界面
- 深色/浅色主题
- 系统托盘 + 关闭确认
- 全局搜索（Ctrl+K）

## 技术栈 / Tech Stack

- 桌面：Tauri 2.0
- 前端：React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- 状态：Zustand 5
- 数据库：SQLite (tauri-plugin-sql)
- 后端：Rust

## 开发 / Development

安装依赖：
pnpm install

启动开发：
pnpm tauri dev

打包：
pnpm tauri build

## 数据安全 / Data Safety

所有数据存储在本机 SQLite 数据库，不上传任何服务器。
API Key、Token 等敏感信息仅保存在本地，不会通过网络传输（除非你主动调用 AI）。

## 反馈 / Feedback

- GitHub Issues: https://github.com/Boris-boomer/shipsignal/issues
- 邮箱: 3090287415@qq.com

## 打赏 / Support

如果 ShipSignal 帮到了你，欢迎在设置页扫码请作者喝杯咖啡。
完全自愿，不影响任何功能。

## License

MIT