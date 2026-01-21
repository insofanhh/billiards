import type { Table } from '../types';

export const getCurrentPriceRate = (rates: Table['table_type']['price_rates'] | undefined) => {
  if (!rates || rates.length === 0) return undefined;

  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;

  // Filter active rates
  const activeRates = rates.filter(rate => rate.active);

  // Filter by validity
  const validRates = activeRates.filter(rate => {
    const hasDayConstraint = rate.day_of_week && rate.day_of_week.length > 0;
    const hasTimeConstraint = !!(rate.start_time && rate.end_time);

    if (!hasTimeConstraint) {
      // Only day constraint
      if (hasDayConstraint) {
        return rate.day_of_week!.includes(currentDay.toString());
      }
      return true;
    }

    const start = rate.start_time!;
    const end = rate.end_time!;

    if (start <= end) {
      // Standard range (e.g. 08:00 - 22:00)
      // Must be today AND within time
      if (hasDayConstraint && !rate.day_of_week!.includes(currentDay.toString())) return false;
      return currentTimeStr >= start && currentTimeStr <= end;
    } else {
      // Overnight range (e.g. 18:00 - 06:00)
      // Valid if:
      // 1. Today is valid AND time >= start
      // 2. Yesterday was valid AND time <= end

      const matchesStart = currentTimeStr >= start;
      const matchesEnd = currentTimeStr <= end;

      if (matchesStart) {
        if (hasDayConstraint && !rate.day_of_week!.includes(currentDay.toString())) return false;
        return true;
      }
      if (matchesEnd) {
        if (hasDayConstraint) {
          const prevDay = (currentDay + 6) % 7;
          if (!rate.day_of_week!.includes(prevDay.toString())) return false;
        }
        return true;
      }
      return false;
    }
  });

  // Sort by priority desc, then id asc
  validRates.sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    if (priorityB !== priorityA) return priorityB - priorityA;
    return a.id - b.id;
  });

  return validRates[0];
};
