import { z } from 'zod';

// Backend categories
export const eventCategories = [
  'MUSIC',
  'SPORTS',
  'BUSINESS',
  'ENTERTAINMENT',
  'CONFERENCE',
  'WORKSHOP',
  'FESTIVAL',
  'CHARITY',
  'NETWORKING',
  'OTHER',
] as const;

// Event creation schema - multi-step form
export const eventBasicInfoSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: z.enum(eventCategories, {
    message: 'Please select a category',
  }),
});

export const eventDateLocationSchema = z
  .object({
    start_datetime: z.string().min(1, 'Start date and time is required'),
    end_datetime: z.string().min(1, 'End date and time is required'),
    is_online: z.boolean().default(false),
    venue_name: z.string().optional(),
    venue_address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    online_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_datetime);
      const end = new Date(data.end_datetime);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['end_datetime'],
    }
  )
  .refine(
    (data) => {
      if (!data.is_online) {
        return !!(data.venue_name && data.venue_name.trim() &&
                  data.venue_address && data.venue_address.trim());
      }
      return true;
    },
    {
      message: 'Venue name and address are required for in-person events',
      path: ['venue_name'],
    }
  )
  .refine(
    (data) => {
      if (data.is_online) {
        return !!(data.online_url && data.online_url.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Online URL is required for online events',
      path: ['online_url'],
    }
  );

export const eventCapacitySettingsSchema = z.object({
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(1000000, 'Capacity seems too high'),
});

// Combined event creation schema
export const createEventSchema = eventBasicInfoSchema
  .merge(eventDateLocationSchema)
  .merge(eventCapacitySettingsSchema);

// Ticket type schema
export const ticketTypeSchema = z
  .object({
    name: z.string().min(1, 'Ticket name is required').max(100),
    description: z.string().max(500, 'Description too long').optional(),
    price: z
      .number()
      .min(0, 'Price cannot be negative')
      .max(10000000, 'Price seems too high'),
    quantity_available: z
      .number()
      .min(1, 'Must have at least 1 ticket available')
      .max(1000000),
    sales_start_date: z.string().min(1, 'Sales start date is required'),
    sales_end_date: z.string().min(1, 'Sales end date is required'),
    min_purchase: z.number().min(1, 'Minimum must be at least 1').max(100).default(1),
    max_purchase: z.number().min(1, 'Maximum must be at least 1').max(100).default(10),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const start = new Date(data.sales_start_date);
      const end = new Date(data.sales_end_date);
      return end > start;
    },
    {
      message: 'Sales end date must be after start date',
      path: ['sales_end_date'],
    }
  )
  .refine(
    (data) => {
      return data.max_purchase >= data.min_purchase;
    },
    {
      message: 'Maximum purchase must be greater than or equal to minimum',
      path: ['max_purchase'],
    }
  );

// Promo code schema
export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
    discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discount_value: z.number().min(0, 'Discount value must be positive'),
    valid_from: z.string().min(1, 'Valid from date is required'),
    valid_until: z.string().min(1, 'Valid until date is required'),
    usage_limit: z.number().min(1, 'Usage limit must be at least 1'),
    min_purchase_amount: z.number().min(0).optional(),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const from = new Date(data.valid_from);
      const until = new Date(data.valid_until);
      return until > from;
    },
    {
      message: 'Valid until date must be after valid from date',
      path: ['valid_until'],
    }
  )
  .refine(
    (data) => {
      if (data.discount_type === 'PERCENTAGE') {
        return data.discount_value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    }
  );

// Event add-on schema
export const eventAddonSchema = z.object({
  name: z.string().min(1, 'Add-on name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  quantity_available: z.number().min(1, 'Must have at least 1 available'),
  is_required: z.boolean().default(false),
});

export type EventBasicInfo = z.infer<typeof eventBasicInfoSchema>;
export type EventDateLocation = z.infer<typeof eventDateLocationSchema>;
export type EventCapacitySettings = z.infer<typeof eventCapacitySettingsSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
export type EventAddonInput = z.infer<typeof eventAddonSchema>;
