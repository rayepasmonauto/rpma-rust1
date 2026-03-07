/**
 * Barrel re-export for quote hooks.
 *
 * The individual hooks have been split into focused modules:
 * - useQuotesCrud.ts      → list, get, create, update, delete
 * - useQuoteItems.ts      → item add/update/delete
 * - useQuoteStatus.ts     → status transitions (sent, accepted, rejected…)
 * - useQuoteOperations.ts → duplicate, export PDF, convert to task
 * - useQuoteAttachments.ts→ attachment CRUD
 */

export { useQuotesList, useQuote, useCreateQuote, useUpdateQuote, useDeleteQuote } from './useQuotesCrud';
export type { UseQuotesListOptions } from './useQuotesCrud';
export { useQuoteItems } from './useQuoteItems';
export { useQuoteStatus } from './useQuoteStatus';
export { useDuplicateQuote, useQuoteExportPdf, useConvertQuoteToTask } from './useQuoteOperations';
export { useQuoteAttachments, useQuoteAttachmentActions } from './useQuoteAttachments';
