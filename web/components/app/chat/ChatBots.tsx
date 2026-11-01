"use client";

import React, { useCallback, useEffect, useState } from "react";
import { askConfirm, askText } from "@/components/app/AppDialogHost";
import { chatRemote, useChatPresence, type ChatBot } from "@/lib/chat-live";
import { HublyCopyIcon, HublyTrashIcon } from "@/components/app/icons/DuotoneIcons";

const EVENTS = [
  { id: "mencion", label: "Cuando lo mencionan" },
  { id: "respuesta", label: "Respuestas a sus mensajes" },
  { id: "boton", label: "Clics en sus botones" },
  { id: "canal", label: "Todos los mensajes" },
];

function BotEvents({ bot, onSaved, onNotice }: { bot: ChatBot; onSaved: () => void; onNotice: (text: string) => void }) {
  const [url, setUrl] = useState(bot.events_url ?? "");
  const [events, setEvents] = useState(bot.events ?? ["mencion", "respuesta", "boton"]);
  const [secret, setSecret] = useState<string | null>(null);
  const save = async () => {
    const value = await chatRemote()?.configureBot(bot.id, url.trim(), events);
    if (!value) {
      onNotice("No pudimos guardar. Solo lo edita quien lo creó o un admin.");
      return;
    }
    setSecret(value);
    onSaved();
  };
  return (
    <details className="hubly-chat-botevents">
      <summary>Que también reciba eventos</summary>
      <label className="hubly-cal-field">
        <span>URL de eventos</span>
        <input className="hubly-cal-line" type="url" placeholder="https://tu-sistema.com/hubly" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      {EVENTS.map((event) => (
        <label key={event.id} className="hubly-chat-details-private">
          <input
            type="checkbox"
            checked={events.includes(event.id)}
            onChange={(e) => setEvents((list) => (e.target.checked ? [...list, event.id] : list.filter((v) => v !== event.id)))}
          />
          <span>{event.label}</span>
        </label>
      ))}
      <button type="button" className="hbtn hbtn-xs hbtn-secondary" onClick={save}>Guardar eventos</button>
      {secret ? (
        <div className="hubly-chat-boturl" role="status">
          <p>Copia el secreto ahora: no se vuelve a mostrar. Cada aviso llega firmado en la cabecera X-Hubly-Firma con HMAC-SHA256.</p>
          <code className="hubly-chat-boturl-value">{secret}</code>
        </div>
      ) : null}
    </details>
  );
}

export function ChatBots({ channelId, onNotice }: { channelId: string; onNotice: (text: string) => void }) {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const serverFeatures = useChatPresence((st) => st.serverFeatures);

  const refresh = useCallback(async () => {
    setBots((await chatRemote()?.listBots(channelId)) ?? []);
  }, [channelId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async () => {
    const name = (await askText("Nombre del bot, por ejemplo «Ventas de Stripe»", "", "Crear bot"))?.trim();
    if (!name) return;
    setError(null);
    const token = await chatRemote()?.createBot(channelId, name);
    if (!token) {
      setError("No pudimos crear el bot. Revisa que tengas permiso de edición.");
      return;
    }
    setFreshUrl(`${window.location.origin}/api/chat/bots/${token}`);
    await refresh();
  };

  const remove = async (bot: ChatBot) => {
    if (!(await askConfirm(`¿Eliminar «${bot.name}»? Su URL dejará de funcionar.`))) return;
    await chatRemote()?.deleteBot(bot.id);
    await refresh();
  };

  const copy = async () => {
    if (!freshUrl) return;
    try {
      await navigator.clipboard.writeText(freshUrl);
      onNotice("URL copiada");
    } catch {
      onNotice("No pudimos copiar. Hazlo a mano.");
    }
  };

  return (
    <section>
      <h3 className="hubly-chat-details-title">Bots <span>{bots.length}</span></h3>
      {bots.length === 0 && !freshUrl ? (
        <p className="hubly-chat-details-sub">Publica aquí desde Zapier, Make, n8n o un script.</p>
      ) : null}
      {bots.length > 0 ? (
        <ul className="hubly-chat-details-list">
          {bots.map((bot) => (
            <li key={bot.id}>
              <div className="hubly-chat-details-person">
                <span className="hubly-chat-details-clip">{bot.name}</span>
                <button type="button" className="hubly-chat-file-remove" aria-label={`Eliminar ${bot.name}`} onClick={() => remove(bot)}>
                  <HublyTrashIcon size={14} />
                </button>
              </div>
              {serverFeatures ? <BotEvents bot={bot} onSaved={refresh} onNotice={onNotice} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {freshUrl ? (
        <div className="hubly-chat-boturl" role="status">
          <p>Copia esta URL ahora: no se vuelve a mostrar. Envía un POST con JSON <code>{'{"text":"Hola"}'}</code>.</p>
          <code className="hubly-chat-boturl-value">{freshUrl}</code>
          <button type="button" className="hbtn hbtn-xs hbtn-secondary" onClick={copy}>
            <HublyCopyIcon size={13} /> Copiar URL
          </button>
        </div>
      ) : null}
      {error ? <p className="hubly-chat-composer-error" role="alert">{error}</p> : null}
      <button type="button" className="hbtn hbtn-xs hbtn-secondary hubly-chat-botadd" onClick={create}>Crear bot</button>
    </section>
  );
}
