import type { JsonObject, JsonValue } from '@/types/json';
import { safeInvoke, cachedInvoke, invalidatePattern, ResponseHandlers } from '../core';

export { ResponseHandlers } from '../core';

/**
 * Generic CRUD operation helpers to eliminate code duplication across domains
 */
export function createCrudOperations<
  T,
  CreateData,
  UpdateData,
  ListFilters = JsonObject,
  ListResponse = T[]
>(
  commandBase: string,
  validator: (data: JsonValue) => T,
  cachePrefix: string
) {
  return {
    /**
     * Create a new entity
     */
    create: async (data: CreateData): Promise<T> => {
      const result = await safeInvoke<T>(commandBase, {
        request: {
          action: { action: 'Create', data }
        }
      } as unknown as JsonObject, ResponseHandlers.discriminatedUnion('Created', validator));
      invalidatePattern(`${cachePrefix}:`);
      return result;
    },

    /**
     * Get an entity by ID
     */
    get: (id: string): Promise<T | null> =>
      cachedInvoke(`${cachePrefix}:${id}`, commandBase, {
        request: {
          action: { action: 'Get', id }
        }
      }, ResponseHandlers.discriminatedUnionNullable('Found', validator)) as Promise<T | null>,

    /**
     * Update an existing entity
     */
    update: async (id: string, data: UpdateData): Promise<T> => {
      const result = await safeInvoke<T>(commandBase, {
        request: {
          action: { action: 'Update', id, data }
        }
      } as unknown as JsonObject, ResponseHandlers.discriminatedUnion('Updated', validator));
      invalidatePattern(`${cachePrefix}:`);
      return result;
    },

    /**
     * Delete an entity by ID
     */
    delete: async (id: string): Promise<void> => {
      await safeInvoke<void>(commandBase, {
        request: {
          action: { action: 'Delete', id }
        }
      });
      invalidatePattern(`${cachePrefix}:`);
    },

    /**
     * List entities with filters
     */
    list: (filters: Partial<ListFilters>): Promise<ListResponse> =>
      safeInvoke<ListResponse>(commandBase, {
        request: {
          action: { action: 'List', filters }
        }
      } as unknown as JsonObject, ResponseHandlers.list((data: JsonValue) => data as ListResponse)),

    /**
     * Get statistics for the entity type
     */
    statistics: (): Promise<JsonValue> =>
      safeInvoke(commandBase, {
        request: {
          action: { action: 'GetStatistics' }
        }
      }, ResponseHandlers.statistics()),
  };
}

/**
 * Helper for cache management in CRUD operations
 */
export const CacheHelpers = {
  /**
   * Invalidate cache for a specific domain
   */
  invalidateDomain: (domain: string) => invalidatePattern(`${domain}:`),

  /**
   * Invalidate cache for a specific entity
   */
  invalidateEntity: (domain: string, id: string) => invalidatePattern(`${domain}:${id}`),
};
