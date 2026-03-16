import { safeInvoke, invalidatePattern }from '@/lib/ipc/core';
import { signalMutation } from '@/lib/data-freshness';
import { IPC_COMMANDS } from '@/lib/ipc/commands';
import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@/types/calendar';
import type { JsonObject } from '@/types/json';

export const calendarIpc = {
  getEvents: (startDate: string, endDate: string, technicianId?: string): Promise<CalendarEvent[]> =>
    safeInvoke<CalendarEvent[]>(IPC_COMMANDS.GET_EVENTS, {
      start_date: startDate,
      end_date: endDate,
      technician_id: technicianId
    }),

  getEventById: (id: string): Promise<CalendarEvent | null> =>
    safeInvoke<CalendarEvent | null>(IPC_COMMANDS.GET_EVENT_BY_ID, { request: { id } }),

  createEvent: async (eventData: CreateEventInput): Promise<CalendarEvent> => {
    const result = await safeInvoke<CalendarEvent>(IPC_COMMANDS.CREATE_EVENT, { request: { event_data: eventData as unknown as JsonObject } });
    invalidatePattern('calendar:');
    signalMutation('calendar');
    return result;
  },

  updateEvent: async (id: string, eventData: UpdateEventInput): Promise<CalendarEvent> => {
    const result = await safeInvoke<CalendarEvent>(IPC_COMMANDS.UPDATE_EVENT, { request: { id, event_data: eventData as unknown as JsonObject } });
    invalidatePattern('calendar:');
    signalMutation('calendar');
    return result;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await safeInvoke<void>(IPC_COMMANDS.DELETE_EVENT, { request: { id } });
    invalidatePattern('calendar:');
    signalMutation('calendar');
  },

  getEventsForTechnician: (technicianId: string): Promise<CalendarEvent[]> =>
    safeInvoke<CalendarEvent[]>(IPC_COMMANDS.GET_EVENTS_FOR_TECHNICIAN, { request: { technician_id: technicianId } }),

  getEventsForTask: (taskId: string): Promise<CalendarEvent[]> =>
    safeInvoke<CalendarEvent[]>(IPC_COMMANDS.GET_EVENTS_FOR_TASK, { request: { task_id: taskId } }),
};
