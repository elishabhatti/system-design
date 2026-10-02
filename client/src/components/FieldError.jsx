import React from "react";

export default function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-400">
      {message}
    </p>
  );
}

// <input {...a11y(errors.email, "email")} />
export const a11y = (error, id) => ({
  "aria-invalid": !!error,
  "aria-describedby": error ? `${id}-error` : undefined,
});