"use client";

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";
import { IconEye, IconEyeOff } from "@/components/Icons";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function FieldLabel({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="block font-display text-[0.68rem] font-medium uppercase tracking-[0.16em] text-mute"
      >
        {children}
      </label>
      {hint && <span className="text-[0.7rem] text-na">{hint}</span>}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("gms-field", className)} {...props} />;
}

/** Champ mot de passe avec bouton œil Afficher / Masquer. */
export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const label = visible
    ? "Masquer le mot de passe"
    : "Afficher le mot de passe";

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cx("gms-field pr-12", className)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded text-mute transition hover:text-mist"
        aria-label={label}
        title={label}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <IconEyeOff className="h-4 w-4" />
        ) : (
          <IconEye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const inline = Boolean(className?.match(/\bw-auto\b/));
  return (
    <div
      className={cx(
        "gms-select-wrap",
        inline && "inline-block w-auto max-w-full"
      )}
    >
      <select className={cx("gms-field gms-select", className)} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx("gms-field gms-textarea", className)}
      {...props}
    />
  );
}
