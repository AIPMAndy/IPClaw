---
name: ip-run
description: Run IPClaw topic-first workflow (positioning, persona, topic ideas). Use when user asks to run /ip-run, build a weekly topic pack, or generate high-quality content topics.
---

# IPClaw `/ip-run`

一键生成个人 IP 选题包：定位卡 + 人设卡 + 优质选题包（自动填充版）。

## Goal

在 1 次命令中产出可执行资产，不改变 NanoClaw 核心行为。

## Inputs (minimum)

- Creator：创作者名称或身份
- Niche：赛道
- Audience：目标受众
- Source（optional）：本周构建日志或长内容素材文件
- Repo（optional）：仓库链接（用于选题回链）
- CTA（optional）：主行动召唤文案
- Channels（optional）：候选发布渠道，默认 `github,x`
- Focus（optional）：选题聚焦标签，逗号分隔（最多 6 个）
- Topics（optional）：选题总数，默认 `12`（范围 `3-60`）
- Goal（optional）：本轮选题产出目标
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
  [--focus "增长飞轮,模板复用"] \
  [--topics 20] \
  [--goal "<goal>"] \
  [--lang zh|en]
```

2. 命令会在 `plans/ipclaw-runs/<timestamp>/` 生成：

- `README.md`
- `01-positioning.md`
- `02-persona.md`
- `03-topic-ideas.md`

3. 脚本会自动提炼 source 要点并填充 3 份内容：

- `01-positioning.md`：生成一句话定位、内容支柱、CTA。
- `02-persona.md`：生成主人设、痛点、触发点、信任信号。
- `03-topic-ideas.md`：生成 P1/P2/P3 选题池 + 7 天发布建议。

## Guardrails

- 默认人工审批后再对外发布。
- 禁止夸大收益、保证式承诺。
- 输出选题必须人设一致、可执行、可验证。

## Output Standard

完成后给用户一个简短汇总：

- 生成目录路径
- 3 个文件完成状态
- 下一步（建议先发哪 2 条 P1 选题）
