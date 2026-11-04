import assert from "node:assert/strict";
import { test } from "node:test";
import { GENERAL_CHANNEL_ID, SELF_CHANNEL_ID } from "../chat";
import type { AgencyTask, ChatChannel, ChatMessage, SocialPost, TeamMember } from "../types";
import {
  buildChatListItems,
  buildTaskFromChatMessage,
  filterVisibleChatItems,
  hasChatFileAttachment,
  mergeChatSearchResults,
  resolveChatSubtitle,
  resolveMessagePerson,
  selectChannelFiles,
  selectChannelMembers,
  selectChannelPendingAttachments,
  selectChatPeople,
} from "./chat";

const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: "m-1",
  channelId: "ch-1",
  sender: "Lucía",
  senderInitials: "LR",
  text: "Hola equipo",
  time: "10:00",
  ...over,
});

const member = (over: Partial<TeamMember>): TeamMember => ({
  id: "tm-1",
  name: "Lucía Ramírez",
  role: "Strategist",
  email: "lucia@hubly.mx",
  initials: "LR",
  color: "#16324F",
  status: "Activo",
  tasksAssigned: 2,
  tasksCompleted: 1,
  activeTasks: 1,
  overdueTasks: 0,
  brandIds: ["brand-a"],
  ...over,
});

const channel = (over: Partial<ChatChannel>): ChatChannel => ({
  id: "ch-1",
  name: "# Producción",
  type: "agency",
  unread: 0,
  ...over,
});

test("hasChatFileAttachment y selectChannelFiles detectan archivos y notas de voz del canal", () => {
  const fileMsg = msg({
    id: "m-file",
    channelId: "ch-1",
    attachment: { kind: "file", id: "f1", title: "brief.pdf", href: "/f1" },
  });
  const voiceMsg = msg({
    id: "m-voice",
    channelId: "ch-1",
    attachment: { kind: "voice", id: "v1", title: "Nota de voz", href: "/v1" },
  });
  const taskMsg = msg({
    id: "m-task",
    channelId: "ch-1",
    attachment: { kind: "task", id: "t1", title: "Revisar copy", href: "/tareas" },
  });
  const otherChannelFile = msg({
    id: "m-other",
    channelId: "ch-2",
    attachment: { kind: "file", id: "f2", title: "logo.png", href: "/f2" },
  });

  assert.equal(hasChatFileAttachment(fileMsg), true);
  assert.equal(hasChatFileAttachment(voiceMsg), true);
  assert.equal(hasChatFileAttachment(taskMsg), false);
  assert.deepEqual(
    selectChannelFiles([fileMsg, voiceMsg, taskMsg, otherChannelFile], "ch-1").map((m) => m.id),
    ["m-file", "m-voice"]
  );
  assert.deepEqual(selectChannelFiles([fileMsg], null), []);
});

test("selectChatPeople excluye inactivos y a la persona actual por nombre o correo", () => {
  const team: TeamMember[] = [
    member({ id: "tm-me", name: "Jair Bonilla", email: "jair@hubly.mx" }),
    member({ id: "tm-1", name: "Lucía Ramírez", email: "lucia@hubly.mx", initials: "" }),
    member({ id: "tm-2", name: "Diego Soto", email: "diego@hubly.mx", status: "Inactivo" }),
  ];

  assert.deepEqual(selectChatPeople(team, "Jair Bonilla", "jair@hubly.mx"), [
    { id: "tm-1", name: "Lucía Ramírez", initials: "LR" },
  ]);
});

test("buildChatListItems incluye canales base provisionales, aplica preferencias y deja notas al final", () => {
  const now = new Date("2026-10-31T12:00:00Z").getTime();
  const items = buildChatListItems({
    channels: [
      channel({ id: "ch-brand", name: "# Café Bruma", type: "brand", unread: 3 }),
      channel({ id: "ch-arch", name: "Archivado", type: "agency", archived: true }),
    ],
    messages: [],
    muted: ["ch-brand"],
    pinnedChats: [GENERAL_CHANNEL_ID],
    hiddenChats: [],
    myName: "Jair",
    myInitials: "JB",
    online: [],
    now,
  });

  assert.deepEqual(
    items.map((i) => [i.id, i.name, i.group, i.muted, i.pinned]),
    [
      [GENERAL_CHANNEL_ID, "General", "agencia", false, true],
      ["ch-brand", "Café Bruma", "marcas", true, false],
      [SELF_CHANNEL_ID, "Jair (tú)", "directos", false, false],
    ]
  );
});

