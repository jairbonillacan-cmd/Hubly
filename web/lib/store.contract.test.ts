/**
 * Contrato del store: lo que F1 no puede mover sin romper algo.
 *
 * Tres cosas quedan fijadas aquí y no se editan durante el deslope:
 *
 * 1. Las claves de `useHublyStore.getState()`, en orden. Una clave nueva, una
 *    clave que desaparece o una slice que pisa a otra hacen fallar.
 * 2. El resultado de una secuencia de acciones de todos los dominios, con reloj y
 *    datos fijos. Los ids generados se normalizan: `<id:n>` es el n-ésimo id
 *    distinto de la foto, en orden de lectura.
 * 3. Qué se guarda: la forma del documento que recibe `saveWorkspaceToStorage` y
 *    cuántas veces guarda cada acción. Un campo que deje de guardarse es pérdida
 *    de datos y ninguna prueba visual lo vería.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_WIDGETS_CONFIG } from "./seed-data";
import type {
  BrandWorkspace,
  DashboardWidgetConfig,
  HublyWorkspaceData,
  PeriodCommitmentSnapshot,
  TeamMember,
} from "./types";

// La foto incluye fechas y horas locales: se fija la zona antes de cargar el store.
process.env.TZ = "UTC";
// Modo demo: sin claves, `persistWorkspaceState` guarda en almacenamiento y API.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Reloj de la secuencia. Todo lo que el store fecha depende de él. */
const RELOJ = "2026-05-14T10:00:00.000Z";
const MOMENTO = Date.parse(RELOJ);
const HOY = "2026-05-14";

// `new Date()` y `Date.now()` tienen que devolver lo mismo, o la foto cambia de
// una corrida a otra. El reloj solo avanza cuando la secuencia se lo pide.
let ahora = MOMENTO;

class RelojFijo extends Date {
  constructor(valor?: number | string) {
    super(valor === undefined ? ahora : valor);
  }
  static now(): number {
    return ahora;
  }
}

(globalThis as unknown as { Date: DateConstructor }).Date =
  RelojFijo as unknown as DateConstructor;

function avanzar(): void {
  ahora += 1;
}

type Modulo = typeof import("./store");
type Store = Modulo["useHublyStore"];
type Estado = ReturnType<Store["getState"]>;

/** Lo que devuelve `fetch` dentro de `pushWorkspaceToApi`. */
interface RespuestaFalsa {
  ok: boolean;
  json: () => Promise<unknown>;
}

const almacen = new Map<string, string>();
const guardados: Record<string, unknown>[] = [];

const global = globalThis as unknown as {
  window?: Record<string, unknown>;
  fetch?: (entrada: string, init?: { body?: string }) => Promise<RespuestaFalsa>;
};

global.window = {
  location: { pathname: "/dashboard", search: "" },
  localStorage: {
    getItem: (clave: string) => almacen.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void almacen.set(clave, String(valor)),
    removeItem: (clave: string) => void almacen.delete(clave),
    clear: () => almacen.clear(),
    key: (indice: number) => [...almacen.keys()][indice] ?? null,
    get length() {
      return almacen.size;
    },
  },
  dispatchEvent: () => true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
};

// El guardado llega a `fetch` con el mismo documento que recibe
// `saveWorkspaceToStorage`; aquí se copia antes de que se pierda.
global.fetch = async (_entrada, init) => {
  if (init?.body) guardados.push(JSON.parse(init.body) as Record<string, unknown>);
  return { ok: true, json: async () => ({}) };
};

let modulo: Modulo | undefined;
/** Claves del estado recién importado, antes de que ninguna prueba lo toque. */
let clavesPristinas: string[] | undefined;

async function cargar(): Promise<Modulo> {
  if (!modulo) {
    modulo = await import("./store");
    clavesPristinas = Object.keys(modulo.useHublyStore.getState()).sort();
  }
  return modulo;
}

function periodo(
  period: PeriodCommitmentSnapshot["period"],
  posts: number,
  completados = 0
): PeriodCommitmentSnapshot {
  return {
    period,
    postsCommitted: posts,
    postsCompleted: completados,
    StoriesCommitted: 0,
    StoriesCompleted: 0,
    storiesCommitted: 0,
    storiesCompleted: 0,
    reelsCommitted: 0,
    reelsCompleted: 0,
    adCampaignsCommitted: 0,
    adCampaignsCompleted: 0,
  };
}

function marca(): BrandWorkspace {
  return {
    id: "marca-uno", name: "Marca Uno", slug: "marca-uno", handle: "@marcauno",
    shareToken: "marca-uno-nov", initials: "MU", initial: "M", color: "#0a7a55",
    avatarBg: "#ecfdf5", avatarColor: "#0a7a55", industry: "Comercio",
    city: "Ciudad de México", connectedNetworks: ["Instagram"], Networks: ["Instagram"],
    monthlyPostTarget: 10, monthlyBudget: 1000, adBudget: 0, hasPaidAds: false,
    paidAdsLabel: "sin pauta", healthStatus: "en_progreso", healthScore: 80,
    commitments: {
      period: "mes_actual", postsCommitted: 10, postsCompleted: 3,
      StoriesCommitted: 0, StoriesCompleted: 0, storiesCommitted: 0, storiesCompleted: 0,
      reelsCommitted: 0, reelsCompleted: 0, adCampaignsCommitted: 0, adCampaignsCompleted: 0,
      hasDeclaredCommitments: true, customMetrics: [],
      periodHistory: {
        mes_actual: periodo("mes_actual", 10, 3),
        mes_anterior: periodo("mes_anterior", 10, 10),
        trimestre: periodo("trimestre", 30, 6),
      },
    },
    core: {
      whatTheySell: "Café de altura", category: "Alimentos",
      websiteUrl: "https://marca-uno.ejemplo", toneOfVoice: "Cercano",
      pillars: ["Producto"], doWords: ["calidad"], dontWords: ["spam"],
      personas: [{
        id: "persona-uno", name: "Cliente", ageRange: "30-40", occupation: "Oficina",
        painPoints: "Poco tiempo", motivation: "Café bueno", accepted: false,
      }],
    },
    bioLink: { handle: "marca-uno", headline: "Marca Uno", whatsapp: "+52 55 0000 0000", buttons: [] },
  };
}

function miembro(): TeamMember {
  return {
    id: "tm-uno", name: "Ana Ruiz", initials: "AR", avatarInitial: "A",
    avatarColor: "#4338ca", role: "Owner", email: "ana@agencia.demo", status: "Activo",
    baseActiveMinutes: 90, brandIds: ["marca-uno"], brandsCount: 1, tasksCompleted: 0,
    tasksInProgress: 0, postsPublished: 0, activeTimeLabel: "menos de un minuto", points: 10,
  };
}

function widget(id: DashboardWidgetConfig["id"], order: number): DashboardWidgetConfig {
  return {
    id, title: `Widget ${id}`, description: "", visible: true, order,
    column: order === 1 ? "left" : "right",
  };
}

