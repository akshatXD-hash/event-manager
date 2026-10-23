import { z } from "zod";

export const eventTypes = [
  "Wedding",
  "Corporate event",
  "Birthday",
  "Concert",
  "Festival",
  "Private party",
  "Other",
] as const;
export const planningServices = [
  "Full event planning",
  "Venue sourcing",
  "Decor & styling",
  "Vendor coordination",
  "On-the-day coordination",
] as const;
export const performerTypes = [
  "DJ",
  "Live band",
  "Singer",
  "Dancer",
  "Emcee",
  "Magician",
  "Other",
] as const;
export const crewRoles = [
  "Photography",
  "Videography",
  "Sound & lighting",
  "Event setup",
  "Hospitality",
  "Security",
] as const;
export const equipmentOptions = [
  "Provided at venue",
  "Bring own equipment",
  "To be discussed",
] as const;
export const categorySchema = z.enum(["planner", "performer", "crew"]);
export type Category = z.infer<typeof categorySchema>;

const shortText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(2, `${label} must have at least 2 characters`)
    .max(max, `Keep ${label.toLowerCase()} under ${max} characters`);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Choose a valid date");
const count = (label: string, max: number) =>
  z
    .number({ error: `Enter ${label.toLowerCase()}` })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} must be ${max} or fewer`);

export const eventSchema = z
  .object({
    name: shortText("Event name"),
    type: z.enum(eventTypes, { error: "Choose an event type" }),
    startDate: date,
    endDate: date,
    location: shortText("Location"),
    venue: z.string().trim().max(160).optional().default(""),
  })
  .strict()
  .refine((event) => event.endDate >= event.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });

export const plannerDetailsSchema = z
  .object({
    services: z
      .array(z.enum(planningServices))
      .min(1, "Select at least one service")
      .max(planningServices.length),
    guestCount: count("Guest count", 100000),
  })
  .strict();
export const performerDetailsSchema = z
  .object({
    performerType: z.enum(performerTypes, { error: "Choose a performer type" }),
    performerCount: count("Performer count", 500),
    durationMinutes: count("Duration", 1440),
    equipment: z.enum(equipmentOptions, {
      error: "Choose an equipment arrangement",
    }),
  })
  .strict();
export const crewDetailsSchema = z
  .object({
    roles: z
      .array(
        z
          .object({ role: z.enum(crewRoles), count: count("Crew count", 1000) })
          .strict(),
      )
      .min(1, "Select at least one crew role")
      .max(crewRoles.length)
      .refine(
        (roles) =>
          new Set(roles.map((item) => item.role)).size === roles.length,
        "Each crew role should appear only once",
      ),
    shiftHours: z
      .number({ error: "Enter a shift duration" })
      .min(1, "Shift must be at least 1 hour")
      .max(24, "Shift must be 24 hours or less"),
  })
  .strict();

export const budgetSchema = z
  .object({
    min: z
      .number({ error: "Enter a minimum budget" })
      .int()
      .min(0, "Budget cannot be negative")
      .max(100000000),
    max: z
      .number({ error: "Enter a maximum budget" })
      .int()
      .min(1, "Enter a budget greater than zero")
      .max(100000000),
    currency: z.literal("INR"),
  })
  .strict()
  .refine((budget) => budget.max >= budget.min, {
    path: ["max"],
    message: "Maximum budget must be at least the minimum",
  });

const common = {
  event: eventSchema,
  budget: budgetSchema,
  notes: z
    .string()
    .trim()
    .max(2000, "Keep notes under 2,000 characters")
    .default(""),
};

export const requirementSchema = z.discriminatedUnion("category", [
  z
    .object({
      ...common,
      category: z.literal("planner"),
      details: plannerDetailsSchema,
    })
    .strict(),
  z
    .object({
      ...common,
      category: z.literal("performer"),
      details: performerDetailsSchema,
    })
    .strict(),
  z
    .object({
      ...common,
      category: z.literal("crew"),
      details: crewDetailsSchema,
    })
    .strict(),
]);
export type RequirementInput = z.infer<typeof requirementSchema>;
export const basicsSchema = z.object({
  event: eventSchema,
  category: categorySchema,
});
export const budgetStepSchema = z.object({
  budget: budgetSchema,
  notes: common.notes,
});
