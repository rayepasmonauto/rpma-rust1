import { signalMutation } from '@/lib/data-freshness';
import { invalidatePattern } from '../core';

export interface MutationEffectConfig {
  invalidate?: readonly string[];
  signal?: readonly string[];
}

export function applyMutationEffects(config: MutationEffectConfig): void {
  for (const pattern of config.invalidate ?? []) {
    invalidatePattern(pattern);
  }

  for (const domain of config.signal ?? []) {
    signalMutation(domain);
  }
}

export async function runWithMutationEffects<T>(
  operation: () => Promise<T>,
  config: MutationEffectConfig,
): Promise<T> {
  const result = await operation();
  applyMutationEffects(config);
  return result;
}
