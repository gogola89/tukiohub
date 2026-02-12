import { z } from 'zod';

/**
 * Validation schema for ticket transfer
 */
export const transferTicketSchema = z.object({
  new_attendee_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  new_attendee_email: z
    .string()
    .email('Invalid email address'),
  new_attendee_phone: z
    .string()
    .regex(/^\+254\d{9}$/, 'Phone number must start with +254 and be 13 characters (e.g., +254722334455)')
    .length(13, 'Phone number must be exactly 13 characters'),
});

export type TransferTicketData = z.infer<typeof transferTicketSchema>;

/**
 * Validation schema for ticket verification (ticket code)
 */
export const verifyTicketSchema = z.object({
  ticket_code: z
    .string()
    .min(1, 'Ticket code is required')
    .regex(/^TK-/, 'Invalid ticket code format (must start with TK-)'),
});

export type VerifyTicketData = z.infer<typeof verifyTicketSchema>;
