### 1. Detect code smells

```text
Analyze the selected scope in this project and identify concrete code smells.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow (frontend + backend)

Focus on:
- Long methods / large modules / oversized components
- Duplicate logic
- Tight coupling
- Poor naming
- Complex conditionals
- Data clumps
- Responsibility leakage across layers
- Inconsistent patterns within the same domain

Project-aware expectations:
- Frontend should use typed IPC wrappers and TanStack Query for server state
- Backend should respect IPC → Application → Domain → Infrastructure boundaries
- Cross-domain behavior should not create hidden dependencies

Output:
- List of smells
- Why each is a problem
- Exact locations (files, modules, functions, components, services, hooks, handlers)
- Suggested refactoring techniques from a standard catalog

Do NOT modify code.
```

***

### 2. Long logic → extract method

```text
PATCH MODE — Refactor long logic in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Goals:
- Reduce nesting
- Extract small pure helper functions where possible
- Keep execution order identical
- Improve readability without changing architecture

Rules:
- No behavior change
- No renaming public APIs
- No breaking side effects
- Keep extracted logic in the appropriate layer or module
- For frontend, prefer helpers/hooks/subcomponents when appropriate
- For backend, prefer private helpers and small focused methods

Output:
- Updated code across the impacted modules
- List of extracted helpers with purpose
- Brief explanation of why each extraction is safe
```

***

### 3. Large module/class/component → split responsibilities

```text
PATCH MODE — Refactor oversized responsibilities in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Goals:
- Identify distinct responsibilities
- Split cohesive concerns into smaller modules, services, hooks, or subcomponents
- Clarify boundaries between orchestration, business rules, persistence, and UI concerns

Constraints:
- Preserve public API
- Minimal file movement
- No architectural rewrite
- Keep existing domain and layer conventions intact

Output:
- Refactored structure
- Explanation of new responsibility boundaries
- List of impacted modules and why they were split
```

***

### 4. Duplicate code → consolidate

```text
PATCH MODE — Remove duplicated logic in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Steps:
- Detect exact and near duplicates
- Group them by duplication type: UI logic, validation, mapping, orchestration, persistence, conditional rules
- Extract the smallest shared abstraction that improves clarity

Constraints:
- No over-abstraction
- Preserve readability
- No behavior changes
- Avoid creating artificial shared utilities for unrelated concepts

Output:
- Unified implementation
- Where duplication existed
- Why the chosen abstraction is appropriate
```

***

### 5. Complex conditionals → simplify

```text
PATCH MODE — Simplify conditional logic in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Goals:
- Replace deeply nested if/else structures with guard clauses where appropriate
- Reduce branching complexity
- Isolate decision logic into well-named helpers or domain methods
- Keep rules explicit and readable

Optional:
- Suggest table-driven logic, state-based modeling, or polymorphism if relevant

Rules:
- Preserve logic exactly
- No business rule changes
- Keep decision logic in the correct layer

Output:
- Simplified code
- Before/after reasoning
- Explanation of why the new structure is easier to maintain
```

***

### 6. Tight coupling → decouple

```text
PATCH MODE — Reduce coupling in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Focus:
- Dependencies between modules, services, components, hooks, or classes
- Hidden assumptions between frontend and backend
- Layer violations
- Cross-domain dependencies that should be isolated

Actions:
- Introduce interfaces, traits, adapters, or abstractions only if minimal and useful
- Isolate side effects
- Clarify ownership of orchestration logic
- Reduce direct knowledge of low-level details

Constraints:
- No large rewrites
- Keep current architecture
- Preserve public behavior

Output:
- Improved dependency structure
- What was tightly coupled before
- Why the new structure is safer and easier to evolve
```

***

### 7. Data clumps → parameter object

```text
PATCH MODE — Refactor repeated parameter groups in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Goals:
- Detect recurring parameter sets
- Replace them with a parameter object, request object, filter object, or typed config object
- Improve readability and reduce call-site noise

Constraints:
- Minimal API changes
- Backward compatibility if possible
- Keep request/response contracts coherent across the stack

Output:
- New structure
- Updated function/method signatures
- Impacted call sites
- Notes on compatibility implications
```

***

### 8. Clean unused / dead code

```text
PATCH MODE — Remove dead code in the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Tasks:
- Unused variables
- Unreachable branches
- Obsolete helpers
- Stale wrappers, hooks, services, or handlers
- Unused exports and indirections
- Redundant compatibility code no longer needed

Constraints:
- Ensure nothing externally used is removed
- Preserve public APIs unless clearly unused and safe to delete
- Be conservative where usage is uncertain

Output:
- Cleaned code
- List of removals
- Why each removal is safe
```

***

### 9. Rename for clarity

```text
PATCH MODE — Improve naming across the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Focus:
- Unclear variables
- Ambiguous functions or methods
- Misleading component/hook/service names
- Names that hide business intent
- Generic names that make cross-layer flow hard to follow

Rules:
- Keep public API stable where required
- Prioritize clarity over brevity
- Preserve domain terminology consistency
- Avoid renaming that creates unnecessary churn

Output:
- Renamed elements
- Reasoning
- Any names intentionally kept unchanged for API stability
```

***

### 10. Safe refactor with test awareness

```text
Refactor the selected scope safely.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Steps:
1. Identify risky areas
2. Suggest test cases needed before or alongside refactoring
3. Apply minimal refactor
4. Highlight assumptions and behavior-preservation points

Constraints:
- No behavior change
- Be explicit about side effects, state transitions, persistence, and permissions
- Call out gaps in test coverage

Output:
- Refactored code
- Risk analysis
- Missing tests
- Assumptions that should be verified
```

***

### 11. Full senior refactor

```text
PATCH MODE — Perform a senior-level refactor on the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Goals:
- Improve readability
- Reduce complexity
- Enforce clear structure
- Preserve architecture and conventions
- Minimize diff while improving maintainability

Process:
1. Identify code smells
2. Prioritize low-risk improvements
3. Apply incremental refactors:
   - extract methods
   - simplify conditionals
   - remove duplication
   - improve naming
   - reduce coupling
   - clarify responsibilities

Constraints:
- Zero behavior change
- Minimal diff
- No over-engineering
- No unnecessary abstractions
- Keep existing public contracts stable unless explicitly approved

Output:
- Final refactored code
- List of changes
- Reasoning per change
- Risks or follow-up opportunities not included in this patch
```



## Recommended version

If you want one prompt to reuse most of the time, use this shortened production version:

```text
PATCH MODE — Perform a senior-level refactor on the selected scope.

Scope:
- Frontend domain or feature
- Backend domain or feature
- End-to-end feature flow

Process:
1. Identify code smells
2. Prioritize low-risk improvements
3. Apply incremental refactors:
   - extract methods
   - simplify conditionals
   - remove duplication
   - improve naming
   - reduce coupling
   - clarify responsibilities

Constraints:
- zero behavior change
- minimal diff
- no over-engineering
- preserve public APIs and contracts
- keep logic in the correct architectural layer

Output:
- final refactored code
- list of changes
- reasoning per change
- risks and suggested tests
```
---------------------------------------

Use the "refactor" skill.

find code violates RPMA architecture constraints.

Task:
- Identify violations (layers, dependencies, responsibilities)
- Refactor to enforce correct layering (IPC → Application → Domain → Infrastructure)

Constraints:
- PATCH MODE only
- Minimal diff
- Preserve behavior

Focus ONLY on architecture violations.
