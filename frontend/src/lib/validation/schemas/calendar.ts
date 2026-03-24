/**
 * Zod schemas for Calendar types
 *
 * These schemas validate IPC responses and form inputs at runtime.
 * The canonical type definitions come from the generated `@/lib/backend`
 * types (ADR-015).  The schemas here intentionally accept `number` for
 * timestamp fields because JSON serialisation (Tauri IPC) delivers JS
 * numbers, even though ts-rs maps Rust i64 to `bigint`.
 */

import { z } from 'zod';
import type {
  CalendarEvent,
  CreateEventInput,
  UpdateEventInput,
} from '@/types/calendar';

export const ParticipantStatusSchema = z.enum([
  'accepted',
  'declined',
  'tentative',
  'needsaction',
]);

export const EventTypeSchema = z.enum([
  'meeting',
  'appointment',
  'task',
  'reminder',
  'other',
]);

export const EventStatusSchema = z.enum([
  'confirmed',
  'tentative',
  'cancelled',
]);

export const EventParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  status: ParticipantStatusSchema,
});

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),

  // Temporal
  startDatetime: z.string(),
  endDatetime: z.string(),
  allDay: z.boolean(),
  timezone: z.string(),

  // Type and category
  eventType: EventTypeSchema,
  category: z.string().nullable(),

  // Relations
  taskId: z.string().nullable(),
  clientId: z.string().nullable(),
  technicianId: z.string().nullable(),

  // Meeting details
  location: z.string().nullable(),
  meetingLink: z.string().nullable(),
  isVirtual: z.boolean(),

  // Participants
  participants: z.array(EventParticipantSchema),

  // Recurrence
  isRecurring: z.boolean(),
  recurrenceRule: z.string().nullable(),
  parentEventId: z.string().nullable(),

  // Reminders (minutes before event)
  reminders: z.array(z.number()),

  // Status and metadata
  status: EventStatusSchema,
  color: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),

  // Sync and audit — accept number (JSON) even though TS type is bigint
  synced: z.boolean(),
  lastSyncedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  deletedAt: z.number().nullable(),
  deletedBy: z.string().nullable(),
});

export const CreateEventInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  startDatetime: z.string(),
  endDatetime: z.string(),
  allDay: z.boolean().nullable(),
  timezone: z.string().nullable(),
  eventType: EventTypeSchema.nullable(),
  category: z.string().nullable(),
  taskId: z.string().nullable(),
  clientId: z.string().nullable(),
  technicianId: z.string().nullable(),
  location: z.string().nullable(),
  meetingLink: z.string().nullable(),
  isVirtual: z.boolean().nullable(),
  participants: z.array(EventParticipantSchema).nullable(),
  reminders: z.array(z.number()).nullable(),
  color: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
});

export const UpdateEventInputSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  startDatetime: z.string().nullable(),
  endDatetime: z.string().nullable(),
  allDay: z.boolean().nullable(),
  timezone: z.string().nullable(),
  eventType: EventTypeSchema.nullable(),
  category: z.string().nullable(),
  taskId: z.string().nullable(),
  clientId: z.string().nullable(),
  location: z.string().nullable(),
  meetingLink: z.string().nullable(),
  isVirtual: z.boolean().nullable(),
  participants: z.array(EventParticipantSchema).nullable(),
  status: EventStatusSchema.nullable(),
  reminders: z.array(z.number()).nullable(),
  color: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
});

/**
 * Validates a CalendarEvent from an IPC response payload.
 * Throws a ZodError if the data does not match the expected shape.
 */
export function validateCalendarEvent(data: unknown): CalendarEvent {
  return CalendarEventSchema.parse(data) as unknown as CalendarEvent;
}

/**
 * Validates an array of CalendarEvents from an IPC response payload.
 * Throws a ZodError if the data does not match the expected shape.
 */
export function validateCalendarEventList(data: unknown): CalendarEvent[] {
  return z.array(CalendarEventSchema).parse(data) as unknown as CalendarEvent[];
}

/**
 * Validates a CreateEventInput before sending to the backend.
 * Throws a ZodError if the input does not match the expected shape.
 */
export function validateCreateEventInput(data: unknown): CreateEventInput {
  return CreateEventInputSchema.parse(data) as unknown as CreateEventInput;
}

/**
 * Validates an UpdateEventInput before sending to the backend.
 * Throws a ZodError if the input does not match the expected shape.
 */
export function validateUpdateEventInput(data: unknown): UpdateEventInput {
  return UpdateEventInputSchema.parse(data) as unknown as UpdateEventInput;
}
