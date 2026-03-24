// Re-export calendar types from the generated backend definitions (ADR-015).
// Do NOT add handwritten interfaces here — edit the Rust source instead.
export type {
  CalendarEvent,
  EventType,
  EventStatus,
  EventParticipant,
  ParticipantStatus,
  CreateEventInput,
  UpdateEventInput,
} from '@/lib/backend';