function estadoFijo(): HublyWorkspaceData {
  return {
    schemaVersion: 2, workspaceId: "prueba", agencyName: "Agencia Prueba",
    profile: {
      id: "perfil-uno", name: "Ana Ruiz", email: "ana@agencia.demo", role: "Owner",
      avatarInitial: "AR", timezone: "UTC", locale: "es-MX",
    },
    agency: {
      id: "agencia-uno", name: "Agencia Prueba", plan: "Studio", activeDays: 30,
      activeStreak: 4, timezone: "UTC", currency: "MXN",
    },
    testClock: { fixedIsoNow: RELOJ },
    activeBrandId: "marca-uno",
    brands: [marca()],
    posts: [], ideas: [], leads: [], quotes: [], automations: [], agents: [],
    tasks: [], taskLists: [], calendarActivities: [],
    notebooks: [], assets: [], projects: [], ads: [],
    channels: [{ id: "ch-general", name: "General", type: "general", unread: 0 }],
    messages: [], chatScheduled: [], chatReminders: [], team: [miembro()], invitations: [],
    activityEvents: [], notifications: [],
    widgets: [widget("tareas", 1), widget("posts", 2)],
    onboarding: {
      brandCreatedOrSelected: true, taskCreatedOrCompleted: false,
      postCreatedOrScheduled: false, teamCheckedOrInvited: false,
      dismissed: false, minimized: false, manualOverrides: {},
    },
    dismissedRecommendationIds: [], appliedRecommendationsMap: {},
  };
}

/** Vuelve al estado fijo: sin esto, cada prueba arrastraría lo de la anterior. */
function reiniciar(store: Store): void {
  // El contrato se mide sobre el estado prístino: reiniciar antes lo falsearía.
  if (!clavesPristinas) throw new Error("hay que cargar el store antes de reiniciarlo");
  ahora = MOMENTO;
  almacen.clear();
  guardados.length = 0;
  const base = estadoFijo();
  store.setState({
    ...base,
    hydrated: true,
    role: null,
    isReferenceFixture: false,
    teamMembers: base.team,
    dashboardWidgets: base.widgets.map((w) => ({ ...w, enabled: w.visible })),
    composerOpen: false,
    editingPostId: null,
    composerDefaultDate: null,
    composerDirty: false,
    composerPending: null,
    cmdkOpen: false,
    aiDrawerOpen: false,
    aiDrawerPrompt: null,
    newBrandModalOpen: false,
    inviteModalOpen: false,
    widgetConfigModalOpen: false,
    autoSuggestionsModalOpen: false,
    editWidgetsMode: false,
    activeNotebookId: null,
  });
}

interface Paso {
  accion: string;
  guardados: number;
}

