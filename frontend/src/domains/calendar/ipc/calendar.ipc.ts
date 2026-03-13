import { safeInvoke } from '@/lib/ipc/core';
import type { CreateEventInput, UpdateEventInput } from '@/types/calendar';
import type { JsonObject } from '@/types/json';

export const calendarIpc = {
  getEvents: (startDate: string, endDate: string, technicianId?: string) =>
    safeInvoke('get_events', {
      start_date: startDate,
      end_date: endDate,
      technician_id: technicianId
    }),

  getEventById: (id: string) =>
    safeInvoke('get_event_by_id', { request: { id } }),

  createEvent: (eventData: CreateEventInput) =>
    safeInvoke('create_event', { request: { event_data: eventData as unknown as JsonObject } }),

  updateEvent: (id: string, eventData: UpdateEventInput) =>
    safeInvoke('update_event', { request: { id, event_data: eventData as unknown as JsonObject } }),

  deleteEvent: (id: string) =>
    safeInvoke('delete_event', { request: { id } }),

  getEventsForTechnician: (technicianId: string) =>
    safeInvoke('get_events_for_technician', { request: { technician_id: technicianId } }),

  getEventsForTask: (taskId: string) =>
    safeInvoke('get_events_for_task', { request: { task_id: taskId } }),
};
