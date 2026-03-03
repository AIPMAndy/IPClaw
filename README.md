<div align="center">

# 🚀 IPClaw

**AI 驱动的个人 IP 增长引擎 — 一键生成定位、人设、选题**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/AIPMAndy/IPClaw?style=social)](https://github.com/AIPMAndy/IPClaw)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-green)](https://nodejs.org)

[English](#english) | **简体中文**

<img src="assets/demo.gif" width="680" alt="IPClaw Demo">

*（Demo GIF 待补）*

</div>

---

## 🆚 为什么选 IPClaw？

| 能力 | 传统 AI 写作 | 内容运营 SaaS | **IPClaw** |
|------|:------------:|:-------------:|:----------:|
| 定位诊断 | ❌ | 部分 | ✅ **结构化输出** |
| 人设画像生成 | ❌ | ❌ | ✅ **痛点+触发+信任** |
| 选题规划（P1/P2/P3） | ❌ | 部分 | ✅ **优先级分层** |
| 多渠道分发建议 | ❌ | ✅ | ✅ **GitHub/X/微信** |
| 本地运行/数据私有 | ❌ | ❌ | ✅ **完全本地** |
| 开源可定制 | ❌ | ❌ | ✅ **Apache 2.0 + 附加条款** |

**一句话差异**：别的工具帮你"写内容"，IPClaw 帮你"建系统"。

---

## 🎯 谁适合用？

- **独立开发者** — 边做产品边打造技术影响力
- **技术博主** — 用 GitHub 做内容枢纽，系统化增长
- **咨询师/教练** — 可复用的内容→线索转化工作流
- **小型创作团队** — AI 辅助运营 + 人工审核把关

---

## 🚀 30 秒快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw

# 2. 安装依赖
npm install

# 3. 一键生成 IP 运营包
npm run ip:run -- \
  --creator "你的名字" \
  --niche "你的领域" \
  --audience "目标受众"
```

**输出文件：**
```
plans/ipclaw-runs/<timestamp>/
├── 01-positioning.md   # 定位卡
├── 02-persona.md       # 人设卡
├── 03-topic-ideas.md   # 选题包（P1/P2/P3）
└── 04-content-pack.md  # 案例驱动内容包
```

**案例驱动模式（可选）：**
```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "个人IP自动化" \
  --audience "独立开发者" \
  --case "问题：发了内容没有转化；动作：重做定位+P1选题；结果：一周新增3个意向线索"
```

---

## ✨ 核心功能

### 1️⃣ 定位诊断
回答三个核心问题：你服务谁？解决什么问题？带来什么结果？

### 2️⃣ 人设画像
提取目标用户的：
- 痛点（为什么需要你）
- 触发点（什么时候想起你）
- 信任信号（为什么相信你）

### 3️⃣ 选题规划
生成优先级分层的选题池：
- **P1**：高转化、强需求
- **P2**：建立专业度
- **P3**：长尾流量

### 4️⃣ 7 天发布节奏
- 快速发布 → 收集反馈 → 迭代优化
- 支持多渠道：GitHub、X/Twitter、微信公众号

---

## 📦 完整命令示例

```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "个人IP自动化" \
  --audience "独立开发者" \
  --source docs/IPCLAW_MUSK_5STEP_EXECUTION.md \
  --case "问题：发了内容没有转化；动作：重做定位+P1选题并每周复盘；结果：一周新增3个意向线索" \
  --repo "https://github.com/AIPMAndy/IPClaw" \
  --channels github,x,wechat \
  --focus "增长飞轮,模板复用,案例拆解" \
  --topics 20 \
  --goal "获取前 20 个种子用户" \
  --lang zh
```

详细参数见：[docs/IPCLAW_COMMANDS.md](docs/IPCLAW_COMMANDS.md)

---

## 🗂️ 项目结构

```
IPClaw/
├── scripts/ipclaw-run.ts        # 核心执行脚本
├── extensions/ipclaw/           # IP 增长模块
│   └── positioning/             # 定位诊断
├── templates/ipclaw/            # 模板资产
├── docs/
│   ├── IPCLAW_COMMANDS.md       # 命令参考
│   ├── IPCLAW_MVP_ROADMAP.md    # 产品路线图
│   └── IPCLAW_MUSK_5STEP_EXECUTION.md  # 马斯克五步法执行
└── plans/ipclaw-runs/           # 输出目录
```

---

## 🗺️ Roadmap

- [x] `/ip-run` MVP — 定位 + 人设 + 选题
- [x] 多语言支持（中/英）
- [x] 多渠道建议（GitHub/X/微信）
- [ ] 选题效果追踪与反馈闭环
- [ ] 内容模板库扩展
- [ ] Web UI 可视化面板

---

## 🤝 贡献

欢迎 PR！当前优先贡献方向：

1. **提升输出质量** — 更精准的定位/人设/选题
2. **增加模板** — 更多领域的可复用模板和案例
3. **自动化闭环** — 选题验证与反馈收集
4. **渠道适配器** — 支持更多分发平台

---

## 👨‍💻 作者

**AI酋长Andy** | 前腾讯/百度 AI 产品专家，AI 商业战略顾问

[![微信](https://img.shields.io/badge/微信-AIPMAndy-07C160?logo=wechat&logoColor=white)](https://your-wechat-qr-link)
[![GitHub](https://img.shields.io/badge/GitHub-AIPMAndy-181717?logo=github)](https://github.com/AIPMAndy)

---

## 📄 License

[Apache 2.0 + 附加条款](LICENSE)

✅ **允许**：个人学习、企业内部使用、开源引用（需保留作者信息）

❌ **禁止**（除非书面授权）：去品牌化、商业 SaaS、转售/倒卖

商业授权联系：微信 AIPMAndy

---

<div align="center">

**如果有帮助，请给个 ⭐ Star！**

</div>

---

## English

<div align="center">

# 🚀 IPClaw

**AI-Powered Personal IP Growth Engine — Generate positioning, persona, and topics in one click**

</div>

### Why IPClaw?

| Capability | AI Writing Tools | Content SaaS | **IPClaw** |
|------------|:----------------:|:------------:|:----------:|
| Positioning diagnosis | ❌ | Partial | ✅ **Structured** |
| Persona generation | ❌ | ❌ | ✅ **Pain+Trigger+Trust** |
| Topic planning (P1/P2/P3) | ❌ | Partial | ✅ **Prioritized** |
| Multi-channel suggestions | ❌ | ✅ | ✅ **GitHub/X/WeChat** |
| Local-first / Data private | ❌ | ❌ | ✅ **Fully local** |
| Open source & customizable | ❌ | ❌ | ✅ |

**The difference**: Other tools help you "write content." IPClaw helps you "build a system."

### Who Is It For?

- **Indie developers** — Build in public with a growth system
- **Technical creators** — Use GitHub as content hub
- **Consultants/Coaches** — Repeatable content-to-lead workflow
- **Small creator teams** — AI-assisted ops with human approval

### Quick Start

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
npm run ip:run -- \
  --creator "YourName" \
  --niche "Your Niche" \
  --audience "Target Audience"
```

Optional case-driven mode:
```bash
npm run ip:run -- \
  --creator "YourName" \
  --niche "Your Niche" \
  --audience "Target Audience" \
  --case "Problem: posted content with no leads; Action: rebuilt positioning + P1 topics; Result: higher CTR in one week"
```

### License

[Apache 2.0 + Additional Terms](LICENSE)

**Allowed**: Personal learning, internal enterprise use, open-source citation (retain author attribution)

**Prohibited** (without written authorization): De-branding, commercial SaaS, resale

Commercial licensing: WeChat AIPMAndy
