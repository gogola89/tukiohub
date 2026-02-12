import { z } from 'zod';

// Kenyan phone number validation (+254XXXXXXXXX)
const kenyanPhoneRegex = /^\+254[17]\d{8}$/;

export const attendeeFormSchema = z.object({
  attendee_name: z.string().min(2, 'Name must be at least 2 characters'),
  attendee_email: z.string().email('Invalid email address'),
  attendee_phone: z
    .string()
    .regex(kenyanPhoneRegex, 'Phone number must be in format +254XXXXXXXXX (e.g., +254722334455)'),
  notes: z.string().optional(),
});

export const promoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required').toUpperCase(),
});

export type AttendeeFormInput = z.infer<typeof attendeeFormSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
