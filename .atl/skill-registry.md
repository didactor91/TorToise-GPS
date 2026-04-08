# Skill Registry — tortoise-gps

Generated: 2026-04-08

## Project Context Files

| File | Status |
|------|--------|
| AGENTS.md | ❌ Not found |
| CLAUDE.md | ❌ Not found |
| .cursorrules | ❌ Not found |

_No project-level agent conventions found. Using global AGENTS.md at ~/.config/opencode/AGENTS.md._

---

## Available Skills

### Workflow & Collaboration

| Skill | Trigger |
|-------|---------|
| **branch-pr** | When creating a pull request, opening a PR, or preparing changes for review. |
| **issue-creation** | When creating a GitHub issue, reporting a bug, or requesting a feature. |
| **judgment-day** | When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". |

### Testing

| Skill | Trigger |
|-------|---------|
| **go-testing** | When writing Go tests, using teatest, or adding test coverage. |

### SDD (Spec-Driven Development)

| Skill | Trigger |
|-------|---------|
| **sdd-init** | When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init". |
| **sdd-explore** | When the orchestrator launches you to think through a feature, investigate the codebase, or clarify requirements. |
| **sdd-propose** | When the orchestrator launches you to create or update a proposal for a change. |
| **sdd-spec** | When the orchestrator launches you to write or update specs for a change. |
| **sdd-design** | When the orchestrator launches you to write or update the technical design for a change. |
| **sdd-tasks** | When the orchestrator launches you to create or update the task breakdown for a change. |
| **sdd-apply** | When the orchestrator launches you to implement one or more tasks from a change. |
| **sdd-verify** | When the orchestrator launches you to verify a completed (or partially completed) change. |
| **sdd-archive** | When the orchestrator launches you to archive a change after implementation and verification. |
| **sdd-onboard** | When the orchestrator launches you to onboard a user through the full SDD cycle. |

### Meta

| Skill | Trigger |
|-------|---------|
| **skill-creator** | When user asks to create a new skill, add agent instructions, or document patterns for AI. |
| **skill-registry** | When user says "update skills", "skill registry", "actualizar skills", "update registry", or after installing/removing skills. |

---

## Skill Sources

- User-level: `~/.config/opencode/skills/` (16 skills)
- User-level: `~/.claude/skills/` (mirrors opencode, same 16 skills)
- Project-level: none detected

_SDD skills (sdd-*) and _shared are excluded from this registry per convention._
