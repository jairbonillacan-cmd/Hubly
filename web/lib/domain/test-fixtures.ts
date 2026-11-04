import type { BrandWorkspace, PostItem, TaskItem } from "../types";

export const task = (overrides: Partial<TaskItem>): TaskItem =>
  ({
    id: "t",
    title: "Tarea",
    brandId: "a",
    dueLabel: "",
    dueDate: "2026-10-31",
    assignee: "Ana",
    assigneeId: "tm-2",
    assigneeName: "Ana",
    assigneeInitial: "A",
    listName: "General",
    status: "pendiente",
    priority: "media",
    completed: false,
    tags: [],
    ...overrides,
  }) as TaskItem;

export const post = (overrides: Partial<PostItem>): PostItem =>
  ({
    id: "p",
    brandId: "a",
    title: "Post",
    caption: "",
    networks: ["Instagram"],
    format: "Imagen",
    scheduledDate: "2026-10-31",
    scheduledTime: "10:00",
    status: "approved",
    assignee: "Ana",
    pillar: "Contenido",
    comments: [],
    ...overrides,
  }) as unknown as PostItem;

export const brand = (overrides: Partial<BrandWorkspace>): BrandWorkspace =>
  ({
    id: "a",
    name: "Marca A",
    slug: "marca-a",
    handle: "@a",
    shareToken: "tk",
    initials: "MA",
    initial: "M",
    color: "#000",
    avatarBg: "#fff",
    avatarColor: "#000",
    industry: "Moda",
    city: "CDMX",
    connectedNetworks: [],
    Networks: [],
    monthlyPostTarget: 12,
    monthlyBudget: 0,
    adBudget: 0,
    hasPaidAds: false,
    paidAdsLabel: "sin pauta",
    healthStatus: "en_progreso",
    healthScore: 50,
    commitments: { hasDeclaredCommitments: false },
    ...overrides,
  }) as unknown as BrandWorkspace;

export const RELOJ = "2026-10-31T18:00:00Z"; // 12:00 en America/Mexico_City