/** Ejecuta la secuencia de todos los dominios y anota cuántas veces guardó cada acción. */
function ejecutarSecuencia(store: Store): Paso[] {
  const pasos: Paso[] = [];
  const paso = <T>(accion: string, fn: () => T): T => {
    // El reloj avanza un milisegundo por acción: los ids con `Date.now()` no se pisan.
    avanzar();
    const antes = guardados.length;
    const valor = fn();
    pasos.push({ accion, guardados: guardados.length - antes });
    return valor;
  };
  const s = () => store.getState();

  paso("setActiveBrand", () => s().setActiveBrand("marca-uno"));
  paso("updateProfile", () => s().updateProfile({ name: "Beto Lara" }));
  paso("updateAgency", () => s().updateAgency({ name: "Agencia Dos" }));
  paso("setTestClock", () => s().setTestClock(RELOJ));

  paso("updateBrand", () => s().updateBrand("marca-uno", { city: "Puebla" }));
  paso("updateBrandCore", () => s().updateBrandCore("marca-uno", { toneOfVoice: "Directo" }));
  paso("togglePersonaAccepted", () => s().togglePersonaAccepted("marca-uno", "persona-uno"));
  paso("updateBrandCommitments", () => s().updateBrandCommitments("marca-uno", { postsCompleted: 5 }));
  paso("setBrandCustomMetrics", () => s().setBrandCustomMetrics("marca-uno", []));
  paso("applyRecommendation", () => s().applyRecommendation("rec-marca-uno-posts-upgrade"));
  paso("applyRecommendationsBatch", () => s().applyRecommendationsBatch(["rec-inexistente"]));
  paso("dismissRecommendation", () => s().dismissRecommendation("rec-descartada"));

  paso("savePost", () =>
    s().savePost({
      brandId: "marca-uno", title: "Post de prueba", caption: "Copy fijo",
      network: "Instagram", networks: ["Instagram"], format: "Imagen", cover: "steam",
      scheduledDate: HOY, scheduledTime: "10:00", status: "draft",
      assignee: "Ana Ruiz", pillar: "Producto",
    })
  );
  paso("addAutomation", () =>
    s().addAutomation({ name: "Aviso al enviar", trigger: "post_pending", action: "notify", text: "Revisar {post}" })
  );
  paso("updatePostStatus", () =>
    s().updatePostStatus(s().posts[0].id, "pending", "Listo", "Ana Ruiz", "agency")
  );
  paso("updatePostFields", () => s().updatePostFields(s().posts[0].id, { pillar: "Comunidad" }));
  paso("movePost", () => s().movePost(s().posts[0].id, "2026-05-20"));
  paso("patchPost", () => s().patchPost(s().posts[0].id, { notes: "Pendiente de arte" }));
  paso("addPostComment", () => s().addPostComment(s().posts[0].id, "Va bien", "Ana Ruiz", "agency"));
  paso("approveAllBrandPosts", () => s().approveAllBrandPosts("marca-uno", "Ana Ruiz", "agency"));
  paso("recordPublication", () =>
    s().recordPublication(s().posts[0].id, { url: "https://redes.ejemplo/p/1", date: HOY })
  );
  paso("setPostResults", () =>
    s().setPostResults(s().posts[0].id, { reach: 100, likes: 10, comments: 2, saves: 1, shares: 1 })
  );
  paso("duplicatePost", () => s().duplicatePost(s().posts[0].id));
  paso("deletePost", () => s().deletePost(s().posts[0].id));
  paso("setCalendarActivities", () => s().setCalendarActivities([{ id: "act-uno", kind: "evento" }]));

  paso("addIdea", () =>
    s().addIdea({ brandId: "marca-uno", title: "Idea fija", notes: "Notas", pillar: "Producto" })
  );
  paso("convertIdeaToPost", () => s().convertIdeaToPost(s().ideas?.[0]?.id ?? ""));
  paso("addIdea", () =>
    s().addIdea({ brandId: "marca-uno", title: "Idea sobrante", notes: "", pillar: "Producto" })
  );
  paso("removeIdea", () => s().removeIdea(s().ideas?.[0]?.id ?? ""));

  const lead = paso("saveLead", () => {
    s().saveLead({
      name: "Cliente Fijo", company: "Compra Fija", stage: "nuevo", email: "cliente@ejemplo.com",
      phone: "555", value: 1000, notes: "Nota", source: "Sitio",
    });
    return s().leads?.[0]?.id ?? "";
  });
  paso("moveLead", () => s().moveLead(lead, "contactado", null));
  paso("saveQuote", () =>
    s().saveQuote({ leadId: lead, title: "COT-1", status: "Borrador", items: [] })
  );
  paso("deleteQuote", () => s().deleteQuote(s().quotes?.[0]?.id ?? ""));
  paso("saveQuote", () =>
    s().saveQuote({ leadId: lead, title: "COT-2", status: "Borrador", items: [] })
  );
  const leadBorrado = paso("saveLead", () => {
    s().saveLead({
      name: "Cliente Borrado", company: "Compra Borrada", stage: "nuevo",
      email: "borrado@ejemplo.com", phone: "556", value: 500, notes: "", source: "Sitio",
    });
    return s().leads?.[0]?.id ?? "";
  });
  paso("deleteLead", () => s().deleteLead(leadBorrado));
  paso("addAutomation", () =>
    s().addAutomation({ name: "Segunda", trigger: "post_approved", action: "notify", text: "Ok {post}" })
  );
  paso("toggleAutomation", () => s().toggleAutomation(s().automations?.[0]?.id ?? ""));
  paso("removeAutomation", () => s().removeAutomation(s().automations?.[0]?.id ?? ""));

  paso("addTask", () =>
    s().addTask({
      brandId: "marca-uno", title: "Tarea fija", dueLabel: "Hoy", dueDate: HOY,
      assignee: "Ana Ruiz", listName: "Primeros pasos", status: "todo", priority: "media",
    })
  );
  paso("addTaskList", () => s().addTaskList("marca-uno", "Nueva lista"));
  paso("renameTaskList", () => s().renameTaskList("marca-uno", "Nueva lista", "Lista dos"));
  paso("updateTask", () => s().updateTask(s().tasks[0].id, { priority: "alta" }));
  paso("toggleTaskStatus", () => s().toggleTaskStatus(s().tasks[0].id));
  paso("moveTask", () => s().moveTask(s().tasks[0].id, "in_progress", null));
  paso("addTask", () =>
    s().addTask({
      brandId: "marca-uno", title: "Tarea que se borra", dueLabel: "Hoy", dueDate: HOY,
      assignee: "Ana Ruiz", listName: "Lista dos", status: "todo", priority: "baja",
    })
  );
  paso("deleteTask", () => s().deleteTask(s().tasks[0].id));
  paso("deleteTaskList", () => s().deleteTaskList("marca-uno", "Lista dos"));

  const agenteId = paso("addAgent", () => s().addAgent()).id;
  paso("updateAgent", () => s().updateAgent(agenteId, { purpose: "Reportes" }));
  const agenteCopia = paso("duplicateAgent", () => s().duplicateAgent(agenteId));
  paso("deleteAgent", () => s().deleteAgent(agenteCopia?.id ?? agenteId));

  const libretaId = paso("addNotebook", () => s().addNotebook({ title: "Libreta fija" })).id;
  paso("updateNotebook", () => s().updateNotebook(libretaId, { category: "Ideas" }));
  paso("toggleNotebookPinned", () => s().toggleNotebookPinned(libretaId));
  const otraLibreta = paso("addNotebook", () =>
    s().addNotebook({ title: "Libreta que se borra" })
  ).id;
  paso("deleteNotebook", () => s().deleteNotebook(otraLibreta));

  const invitacion = paso("inviteTeamMember", () =>
    s().inviteTeamMember({ email: "nueva@agencia.demo", role: "Editor", brandIds: ["marca-uno"] })
  );
  paso("acceptTeamInvitation", () => s().acceptTeamInvitation(invitacion.id));
  const segundaInvitacion = paso("inviteTeamMember", () =>
    s().inviteTeamMember({ email: "otra@agencia.demo", role: "Editor" })
  );
  paso("cancelTeamInvitation", () => s().cancelTeamInvitation(segundaInvitacion.id));
  paso("updateTeamMember", () => s().updateTeamMember("tm-uno", { role: "Admin" }));
  paso("recordActivityEvent", () => s().recordActivityEvent({ type: "session_active", memberId: "tm-uno" }));

  paso("toggleWidgetVisibility", () => s().toggleWidgetVisibility("tareas"));
  paso("setWidgetVisibility", () => s().setWidgetVisibility("posts", true));
  paso("reorderWidgets", () => s().reorderWidgets(["posts", "tareas"]));
  paso("moveWidget", () => s().moveWidget("tareas", "up"));
  paso("setWidgetSpan", () => s().setWidgetSpan("tareas", 2));
  paso("setWidgetMetric", () => s().setWidgetMetric("posts", "ctr"));
  paso("toggleOnboardingStep", () => s().toggleOnboardingStep("redes"));
  paso("setOnboardingDismissed", () => s().setOnboardingDismissed(true));
  paso("setOnboardingMinimized", () => s().setOnboardingMinimized(true));

  paso("addNotification", () =>
    s().addNotification({ title: "Aviso", body: "Cuerpo", kind: "sistema" })
  );
  paso("markNotificationRead", () => s().markNotificationRead(s().notifications[0].id));
  paso("markAllNotificationsRead", () => s().markAllNotificationsRead());
  paso("addAsset", () =>
    s().addAsset({
      brandId: "marca-uno", name: "Arte", kind: "image", cover: "steam",
      sizeLabel: "1 MB", aiTags: [], folder: "General",
    })
  );
  const proyecto = paso("addProject", () => {
    s().addProject({
      brandId: "marca-uno", title: "Proyecto", description: "", progress: 10,
      status: "En curso", dueDate: HOY, deliverablesCount: 1,
    });
    return s().projects[0].id;
  });
  const proyectoBorrado = paso("addProject", () => {
    s().addProject({
      brandId: "marca-uno", title: "Proyecto que se borra", description: "", progress: 0,
      status: "En curso", dueDate: HOY, deliverablesCount: 0,
    });
    return s().projects[0].id;
  });
  paso("updateProject", () => s().updateProject(proyecto, { progress: 50 }));
  paso("moveProject", () => s().moveProject(proyecto, "Revisión", null));
  paso("deleteProject", () => s().deleteProject(proyectoBorrado));

  const canal = paso("addChatChannel", () =>
    s().addChatChannel({ name: "Equipo", type: "agency", unread: 2 })
  );
  const canalBorrado = paso("addChatChannel", () =>
    s().addChatChannel({ name: "Temporal", type: "agency" })
  );
  paso("sendChatMessage", () => s().sendChatMessage(canal.id, "Hola", "Ana Ruiz", "AR"));
  const mensajeSobrevive = paso("sendChatMessage", () => {
    s().sendChatMessage(canal.id, "Adiós", "Ana Ruiz", "AR");
    return s().messages.at(-1)?.id ?? "";
  });
  const mensajeBorrado = paso("sendChatMessage", () => {
    s().sendChatMessage(canal.id, "Temporal", "Ana Ruiz", "AR");
    return s().messages.at(-1)?.id ?? "";
  });
  paso("markChatRead", () => s().markChatRead(canal.id));
  paso("editChatMessage", () => s().editChatMessage(mensajeSobrevive, "Adiós a todos"));
  paso("toggleChatReaction", () => s().toggleChatReaction(mensajeSobrevive, "pulgar", "Ana"));
  paso("toggleChatPin", () => s().toggleChatPin(mensajeSobrevive));
  paso("updateChatChannel", () => s().updateChatChannel(canal.id, { name: "Equipo dos" }));
  paso("setChatPreference", () => s().setChatPreference(canal.id, { muted: true }));
  paso("scheduleChatMessage", () =>
    s().scheduleChatMessage({
      channelId: canal.id, text: "Vencido", sendAt: MOMENTO - 1_000, repeat: "none",
      authorId: "perfil-uno", sender: "Ana Ruiz", senderInitials: "AR",
    })
  );
  paso("addChatReminder", () =>
    s().addChatReminder({
      channelId: canal.id, messageId: mensajeSobrevive, text: "Recordar",
      remindAt: MOMENTO - 1_000, authorId: "perfil-uno",
    })
  );
  paso("flushChatQueue", () => s().flushChatQueue(MOMENTO));
  paso("scheduleChatMessage", () =>
    s().scheduleChatMessage({
      channelId: canal.id, text: "Programado", sendAt: MOMENTO + 90_000, repeat: "weekly",
      authorId: "perfil-uno", sender: "Ana Ruiz", senderInitials: "AR",
    })
  );
  paso("scheduleChatMessage", () =>
    s().scheduleChatMessage({
      channelId: canal.id, text: "Programado dos", sendAt: MOMENTO + 120_000, repeat: "weekly",
      authorId: "perfil-uno", sender: "Ana Ruiz", senderInitials: "AR",
    })
  );
  paso("cancelChatScheduled", () => s().cancelChatScheduled(s().chatScheduled?.[0]?.id ?? ""));
  paso("deleteChatMessage", () => s().deleteChatMessage(mensajeBorrado));
  paso("deleteChatChannel", () => s().deleteChatChannel(canalBorrado.id));

  paso("openComposer", () => s().openComposer(null, HOY));
  paso("setComposerDirty", () => s().setComposerDirty(true));
  paso("closeComposer", () => s().closeComposer());
  paso("setCmdkOpen", () => s().setCmdkOpen(true));
  paso("setAiDrawerOpen", () => s().setAiDrawerOpen(true));
  paso("setAiDrawerPrompt", () => s().setAiDrawerPrompt("Hola"));
  paso("setNewBrandModalOpen", () => s().setNewBrandModalOpen(true));
  paso("setInviteModalOpen", () => s().setInviteModalOpen(true));
  paso("setWidgetConfigModalOpen", () => s().setWidgetConfigModalOpen(true));
  paso("setAutoSuggestionsModalOpen", () => s().setAutoSuggestionsModalOpen(true));
  paso("setEditWidgetsMode", () => s().setEditWidgetsMode(true));
  paso("setActiveNotebookId", () => s().setActiveNotebookId(null));

  return pasos;
}
function ordenar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === "object") {
    const fuente = valor as Record<string, unknown>;
    const salida: Record<string, unknown> = {};
    for (const clave of Object.keys(fuente).sort()) salida[clave] = ordenar(fuente[clave]);
    return salida;
  }
  return valor;
}

