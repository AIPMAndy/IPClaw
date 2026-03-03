# IPClaw

[English](README.md) | **中文**

> 面向创作者的开源个人 IP 增长操作系统。

IPClaw 目标是把一次构建过程变成可复用增长闭环：

- 定位
- 内容生产
- 分发执行
- KPI 复盘迭代

---

## 为什么是 IPClaw

多数工具止步于“帮你写内容”。IPClaw 更关注执行闭环：

1. 明确定位（你服务谁，带来什么结果）
2. 从真实构建日志产出可发布内容资产
3. 用审批优先 + 追踪链接做分发
4. 每周按数据做 keep / drop / double-down

---

## 快速开始

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
claude
```

然后执行：

- `/ip-run`：生成每周 IP 运营包

如果你是第一次本地初始化运行环境，再执行一次 `/setup` 即可。

---

## `/ip-run`（MVP）

`/ip-run` 会一次生成：

- 定位卡
- 内容包
- 分发审批卡
- 周 KPI 复盘卡

CLI 示例：

```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "个人IP自动化" \
  --audience "独立开发者" \
  --source docs/IPCLAW_MUSK_5STEP_EXECUTION.md \
  --repo "https://github.com/AIPMAndy/IPClaw" \
  --channels github,x \
  --lang zh
```

完整参数见：`docs/IPCLAW_COMMANDS.md`。

---

## 核心能力

### IP 增长层

- `extensions/ipclaw/positioning/`
- `extensions/ipclaw/content/`
- `extensions/ipclaw/distribution/`
- `extensions/ipclaw/analytics/`

模板资产在：`templates/ipclaw/`。

### 运行时能力层

- 容器化 agent 执行
- 群组隔离上下文（`groups/*/CLAUDE.md`）
- 定时任务与调度
- IPC 工具桥接
- SQLite 持久化

兼容性门槛：`docs/IPCLAW_COMPATIBILITY_CHECKLIST.md`

---

## 产品文档

- `docs/IPCLAW_MVP_ROADMAP.md`
- `docs/IPCLAW_MUSK_5STEP_EXECUTION.md`
- `docs/IPCLAW_COMMANDS.md`

---

## 贡献方向

当前阶段优先欢迎：

1. 提升定位/内容/分发/复盘输出质量
2. 增加高复用模板与案例
3. 补强 KPI 埋点与周报自动化

请保持加法式改动，不破坏运行时基线能力。

---

## License

MIT
