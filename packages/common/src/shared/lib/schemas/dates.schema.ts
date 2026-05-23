import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// ⚠️ COMMON MISTAKE: z.date() does NOT accept ISO strings
// APIs and databases return strings, not Date objects
// ─────────────────────────────────────────────────────────────

// ✅ Correct — coerce automatically converts to Date
export const DateSchema = z.coerce.date();

// ─────────────────────────────────────────────────────────────
// 📅 Practical range validations
// ─────────────────────────────────────────────────────────────
export const DateRangeSchema = z
  .object({
    // Minimum date: does not accept past dates
    scheduledAt: z.coerce
      .date()
      .min(new Date(), { message: "Date cannot be in the past" }),

    // Maximum date: at most 1 year in the future
    expiresAt: z.coerce.date().max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), {
      message: "Date cannot exceed 1 year from now",
    }),

    // Cross-field date range validation
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(
    // ✅ refine: cross-field validation between startDate and endDate
    (data) => data.endDate > data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"], // points to the field with the error
    },
  );

// ─────────────────────────────────────────────────────────────
// 🎂 Minimum age validation — very common in registration forms
// ─────────────────────────────────────────────────────────────
export const BirthDateSchema = z.coerce.date().refine(
  (date) => {
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    return date <= minAgeDate;
  },
  { message: "Must be at least 18 years old" },
);

// ─────────────────────────────────────────────────────────────
// 🔁 Reusable date utilities for Prisma nullable fields
// ─────────────────────────────────────────────────────────────
export const NullableDate = z.coerce.date().nullable(); // mirrors Prisma "?" field
export const OptionalDate = z.coerce.date().optional(); // API input body
export const NullishDate = z.coerce.date().nullish(); // PATCH partial updates

export type DateRangeInput = z.infer<typeof DateRangeSchema>;

// ─────────────────────────────────────────────────────────────
// ✅ Usage examples
// ─────────────────────────────────────────────────────────────

// Booking form
// const booking = DateRangeSchema.parse({
//   scheduledAt: "2026-06-01",
//   expiresAt: "2026-12-31",
//   startDate: "2026-06-01",
//   endDate: "2026-06-10",
// });

// Age gate
// const dob = BirthDateSchema.parse("1990-05-15"); // ✅ over 18
