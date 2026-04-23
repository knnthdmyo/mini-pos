# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Validate the feature against each principle from `.specify/memory/constitution.md`:

- [ ] **I. Speed First** — Does this feature keep order creation under 5 seconds?
      Does it add zero extra taps to the core POS flow?
- [ ] **II. Simplicity Over Completeness** — Is this feature essential to the Core
      Purpose (prevent missed orders / track inventory / daily profit)? Not merely useful?
- [ ] **III. Accuracy in Inventory & Profit** — If this feature touches inventory,
      does deduction happen only on order completion? Is costing consistent?
- [ ] **IV. Human-Error Tolerant** — Are all mutations editable/reversible?
      Does the feature avoid blocking core operations on bad state?
- [ ] **V. Single-Device Optimized** — Does this feature function on one tablet
      without multi-device coordination or real-time sync?
- [ ] **VI. Accuracy Over Speed (Admin Only)** — If this feature touches costing,
      are all calculations mathematically correct and traceable? No hidden formulas?
- [ ] **VII. Separation of Concerns** — Does this feature keep POS fast and simple?
      Does it avoid adding costing complexity to the POS flow?
- [ ] **VIII. Batch-Based Thinking** — Is all costing computed at batch/yield level?
      Is single-item cost derived from batch, never entered directly?
- [ ] **IX. Editable System** — Are suggested values (SRP, cost) editable by admin?
      Does the system assist without enforcing?
- [ ] **X. Transparency** — Does the costing UI show full breakdown (materials,
      overhead, labor, total, profit)? No black-box formulas?
- [ ] **XI. Personalization Without Performance Cost** — If this feature touches
      branding/theme, are settings loaded once and cached? No runtime style
      computation? No latency added to POS, queue, or reporting flows?
- [ ] **Scope** — Is this feature in the MVP1, MVP2, or MVP3 Included list? If not,
      flag immediately.
- [ ] **Data Integrity** — Are all mutations logged? Are inventory deductions
      traceable to an order or manual adjustment? Is material cost the source of
      truth for costing?
- [ ] **Evolution Rule** — Does this feature satisfy all three evolution conditions?
      (No POS slowdown, no extra taps, no inventory/costing accuracy regression.)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
