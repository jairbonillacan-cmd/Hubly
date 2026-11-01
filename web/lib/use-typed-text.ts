import { useEffect, useState } from "react";

const TYPE_MS = 45;
const DELETE_MS = 24;
const HOLD_MS = 1800;
const START_MS = 240;

// Escribe y borra cada frase por turnos. Devuelve null si no hay que animar (inactivo o movimiento reducido).
export function useTypedText(phrases: string[], active: boolean): string | null {
  const [text, setText] = useState("");
  const animated =
    active && typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!animated) return;
    let phrase = 0;
    let length = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleting && length === phrases[phrase].length) {
        deleting = true;
        timer = setTimeout(tick, HOLD_MS);
        return;
      }
      if (deleting && length === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
      }
      length += deleting ? -1 : 1;
      setText(phrases[phrase].slice(0, length));
      timer = setTimeout(tick, deleting ? DELETE_MS : TYPE_MS);
    };

    timer = setTimeout(tick, START_MS);
    return () => {
      clearTimeout(timer);
      setText("");
    };
  }, [animated, phrases]);

  return animated ? text : null;
}
