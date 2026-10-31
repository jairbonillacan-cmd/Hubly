import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_FILTERS, filterPosts, monthGrid, sortPosts, weekDays } from "./calendar-views";
import type { SocialPost } from "./types";

test("la semana que cruza mes y año empieza en lunes y termina en domingo", () => {
  assert.deepEqual(weekDays("2027-01-01"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  assert.equal(new Date(`${weekDays("2027-01-01")[0]}T12:00:00Z`).getUTCDay(), 1);
  assert.equal(new Date(`${weekDays("2027-01-01")[6]}T12:00:00Z`).getUTCDay(), 0);
});

test("la malla del mes respeta los años bisiestos", () => {
  assert.ok(monthGrid("2028-02-10").includes("2028-02-29"));
  assert.ok(!monthGrid("2026-02-10").includes("2026-02-29"));
  assert.ok(monthGrid("2026-02-10").includes("2026-03-01"));
});

test("los posts sin fecha van al final al ordenar y filterPosts filtra", () => {
  const post = (over: Partial<SocialPost>) =>
    ({ brandId: "b", networks: ["Instagram"], format: "Imagen", title: "", scheduledDate: "", scheduledTime: "", status: "draft", ...over }) as SocialPost;
  const posts = [
    post({ title: "b", scheduledDate: "2026-10-02" }),
    post({ title: "a", scheduledDate: "" }),
    post({ title: "c", scheduledDate: "2026-10-01", scheduledTime: "09:00" }),
    post({ title: "d", scheduledDate: "2026-10-01" }),
  ];
  // Ascendente: por fecha y hora; los dos sin fecha cierran la lista.
  assert.deepEqual(sortPosts(posts, "fecha", "asc", () => "").map((p) => p.title), ["d", "c", "b", "a"]);
  assert.deepEqual(sortPosts(posts, "fecha", "desc", () => "").map((p) => p.title), ["b", "c", "d", "a"]);

  assert.deepEqual(filterPosts(posts, EMPTY_FILTERS).length, 4);
  assert.deepEqual(filterPosts(posts, { statuses: ["draft"], networks: [], formats: [] }).length, 4);
  assert.deepEqual(filterPosts(posts, { statuses: [], networks: ["TikTok"], formats: [] }).length, 0);
  assert.deepEqual(
    filterPosts([post({ networks: ["TikTok"] }), post({ format: "Story" })], { statuses: [], networks: [], formats: ["Story"] }).map((p) => p.format),
    ["Story"]
  );
});
