import {
  endOfMonth,
  endOfDay,
  startOfMonth,
  subMonths,
  startOfDay,
} from "date-fns";

export function getDateRangeFromPreset(
  preset: "this-month" | "last-month" | "all",
  customStart?: string,
  customEnd?: string
): { start?: Date; end?: Date } {
  const now = new Date();

  switch (preset) {
    case "this-month":
      return {
        start: startOfMonth(now),
        end: endOfDay(now),
      };
    case "last-month": {
      const last = subMonths(now, 1);
      return {
        start: startOfMonth(last),
        end: endOfMonth(last),
      };
    }
    case "all":
      if (customStart && customEnd) {
        return {
          start: startOfDay(new Date(customStart)),
          end: endOfDay(new Date(customEnd)),
        };
      }
      return {};
    default:
      return {};
  }
}
