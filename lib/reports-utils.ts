import type { DatePreset, DateRange } from "@/lib/actions/reports";

export function deriveDateRange(
  preset: DatePreset,
  customRange: DateRange,
): DateRange {
  const now = new Date();
  if (preset === "today") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: now,
    };
  }
  if (preset === "yesterday") {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return {
      start: y,
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }
  if (preset === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
    };
  }
  if (preset === "year") {
    return { start: new Date(now.getFullYear(), 0, 1), end: now };
  }
  return customRange;
}
