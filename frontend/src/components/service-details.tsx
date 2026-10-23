"use client";

import { useFormContext } from "react-hook-form";
import { Check, ClipboardList, Mic2, Users } from "lucide-react";
import {
  crewRoles,
  performerTypes,
  planningServices,
} from "@event-manager/shared";
import type { FormValues } from "@/lib/form";
import { InputField, SelectField } from "./form-fields";

export function ServiceDetails() {
  const { watch, setValue, getFieldState, formState } =
    useFormContext<FormValues>();
  const category = watch("category");
  const services = watch("details.services");
  const roles = watch("details.roles");
  const error = getFieldState(
    category === "planner" ? "details.services" : "details.roles",
    formState,
  ).error;

  if (category === "planner")
    return (
      <section className="form-section">
        <div className="section-label">
          <ClipboardList size={17} />
          <h2>A little help, or the whole plan</h2>
        </div>
        <fieldset aria-describedby={error ? "services-error" : undefined}>
          <legend>What do you need help with?</legend>
          <p className="section-description">
            Select all the services you’re looking for.
          </p>
          <div className="option-list">
            {planningServices.map((service) => (
              <label
                className={`check-option ${services.includes(service) ? "checked" : ""}`}
                key={service}
              >
                <input
                  type="checkbox"
                  checked={services.includes(service)}
                  onChange={(event) =>
                    setValue(
                      "details.services",
                      event.target.checked
                        ? [...services, service]
                        : services.filter((item) => item !== service),
                    )
                  }
                />
                <span className="custom-check">
                  {services.includes(service) && <Check size={13} />}
                </span>
                <span>{service}</span>
              </label>
            ))}
          </div>
          {error && (
            <p className="field-error" id="services-error" role="alert">
              {error.message}
            </p>
          )}
        </fieldset>
        <InputField
          name="details.guestCount"
          label="Estimated guest count"
          type="number"
          placeholder="e.g. 200"
          min={1}
          max={100000}
          hint="An estimate is absolutely fine."
        />
      </section>
    );

  if (category === "performer")
    return (
      <section className="form-section">
        <div className="section-label">
          <Mic2 size={17} />
          <h2>Set the mood</h2>
        </div>
        <SelectField
          name="details.performerType"
          label="Type of performer"
          placeholder="Choose your kind of entertainment"
          options={performerTypes}
        />
        <InputField
          name="details.performerCount"
          label="Number of performers"
          type="number"
          placeholder="e.g. 4"
          min={1}
          max={500}
          hint="For a band or group, enter the total number of people."
        />
        <div className="inline-note">
          The right talent makes all the difference. You can add music
          preferences and special requests in the next step.
        </div>
      </section>
    );

  return (
    <section className="form-section">
      <div className="section-label">
        <Users size={17} />
        <h2>Your behind-the-scenes team</h2>
      </div>
      <fieldset aria-describedby={error ? "roles-error" : undefined}>
        <legend>Which crew roles do you need?</legend>
        <p className="section-description">
          Choose your roles and the number of people for each.
        </p>
        <div className="option-list">
          {crewRoles.map((role) => {
            const index = roles.findIndex((item) => item.role === role);
            const selected = index !== -1;
            return (
              <div
                className={`crew-option ${selected ? "checked" : ""}`}
                key={role}
              >
                <label className="crew-label">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) =>
                      setValue(
                        "details.roles",
                        event.target.checked
                          ? [...roles, { role, count: 1 }]
                          : roles.filter((item) => item.role !== role),
                      )
                    }
                  />
                  <span className="custom-check">
                    {selected && <Check size={13} />}
                  </span>
                  <span>{role}</span>
                </label>
                {selected && (
                  <InputField
                    name={`details.roles.${index}.count`}
                    label={`${role} people`}
                    type="number"
                    min={1}
                    max={1000}
                  />
                )}
              </div>
            );
          })}
        </div>
        {error && (
          <p className="field-error" id="roles-error" role="alert">
            {error.message}
          </p>
        )}
      </fieldset>
    </section>
  );
}
