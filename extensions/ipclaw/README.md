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
2. 基于 source 自动提炼主人设（痛点、触发点、信任信号）。
3. 生成优质选题池（P1/P2/P3）。
4. 生成 7 天发布节奏建议。

## Template Assets

- `templates/ipclaw/positioning-prompt.md`
- `templates/ipclaw/persona-canvas.md`
- `templates/ipclaw/topic-ideas.md`

## Command Skeleton

- `/ip-run` skill: `.claude/skills/ip-run/SKILL.md`
- CLI scaffold: `npm run ip:run -- --creator "..." --niche "..." --audience "..."`
- Supports auto-fill from source: `--source <file> --repo <url> --channels github,x`
