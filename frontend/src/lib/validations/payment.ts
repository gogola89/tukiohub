import { z } from 'zod';

// Phone number must be in format +254XXXXXXXXX (Kenyan format)
const kenyaPhoneRegex = /^\+254\d{9}$/;

export const paymentSchema = z.object({
  phone_number: z
    .string()
    .min(13, 'Phone number must be 13 characters')
    .max(13, 'Phone number must be 13 characters')
    .regex(kenyaPhoneRegex, 'Phone number must start with +254 and be 13 characters total'),
  amount: z.number().positive('Amount must be greater than 0'),
  account_reference: z.string().min(1, 'Booking reference is required'),
});

export const initiatePaymentSchema = z.object({
  phone_number: z
    .string()
    .min(13, 'Phone number must be 13 characters')
    .max(13, 'Phone number must be 13 characters')
    .regex(kenyaPhoneRegex, 'Phone number must start with +254 and be 13 characters total (e.g., +254722334455)'),
  amount: z.number().positive('Amount must be greater than 0'),
  account_reference: z.string().min(1, 'Booking reference is required'),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
export type InitiatePaymentData = z.infer<typeof initiatePaymentSchema>;