/** Ids con marca de tiempo (los que genera el store) más su sufijo aleatorio. */
const ID_GENERADO =
  /\b(brand|agent|asset|auto|cola|evt|idea|inv|lead|list|notif|proj|quote|task|msg|post|pa|nb|tm|ch|rec|bp|c)-(\d{10,})(?:-[a-z0-9]+)?\b/g;

function normalizarIds(texto: string): string {
  const vistos = new Map<string, string>();
  return texto.replace(ID_GENERADO, (encontrado) => {
    const previo = vistos.get(encontrado);
    if (previo) return previo;
    const nuevo = `<id:${vistos.size + 1}>`;
    vistos.set(encontrado, nuevo);
    return nuevo;
  });
}

/**
 * La foto: el estado sin funciones y sin las listas derivadas, que se comprueban
 * aparte. Las marcas, los posts, el equipo y la bitácora se reducen a los campos
 * que la secuencia toca o que identifican la fila.
 */
function foto(estado: Estado): unknown {
  const marcas = estado.brands.map((b) => ({
    id: b.id, name: b.name, slug: b.slug, handle: b.handle, initials: b.initials,
    city: b.city, industry: b.industry, color: b.color, shareToken: b.shareToken,
    monthlyPostTarget: b.monthlyPostTarget, hasPaidAds: b.hasPaidAds,
    paidAdsLabel: b.paidAdsLabel, healthScore: b.healthScore, healthStatus: b.healthStatus,
    tono: b.core.toneOfVoice,
    personas: b.core.personas.map((p) => [p.id, p.accepted]),
    bioLink: b.bioLink.handle,
    compromisos: {
      postsCommitted: b.commitments.postsCommitted,
      postsCompleted: b.commitments.postsCompleted,
      hasDeclaredCommitments: b.commitments.hasDeclaredCommitments,
      metricas: b.commitments.customMetrics,
      historial: Object.values(b.commitments.periodHistory).map((p) => [
        p.period, p.postsCommitted, p.postsCompleted,
      ]),
    },
  }));

  const posts = estado.posts.map((p) => ({
    id: p.id, brandId: p.brandId, title: p.title, caption: p.caption, network: p.network,
    networks: p.networks, format: p.format, cover: p.cover, scheduledDate: p.scheduledDate,
    scheduledTime: p.scheduledTime, status: p.status, statusLabel: p.statusLabel,
    assignee: p.assignee, pillar: p.pillar, notes: p.notes, publishedUrl: p.publishedUrl,
    metricsSource: p.metricsSource, metrics: p.metrics,
    comments: p.comments.map((c) => [c.author, c.role, c.text, c.createdAt]),
    activity: p.activity?.map((a) => [a.author, a.text, a.at]),
  }));

  const equipo = estado.team.map((m) => [
    m.id, m.name, m.role, m.status, m.brandIds, m.brandsCount, m.points,
  ]);

  const eventos = estado.activityEvents.map((evento) =>
    JSON.stringify([
      evento.type, evento.memberId, evento.brandId ?? null,
      evento.durationMinutes ?? null, evento.metadata ?? null,
    ])
  );

  const visible: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(estado as unknown as Record<string, unknown>)) {
    if (typeof valor === "function") continue;
    visible[clave] = valor;
  }
  return ordenar({
    ...visible,
    brands: marcas,
    posts,
    team: equipo,
    teamMembers: undefined,
    dashboardWidgets: undefined,
    activityEvents: eventos,
    widgets: estado.widgets.map((w) => [w.id, w.visible, w.order, w.column, w.span, w.metric]),
  });
}

