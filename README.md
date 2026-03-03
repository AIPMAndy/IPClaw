# IPClaw

**English** | [中文](README_zh.md)

> Turn one weekly build log into a repeatable personal-brand growth loop.

IPClaw is an open-source AI workflow for creators, indie builders, and public thinkers.
It helps you move from “I posted something” to “I run a measurable growth system”.

---

## Why IPClaw Is Different

Most AI tools stop at copywriting.

IPClaw gives you a focused execution loop:

1. **Positioning** — who you help and what result you create
2. **Persona** — define pain points, triggers, and trust signals
3. **Topic Plan** — generate high-quality P1/P2/P3 topic backlog
4. **7-Day Cadence** — publish fast, collect feedback, iterate

This is built for people who want **operating system**, not just prompts.

---

## What You Get Today

- `/ip-run` workflow pack generator (auto-filled drafts)
- Positioning / persona / topic templates
- Topic-first publishing cadence with channel suggestions
- Container-isolated runtime and task orchestration

---

## Prerequisites

- Node.js `>=20` (`node -v`)
- For full NanoClaw runtime: one container runtime
  - Docker (`docker info`)
  - Apple Container (`container --help`)
- If you only use `/ip-run`, container runtime is optional

---

## Quick Start (Two Paths)

### Path A: Generate IP pack only (no container runtime)

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
npm run ip:run -- \
  --creator "Andy" \
  --niche "Personal IP automation" \
  --audience "Indie developers"
```

### Path B: Run full NanoClaw runtime (requires container runtime)

```bash
git clone https://github.com/AIPMAndy/IPClaw.git
cd IPClaw
npm install
npm run setup
```

`npm run setup` now runs an environment check and prints the exact next commands.

After setup, start `claude` and run `/ip-run`.

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
  --focus "growth loop,template reuse,case breakdown" \
  --topics 20 \
  --goal "Get first 20 seed users" \
  --lang zh
```

Output folder:

- `plans/ipclaw-runs/<timestamp>/01-positioning.md`
- `plans/ipclaw-runs/<timestamp>/02-persona.md`
- `plans/ipclaw-runs/<timestamp>/03-topic-ideas.md`

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
- `scripts/ipclaw-run.ts` (positioning → persona → topic planning)
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
- Keep weekly iteration based on topic performance evidence

---

## Contributing

Current high-impact contribution areas:

1. Better output quality for `/ip-run`
2. More reusable templates and real case examples
3. Topic validation instrumentation and weekly automation
4. Better topic adapters for more channels

If this project is useful, please star it and share your use case in Issues or Discussions.

---

## License

MIT
