AUDIT MODE — patch only.

Scan frontend/src/domains/*/components/**/*.tsx.
Enforce the rule: "Components MUST receive data via props. Avoid fetching directly inside components."

Flag components that:
  - Call useQuery or useMutation directly inside a leaf/presentational component
    (should be lifted to a container or hook)
  - Accept raw IPC responses as props instead of typed domain models
  - Are missing explicit TypeScript prop interfaces (using implicit `any` or no interface)

For each violation, produce a patch that:
  - Extracts the fetch logic into a dedicated hook in /hooks/ or /api/
  - Passes typed props down to the component
  - Preserves existing behavior exactly
