# IPClaw Extensions

This folder contains additive modules for personal-IP growth while preserving NanoClaw core behavior.

## Modules

- `positioning/` - audience and value-positioning generation
- `content/` - long-form to multi-platform content repurposing
- `distribution/` - channel adaptation and publish checklist
- `analytics/` - KPI snapshot and iteration suggestions

## Rules

- Keep changes additive.
- Do not break existing core commands.
- Default to human approval for outbound publishing.

## Execution Flow (MVP)

1. `positioning/` 生成定位与内容支柱。
2. `content/` 把长内容改写为发布资产。
3. `distribution/` 生成渠道适配与审批清单。
4. `analytics/` 输出周报与下一步动作。

## Template Assets

- `templates/ipclaw/positioning-prompt.md`
- `templates/ipclaw/content-repurpose.md`
- `templates/ipclaw/distribution-checklist.md`
- `templates/ipclaw/weekly-kpi-review.md`

## Command Skeleton

- `/ip-run` skill: `.claude/skills/ip-run/SKILL.md`
- CLI scaffold: `npm run ip:run -- --creator "..." --niche "..." --audience "..."`
- Supports auto-fill from source: `--source <file> --repo <url> --channels github,x`