test("filterVisibleChatItems y mergeChatSearchResults filtran canales y deduplican mensajes encontrados", () => {
  const items = [
    { id: "ch-1", name: "General" },
    { id: "ch-2", name: "Café Bruma" },
  ];
  const localMessages = [
    msg({ id: "m-1", channelId: "ch-1", text: "Entregar parrilla de noviembre" }),
    msg({ id: "m-2", channelId: "ch-2", text: "Hola" }),
  ];
  const remoteMessages = [
    msg({ id: "m-1", channelId: "ch-1", text: "Entregar parrilla de noviembre" }),
    msg({ id: "m-3", channelId: "ch-2", text: "Parrilla aprobada por cliente" }),
  ];

  assert.deepEqual(
    filterVisibleChatItems(items, localMessages, "parrilla").map((i) => i.id),
    ["ch-1"]
  );
  assert.deepEqual(mergeChatSearchResults(localMessages, remoteMessages, "p"), []);
  assert.deepEqual(
    mergeChatSearchResults(localMessages, remoteMessages, "parrilla").map((m) => m.id),
    ["m-3", "m-1"]
  );
});

test("resolveChatSubtitle y selectChannelMembers resuelven descripción y participantes por tipo de canal", () => {
  const me = { id: "me", name: "Jair", initials: "JB" };
  const people = [
    { id: "tm-1", name: "Lucía Ramírez", initials: "LR" },
    { id: "tm-2", name: "Ana Ruiz", initials: "AR" },
  ];
  const team = [
    member({ id: "tm-1", name: "Lucía Ramírez", brandIds: ["brand-a"] }),
    member({ id: "tm-2", name: "Ana Ruiz", brandIds: ["brand-b"] }),
  ];

  assert.equal(resolveChatSubtitle(null, undefined, undefined, false), "");
  assert.equal(
    resolveChatSubtitle({ group: "marcas" }, channel({ type: "brand" }), "Café Bruma", false),
    "Canal de Café Bruma"
  );
  assert.equal(resolveChatSubtitle({ group: "directos" }, undefined, undefined, true), "Notas, borradores y recordatorios");

  assert.deepEqual(
    selectChannelMembers({
      hasActive: true,
      isSelf: false,
      channel: channel({ type: "brand", brandId: "brand-a" }),
      me,
      people,
      team,
      myName: "Jair",
    }).map((p) => p.id),
    ["me", "tm-1"]
  );
});

test("selectChannelPendingAttachments, resolveMessagePerson y buildTaskFromChatMessage aplican reglas del chat", () => {
  const roots: ChatMessage[] = [
    msg({ id: "m1", attachment: { kind: "task", id: "t-open", title: "Tarea abierta", href: "/tareas" } }),
    msg({ id: "m2", attachment: { kind: "task", id: "t-open", title: "Tarea abierta", href: "/tareas" } }),
    msg({ id: "m3", attachment: { kind: "task", id: "t-done", title: "Tarea lista", href: "/tareas" } }),
    msg({ id: "m4", attachment: { kind: "post", id: "p-draft", title: "Post borrador", href: "/calendario" } }),
  ];
  const tasks = [
    { id: "t-open", completed: false } as AgencyTask,
    { id: "t-done", completed: true } as AgencyTask,
  ];
  const posts = [{ id: "p-draft", status: "draft" } as SocialPost];

  assert.deepEqual(
    selectChannelPendingAttachments(roots, tasks, posts).map((a) => `${a.kind}:${a.id}`),
    ["task:t-open", "post:p-draft"]
  );

  const team = [member({ id: "tm-1", name: "Lucía" })];
  assert.equal(resolveMessagePerson(msg({ isBot: true }), "Jair", undefined, team, []), null);
  assert.deepEqual(resolveMessagePerson(msg({ sender: "Lucía" }), "Jair", undefined, team, ["tm-1"]), {
    name: "Lucía",
    role: "Strategist",
    email: "lucia@hubly.mx",
    online: true,
  });

  const taskInput = buildTaskFromChatMessage(
    msg({ channelId: "ch-brand", text: "Preparar pauta mensual" }),
    [channel({ id: "ch-brand", brandId: "brand-bruma" })],
    "brand-default",
    "Jair",
    "2026-10-31"
  );
  assert.equal(taskInput.brandId, "brand-bruma");
  assert.equal(taskInput.title, "Preparar pauta mensual");
  assert.equal(taskInput.dueLabel, "Hoy");
  assert.equal(taskInput.listName, "Chat");
});
