"use client";

import { useFormContext } from "react-hook-form";
import { Clock3, IndianRupee, MessageSquare } from "lucide-react";
import { equipmentOptions } from "@event-manager/shared";
import { categories, type FormValues } from "@/lib/form";
import { Field, InputField, SelectField } from "./form-fields";

export function BudgetDetails() {
  const { register, watch, getFieldState, formState } =
    useFormContext<FormValues>();
  const category = watch("category");
  const notes = watch("notes");
  const notesError = getFieldState("notes", formState).error;
  return (
    <>
      {category !== "planner" && (
        <section className="form-section">
          <div className="section-label">
            <Clock3 size={17} />
            <h2>
              {category === "performer" ? "The performance" : "On the day"}
            </h2>
          </div>
          {category === "performer" ? (
            <>
              <InputField
                name="details.durationMinutes"
                label="Performance duration (minutes)"
                type="number"
                placeholder="e.g. 90"
                min={1}
                max={1440}
              />
              <SelectField
                name="details.equipment"
                label="Sound & equipment"
                options={equipmentOptions}
              />
            </>
          ) : (
            <InputField
              name="details.shiftHours"
              label="Shift duration per person (hours)"
              type="number"
              placeholder="e.g. 8"
              min={1}
              max={24}
              step={0.5}
            />
          )}
        </section>
      )}
      <section className="form-section">
        <div className="section-label">
          <IndianRupee size={17} />
          <h2>A budget that works for you</h2>
        </div>
        <p className="section-description">
          Your total budget for this {categories[category].short.toLowerCase()}{" "}
          requirement, in Indian rupees.
        </p>
        <div className="field-grid">
          <InputField
            name="budget.min"
            label="Minimum budget (₹)"
            type="number"
            placeholder="e.g. 20,000"
            min={0}
            max={100000000}
          />
          <InputField
            name="budget.max"
            label="Maximum budget (₹)"
            type="number"
            placeholder="e.g. 50,000"
            min={1}
            max={100000000}
          />
        </div>
        <div className="inline-note">
          A realistic range helps set clear expectations. This is an estimate,
          not a payment.
        </div>
      </section>
      <section className="form-section">
        <div className="section-label">
          <MessageSquare size={17} />
          <h2>The little details matter</h2>
        </div>
        <Field name="notes" label="Anything else we should know?" optional>
          <textarea
            id="notes"
            rows={5}
            maxLength={2000}
            placeholder={categories[category].note}
            {...register("notes")}
            aria-invalid={!!notesError}
            aria-describedby={notesError ? "notes-error" : "notes-count"}
          />
        </Field>
        <p className="character-count" id="notes-count">
          {notes.length.toLocaleString()} / 2,000
        </p>
      </section>
    </>
  );
}
