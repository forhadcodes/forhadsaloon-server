import { SALON_TIMEZONE } from "../config/constants.js";
import { ApiError } from "./apiError.js";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" for today in the salon's time zone (not the server's). */
export function salonToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Validates and normalises a YYYY-MM-DD string. */
export function parseDateOnly(value: unknown): string {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format");
  }

  const [year, month, day] = value.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new ApiError(400, "Invalid calendar date");
  }

  return value;
}

/** Appointment dates are stored as a Date at UTC midnight. */
export function dateOnlyToUtcMidnight(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function assertTodayOrFuture(value: string): void {
  if (value < salonToday()) {
    throw new ApiError(400, "Appointment date must be today or later");
  }
}