test("las claves del estado son las mismas", async () => {
  await cargar();
  const { backendEnabled } = await import("./supabase/config");
  // El contrato cubre el modo demo: con claves, el guardado se encola en vivo.
  assert.equal(backendEnabled, false);
  // Sobre el estado prístino, sin `reiniciar()`: si se reiniciara antes, `setState`
  // repondría las claves que falten y el contrato no vería la pérdida.
  assert.deepEqual(clavesPristinas, CLAVES);
});

test("hidratar un documento completo añade las claves opcionales", async () => {
  const { useHublyStore } = await cargar();
  // Arranca del estado prístino: si otra prueba lo hubiera tocado, `setState` ya
  // habría repuesto esas claves y la comprobación no vería nada.
  assert.deepEqual(Object.keys(useHublyStore.getState()).sort(), CLAVES);
  // Vía real de la app: `syncFromServer` → `loadWorkspaceFromStorage` →
  // `normalizeWorkspacePayload`.
  almacen.set(
    "hubly:workspace:v3:hidratado",
    JSON.stringify({ brands: [{ id: "marca-uno", name: "Marca Uno" }] })
  );
  await useHublyStore.getState().syncFromServer("hidratado");
  const estado = useHublyStore.getState();
  assert.equal(estado.workspaceId, "hidratado");
  assert.equal(estado.hydrated, true);
  assert.deepEqual(Object.keys(estado).sort(), [...CLAVES, ...OPCIONALES].sort());
});

test("la secuencia de todos los dominios deja el estado en la foto", async () => {
  const { useHublyStore } = await cargar();
  reiniciar(useHublyStore);
  ejecutarSecuencia(useHublyStore);
  const estado = useHublyStore.getState();
  assert.deepEqual(JSON.parse(normalizarIds(JSON.stringify(foto(estado)))), FOTO);
  // La bitácora no repite la marca de tiempo del reloj fijo en la foto.
  assert.deepEqual([...new Set(estado.activityEvents.map((e) => e.timestamp))], [RELOJ]);
  // `teamMembers` y `dashboardWidgets` son copias: solo las mueve quien las escribe.
  assert.deepEqual(estado.teamMembers.map((m) => [m.id.replace(/-\d+$/, ""), m.role]), [
    ["tm-uno", "Owner"], ["tm", "Editor"], ["tm", "Editor"],
  ]);
  assert.deepEqual(
    estado.dashboardWidgets,
    estadoFijo().widgets.map((w) => ({ ...w, enabled: w.visible }))
  );
});

test("cada acción guarda las veces de siempre", async () => {
  const { useHublyStore } = await cargar();
  reiniciar(useHublyStore);
  const pasos = ejecutarSecuencia(useHublyStore);
  assert.deepEqual(Object.fromEntries(pasos.map((p) => [p.accion, p.guardados])), GUARDADOS);
  assert.equal(guardados.length, TOTAL_GUARDADOS);
});

test("el documento guardado lleva todos los campos de siempre", async () => {
  const { useHublyStore } = await cargar();
  reiniciar(useHublyStore);
  ejecutarSecuencia(useHublyStore);
  const documento = guardados[guardados.length - 1];
  // El orden del literal no es parte de la forma.
  assert.deepEqual(Object.keys(documento).sort(), [...DOCUMENTO].sort());
  assert.equal(documento.schemaVersion, 2);
  assert.equal(documento.workspaceId, "prueba");
  assert.equal((documento.notifications as unknown[]).length, 3);
});

test("addBrand crea la marca con su canal, su evento y un solo guardado", async () => {
  const { useHublyStore } = await cargar();
  reiniciar(useHublyStore);
  const antes = useHublyStore.getState().activityEvents.length;
  useHublyStore.getState().addBrand({ name: "Marca Nueva", industry: "Moda" });
  const estado = useHublyStore.getState();
  const creada = estado.brands[1];

  assert.match(creada.id, /^brand-\d+$/);
  assert.equal(creada.slug, "marca-nueva");
  assert.equal(creada.handle, "@marcanueva");
  assert.equal(creada.initials, "MA");
  assert.equal(creada.shareToken, "marca-nueva-nov");
  assert.equal(creada.commitments.postsCommitted, 12);
  assert.equal(creada.commitments.periodHistory.trimestre.postsCommitted, 36);
  assert.equal(creada.core.personas.length, 1);
  assert.equal(creada.bioLink.handle, "marca-nueva");
  assert.equal(estado.brands.length, 2);
  assert.equal(estado.activeBrandId, creada.id);
  assert.equal(estado.channels.at(-1)?.id, "ch-marca-nueva");
  assert.equal(estado.onboarding.brandCreatedOrSelected, true);
  assert.equal(estado.activityEvents.length, antes + 1);
  assert.deepEqual(estado.activityEvents[0].metadata, {
    action: "brand_created",
    brandName: "Marca Nueva",
  });
  assert.equal(guardados.length, 1);
});

test("resetWidgetsLayout vuelve a la disposición por defecto y guarda una vez", async () => {
  const { useHublyStore } = await cargar();
  reiniciar(useHublyStore);
  useHublyStore.getState().resetWidgetsLayout();
  assert.deepEqual(useHublyStore.getState().widgets, DEFAULT_WIDGETS_CONFIG);
  assert.equal(guardados.length, 1);
});

// Las cifras salen de correr esta misma prueba contra `main`: no se editan a mano.

/** Lo que compone `useHublyStore` recién importado, sin hidratar. */
const CLAVES: string[] = [
  "acceptTeamInvitation", "activeBrandId", "activeNotebookId", "activityEvents", "addAgent",
  "addAsset", "addAutomation", "addBrand", "addChatChannel", "addChatReminder",
  "addIdea", "addNotebook", "addNotification", "addPostComment", "addProject",
  "addTask", "addTaskList", "ads", "agency", "agencyName",
  "aiDrawerOpen", "aiDrawerPrompt", "appliedRecommendationsMap", "applyRecommendation", "applyRecommendationsBatch",
  "applyReferenceFixture", "approveAllBrandPosts", "assets", "autoSuggestionsModalOpen", "brands",
  "cancelChatScheduled", "cancelTeamInvitation", "channels", "closeComposer", "cmdkOpen",
  "composerDefaultDate", "composerDirty", "composerOpen", "composerPending", "convertIdeaToPost",
  "dashboardWidgets", "deleteAgent", "deleteChatChannel", "deleteChatMessage", "deleteLead",
  "deleteNotebook", "deletePost", "deleteProject", "deleteQuote", "deleteTask",
  "deleteTaskList", "dismissRecommendation", "dismissedRecommendationIds", "duplicateAgent", "duplicatePost",
  "editChatMessage", "editWidgetsMode", "editingPostId", "flushChatQueue", "hydrated",
  "invitations", "inviteModalOpen", "inviteTeamMember", "isReferenceFixture", "markAllNotificationsRead",
  "markChatRead", "markNotificationRead", "messages", "moveLead", "movePost",
  "moveProject", "moveTask", "moveWidget", "newBrandModalOpen", "notebooks",
  "notifications", "onboarding", "openComposer", "patchPost", "posts",
  "profile", "projects", "recordActivityEvent", "recordPublication", "removeAutomation",
  "removeIdea", "renameTaskList", "reorderWidgets", "resetDemoData", "resetWidgetsLayout",
  "resolveComposerPending", "role", "saveLead", "savePost", "saveQuote",
  "scheduleChatMessage", "sendChatMessage", "setActiveBrand", "setActiveNotebookId", "setAiDrawerOpen",
  "setAiDrawerPrompt", "setAutoSuggestionsModalOpen", "setBrandCustomMetrics", "setCalendarActivities", "setChatPreference",
  "setCmdkOpen", "setComposerDirty", "setEditWidgetsMode", "setInviteModalOpen", "setNewBrandModalOpen",
  "setOnboardingDismissed", "setOnboardingMinimized", "setPostResults", "setTestClock", "setWidgetConfigModalOpen",
  "setWidgetMetric", "setWidgetSpan", "setWidgetVisibility", "switchWorkspace", "syncFromServer",
  "tasks", "team", "teamMembers", "testClock", "toggleAutomation",
  "toggleChatPin", "toggleChatReaction", "toggleNotebookPinned", "toggleOnboardingStep", "togglePersonaAccepted",
  "toggleTaskStatus", "toggleWidgetVisibility", "updateAgency", "updateAgent", "updateBrand",
  "updateBrandCommitments", "updateBrandCore", "updateChatChannel", "updateNotebook", "updatePostFields",
  "updatePostStatus", "updateProfile", "updateProject", "updateTask", "updateTeamMember",
  "widgetConfigModalOpen", "widgets", "workspaceId",
];

/**
 * Claves opcionales del documento que el store no declara: las aporta
 * `normalizeWorkspacePayload` al hidratar. Con documento completo el estado
 * pasa de 148 a 158 claves, y F1 tampoco puede perder estas.
 */
const OPCIONALES: string[] = [
  "agents", "automations", "calendarActivities", "chatReminders", "chatScheduled",
  "ideas", "leads", "quotes", "schemaVersion", "taskLists",
];

const GUARDADOS: Record<string, number> = {
  setActiveBrand: 1, updateProfile: 1, updateAgency: 1, setTestClock: 1,
  updateBrand: 1, updateBrandCore: 1, togglePersonaAccepted: 1, updateBrandCommitments: 1,
  setBrandCustomMetrics: 1, applyRecommendation: 1, applyRecommendationsBatch: 1, dismissRecommendation: 1,
  savePost: 1, addAutomation: 1, updatePostStatus: 2, updatePostFields: 1,
  movePost: 1, patchPost: 1, addPostComment: 1, approveAllBrandPosts: 1,
  recordPublication: 1, setPostResults: 1, duplicatePost: 1, deletePost: 1,
  setCalendarActivities: 1, addIdea: 1, convertIdeaToPost: 1, removeIdea: 1,
  saveLead: 1, moveLead: 1, saveQuote: 1, deleteQuote: 1,
  deleteLead: 1, toggleAutomation: 1, removeAutomation: 1, addTask: 1,
  addTaskList: 1, renameTaskList: 1, updateTask: 1, toggleTaskStatus: 1,
  moveTask: 1, deleteTask: 1, deleteTaskList: 1, addAgent: 1,
  updateAgent: 1, duplicateAgent: 1, deleteAgent: 1, addNotebook: 1,
  updateNotebook: 1, toggleNotebookPinned: 1, deleteNotebook: 1, inviteTeamMember: 1,
  acceptTeamInvitation: 1, cancelTeamInvitation: 1, updateTeamMember: 1, recordActivityEvent: 1,
  toggleWidgetVisibility: 1, setWidgetVisibility: 1, reorderWidgets: 1, moveWidget: 1,
  setWidgetSpan: 1, setWidgetMetric: 1, toggleOnboardingStep: 1, setOnboardingDismissed: 1,
  setOnboardingMinimized: 1, addNotification: 1, markNotificationRead: 1, markAllNotificationsRead: 1,
  addAsset: 1, addProject: 1, updateProject: 1, moveProject: 1,
  deleteProject: 1, addChatChannel: 1, sendChatMessage: 1, markChatRead: 1,
  editChatMessage: 1, toggleChatReaction: 1, toggleChatPin: 1, updateChatChannel: 1,
  setChatPreference: 0, scheduleChatMessage: 1, addChatReminder: 1, flushChatQueue: 3,
  cancelChatScheduled: 1, deleteChatMessage: 1, deleteChatChannel: 1, openComposer: 0,
  setComposerDirty: 0, closeComposer: 0, setCmdkOpen: 0, setAiDrawerOpen: 0,
  setAiDrawerPrompt: 0, setNewBrandModalOpen: 0, setInviteModalOpen: 0, setWidgetConfigModalOpen: 0,
  setAutoSuggestionsModalOpen: 0, setEditWidgetsMode: 0, setActiveNotebookId: 0,
};

const TOTAL_GUARDADOS = 102;

const DOCUMENTO: string[] = [
  "schemaVersion", "workspaceId", "agencyName", "profile",
  "agency", "testClock", "activeBrandId", "brands",
  "posts", "ideas", "leads", "quotes",
  "automations", "agents", "tasks", "taskLists",
  "calendarActivities", "notebooks", "assets", "projects",
  "ads", "channels", "messages", "chatScheduled",
  "chatReminders", "team", "invitations", "activityEvents",
  "notifications", "widgets", "onboarding", "dismissedRecommendationIds",
  "appliedRecommendationsMap",
];

