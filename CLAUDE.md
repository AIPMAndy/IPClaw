# IPClaw

IPClaw is a CLI-first project focused on one workflow: `npm run ip:run`.

## Scope

- Generate an IP growth run pack from lightweight inputs.
- Keep architecture minimal: no daemon/service/runtime orchestration.
- Keep all outputs deterministic and file-based under `plans/ipclaw-runs/`.

## Key Files

- `scripts/ipclaw-run.ts`: core generator.
- `templates/ipclaw/*`: prompt and output templates.
- `docs/IPCLAW_COMMANDS.md`: command reference.

## Quality Bar

- `npm run lint`
- `npm run test`
- `npm run build`

Only merge changes that keep all three green.
