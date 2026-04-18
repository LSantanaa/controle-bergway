"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
};

export function SubmitButton({ children, className, pending: pendingProp }: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button className={className ?? "button"} type="submit" disabled={pending}>
      {pending ? "Salvando..." : children}
    </button>
  );
}
