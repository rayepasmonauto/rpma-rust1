You are a senior Rust + Tauri + TypeScript architecture auditor. Audit the IPC layer of this codebase thoroughly and produce a structured, evidence-based review.
Context:


This project uses a strict four-layer backend architecture: IPC -> Application -> Domain -> Infrastructure.


The IPC layer is responsible for Tauri command handlers, authentication, authorization entry checks, and input/output mapping.


Frontend IPC must go through typed domain wrappers and must not call low-level Tauri invoke directly from UI components.


Authentication and RBAC must be enforced at the IPC boundary, not inside services or repositories.


Backend validation is authoritative; frontend validation is only for UX.


TypeScript types are generated from Rust and should not be manually redefined.


Testing is mandatory for success paths, validation failures, and permission failures.


Audit goals:


Identify architectural violations in the IPC layer.


Identify security risks, especially auth, RBAC, and token-handling issues.


Identify validation gaps, type-safety gaps, and error-handling inconsistencies.


Identify maintainability and testability issues.


Recommend concrete fixes with priority and rationale.


Review the code against these rules:
A. IPC boundary and layering


Verify each Tauri command stays thin and delegates business logic to the application layer.


Flag commands that contain domain logic, persistence logic, or cross-domain implementation details.


Flag any direct imports of another domain’s internal modules instead of shared contracts or approved cross-domain services.


Confirm request/response mapping is handled at the IPC boundary and does not leak infrastructure concerns upward.


B. Frontend IPC usage


Flag any direct use of invoke in components, hooks, or pages.


Verify frontend code uses typed domain IPC wrappers consistently.


Check whether command names are centralized and reused instead of duplicated string literals.


Verify cache invalidation and mutation signaling happen after write operations where required.


C. Authentication and RBAC


Verify protected commands enforce authentication at the IPC layer.


Verify role checks are applied through the project’s standard context-resolution flow.


Flag any service or repository that receives raw session tokens.


Confirm public commands are intentionally public and not missing protection by accident.


Identify commands with missing, weak, or inconsistent authorization requirements.


D. Validation and sanitization


Verify IPC commands validate request payloads before delegating to services.


Check whether backend validation exists for all important inputs, even if frontend validation also exists.


Flag missing sanitization, weak field validation, weak business-rule validation, and missing edge-case validation.


Identify places where invalid data could reach the application or domain layer.


E. Type safety


Verify request and response payloads rely on generated Rust-to-TypeScript types where applicable.


Flag manually duplicated frontend types that should come from generated definitions.


Check runtime response validation and type guards around backend responses.


Identify risks of contract drift between Rust IPC payloads and TypeScript consumers.


F. Error handling and observability


Verify IPC calls use the project-safe invocation pattern with timeout handling, correlation IDs, structured logging, and error mapping.


Flag inconsistent response extraction, missing validation of backend responses, and unclear user-facing error handling.


Check whether auth decisions and important actions are auditable.


G. Tests


Verify every IPC command has tests for success, validation failure, and permission failure.


Flag missing regression tests for known bug-prone areas.


Identify missing unit, integration, validation, and permission tests.


Call out commands that are difficult to test because they mix responsibilities.


Required output format:


Executive assessment




Give an overall IPC audit score from 1 to 10.


Summarize the top 5 risks.




Findings table




For each finding include:


ID


Severity: Critical / High / Medium / Low


Category: Architecture / Security / Validation / Type Safety / Testing / Observability / Performance


File or module


Evidence


Why it matters


Recommended fix






Rule-by-rule review




Review the code under sections A to G above.


For each rule, state Pass / Partial / Fail.




Priority actions




List the 10 most important fixes in implementation order.


Separate quick wins from structural refactors.




Patch guidance




For the highest-severity findings, propose concrete refactoring steps.


When useful, provide example code patterns that follow the project standard.




Test plan




Propose missing tests with exact scenarios, especially auth failures, validation failures, and happy paths.


Audit instructions:


Be strict.


Do not give generic advice.


Base every finding on actual code evidence.


Prefer file-level and function-level comments over broad statements.


Call out anti-patterns explicitly, such as direct invoke usage, missing IPC auth checks, passing session tokens beyond the IPC layer, manual type duplication, and missing permission tests.


Where possible, distinguish between confirmed violations and suspected risks.


Final rule:


Do not rewrite the whole system.


Focus on actionable findings that improve correctness, security, maintainability, and conformance to the documented architecture.