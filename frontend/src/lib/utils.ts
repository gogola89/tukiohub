import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to Kenyan format (dd/mm/yyyy)
 */
export function formatDateKE(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}

/**
 * Format datetime to Kenyan format (dd/mm/yyyy HH:mm)
 */
export function formatDateTimeKE(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm');
}

/**
 * Format time only (HH:mm)
 */
export function formatTimeKE(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Convert an ISO datetime string (with any timezone offset, e.g. "+03:00")
 * to the local-time value an <input type="datetime-local"> expects
 * ("yyyy-MM-ddTHH:mm"). The input rejects any value carrying a timezone
 * designator, so a plain string slice isn't safe once the API returns
 * anything other than a bare "Z" suffix.
 */
export function toDatetimeLocalInput(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "yyyy-MM-dd'T'HH:mm");
}
