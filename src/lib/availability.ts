export interface BusinessHourRow {
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start_time: string; // "09:00:00"
  end_time: string; // "17:00:00"
  is_closed: boolean;
}

export interface BlockedSlotRow {
  start_at: string; // ISO
  end_at: string; // ISO
}

export interface TakenSlotRow {
  start_at: string; // ISO
  end_at: string; // ISO
}

const SLOT_STEP_MINUTES = 30;
// Gap kept free between the end of one appointment and the start of the
// next, so Chanelle always has a moment to reset the room.
const BUFFER_MINUTES = 15;

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Computes bookable start times for a given calendar date and service
 * duration, given the weekly business hours plus any blocked slots / already
 * taken slots. Returns a list of Date objects (slot start times), in the
 * business's local time as constructed from the browser's local timezone.
 */
export function computeAvailableSlots({
  date,
  durationMinutes,
  businessHours,
  blockedSlots,
  takenSlots,
  now = new Date(),
}: {
  date: Date;
  durationMinutes: number;
  businessHours: BusinessHourRow[];
  blockedSlots: BlockedSlotRow[];
  takenSlots: TakenSlotRow[];
  now?: Date;
}): Date[] {
  const dayOfWeek = date.getDay();
  const hoursForDay = businessHours.find((h) => h.day_of_week === dayOfWeek);

  if (!hoursForDay || hoursForDay.is_closed) return [];

  const openMinutes = timeStringToMinutes(hoursForDay.start_time);
  const closeMinutes = timeStringToMinutes(hoursForDay.end_time);

  const blocked = blockedSlots.map((b) => ({
    start: new Date(b.start_at),
    end: new Date(b.end_at),
  }));
  const taken = takenSlots.map((t) => ({
    start: new Date(t.start_at),
    end: new Date(t.end_at),
  }));

  const slots: Date[] = [];

  for (
    let minutes = openMinutes;
    minutes + durationMinutes <= closeMinutes;
    minutes += SLOT_STEP_MINUTES
  ) {
    const slotStart = new Date(date);
    slotStart.setHours(0, 0, 0, 0);
    slotStart.setMinutes(minutes);

    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);
    const bufferedEnd = new Date(slotEnd.getTime() + BUFFER_MINUTES * 60_000);

    if (slotStart < now) continue;

    const clashesBlocked = blocked.some((b) => overlaps(slotStart, bufferedEnd, b.start, b.end));
    const clashesTaken = taken.some((t) => overlaps(slotStart, bufferedEnd, t.start, t.end));

    if (!clashesBlocked && !clashesTaken) {
      slots.push(slotStart);
    }
  }

  return slots;
}
