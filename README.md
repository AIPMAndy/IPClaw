# IPClaw

> Open-source personal-IP growth operating system for creators.

IPClaw helps creators turn one build cycle into a repeatable growth loop:

- positioning
- content production
- distribution planning
- KPI review and iteration

IPClaw keeps compatibility with NanoClaw runtime capabilities while focusing product experience on personal brand growth.

---

## Why IPClaw

Most tools stop at “content generation”. IPClaw is designed for execution:

1. Define clear positioning (who you help + what result you create)
2. Generate reusable content assets from real build logs
3. Distribute with approval-first workflow and tracking links
4. Review data weekly and decide keep / drop / double-down

---

## Quick Start

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
claude
```

Then run:

- `/setup` for environment and channel initialization
- `/ip-run` to generate your weekly IP operation pack

---

## `/ip-run` (MVP)

IPClaw includes a runnable skeleton command that generates:

- positioning card
- content pack
- distribution checklist
- weekly KPI review

CLI usage:

```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "Personal IP automation" \
  --audience "indie developers" \
  --source docs/IPCLAW_MUSK_5STEP_EXECUTION.md \
  --repo "https://github.com/AIPMAndy/IPClaw" \
  --channels github,x \
  --lang zh
```

See `docs/IPCLAW_COMMANDS.md` for full options.

---

## Core Capabilities

### IP Growth Layer

- `extensions/ipclaw/positioning/`
- `extensions/ipclaw/content/`
- `extensions/ipclaw/distribution/`
- `extensions/ipclaw/analytics/`

Reusable templates live in `templates/ipclaw/`.

### Runtime Layer (Compatibility Baseline)

- containerized agent execution
- isolated group context (`groups/*/CLAUDE.md`)
- scheduler and recurring tasks
- IPC tool bridge
- SQLite persistence

Compatibility and release gates:

- `docs/IPCLAW_COMPATIBILITY_CHECKLIST.md`

---

## Product Docs

- `docs/IPCLAW_MVP_ROADMAP.md`
- `docs/IPCLAW_MUSK_5STEP_EXECUTION.md`
- `docs/IPCLAW_COMMANDS.md`

---

## Contribution

Priority contributions for this stage:

1. Better IP output quality (positioning/content/distribution/review)
2. More reusable templates and case-based examples
3. KPI instrumentation and weekly review automation

Please keep changes additive and avoid breaking baseline runtime behavior.

---

## License

MIT
