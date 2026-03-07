# Contributing

## Source Code Changes

**Accepted:** Bug fixes, output-quality improvements, simplifications, reducing code.

**Not accepted:** Heavy runtime/platform additions unrelated to `ip:run`.

## Project Focus

IPClaw is now a standalone CLI. Please keep contributions within:

- `scripts/ipclaw-run.ts`
- `templates/ipclaw/*`
- `docs/IPCLAW_*`
- focused tests in `scripts/*.test.ts`

## Testing

Run before submitting:

```bash
npm run lint
npm run test
npm run build
```
