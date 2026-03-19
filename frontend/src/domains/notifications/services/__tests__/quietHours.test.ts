import { isInQuietHoursAt } from '../quietHours';

describe('isInQuietHoursAt', () => {
  it('returns true when a timestamp falls within a cross-midnight range', () => {
    expect(
      isInQuietHoursAt(
        {
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        },
        new Date('2026-03-18T22:30:00+01:00').getTime(),
        'Europe/Paris',
      ),
    ).toBe(true);
  });

  it('returns false when quiet hours are disabled', () => {
    expect(
      isInQuietHoursAt(
        {
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        },
        Date.now(),
        'Europe/Paris',
      ),
    ).toBe(false);
  });
});
