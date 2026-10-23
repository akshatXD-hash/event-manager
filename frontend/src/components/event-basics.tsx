"use client";

import { useFormContext } from "react-hook-form";
import {
  CalendarDays,
  Check,
  ClipboardList,
  MapPin,
  Mic2,
  Users,
} from "lucide-react";
import { eventTypes, type Category } from "@event-manager/shared";
import { categories, emptyDetails, type FormValues } from "@/lib/form";
import { InputField, SelectField } from "./form-fields";

const icons = { planner: ClipboardList, performer: Mic2, crew: Users };

export function EventBasics({
  dateRange,
  setDateRange,
}: {
  dateRange: boolean;
  setDateRange: (value: boolean) => void;
}) {
  const { watch, setValue, clearErrors } = useFormContext<FormValues>();
  const category = watch("category");
  const startDate = watch("event.startDate");

  function chooseCategory(next: Category) {
    if (category === next) return;
    setValue("category", next);
    setValue("details", { ...emptyDetails, services: [], roles: [] });
    clearErrors("details");
  }

  return (
    <>
      <section className="form-section">
        <div className="section-label">
          <CalendarDays size={17} />
          <h2>The occasion</h2>
        </div>
        <InputField
          name="event.name"
          label="Event name"
          placeholder="e.g. The Mehta wedding"
          maxLength={120}
        />
        <SelectField
          name="event.type"
          label="Event type"
          options={eventTypes}
          placeholder="What are you celebrating?"
        />
        <div className="date-label">
          <span>When is it happening?</span>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={dateRange}
              onChange={(event) => {
                setDateRange(event.target.checked);
                if (!event.target.checked) setValue("event.endDate", startDate);
              }}
            />
            Multiple days
          </label>
        </div>
        <div className={dateRange ? "field-grid" : ""}>
          <InputField
            name="event.startDate"
            label={dateRange ? "Start date" : "Event date"}
            type="date"
          />
          {dateRange && (
            <InputField
              name="event.endDate"
              label="End date"
              type="date"
              min={startDate}
            />
          )}
        </div>
      </section>
      <section className="form-section">
        <div className="section-label">
          <MapPin size={17} />
          <h2>The setting</h2>
        </div>
        <div className="field-grid">
          <InputField
            name="event.location"
            label="City / location"
            placeholder="e.g. Mumbai, Maharashtra"
            maxLength={120}
          />
          <InputField
            name="event.venue"
            label="Venue"
            placeholder="Have a place in mind?"
            optional
            maxLength={160}
          />
        </div>
      </section>
      <section className="form-section category-section">
        <fieldset>
          <legend>Who are you looking for?</legend>
          <p className="section-description">
            Choose one category for this requirement.
          </p>
          <div className="category-grid">
            {(Object.keys(categories) as Category[]).map((key) => {
              const Icon = icons[key];
              return (
                <label
                  key={key}
                  className={`category-card ${category === key ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={category === key}
                    onChange={() => chooseCategory(key)}
                  />
                  <span className="category-icon">
                    <Icon size={23} strokeWidth={1.7} />
                  </span>
                  <span className="category-check">
                    {category === key && <Check size={11} strokeWidth={3} />}
                  </span>
                  <strong>{categories[key].label}</strong>
                  <span className="category-description">
                    {categories[key].description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>
    </>
  );
}
