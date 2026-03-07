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
  --case "问题：发了内容但没有线索；动作：重做定位和选题优先级；结果：点击率提升 35%" \
  --case-file plans/case-notes.md \
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
- `04-content-pack.md`（案例驱动内容包）
- `05-feedback-tracker.csv`（反馈追踪表，按选题逐条填报）

### 参数说明

- `--creator`：创作者名称（必填）
- `--niche`：主赛道（必填）
- `--audience`：目标受众（必填）
- `--source`：素材文件（可选，建议提供）
- `--case`：案例摘要文本（可选，建议 1-3 句）
- `--case-file`：案例文件路径（可选，可与 `--case` 同时使用）
- `--repo`：仓库链接（可选，用于选题中的回链）
- `--cta`：主 CTA（可选）
- `--channels`：逗号分隔渠道（可选，用于选题推荐渠道，默认 `github,x`）
- `--focus`：聚焦标签（可选，逗号分隔，最多 6 个）
- `--topics`：选题总数（可选，默认 `12`，范围 `3-60`）
- `--goal`：本轮产出目标（可选）
- `--lang`：`zh`/`en`（可选，默认 `zh`）

### 使用建议

- 先用 `--topics 12` 跑默认版本，确认语气和结构。
- 再通过 `--focus` 与 `--case` 精细化第二版输出。
- 发布后同步填写 `05-feedback-tracker.csv` 的曝光/点击/线索数据。
- 固定每周同一时间执行一次，按数据做保留/下线/加倍投入决策。

## `/ip-review`（KPI 周复盘）

用途：读取 `05-feedback-tracker.csv`，自动生成 KPI 快照和 keep/drop/double-down 建议。

### CLI 骨架

```bash
npm run ip:review -- \
  --tracker plans/ipclaw-runs/<timestamp>/05-feedback-tracker.csv \
  --out plans/ipclaw-runs/<timestamp>/06-weekly-review \
  --format both \
  --min-impressions 120 \
  --strong-ctr 0.04 \
  --weak-ctr 0.01 \
  --lead-target 2
```

### 参数说明

- `--tracker`：反馈追踪 CSV 路径（可选，默认自动读取最新 run 的 tracker）
- `--out`：输出路径（可选；可传文件、无扩展名基名，或目录（以 `/` 结尾/已存在目录）；默认同目录下 `06-weekly-review.*`）
- `--format`：输出格式（可选，`md`/`json`/`both`，默认 `md`）
- `--min-impressions`：进入稳定判断所需最小曝光（默认 `120`）
- `--strong-ctr`：加倍投入阈值 CTR（默认 `0.04`）
- `--weak-ctr`：下线阈值 CTR（默认 `0.01`）
- `--lead-target`：加倍投入阈值线索数（默认 `2`）
