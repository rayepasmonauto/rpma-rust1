// ADR-007 compliance: Role definitions must match the backend's 4 lowercase roles.
// ADR-015: Re-export from auto-generated backend types — never hand-define role unions.
export type { UserRole } from "@/lib/backend";
