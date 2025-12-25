import type { TimeFormatResult } from '@/specs/002-mobile-battery-ui/contracts/time-format.types';

/**
 * Convert decimal hours to human-readable time format
 *
 * @param decimalHours - Backup time in decimal hours
 * @returns TimeFormatResult with both decimal and human-readable formats
 *
 * @example
 * formatTimeDisplay(3.456) // Returns "3 hours 27 minutes"
 * formatTimeDisplay(0.75)  // Returns "45 minutes"
 * formatTimeDisplay(0.01)  // Returns "< 1 minute"
 */
export function formatTimeDisplay(decimalHours: number): TimeFormatResult {
  // Edge case: Less than 1 minute (threshold: 0.0167 hours ≈ 1 minute)
  if (decimalHours < 0.0167) {
    return {
      decimalHours,
      hours: 0,
      minutes: 0,
      formatted: '< 1 minute',
      short: '< 1m',
    };
  }

  // Convert to total minutes and split into hours and minutes
  // Using Math.round ensures consistent rounding behavior
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Grammar handling: singular vs plural
  const hourText = hours === 1 ? 'hour' : 'hours';
  const minuteText = minutes === 1 ? 'minute' : 'minutes';

  // Build formatted string based on components present
  let formatted: string;
  if (hours === 0) {
    // Only minutes (e.g., "45 minutes")
    formatted = `${minutes} ${minuteText}`;
  } else if (minutes === 0) {
    // Only hours (e.g., "3 hours")
    formatted = `${hours} ${hourText}`;
  } else {
    // Both hours and minutes (e.g., "3 hours 27 minutes")
    formatted = `${hours} ${hourText} ${minutes} ${minuteText}`;
  }

  // Build compact/short format
  let short: string;
  if (hours === 0) {
    short = `${minutes}m`;
  } else if (minutes === 0) {
    short = `${hours}h`;
  } else {
    short = `${hours}h ${minutes}m`;
  }

  return {
    decimalHours,
    hours,
    minutes,
    formatted,
    short,
  };
}
