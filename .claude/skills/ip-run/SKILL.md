---
name: ip-run
description: Run IPClaw end-to-end personal-IP workflow (positioning, content pack, distribution checklist, KPI review). Use when user asks to run /ip-run, generate an IP operating pack, or create weekly IP growth deliverables.
---

# IPClaw `/ip-run`

一键生成个人 IP 运营包：定位卡 + 内容包 + 分发审批卡 + KPI 复盘卡（自动填充版）。

## Goal

在 1 次命令中产出可执行资产，不改变 NanoClaw 核心行为。

## Inputs (minimum)

- Creator：创作者名称或身份
- Niche：赛道
- Audience：目标受众
- Source（optional）：本周构建日志或长内容素材文件
- Repo（optional）：仓库链接（用于自动生成追踪链接）
- CTA（optional）：主行动召唤文案
- Channels（optional）：分发渠道，默认 `github,x`
- Goal（optional）：本轮增长目标
- Lang（optional）：`zh` 或 `en`，默认 `zh`

如果缺输入，先用最少问题补齐，不做冗长问答。

## Execution Steps

1. 运行脚手架命令：

```bash
npm run ip:run -- \
  --creator "<creator>" \
  --niche "<niche>" \
  --audience "<audience>" \
  [--source <path>] \
  [--repo <url>] \
  [--cta "<cta>"] \
  [--channels github,x,wechat] \
  [--goal "<goal>"] \
  [--lang zh|en]
```

2. 命令会在 `plans/ipclaw-runs/<timestamp>/` 生成：

- `README.md`
- `01-positioning.md`
- `02-content-pack.md`
- `03-distribution.md`
- `04-weekly-review.md`

3. 脚本会自动提炼 source 要点并填充 4 份内容：

- `01-positioning.md`：生成一句话定位、内容支柱、CTA。
- `02-content-pack.md`：产出 GitHub 更新 + 5 条短内容。
- `03-distribution.md`：按渠道生成执行表与追踪链接。
- `04-weekly-review.md`：写本周 KPI 与 keep/drop/double-down。

## Guardrails

- 默认人工审批后再对外发布。
- 禁止夸大收益、保证式承诺。
- 任何外发建议必须回链 GitHub 仓库。

## Output Standard

完成后给用户一个简短汇总：

- 生成目录路径
- 4 个文件完成状态
- 下一步（建议先发布哪条内容）
