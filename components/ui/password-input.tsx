"use client";

import { useState } from "react";

type PasswordInputProps = {
  id: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  placeholder?: string;
};

export function PasswordInput({
  id,
  name,
  required,
  defaultValue,
  minLength,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        className="input password-input"
        defaultValue={defaultValue}
        id={id}
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required={required}
        type={visible ? "text" : "password"}
      />
      <button
        aria-controls={id}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
