<!-- MASTER-ORCHESTRATOR -->
**Lead Developer Mandate**: Read `/root/.config/opencode/RULES.md` first. This workspace operates with autonomous orchestration - never ask which tool to use, automatically coordinate best available skills/MCPs.
<!-- MASTER-ORCHESTRATOR -->

<!-- convex-ai-start -->
**Convex Backend**: Read `convex/_generated/ai/guidelines.md` first for Convex APIs.
Convex agent skills: `npx convex ai-files install`.
<!-- convex-ai-end -->

## Available Skills

- **debug** - Frontend/UI debugging (auto-trigger: "debug this", "fix bug")
- **ui-ux-pro-max** - Design system generator (67 styles, 161 rules)
- **code-graph** - Token-efficient code review
- **design-taste/frontend** - High-agency UI engineering
- **frontend-design** - Production-grade frontend

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
