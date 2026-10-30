"use client";

import { useId, useState, type FormEvent } from "react";

const REPO_URL = "https://github.com/jairbonillacan-cmd/Hubly";

type Status = "idle" | "sending" | "done" | "invalid" | "unavailable" | "failed";

const MESSAGES: Partial<Record<Status, string>> = {
  invalid: "Ese correo no parece válido. Revísalo e inténtalo de nuevo.",
  unavailable:
    "La lista de espera aún no está abierta. Mientras tanto, puedes seguir el proyecto en GitHub.",
  failed: "No pudimos guardar tu correo. Inténtalo de nuevo en un momento.",
};

export function WaitlistForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          website: data.get("website"),
        }),
      });
      if (response.ok) setStatus("done");
      else if (response.status === 400) setStatus("invalid");
      else if (response.status === 503) setStatus("unavailable");
      else setStatus("failed");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <p className={`waitlist-done waitlist-done--${tone}`} role="status">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m4 10.5 4 4 8-9" />
        </svg>
        Listo, te avisaremos cuando Hubly esté disponible.
      </p>
    );
  }

  const message = MESSAGES[status];

  return (
    <form className={`waitlist waitlist--${tone}`} onSubmit={handleSubmit} noValidate>
      <div className="waitlist-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          Tu correo de trabajo
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@agencia.com"
          required
          aria-invalid={status === "invalid"}
          aria-describedby={message ? `${id}-message` : undefined}
        />
        <div className="waitlist-trap" aria-hidden="true">
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="button button--primary" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Unirme a la lista"}
        </button>
      </div>
      {message ? (
        <p id={`${id}-message`} className="waitlist-message" role="alert">
          {message}
          {status === "unavailable" ? (
            <>
              {" "}
              <a href={REPO_URL}>Ir al repositorio</a>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
