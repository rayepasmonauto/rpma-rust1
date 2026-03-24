/**
 * @deprecated Legacy NextAuth compatibility stub.
 * Use `@/domains/auth` for authentication and `@/lib/ipc` for session management.
 * This file is retained only for backward compatibility with existing imports.
 * TODO(ADR-006): Remove once all consumers are migrated.
 */

export const getServerSession = async () => {
  console.warn(
    "[DEPRECATED] getServerSession is a no-op stub. Use @/domains/auth instead.",
  );
  return null;
};

export const signIn = async (_provider: string, _options?: unknown) => {
  console.warn(
    "[DEPRECATED] signIn is a no-op stub. Use @/domains/auth instead.",
  );
  return { ok: true };
};

export const signOut = async (_options?: unknown) => {
  console.warn(
    "[DEPRECATED] signOut is a no-op stub. Use @/domains/auth instead.",
  );
  return { ok: true };
};
