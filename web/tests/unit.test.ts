import { createSeedWorkspaceData, rebaseStaleFixture } from "../lib/seed-data";
import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dueLabelFor, localIsoDate } from "../lib/date";
import { notebookPlainText, notebookTasks, notebookToHtml } from "../lib/notebook-content";
import { buildCaptionSystemPrompt } from "../lib/ai-caption";
import { buildMonthlyReport } from "../lib/reporting";
import { safeNextPath } from "../lib/supabase/config";
import type { SocialPost } from "../lib/types";
import { moveInList } from "../lib/use-kanban-drag";

test("localIsoDate usa la fecha local", () => {
  assert.equal(localIsoDate(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("addDays cruza meses", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("dueLabelFor describe fechas relativas", () => {
  const today = "2026-10-30";
  assert.equal(dueLabelFor("2026-10-30", today), "Hoy");
  assert.equal(dueLabelFor("2026-10-31", today), "Mañana");
  assert.equal(dueLabelFor("2026-10-29", today), "Ayer");
  assert.equal(dueLabelFor("2026-10-27", today), "Hace 3 días");
  assert.equal(dueLabelFor("2026-11-02", today), "En 3 días");
  assert.equal(dueLabelFor("", today), "Sin fecha");
});

test("moveInList reordena y aplica el cambio", () => {
  const list = [{ id: "a", s: 1 }, { id: "b", s: 1 }, { id: "c", s: 1 }];
  const before = moveInList(list, "c", "a", (x) => ({ ...x, s: 2 }));
  assert.deepEqual(before.map((x) => x.id), ["c", "a", "b"]);
  assert.equal(before[0].s, 2);
  assert.deepEqual(moveInList(list, "a", null, (x) => x).map((x) => x.id), ["b", "c", "a"]);
  assert.equal(moveInList(list, "zzz", null, (x) => x), list);
  assert.equal(moveInList(list, "a", "a", (x) => x), list);
});

test("notebookToHtml escapa texto plano y respeta HTML", () => {
  assert.equal(notebookToHtml("a < b\nc"), "<p>a &lt; b</p><p>c</p>");
  assert.equal(notebookToHtml("<p>hola</p>"), "<p>hola</p>");
  assert.equal(notebookToHtml(""), "");
});

test("notebookPlainText ignora las etiquetas", () => {
  assert.equal(notebookPlainText("<p>uno</p><p></p><ul><li>dos</li></ul>"), "uno dos");
  assert.equal(notebookPlainText("<p></p>"), "");
});

test("notebookTasks devuelve solo pendientes de listas de tareas", () => {
  const html =
    '<p>nota</p><ul data-type="taskList">' +
    '<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Pedir fotos</p></div></li>' +
    '<li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>Hecha</p></div></li>' +
    '<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Con &amp; signo</p></div></li>' +
    "</ul><ul><li>viñeta normal</li></ul>";
  assert.deepEqual(notebookTasks(html), ["Pedir fotos", "Con & signo"]);
});

test("safeNextPath bloquea redirecciones externas", () => {
  assert.equal(safeNextPath("/crm?x=1"), "/crm?x=1");
  assert.equal(safeNextPath("//evil.com"), "/dashboard");
  assert.equal(safeNextPath("https://evil.com"), "/dashboard");
  assert.equal(safeNextPath("/\\evil.com"), "/dashboard");
  assert.equal(safeNextPath(null, "/onboarding"), "/onboarding");
});

test("buildMonthlyReport solo cuenta publicados medidos del mes", () => {
  const base = { brandId: "b", networks: ["Instagram"], comments: [] } as unknown as SocialPost;
  const metrics = { reach: 100, likes: 10, comments: 5, saves: 2, shares: 5 };
  const posts = [
    { ...base, id: "1", scheduledDate: "2026-11-02", status: "published", network: "Instagram", metrics },
    { ...base, id: "2", scheduledDate: "2026-11-03", status: "published", network: "TikTok" },
    { ...base, id: "3", scheduledDate: "2026-11-04", status: "pending", metrics },
    { ...base, id: "4", scheduledDate: "2026-12-01", status: "published", metrics },
  ] as SocialPost[];
  const r = buildMonthlyReport(posts, "2026-11");
  assert.equal(r.planned, 3);
  assert.equal(r.published, 2);
  assert.equal(r.measured, 1);
  assert.equal(r.reach, 100);
  assert.equal(r.interactions, 20);
  assert.equal(r.engagementRate, 20);
  assert.deepEqual(r.byNetwork.map((n) => n.network), ["Instagram", "TikTok"]);
  assert.equal(buildMonthlyReport([], "2026-11").engagementRate, null);
});

test("el prompt de IA incluye la voz de la marca y limita lo que recibe", () => {
  const p = buildCaptionSystemPrompt({ name: "Sol", toneOfVoice: "cercano", dontWords: ["barato"] }, "Instagram", "Reel");
  assert.match(p, /Marca: Sol/);
  assert.match(p, /Tono de voz: cercano/);
  assert.match(p, /evita: barato/);
  assert.match(p, /No inventes/);
  assert.ok(buildCaptionSystemPrompt({ name: "x".repeat(5000) }).length < 1000);
});

test("repara un espacio con el reloj de prueba sin perder lo creado", () => {
  const stale = createSeedWorkspaceData("prueba", { referenceFixture: true });
  stale.tasks.push({ ...stale.tasks[0], id: "propia", title: "dsa", dueDate: "2026-12-24" });
  const fixed = rebaseStaleFixture(stale);
  assert.equal(fixed.testClock?.fixedIsoNow, null);
  assert.ok(!JSON.stringify(fixed.tasks).includes("2026-04-19"));
  assert.equal(fixed.tasks.find((t) => t.id === "propia")?.dueDate, "2026-12-24");
  assert.equal(rebaseStaleFixture(fixed), fixed);
});

test("la reparación de fechas respeta lo editado por el usuario", () => {
  const stale = createSeedWorkspaceData("prueba", { referenceFixture: true });
  const fixtureDate = "2026-04-19";
  const seedTask = stale.tasks.find((t) => t.dueDate === fixtureDate);
  const edited = stale.tasks.find((t) => t !== seedTask);
  assert.ok(seedTask && edited);
  edited.title = `Reunión del ${fixtureDate}`;
  edited.dueDate = fixtureDate;
  stale.tasks.push({ ...stale.tasks[0], id: "propia", title: `Cierre ${fixtureDate}`, dueDate: fixtureDate });
  const fixed = rebaseStaleFixture(stale);
  const moved = fixed.tasks.find((t) => t.id === seedTask.id);
  assert.notEqual(moved?.dueDate, fixtureDate);
  const own = fixed.tasks.find((t) => t.id === "propia");
  assert.equal(own?.dueDate, fixtureDate);
  assert.equal(own?.title, `Cierre ${fixtureDate}`);
  assert.equal(fixed.tasks.find((t) => t.id === edited.id)?.title, `Reunión del ${fixtureDate}`);
  assert.equal(rebaseStaleFixture(fixed), fixed);
});

test("aprobar no publica: ni evento de publicación ni etiqueta de programado", async () => {
  const { useHublyStore } = await import("../lib/store");
  const seed = createSeedWorkspaceData("prueba");
  const brandId = seed.brands[0].id;
  const post = { ...seed.posts[0], id: "aprobable", brandId, status: "pending" as const };
  useHublyStore.setState({ ...seed, posts: [post], activityEvents: [], role: null });
  useHublyStore.getState().approveAllBrandPosts(brandId, "Ana", "agency");
  const state = useHublyStore.getState();
  assert.equal(state.posts[0].status, "approved");
  assert.equal(state.posts[0].statusLabel, "Aprobado");
  assert.deepEqual(state.activityEvents.map((e) => e.type), ["post_approved"]);
  assert.equal(state.activityEvents[0].metadata?.postId, "aprobable");
  useHublyStore.getState().approveAllBrandPosts(brandId, "Ana", "agency");
  assert.equal(useHublyStore.getState().activityEvents.length, 1);
});

test("un lector no cambia datos desde el store", async () => {
  const { useHublyStore } = await import("../lib/store");
  const seed = createSeedWorkspaceData("prueba");
  useHublyStore.setState({ ...seed, role: "viewer" });
  const before = useHublyStore.getState().tasks.length;
  useHublyStore.getState().deleteTask(seed.tasks[0].id);
  assert.equal(useHublyStore.getState().tasks.length, before);
  useHublyStore.getState().openComposer();
  assert.equal(useHublyStore.getState().composerOpen, true);
  useHublyStore.setState({ role: null, composerOpen: false });
});

test("un 409 conserva el cambio hasta que la persona elige", async () => {
  const live = await import("../lib/live-workspace");
  const saved: unknown[] = [];
  const responses = [
    new Response(JSON.stringify({ data: {}, version: 1, agencyId: "a1", role: "editor" })),
    new Response("{}", { status: 409 }),
    new Response(JSON.stringify({ version: 5 })),
    new Response(JSON.stringify({ version: 6 })),
  ];
  const store = new Map<string, string>();
  Object.assign(globalThis, {
    window: new EventTarget(),
    CustomEvent: globalThis.CustomEvent,
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) },
    fetch: async (_url: string, init?: RequestInit) => {
      if (init?.body) saved.push(JSON.parse(String(init.body)));
      return responses.shift();
    },
  });
  await live.loadLiveWorkspace();
  const mine = { agencyName: "mía" } as never;
  live.queueLiveSave(mine);
  await new Promise((r) => setTimeout(r, 560));
  assert.equal(live.hasPendingSave(), true);
  assert.ok(store.has("hubly:conflicto:a1"));
  await live.keepMyVersion();
  assert.equal(live.hasPendingSave(), false);
  assert.equal(store.has("hubly:conflicto:a1"), false);
  assert.deepEqual(saved.at(-1), { agencyId: "a1", version: 5, data: mine });
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
});

test("Post v2: el medio heredado se convierte una vez y los campos nuevos sobreviven", async () => {
  const { normalizeWorkspacePayload } = await import("../lib/workspace-repository");
  const seed = createSeedWorkspaceData("prueba");
  const legacy = { ...seed.posts[0], id: "viejo", mediaUrl: "data:image/jpeg;base64,AAA", media: undefined };
  const nuevo = {
    ...seed.posts[0],
    id: "nuevo",
    media: [{ id: "m", kind: "video" as const, name: "a.mp4", assetId: "x" }],
    platformSettings: { Pinterest: { caption: "pin", boardName: "Tablero" } },
    workflowStatusId: "diseno",
    assigneeIds: ["a", "b"],
    customFields: { prioridad: "alta" },
    scheduledDate: "",
  };
  const once = normalizeWorkspacePayload({ ...seed, posts: [legacy, nuevo] }, "prueba");
  const twice = normalizeWorkspacePayload(once, "prueba");
  assert.deepEqual(twice.posts, once.posts);
  assert.equal(once.schemaVersion, 2);
  const viejo = once.posts.find((p) => p.id === "viejo");
  assert.equal(viejo?.media?.[0]?.url, legacy.mediaUrl);
  assert.equal(viejo?.mediaUrl, legacy.mediaUrl);
  const guardado = once.posts.find((p) => p.id === "nuevo");
  assert.deepEqual(guardado?.media, nuevo.media);
  assert.deepEqual(guardado?.platformSettings, nuevo.platformSettings);
  assert.equal(guardado?.workflowStatusId, "diseno");
  assert.deepEqual(guardado?.assigneeIds, ["a", "b"]);
  assert.equal(guardado?.scheduledDate, "");
});

test("los límites de archivos se aplican por tipo", async () => {
  const { mediaRejection, mp4UsesHevc, MAX_VIDEO_BYTES, MAX_IMAGE_BYTES } = await import("../lib/media");
  assert.equal(mediaRejection("image/png", MAX_IMAGE_BYTES), null);
  assert.ok(mediaRejection("image/png", MAX_IMAGE_BYTES + 1));
  assert.equal(mediaRejection("video/mp4", MAX_VIDEO_BYTES), null);
  assert.ok(mediaRejection("video/mp4", MAX_VIDEO_BYTES + 1));
  assert.ok(mediaRejection("application/x-msdownload", 10));
  assert.ok(mediaRejection("image/svg+xml", 10));
  assert.equal(mp4UsesHevc(new TextEncoder().encode("moov....stsd........hvc1")), true);
  assert.equal(mp4UsesHevc(new TextEncoder().encode("moov....stsd........avc1")), false);
});

test("catálogo de redes: límites, corte del feed y reglas por red", async () => {
  const { captionLevel, feedCutIndex, networkIssues, NETWORKS } = await import("../lib/network-catalog");
  assert.equal(NETWORKS.length, 10);
  assert.equal(captionLevel(260, 280), "near");
  assert.equal(captionLevel(281, 280), "over");
  assert.equal(captionLevel(10, 280), "ok");
  assert.equal(feedCutIndex("a".repeat(126), "Instagram"), 125);
  assert.equal(feedCutIndex("a".repeat(126), "X"), null);
  assert.equal(feedCutIndex("a\nb\nc\nd", "Facebook"), 5);
  const issues = (network: Parameters<typeof networkIssues>[0]["networks"][number], media: { kind: "image" | "video" }[], caption = "Hola") =>
    networkIssues({ networks: [network], caption, media }).map((i) => i.message);
  assert.ok(issues("Google Business", [{ kind: "video" }]).some((m) => m.includes("No admite videos")));
  assert.ok(issues("YouTube", [{ kind: "image" }]).some((m) => m.includes("video")));
  assert.deepEqual(issues("TikTok", [{ kind: "video" }]), []);
  assert.ok(issues("TikTok", [{ kind: "image" }]).length > 0);
  assert.ok(issues("X", [], "a".repeat(281)).some((m) => m.includes("280")));
  assert.ok(issues("Reddit", []).some((m) => m.includes("título")));
});

test("borrador: ida y vuelta sin perder datos, herencia y sin fecha", async () => {
  const { draftFromPost, draftToPost, captionFor, loadRecovery, saveRecovery, clearAllRecoveries, recoveryKey } = await import("../lib/post-draft");
  const seed = createSeedWorkspaceData("prueba");
  const post = {
    ...seed.posts[0],
    media: [{ id: "m", kind: "image" as const, name: "a.png", assetId: "x" }],
    platformSettings: { X: { caption: "solo x" } },
    assigneeIds: ["t1"],
  };
  const draft = draftFromPost(post, { brandId: "otra", assignee: "A" });
  assert.equal(draft.brandId, post.brandId);
  assert.equal(captionFor(draft, "X"), "solo x");
  assert.equal(captionFor(draft, "Instagram"), draft.caption);
  const saved = draftToPost(draft, post, "A");
  assert.deepEqual(saved.media, post.media);
  assert.deepEqual(saved.platformSettings, post.platformSettings);
  assert.equal(saved.mediaUrl, undefined);
  const nuevo = draftFromPost(null, { brandId: "b", assignee: "A" });
  assert.equal(nuevo.scheduledDate, "");
  assert.equal(nuevo.status, "draft");

  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  };
  const key = recoveryKey("u1:a1", "b", null);
  saveRecovery(storage, key, nuevo);
  assert.deepEqual(loadRecovery(storage, key)?.draft, nuevo);
  storage.setItem("otra-clave", "1");
  clearAllRecoveries(storage);
  assert.equal(loadRecovery(storage, key), null);
  assert.equal(storage.getItem("otra-clave"), "1");
});

test("duplicar crea un borrador limpio y eliminar quita el post", async () => {
  const { useHublyStore } = await import("../lib/store");
  const seed = createSeedWorkspaceData("prueba");
  const original = { ...seed.posts[0], id: "orig", status: "published" as const, metrics: { reach: 1, likes: 1, comments: 1, saves: 1, shares: 1 }, publishedUrl: "https://x" };
  useHublyStore.setState({ ...seed, posts: [original], role: null });
  const id = useHublyStore.getState().duplicatePost("orig");
  const copy = useHublyStore.getState().posts.find((p) => p.id === id);
  assert.equal(copy?.status, "draft");
  assert.equal(copy?.scheduledDate, "");
  assert.equal(copy?.metrics, undefined);
  assert.equal(copy?.publishedUrl, undefined);
  useHublyStore.getState().deletePost("orig");
  assert.equal(useHublyStore.getState().posts.some((p) => p.id === "orig"), false);
});

test("calendario: semana desde el lunes, cruce de mes y año, zona de México", async () => {
  const { monthGrid, periodLabel, shiftPeriod, todayInZone, weekDays, publicationLabel, sortPosts, inPeriod } = await import("../lib/calendar-views");
  assert.deepEqual(weekDays("2026-11-01"), ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.equal(weekDays("2026-11-02")[0], "2026-11-02");
  assert.match(periodLabel("2026-11-01", "semana"), /^26 oct.*1 nov.*2026$/);
  assert.match(periodLabel("2026-12-31", "semana"), /28.*dic.*2026.*3 ene.*2027/);
  assert.match(periodLabel("2026-11-15", "mes"), /^Noviembre 2026$/);
  const grid = monthGrid("2026-02-10");
  assert.equal(grid.length % 7, 0);
  assert.equal(new Date(`${grid[0]}T12:00:00Z`).getUTCDay(), 1);
  assert.ok(grid.includes("2026-02-28"));
  assert.equal(shiftPeriod("2026-01-31", "mes", 1), "2026-02-01");
  assert.equal(shiftPeriod("2026-12-15", "mes", 1), "2027-01-01");
  assert.equal(shiftPeriod("2026-12-30", "semana", 1), "2027-01-06");
  assert.equal(inPeriod("", "2026-11-01", "mes"), false);
  // A las 02:00 UTC del 1 de noviembre todavía es 31 de octubre en Ciudad de México.
  assert.equal(todayInZone(new Date("2026-11-01T02:00:00Z")), "2026-10-31");
  assert.equal(publicationLabel({ status: "scheduled", scheduledDate: "2026-10-01" }, "2026-10-31").label, "Pendiente de registrar");
  assert.equal(publicationLabel({ status: "scheduled", scheduledDate: "2026-11-01" }, "2026-10-31").label, "Planificado");
  const posts = [{ title: "b", scheduledDate: "", scheduledTime: "" }, { title: "a", scheduledDate: "2026-10-02", scheduledTime: "" }, { title: "c", scheduledDate: "2026-10-01", scheduledTime: "" }] as never[];
  assert.deepEqual(sortPosts(posts, "fecha", "desc", () => "").map((p: { title: string }) => p.title), ["a", "c", "b"]);
});

test("importar: separadores, comillas, fechas, mapeo y duplicados", async () => {
  const { guessMapping, parseDelimited, parseImportDate, reviewRows } = await import("../lib/post-import");
  assert.deepEqual(parseDelimited('Título,Copy\n"Uno, dos","di ""hola"""\n'), [["Título", "Copy"], ["Uno, dos", 'di "hola"']]);
  assert.deepEqual(parseDelimited("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseDelimited("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
  assert.equal(parseImportDate("12/11/2026"), "2026-11-12");
  assert.equal(parseImportDate("2026-11-12T10:00"), "2026-11-12");
  assert.equal(parseImportDate("31/02/2026"), null);
  assert.equal(parseImportDate("46000"), "2025-12-09");
  assert.equal(parseImportDate("mañana"), null);
  const mapping = guessMapping(["Título", "Descripción", "FECHA", "Red"]);
  assert.deepEqual(mapping, { title: 0, caption: 1, date: 2, networks: 3 });
  const rows = reviewRows(
    [["Uno", "", "2026-11-12", "ig, tiktok"], ["Uno", "", "2026-11-12", "Instagram"], ["", "", "", ""], ["Dos", "", "ayer", "Orkut"]],
    mapping,
    [],
    []
  );
  assert.deepEqual(rows[0].networks, ["Instagram", "TikTok"]);
  assert.equal(rows[0].duplicate, false);
  assert.equal(rows[1].duplicate, true);
  assert.ok(rows[2].errors.length > 0);
  assert.equal(rows[3].errors.length, 2);
  assert.equal(rows[0].row, 2);
});
