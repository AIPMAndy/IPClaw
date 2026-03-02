# IPClaw Compatibility Checklist (NanoClaw Baseline)

Purpose: ensure `IPClaw` keeps NanoClaw behavior before adding IP-growth features.

## Release Gate

A release can be tagged only if all `P0` checks pass.

## P0: Must Pass (Baseline parity)

- [ ] Messenger ingress works (at least one configured channel can receive messages).
- [ ] Trigger word routing works from main channel and group channel.
- [ ] Main channel admin controls still work (`list tasks`, pause/resume flow).
- [ ] Group isolation remains intact (`groups/*/CLAUDE.md` and filesystem isolation).
- [ ] Per-group queue and global concurrency controls still prevent cross-group interference.
- [ ] Scheduled tasks execute on time and can send message output.
- [ ] Web access tools still execute inside sandboxed container runtime.
- [ ] Container isolation works (Apple Container or Docker) with expected mounts only.
- [ ] Agent swarms can be invoked and return output.
- [ ] `/setup` still completes required environment setup path.
- [ ] `/customize` still applies guided customization without breaking runtime.
- [ ] SQLite persistence remains healthy (messages, groups, sessions, scheduler state).

## P1: Should Pass (Operational quality)

- [ ] Startup logs are clean (no repeating errors).
- [ ] Restart recovery works (process restart resumes scheduler/state).
- [ ] IPC watcher can process command tasks reliably.
- [ ] Readme quick-start remains valid for macOS and Linux.

## IPClaw Add-on Safety Rules

- [ ] New `IPClaw` commands are additive and do not override core commands.
- [ ] External publishing is human-approved by default.
- [ ] No plaintext secrets written into repo files or logs.
- [ ] Feature flags can disable all IPClaw extensions quickly.

## Manual Verification Script (first run)

1. Configure one channel and send `@Trigger` message.
2. Create one scheduled task and verify callback.
3. Send tasks in two groups simultaneously and verify isolation.
4. Invoke one swarm workflow and verify returned artifact.
5. Run one IPClaw extension command and confirm no regression in core behavior.

## Sign-off

- Date:
- Commit:
- Verified by:
- Notes:
