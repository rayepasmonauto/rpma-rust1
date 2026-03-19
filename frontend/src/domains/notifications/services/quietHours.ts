import type { UserNotificationSettings } from '@/lib/backend';

const DEFAULT_TIMEZONE = 'Europe/Paris';

function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

function getMinutesInTimezone(timestampMillis: number, timezone?: string): number | null {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(timestampMillis));
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

export function isInQuietHoursAt(
  settings: Pick<UserNotificationSettings, 'quiet_hours_enabled' | 'quiet_hours_start' | 'quiet_hours_end'>,
  timestampMillis: number,
  timezone?: string,
): boolean {
  if (!settings.quiet_hours_enabled) {
    return false;
  }

  const start = parseTime(settings.quiet_hours_start);
  const end = parseTime(settings.quiet_hours_end);
  const current = getMinutesInTimezone(timestampMillis, timezone);

  if (!start || !end || current === null) {
    return false;
  }

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  if (startMinutes <= endMinutes) {
    return current >= startMinutes && current <= endMinutes;
  }

  return current >= startMinutes || current <= endMinutes;
}
