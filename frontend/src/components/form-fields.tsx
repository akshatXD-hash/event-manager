"use client";

import { type ReactNode } from "react";
import { useFormContext, type FieldPath } from "react-hook-form";
import type { FormValues } from "@/lib/form";

type FieldProps = {
  name: FieldPath<FormValues>;
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

export function Field({ name, label, hint, optional, children }: FieldProps) {
  const { getFieldState, formState } = useFormContext<FormValues>();
  const error = getFieldState(name, formState).error;
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={name}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {error?.message ? (
        <p className="field-error" id={`${name}-error`} role="alert">
          {error.message}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = {
  name: FieldPath<FormValues>;
  label: string;
  placeholder?: string;
  type?: string;
  optional?: boolean;
  hint?: string;
  min?: number | string;
  max?: number;
  step?: number;
  maxLength?: number;
};

export function InputField({
  name,
  label,
  optional,
  hint,
  ...props
}: InputProps) {
  const { register, getFieldState, formState } = useFormContext<FormValues>();
  const error = getFieldState(name, formState).error;
  return (
    <Field name={name} label={label} optional={optional} hint={hint}>
      <input
        id={name}
        {...props}
        {...register(name, {
          ...(props.type === "number"
            ? {
                setValueAs: (value: string) =>
                  value === "" ? undefined : Number(value),
              }
            : {}),
        })}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${name}-error` : hint ? `${name}-hint` : undefined
        }
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  placeholder = "Select an option",
}: {
  name: FieldPath<FormValues>;
  label: string;
  options: readonly string[];
  placeholder?: string;
}) {
  const { register, getFieldState, formState } = useFormContext<FormValues>();
  const error = getFieldState(name, formState).error;
  return (
    <Field name={name} label={label}>
      <select
        id={name}
        {...register(name)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </Field>
  );
}
