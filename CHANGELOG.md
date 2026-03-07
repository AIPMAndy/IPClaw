# Changelog

All notable changes to IPClaw will be documented in this file.

## Unreleased

### Added

- Added `05-feedback-tracker.csv` to every `ip:run` output pack for KPI loop tracking.
- Added CSV generation helper with escaping support for titles containing commas/quotes.
- Added `ip:review` command to generate weekly KPI review from tracker CSV.
- Added parser/strategy tests for review command and recommendation output.
- Added `--format md|json|both` for `ip:review`, including structured JSON report output.

### Changed

- Refactored topic generation flow to return structured ideas plus markdown in one pass.
- Updated docs to include feedback-tracker workflow.
- Updated command docs and README with KPI weekly review usage.
- Refactored review generation to share one data model for markdown and JSON outputs.
