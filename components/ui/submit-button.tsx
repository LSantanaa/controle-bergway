"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function SubmitButton({ children, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className ?? "button"} type="submit" disabled={pending}>
      {pending ? "Salvando..." : children}
    </button>
  );
}
