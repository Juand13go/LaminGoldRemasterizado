"use client";

import { useState } from "react";

interface Props {
  id: string;
  name: string;
  required?: boolean;
  minLength?: number;
}

export function PasswordField({ id, name, required, minLength }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-row">
      <input
        className="auth-input"
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
      />
      <button type="button" className="btn-outline" onClick={() => setVisible((v) => !v)}>
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
