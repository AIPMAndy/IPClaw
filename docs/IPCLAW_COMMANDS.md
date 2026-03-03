# IPClaw Command Skeleton

## `/ip-run`（MVP）

用途：一次生成 IP 选题包（定位、人设、优质选题），并自动填充首版草稿。

### CLI 骨架

```bash
npm run ip:run -- \
  --creator "Andy" \
  --niche "个人IP内容生产与运营" \
  --audience "独立开发者" \
  --source plans/weekly-build-log.md \
  --repo "https://github.com/<you>/IPClaw" \
  --cta "回复你的场景，我给你一版可执行策略" \
  --channels github,x,wechat \
  --focus "增长飞轮,模板复用,案例拆解" \
  --topics 20 \
  --goal "拿到首批 20 个种子用户" \
  --lang zh
```

### 输出目录

默认写入：`plans/ipclaw-runs/<timestamp>/`

- `README.md`
- `01-positioning.md`
- `02-persona.md`
- `03-topic-ideas.md`

### 参数说明

- `--creator`：创作者名称（必填）
- `--niche`：主赛道（必填）
- `--audience`：目标受众（必填）
- `--source`：素材文件（可选，建议提供）
- `--repo`：仓库链接（可选，用于选题中的回链）
- `--cta`：主 CTA（可选）
- `--channels`：逗号分隔渠道（可选，用于选题推荐渠道，默认 `github,x`）
- `--focus`：聚焦标签（可选，逗号分隔，最多 6 个）
- `--topics`：选题总数（可选，默认 `12`，范围 `3-60`）
- `--goal`：本轮产出目标（可选）
- `--lang`：`zh`/`en`（可选，默认 `zh`）

### Skill 入口

已提供 skill：`.claude/skills/ip-run/SKILL.md`

在 Claude Code 中可直接使用 `/ip-run`，按提示补齐输入并完成三份核心产物。
