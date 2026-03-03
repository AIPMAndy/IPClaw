# IPClaw

[English](README.md) | **中文**

> 面向创作者的开源个人 IP 增长操作系统。

IPClaw 目标是把一次构建过程变成可复用增长闭环：

- 定位
- 人设
- 优质选题

---

## 为什么是 IPClaw

多数工具止步于“帮你写内容”。IPClaw 更关注执行闭环：

1. 明确定位（你服务谁，带来什么结果）
2. 抽取主人设（痛点、触发点、信任信号）
3. 生成高质量选题池（P1/P2/P3 优先级）
4. 用 7 天发布节奏快速验证反馈

---

## 运行前准备

- Node.js `>=20`（`node -v`）
- 完整运行 NanoClaw 需要一个容器运行时：
  - Docker（`docker info`）
  - Apple Container（`container --help`）
- 如果你只使用 `/ip-run` 生成运营包，可先不装容器运行时

---

## 快速开始（两条路径）

### 路径 A：仅生成 IP 运营包（无需容器）

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
npm run ip:run -- \
  --creator "Andy" \
  --niche "个人IP自动化" \
  --audience "独立开发者"
```

### 路径 B：运行完整 NanoClaw（需要容器运行时）

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
npm run setup
```

`npm run setup` 会先做环境检查，并打印下一步要执行的命令。

完成 setup 后，启动 `claude` 并执行 `/ip-run`。

---

## `/ip-run`（MVP）

`/ip-run` 会一次生成：

- 定位卡
- 人设卡
- 优质选题包

CLI 示例：

```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "个人IP自动化" \
  --audience "独立开发者" \
  --source docs/IPCLAW_MUSK_5STEP_EXECUTION.md \
  --repo "https://github.com/AIPMAndy/IPClaw" \
  --channels github,x \
  --focus "增长飞轮,模板复用,案例拆解" \
  --topics 20 \
  --lang zh
```

完整参数见：`docs/IPCLAW_COMMANDS.md`。

---

## 核心能力

### IP 增长层

- `extensions/ipclaw/positioning/`
- `scripts/ipclaw-run.ts`（定位→人设→选题）

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

1. 提升定位/人设/选题输出质量
2. 增加高复用模板与案例
3. 补强选题验证与反馈闭环自动化

请保持加法式改动，不破坏运行时基线能力。

---

## License

MIT
