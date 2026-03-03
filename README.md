# IPClaw

**English** | [中文](README_zh.md)

> Turn one weekly build log into a repeatable personal-brand growth loop.

IPClaw is an open-source AI workflow for creators, indie builders, and public thinkers.
It helps you move from “I posted something” to “I run a measurable growth system”.

---

## Why IPClaw Is Different

Most AI tools stop at copywriting.

IPClaw gives you a full execution loop:

1. **Positioning** — who you help and what result you create
2. **Content** — convert one build log into multi-format assets
3. **Distribution** — channel plan with approval-first publishing
4. **Review** — weekly KPI snapshot + keep/drop/double-down decisions

This is built for people who want **operating system**, not just prompts.

---

## What You Get Today

- `/ip-run` workflow pack generator (auto-filled drafts)
- Positioning / content / distribution / KPI templates
- Approval-first distribution checklist (safer for real accounts)
- Container-isolated runtime and task orchestration

---

## Quick Start

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
claude
```

Then run:

- `/ip-run` to generate your weekly IP operation pack

If this is your first local runtime setup, run `/setup` once.

---

## `/ip-run` in 30 seconds

```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "Personal IP automation" \
  --audience "Indie developers" \
  --source docs/IPCLAW_MUSK_5STEP_EXECUTION.md \
  --repo "https://github.com/AIPMAndy/IPClaw" \
  --channels github,x,wechat \
  --goal "Get first 20 seed users" \
  --lang zh
```

Output folder:

- `plans/ipclaw-runs/<timestamp>/01-positioning.md`
- `plans/ipclaw-runs/<timestamp>/02-content-pack.md`
- `plans/ipclaw-runs/<timestamp>/03-distribution.md`
- `plans/ipclaw-runs/<timestamp>/04-weekly-review.md`

See full options in `docs/IPCLAW_COMMANDS.md`.

---

## Who It Is For

- Indie developers doing build-in-public
- Technical creators building personal brand with GitHub as the hub
- Consultants/coaches who need repeatable content-to-lead workflows
- Small creator teams that want AI-assisted operations with human approval

---

## Repository Map

### IP Growth Layer

- `extensions/ipclaw/positioning/`
- `extensions/ipclaw/content/`
- `extensions/ipclaw/distribution/`
- `extensions/ipclaw/analytics/`
- `templates/ipclaw/`

### Strategy & Playbooks

- `docs/IPCLAW_MVP_ROADMAP.md`
- `docs/IPCLAW_MUSK_5STEP_EXECUTION.md`
- `docs/IPCLAW_COMPATIBILITY_CHECKLIST.md`
- `docs/IPCLAW_COMMANDS.md`

---

## Safety & Operating Principle

- Keep all external publishing **human-approved by default**
- Keep changes additive and measurable
- Keep weekly iteration based on KPI evidence

---

## Contributing

Current high-impact contribution areas:

1. Better output quality for `/ip-run`
2. More reusable templates and real case examples
3. KPI instrumentation and weekly automation
4. Distribution adapters for more channels (approval-first)

If this project is useful, please star it and share your use case in Issues or Discussions.

---

## License

MIT
