"use client";

import { type InputHTMLAttributes, type ReactNode, useState } from "react";
import { cn } from "@/lib/cn";

/** Pill text input (Idopontfoglalas / Belepes `.inp`). `tone="white"` on tinted wells. */
export function inputClassName({
  invalid = false,
  tone = "field",
  className,
}: {
  invalid?: boolean;
  tone?: "field" | "white";
  className?: string;
} = {}): string {
  return cn(
    "h-[54px] w-full min-w-0 rounded-full border-[1.5px] px-[22px] text-[15px] font-semibold text-navy",
    "transition-[border-color,box-shadow,background-color] duration-[250ms]",
    "placeholder:font-medium placeholder:text-[#6b7280]",
    "hover:border-[#b9bfd3] focus:border-navy focus:bg-white focus:shadow-[0_0_0_4px_rgba(118,200,182,.35)] focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-60",
    tone === "white" ? "bg-white" : "bg-field",
    invalid ? "border-danger hover:border-danger" : "border-line",
    className,
  );
}

interface FieldShellProps {
  id: string;
  label: ReactNode;
  /** Shown on the right of the label row (e.g. "Elfelejtett jelszó?"). */
  labelAside?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldShell({ id, label, labelAside, hint, error, className, children }: FieldShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-navy">
          {label}
        </label>
        {labelAside}
      </div>
      {children(describedBy)}
      {error && (
        <span id={errorId} className="pl-[22px] text-[13px] font-bold text-danger">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className="pl-[22px] text-[13px] text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type">;

interface TextFieldProps extends NativeInputProps {
  id: string;
  label: ReactNode;
  /** text / email / tel / password only — no native date or time pickers. */
  type?: "text" | "email" | "tel" | "password";
  labelAside?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  tone?: "field" | "white";
  className?: string;
  inputClassName?: string;
}

/** Labelled pill input with optional hint and inline error (wired via aria-describedby). */
export function TextField({
  id,
  label,
  type = "text",
  labelAside,
  hint,
  error,
  tone,
  className,
  inputClassName: inputExtra,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      labelAside={labelAside}
      hint={hint}
      error={error}
      className={className}
    >
      {(describedBy) => (
        <input
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClassName({ invalid: !!error, tone, className: inputExtra })}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d={
          open
            ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"
            : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        }
      />
    </svg>
  );
}

type PasswordFieldProps = Omit<TextFieldProps, "type">;

/** Password input with a round show / hide toggle inside the pill. */
export function PasswordField({
  id,
  label,
  labelAside,
  hint,
  error,
  tone,
  className,
  inputClassName: inputExtra,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell
      id={id}
      label={label}
      labelAside={labelAside}
      hint={hint}
      error={error}
      className={className}
    >
      {(describedBy) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={inputClassName({
              invalid: !!error,
              tone,
              className: cn("pr-16", inputExtra),
            })}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
            aria-pressed={visible}
            className="absolute top-[5px] right-[5px] inline-flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-navy transition-colors duration-[250ms] hover:bg-sage"
          >
            <EyeIcon open={visible} />
          </button>
        </div>
      )}
    </FieldShell>
  );
}

/** "vagy" divider between the Google button and the e-mail form. */
export function OrDivider({ label = "vagy" }: { label?: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-3.5 text-[13px] font-semibold text-[#6b7280]"
    >
      <span className="h-px flex-1 bg-line-soft" />
      {label}
      <span className="h-px flex-1 bg-line-soft" />
    </div>
  );
}
