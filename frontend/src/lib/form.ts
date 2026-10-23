import {
  basicsSchema,
  budgetStepSchema,
  crewDetailsSchema,
  performerDetailsSchema,
  plannerDetailsSchema,
  requirementSchema,
  type Category,
  type RequirementInput,
} from "@event-manager/shared";

export type FormValues = {
  category: Category;
  event: {
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    location: string;
    venue: string;
  };
  details: {
    services: string[];
    guestCount?: number;
    performerType: string;
    performerCount?: number;
    durationMinutes?: number;
    equipment: string;
    roles: { role: string; count: number }[];
    shiftHours?: number;
  };
  budget: { min?: number; max?: number; currency: "INR" };
  notes: string;
};

export const emptyDetails: FormValues["details"] = {
  services: [],
  performerType: "",
  equipment: "",
  roles: [],
};
export const defaultValues: FormValues = {
  category: "planner",
  event: {
    name: "",
    type: "",
    startDate: "",
    endDate: "",
    location: "",
    venue: "",
  },
  details: emptyDetails,
  budget: { currency: "INR" },
  notes: "",
};

export const categories = {
  planner: {
    label: "Event Planner",
    short: "Planner",
    description: "Someone to bring it all together",
    note: "Share your theme, planning priorities, or anything that would help a planner understand your vision.",
  },
  performer: {
    label: "Performer",
    short: "Performer",
    description: "Talent that makes it memorable",
    note: "Share your preferred genre, audience, performance schedule, or any special requests.",
  },
  crew: {
    label: "Crew",
    short: "Crew",
    description: "The people behind a smooth event",
    note: "Share reporting times, dress code, setup needs, or anything your crew should know.",
  },
};

export function getPayload(values: FormValues) {
  const { category, event, budget, notes, details } = values;
  const common = { category, event, budget, notes };
  if (category === "planner")
    return {
      ...common,
      details: { services: details.services, guestCount: details.guestCount },
    };
  if (category === "performer")
    return {
      ...common,
      details: {
        performerType: details.performerType,
        performerCount: details.performerCount,
        durationMinutes: details.durationMinutes,
        equipment: details.equipment,
      },
    };
  return {
    ...common,
    details: { roles: details.roles, shiftHours: details.shiftHours },
  };
}

export function validateStep(step: number, values: FormValues) {
  if (step === 0) return basicsSchema.safeParse(values);
  if (step === 1) {
    const schema =
      values.category === "planner"
        ? plannerDetailsSchema
        : values.category === "performer"
          ? performerDetailsSchema.pick({
              performerType: true,
              performerCount: true,
            })
          : crewDetailsSchema.pick({ roles: true });
    const result = schema.safeParse(stepDetails(values));
    if (!result.success)
      result.error.issues.forEach((issue) => issue.path.unshift("details"));
    return result;
  }
  if (step === 2) {
    const budget = budgetStepSchema.safeParse(values);
    if (!budget.success) return budget;
  }
  return requirementSchema.safeParse(getPayload(values));
}

function stepDetails(values: FormValues) {
  if (values.category === "planner")
    return {
      services: values.details.services,
      guestCount: values.details.guestCount,
    };
  if (values.category === "performer")
    return {
      performerType: values.details.performerType,
      performerCount: values.details.performerCount,
    };
  return { roles: values.details.roles };
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatBudget(budget: RequirementInput["budget"]) {
  const rupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  return `${rupees.format(budget.min)} – ${rupees.format(budget.max)}`;
}