const FOTO: unknown = JSON.parse(String.raw`
{
 "activeBrandId": "marca-uno",
 "activeNotebookId": null,
 "activityEvents": [
  "[\"session_active\",\"tm-uno\",\"marca-uno\",15,null]",
  "[\"session_active\",\"tm-uno\",\"marca-uno\",5,{\"invitedEmail\":\"otra@agencia.demo\",\"role\":\"Editor\"}]",
  "[\"session_active\",\"tm-uno\",\"marca-uno\",5,{\"invitedEmail\":\"nueva@agencia.demo\",\"role\":\"Editor\"}]",
  "[\"notebook_updated\",\"tm-uno\",\"marca-uno\",10,{\"notebookId\":\"<id:1>\",\"title\":\"LIBRETA QUE SE BORRA\"}]",
  "[\"notebook_updated\",\"tm-uno\",\"marca-uno\",10,{\"notebookId\":\"<id:2>\",\"title\":\"LIBRETA FIJA\"}]",
  "[\"task_started\",\"tm-1\",\"marca-uno\",15,{\"taskId\":\"<id:3>\",\"title\":\"Tarea que se borra\"}]",
  "[\"task_completed\",\"tm-1\",\"marca-uno\",20,{\"taskId\":\"<id:4>\",\"title\":\"Tarea fija\"}]",
  "[\"task_started\",\"tm-1\",\"marca-uno\",15,{\"taskId\":\"<id:4>\",\"title\":\"Tarea fija\"}]",
  "[\"post_approved\",\"tm-uno\",\"marca-uno\",5,{\"postId\":\"<id:5>\",\"status\":\"approved\"}]",
  "[\"post_submitted\",\"tm-uno\",\"marca-uno\",15,{\"postId\":\"<id:5>\",\"status\":\"pending\"}]",
  "[\"post_submitted\",\"tm-uno\",\"marca-uno\",25,{\"postId\":\"<id:5>\",\"title\":\"Post de prueba\"}]",
  "[\"commitment_updated\",\"tm-uno\",\"marca-uno\",10,{\"recommendationId\":\"rec-marca-uno-posts-upgrade\",\"ruleId\":\"CONSISTENT_CAPACITY_UPGRADE\",\"recommendedCommitted\":11}]",
  "[\"commitment_updated\",\"tm-uno\",\"marca-uno\",15,{\"period\":\"mes_actual\"}]",
  "[\"commitment_updated\",\"tm-uno\",\"marca-uno\",15,{\"period\":\"mes_actual\"}]"
 ],
 "ads": [],
 "agency": {
  "activeDays": 30,
  "activeStreak": 4,
  "currency": "MXN",
  "id": "agencia-uno",
  "name": "Agencia Dos",
  "plan": "Studio",
  "timezone": "UTC"
 },
 "agencyName": "Agencia Dos",
 "agents": [
  {
   "cadence": "",
   "createdAt": "2026-05-14T10:00:00.049Z",
   "id": "<id:6>",
   "messages": [],
   "name": "Nuevo agente",
   "notes": [],
   "purpose": "Reportes"
  }
 ],
 "aiDrawerOpen": true,
 "aiDrawerPrompt": "Hola",
 "appliedRecommendationsMap": {
  "rec-marca-uno-posts-upgrade": true
 },
 "assets": [
  {
   "aiTags": [],
   "brandId": "marca-uno",
   "cover": "steam",
   "folder": "General",
   "id": "<id:7>",
   "kind": "image",
   "name": "Arte",
   "sizeLabel": "1 MB",
   "uploadedAt": "Ahora mismo",
   "usedInPosts": 0
  }
 ],
 "autoSuggestionsModalOpen": true,
 "automations": [
  {
   "action": "notify",
   "enabled": true,
   "id": "<id:8>",
   "lastRunAt": "2026-05-14T10:00:00.015Z",
   "name": "Aviso al enviar",
   "runs": 1,
   "text": "Revisar {post}",
   "trigger": "post_pending"
  }
 ],
 "brands": [
  {
   "bioLink": "marca-uno",
   "city": "Puebla",
   "color": "#0a7a55",
   "compromisos": {
    "hasDeclaredCommitments": true,
    "historial": [
     [
      "mes_actual",
      11,
      5
     ],
     [
      "mes_anterior",
      10,
      10
     ],
     [
      "trimestre",
      30,
      6
     ]
    ],
    "metricas": [],
    "postsCommitted": 11,
    "postsCompleted": 5
   },
   "handle": "@marcauno",
   "hasPaidAds": false,
   "healthScore": 80,
   "healthStatus": "en_progreso",
   "id": "marca-uno",
   "industry": "Comercio",
   "initials": "MU",
   "monthlyPostTarget": 11,
   "name": "Marca Uno",
   "paidAdsLabel": "sin pauta",
   "personas": [
    [
     "persona-uno",
     true
    ]
   ],
   "shareToken": "marca-uno-nov",
   "slug": "marca-uno",
   "tono": "Directo"
  }
 ],
 "calendarActivities": [
  {
   "id": "act-uno",
   "kind": "evento"
  }
 ],
 "channels": [
  {
   "id": "ch-general",
   "name": "General",
   "type": "general",
   "unread": 0
  },
  {
   "id": "<id:9>",
   "mentioned": false,
   "muted": true,
   "name": "Equipo dos",
   "type": "agency",
   "unread": 0
  }
 ],
 "chatReminders": [],
 "chatScheduled": [
  {
   "authorId": "perfil-uno",
   "channelId": "<id:9>",
   "id": "<id:10>",
   "repeat": "weekly",
   "sendAt": 1778752920000,
   "sender": "Ana Ruiz",
   "senderInitials": "AR",
   "text": "Programado dos"
  }
 ],
 "cmdkOpen": true,
 "composerDefaultDate": "2026-05-14",
 "composerDirty": false,
 "composerOpen": false,
 "composerPending": null,
 "dismissedRecommendationIds": [
  "rec-descartada"
 ],
 "editWidgetsMode": true,
 "editingPostId": null,
 "hydrated": true,
 "ideas": [
  {
   "brandId": "marca-uno",
   "convertedPostId": "<id:11>",
   "createdAt": "2026-05-14T10:00:00.026Z",
   "id": "<id:12>",
   "notes": "Notas",
   "pillar": "Producto",
   "title": "Idea fija"
  }
 ],
 "invitations": [
  {
   "brandIds": [
    "marca-uno"
   ],
   "createdAt": "2026-05-14T10:00:00.058Z",
   "email": "nueva@agencia.demo",
   "id": "<id:13>",
   "inviteLink": "https://hubly.cm/invite/mp5bhohm",
   "name": "Nueva",
   "role": "Editor",
   "status": "Aceptada"
  }
 ],
 "inviteModalOpen": true,
 "isReferenceFixture": false,
 "leads": [
  {
   "company": "Compra Fija",
   "createdAt": "2026-05-14T10:00:00.030Z",
   "email": "cliente@ejemplo.com",
   "id": "<id:14>",
   "name": "Cliente Fijo",
   "notes": "Nota",
   "phone": "555",
   "source": "Sitio",
   "stage": "contactado",
   "value": 1000
  }
 ],
 "messages": [
  {
   "channelId": "<id:9>",
   "createdAt": 1778752800084,
   "id": "<id:15>",
   "sender": "Ana Ruiz",
   "senderInitials": "AR",
   "text": "Hola",
   "time": "10:00"
  },
  {
   "channelId": "<id:9>",
   "createdAt": 1778752800085,
   "editedAt": 1778752800088,
   "id": "<id:16>",
   "pinned": true,
   "reactions": {
    "pulgar": [
     "Ana"
    ]
   },
   "sender": "Ana Ruiz",
   "senderInitials": "AR",
   "text": "Adiós a todos",
   "time": "10:00"
  },
  {
   "channelId": "<id:9>",
   "createdAt": 1778752800095,
   "id": "<id:17>",
   "sender": "Ana Ruiz",
   "senderInitials": "AR",
   "text": "Vencido",
   "time": "10:00"
  }
 ],
 "newBrandModalOpen": true,
 "notebooks": [
  {
   "accentColor": "#10B981",
   "bgGradient": "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
   "brandId": "marca-uno",
   "category": "Ideas",
   "content": "",
   "id": "<id:2>",
   "isPinned": true,
   "stamp": "N° 01 · OCT 26",
   "subtitle": "N° 01 · OCT 26",
   "title": "LIBRETA FIJA",
   "updatedAt": "2026-05-14T10:00:00.055Z",
   "updatedBy": "Beto Lara",
   "variant": "space"
  }
 ],
 "notifications": [
  {
   "actionUrl": "/chat?c=<id:9>&m=<id:16>",
   "body": "Recordar",
   "createdAt": "Ahora mismo",
   "id": "<id:18>",
   "kind": "sistema",
   "read": false,
   "title": "Recordatorio del chat"
  },
  {
   "body": "Cuerpo",
   "createdAt": "Ahora mismo",
   "id": "<id:19>",
   "kind": "sistema",
   "read": true,
   "title": "Aviso"
  },
  {
   "actionUrl": "/parrillas",
   "body": "Revisar Post de prueba",
   "brandId": "marca-uno",
   "createdAt": "Ahora mismo",
   "id": "<id:20>",
   "kind": "sistema",
   "read": true,
   "title": "Aviso al enviar"
  }
 ],
 "onboarding": {
  "brandCreatedOrSelected": true,
  "dismissed": true,
  "manualOverrides": {
   "redes": true
  },
  "minimized": true,
  "postCreatedOrScheduled": true,
  "taskCreatedOrCompleted": true,
  "teamCheckedOrInvited": true
 },
 "posts": [
  {
   "activity": [
    [
     "Beto Lara",
     "Creó el post desde una idea",
     "2026-05-14T10:00:00.027Z"
    ]
   ],
   "assignee": "Beto Lara",
   "brandId": "marca-uno",
   "caption": "Notas",
   "comments": [],
   "cover": "steam",
   "format": "Carrusel",
   "id": "<id:11>",
   "network": "Instagram",
   "networks": [
    "Instagram"
   ],
   "pillar": "Producto",
   "scheduledDate": "2026-05-14",
   "scheduledTime": "11:30",
   "status": "draft",
   "statusLabel": "Borrador",
   "title": "Idea fija"
  },
  {
   "activity": [
    [
     "Beto Lara",
     "Capturó resultados a mano",
     "2026-05-14T10:00:00.022Z"
    ],
    [
     "Beto Lara",
     "Registró la publicación a mano",
     "2026-05-14T10:00:00.021Z"
    ],
    [
     "Ana Ruiz",
     "Aprobó el post en lote",
     "2026-05-14T10:00:00.020Z"
    ],
    [
     "Beto Lara",
     "Movió la fecha a 2026-05-20",
     "2026-05-14T10:00:00.017Z"
    ],
    [
     "Beto Lara",
     "Actualizó el post desde el calendario",
     "2026-05-14T10:00:00.016Z"
    ],
    [
     "Ana Ruiz",
     "Cambió el estado a «En aprobación»",
     "2026-05-14T10:00:00.015Z"
    ],
    [
     "Beto Lara",
     "Creó el post",
     "2026-05-14T10:00:00.013Z"
    ]
   ],
   "assignee": "Ana Ruiz",
   "brandId": "marca-uno",
   "caption": "Copy fijo",
   "comments": [
    [
     "Ana Ruiz",
     "agency",
     "Listo",
     "Ahora mismo"
    ],
    [
     "Ana Ruiz",
     "agency",
     "Va bien",
     "Ahora mismo"
    ],
    [
     "Ana Ruiz",
     "agency",
     "Aprobado en lote por la agencia.",
     "Ahora mismo"
    ]
   ],
   "cover": "steam",
   "format": "Imagen",
   "id": "<id:5>",
   "metrics": {
    "comments": 2,
    "likes": 10,
    "reach": 100,
    "saves": 1,
    "shares": 1
   },
   "metricsSource": "manual",
   "network": "Instagram",
   "networks": [
    "Instagram"
   ],
   "notes": "Pendiente de arte",
   "pillar": "Comunidad",
   "publishedUrl": "https://redes.ejemplo/p/1",
   "scheduledDate": "2026-05-14",
   "scheduledTime": "10:00",
   "status": "published",
   "statusLabel": "Publicado",
   "title": "Post de prueba"
  }
 ],
 "profile": {
  "avatarInitial": "BL",
  "email": "ana@agencia.demo",
  "id": "perfil-uno",
  "locale": "es-MX",
  "name": "Beto Lara",
  "role": "Owner",
  "timezone": "UTC"
 },
 "projects": [
  {
   "brandId": "marca-uno",
   "deliverablesCount": 1,
   "description": "",
   "dueDate": "2026-05-14",
   "id": "<id:21>",
   "progress": 50,
   "status": "Revisión",
   "title": "Proyecto"
  }
 ],
 "quotes": [
  {
   "createdAt": "2026-05-14T10:00:00.034Z",
   "id": "<id:22>",
   "items": [],
   "leadId": "<id:14>",
   "status": "Borrador",
   "title": "COT-2"
  }
 ],
 "role": null,
 "schemaVersion": 2,
 "taskLists": [],
 "tasks": [
  {
   "assignee": "Ana Ruiz",
   "assigneeId": "tm-1",
   "assigneeInitial": "A",
   "assigneeName": "Ana Ruiz",
   "brandId": "marca-uno",
   "completed": false,
   "dueBucket": "today",
   "dueDate": "2026-05-14",
   "dueLabel": "Completada",
   "id": "<id:4>",
   "listName": "Primeros pasos",
   "priority": "alta",
   "status": "in_progress",
   "tags": [
    "Marca Uno",
    "Primeros pasos"
   ],
   "title": "Tarea fija"
  }
 ],
 "team": [
  [
   "tm-uno",
   "Beto Lara",
   "Admin",
   "Activo",
   [
    "marca-uno"
   ],
   1,
   10
  ],
  [
   "<id:23>",
   "Nueva",
   "Editor",
   "Invitado",
   [
    "marca-uno"
   ],
   1,
   50
  ],
  [
   "<id:24>",
   "Otra",
   "Editor",
   "Invitado",
   [
    "marca-uno"
   ],
   1,
   50
  ]
 ],
 "testClock": {
  "fixedIsoNow": "2026-05-14T10:00:00.000Z"
 },
 "widgetConfigModalOpen": true,
 "widgets": [
  [
   "tareas",
   false,
   1,
   "left",
   2,
   null
  ],
  [
   "posts",
   true,
   2,
   "right",
   null,
   "ctr"
  ]
 ],
 "workspaceId": "prueba"
}
`);
