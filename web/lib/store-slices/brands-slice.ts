// Perfil, agencia, marcas, compromisos y recomendaciones.
import type { StoreApi } from "zustand";
import { selectAccountRecommendations } from "../domain-selectors";
import { backendEnabled } from "../supabase/config";
import type { AccountCommitment, BrandWorkspace, PeriodCommitmentSnapshot, SocialNetwork } from "../types";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState, createActivityItem } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createBrandsSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "updateProfile"
  | "updateAgency"
  | "addBrand"
  | "updateBrand"
  | "updateBrandCore"
  | "togglePersonaAccepted"
  | "updateBrandCommitments"
  | "setBrandCustomMetrics"
  | "applyRecommendation"
  | "applyRecommendationsBatch"
  | "dismissRecommendation"
> => ({
  updateProfile: (patch) => {
    if (backendEnabled && patch.name) {
      const name = patch.name;
      void import("../supabase/browser").then(({ createSupabaseBrowser }) =>
        createSupabaseBrowser().auth.updateUser({ data: { name } })
      );
    }
    set((s) => {
      const nextName = patch.name ?? s.profile.name;
      const nextRole = patch.role ?? s.profile.role;
      const nextAvatarInitial =
        patch.avatarInitial ??
        nextName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("");
      const resolvedInitial = nextAvatarInitial || s.profile.avatarInitial;
      const nextTeam = s.team.map((m, idx) =>
        m.id === "tm-1" || idx === 0
          ? {
              ...m,
              name: nextName,
              role: nextRole,
              initials: resolvedInitial,
              avatarInitial: resolvedInitial.slice(0, 1) || "J",
            }
          : m
      );
      return {
        profile: {
          ...s.profile,
          ...patch,
          name: nextName,
          role: nextRole,
          avatarInitial: resolvedInitial,
        },
        team: nextTeam,
        teamMembers: nextTeam,
      };
    });
    persistWorkspaceState(get());
  },

  updateAgency: (patch) => {
    set((s) => {
      const nextAgency = { ...s.agency, ...patch };
      return {
        agency: nextAgency,
        agencyName: nextAgency.name,
      };
    });
    persistWorkspaceState(get());
  },

  addBrand: (input) => {
    const slug = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `brand-${Date.now()}`;
    const initials = (input.initials || input.name.slice(0, 2)).toUpperCase();
    const initial = (input.initial || initials.slice(0, 1) || "M").toUpperCase();
    const color = input.color || "#0a7a55";
    const networks: SocialNetwork[] =
      input.connectedNetworks && input.connectedNetworks.length > 0
        ? input.connectedNetworks
        : ["Instagram", "TikTok"];
    const monthlyTarget = input.monthlyPostTarget || 12;
    const hasPaidAds = input.hasPaidAds ?? Boolean(input.adBudget && input.adBudget > 0);
    const adBudget = input.adBudget ?? (hasPaidAds ? 450 : 0);

    const commitments: AccountCommitment = {
      period: "mes_actual",
      postsCommitted: monthlyTarget,
      postsCompleted: 0,
      StoriesCommitted: 12,
      StoriesCompleted: 0,
      storiesCommitted: 12,
      storiesCompleted: 0,
      reelsCommitted: 4,
      reelsCompleted: 0,
      adCampaignsCommitted: hasPaidAds ? 2 : 0,
      adCampaignsCompleted: 0,
      hasDeclaredCommitments: true,
      customMetrics: [],
      periodHistory: {
        mes_actual: {
          period: "mes_actual",
          postsCommitted: monthlyTarget,
          postsCompleted: 0,
          StoriesCommitted: 12,
          StoriesCompleted: 0,
          storiesCommitted: 12,
          storiesCompleted: 0,
          reelsCommitted: 4,
          reelsCompleted: 0,
          adCampaignsCommitted: hasPaidAds ? 2 : 0,
          adCampaignsCompleted: 0,
          adSpend: adBudget,
          reachTotal: 12400,
          clicksTotal: 420,
          landingPageViewsPerWeek: 4.5,
          clicksPerWeek: 240,
        },
        mes_anterior: {
          period: "mes_anterior",
          postsCommitted: monthlyTarget,
          postsCompleted: monthlyTarget,
          StoriesCommitted: 12,
          StoriesCompleted: 12,
          storiesCommitted: 12,
          storiesCompleted: 12,
          reelsCommitted: 4,
          reelsCompleted: 4,
          adCampaignsCommitted: hasPaidAds ? 2 : 0,
          adCampaignsCompleted: hasPaidAds ? 2 : 0,
          adSpend: adBudget,
          reachTotal: 18500,
          clicksTotal: 610,
          landingPageViewsPerWeek: 5.2,
          clicksPerWeek: 310,
        },
        trimestre: {
          period: "trimestre",
          postsCommitted: monthlyTarget * 3,
          postsCompleted: monthlyTarget * 2,
          StoriesCommitted: 36,
          StoriesCompleted: 28,
          storiesCommitted: 36,
          storiesCompleted: 28,
          reelsCommitted: 12,
          reelsCompleted: 9,
          adCampaignsCommitted: hasPaidAds ? 6 : 0,
          adCampaignsCompleted: hasPaidAds ? 4 : 0,
          adSpend: adBudget * 3,
          reachTotal: 48200,
          clicksTotal: 1640,
          landingPageViewsPerWeek: 5.0,
          clicksPerWeek: 295,
        },
      },
    };

    const newBrand: BrandWorkspace = {
      id,
      name: input.name,
      handle: input.handle || `@${slug.replace(/-/g, "")}`,
      slug,
      shareToken: `${slug}-nov`,
      initial,
      initials,
      color,
      avatarBg: input.avatarBg || "#ecfdf5",
      avatarColor: input.avatarColor || color,
      industry: input.industry || "Comercio y servicios",
      city: input.city || "Ciudad de México",
      connectedNetworks: networks,
      Networks: networks,
      monthlyPostTarget: monthlyTarget,
      monthlyBudget: input.monthlyBudget ?? 1200,
      adBudget,
      hasPaidAds,
      paidAdsLabel: hasPaidAds ? "con pauta" : "sin pauta",
      healthScore: 90,
      healthStatus: "en_progreso",
      commitments,
      core: {
        whatTheySell: input.whatTheySell || `Productos y servicios de ${input.name}.`,
        category: input.industry || "Marca comercial",
        websiteUrl: `https://${slug}.ejemplo`,
        toneOfVoice: "Directo, claro y cercano a su comunidad.",
        pillars: ["Educación y valor", "Producto en uso", "Comunidad y testimonios"],
        doWords: ["calidad", "hecho a medida", "cercano"],
        dontWords: ["relleno", "spam"],
        personas: [
          {
            id: `bp-${Date.now()}-1`,
            name: "Cliente Ideal Principal",
            ageRange: "26–42 años",
            occupation: "Profesional urbano",
            painPoints: "Busca soluciones confiables sin perder tiempo comparando opciones.",
            motivation: "Calidad constante y atención rápida por canales digitales.",
            accepted: true,
          },
        ],
      },
      bioLink: {
        handle: slug,
        headline: `${input.name} · Enlaces oficiales`,
        whatsapp: "+52 55 0000 0000",
        buttons: [{ id: "btn-1", label: "Hablar por WhatsApp", url: "https://wa.me/525500000000" }],
      },
    };

    set((s) => {
      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId: id,
        metadata: { action: "brand_created", brandName: input.name },
      });
      return {
        brands: [...s.brands, newBrand],
        activeBrandId: id,
        channels: [
          ...s.channels,
          { id: `ch-${slug}`, name: `# ${slug}`, type: "brand", brandId: id, unread: 0 },
        ],
        onboarding: {
          ...s.onboarding,
          brandCreatedOrSelected: true,
        },
        activityEvents: [event, ...s.activityEvents],
        newBrandModalOpen: false,
      };
    });
    persistWorkspaceState(get());
  },

  updateBrand: (brandId, patch) => {
    set((s) => ({
      brands: s.brands.map((b) => {
        if (b.id !== brandId) return b;
        const nextNetworks = patch.connectedNetworks ?? patch.Networks ?? b.connectedNetworks;
        const nextHasPaidAds = patch.hasPaidAds ?? b.hasPaidAds;
        return {
          ...b,
          ...patch,
          connectedNetworks: nextNetworks,
          Networks: nextNetworks,
          hasPaidAds: nextHasPaidAds,
          paidAdsLabel:
            patch.paidAdsLabel ?? (nextHasPaidAds ? "con pauta" : "sin pauta"),
        };
      }),
    }));
    persistWorkspaceState(get());
  },

  updateBrandCore: (brandId, corePatch) => {
    set((s) => ({
      brands: s.brands.map((b) =>
        b.id === brandId ? { ...b, core: { ...b.core, ...corePatch } } : b
      ),
      onboarding: {
        ...s.onboarding,
        brandCreatedOrSelected: true,
      },
    }));
    persistWorkspaceState(get());
  },

  togglePersonaAccepted: (brandId, personaId) => {
    set((s) => ({
      brands: s.brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              core: {
                ...b.core,
                personas: b.core.personas.map((p) =>
                  p.id === personaId ? { ...p, accepted: !p.accepted } : p
                ),
              },
            }
          : b
      ),
    }));
    persistWorkspaceState(get());
  },

  updateBrandCommitments: (brandId, patch, periodKey = "mes_actual") => {
    set((s) => {
      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId,
        metadata: { period: periodKey },
      });

      return {
        brands: s.brands.map((b) => {
          if (b.id !== brandId) return b;
          const prev = b.commitments;
          const prevSnap = prev.periodHistory[periodKey];
          const storiesComm =
            patch.StoriesCommitted ??
            patch.storiesCommitted ??
            prevSnap.StoriesCommitted;
          const storiesComp =
            patch.StoriesCompleted ??
            patch.storiesCompleted ??
            prevSnap.StoriesCompleted;

          const updatedSnap: PeriodCommitmentSnapshot = {
            ...prevSnap,
            ...patch,
            period: periodKey,
            StoriesCommitted: storiesComm,
            storiesCommitted: storiesComm,
            StoriesCompleted: storiesComp,
            storiesCompleted: storiesComp,
          };

          const isCurrent = periodKey === "mes_actual";
          const nextCommitments: AccountCommitment = {
            ...prev,
            ...(isCurrent
              ? {
                  postsCommitted: updatedSnap.postsCommitted,
                  postsCompleted: updatedSnap.postsCompleted,
                  StoriesCommitted: updatedSnap.StoriesCommitted,
                  StoriesCompleted: updatedSnap.StoriesCompleted,
                  storiesCommitted: updatedSnap.storiesCommitted,
                  storiesCompleted: updatedSnap.storiesCompleted,
                  reelsCommitted: updatedSnap.reelsCommitted,
                  reelsCompleted: updatedSnap.reelsCompleted,
                  adCampaignsCommitted: updatedSnap.adCampaignsCommitted,
                  adCampaignsCompleted: updatedSnap.adCampaignsCompleted,
                }
              : {}),
            hasDeclaredCommitments: patch.hasDeclaredCommitments ?? true,
            customMetrics: patch.customMetrics ?? prev.customMetrics,
            periodHistory: {
              ...prev.periodHistory,
              [periodKey]: updatedSnap,
            },
          };

          return {
            ...b,
            monthlyPostTarget: isCurrent
              ? nextCommitments.postsCommitted
              : b.monthlyPostTarget,
            commitments: nextCommitments,
          };
        }),
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  setBrandCustomMetrics: (brandId, customMetrics) => {
    get().updateBrandCommitments(brandId, {
      customMetrics,
      hasDeclaredCommitments: true,
    });
  },

  applyRecommendation: (recommendationId) => {
    set((s) => {
      const allRecs = selectAccountRecommendations(
        s.brands,
        s.tasks,
        s.posts,
        s.dismissedRecommendationIds,
        s.appliedRecommendationsMap
      );
      const rec = allRecs.find((r) => r.id === recommendationId);
      if (!rec) return s;

      const nextBrands = s.brands.map((b) => {
        if (b.id !== rec.brandId) return b;
        const prev = b.commitments;
        const actual = prev.periodHistory.mes_actual;

        const nextPostsCommitted =
          rec.metricKey === "posts" ? rec.recommendedCommitted : prev.postsCommitted;
        const nextReelsCommitted =
          rec.metricKey === "reels" ? rec.recommendedCommitted : prev.reelsCommitted;
        const nextStoriesCommitted =
          rec.metricKey === "stories" ? rec.recommendedCommitted : prev.StoriesCommitted;
        const nextAdsCommitted =
          rec.metricKey === "ads" ? rec.recommendedCommitted : prev.adCampaignsCommitted;

        return {
          ...b,
          monthlyPostTarget: nextPostsCommitted,
          commitments: {
            ...prev,
            postsCommitted: nextPostsCommitted,
            reelsCommitted: nextReelsCommitted,
            StoriesCommitted: nextStoriesCommitted,
            storiesCommitted: nextStoriesCommitted,
            adCampaignsCommitted: nextAdsCommitted,
            hasDeclaredCommitments: true,
            periodHistory: {
              ...prev.periodHistory,
              mes_actual: {
                ...actual,
                postsCommitted: nextPostsCommitted,
                reelsCommitted: nextReelsCommitted,
                StoriesCommitted: nextStoriesCommitted,
                storiesCommitted: nextStoriesCommitted,
                adCampaignsCommitted: nextAdsCommitted,
              },
            },
          },
        };
      });

      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId: rec.brandId,
        durationMinutes: 10,
        metadata: {
          recommendationId: rec.id,
          ruleId: rec.ruleId,
          recommendedCommitted: rec.recommendedCommitted,
        },
      });

      return {
        brands: nextBrands,
        appliedRecommendationsMap: {
          ...s.appliedRecommendationsMap,
          [recommendationId]: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  applyRecommendationsBatch: (recommendationIds) => {
    const state = get();
    const allRecs = selectAccountRecommendations(
      state.brands,
      state.tasks,
      state.posts,
      state.dismissedRecommendationIds,
      state.appliedRecommendationsMap
    );
    const targetIds =
      recommendationIds && recommendationIds.length > 0
        ? recommendationIds
        : allRecs.filter((r) => !r.applied).map((r) => r.id);

    for (const id of targetIds) {
      get().applyRecommendation(id);
    }
  },

  dismissRecommendation: (recommendationId) => {
    set((s) => ({
      dismissedRecommendationIds: s.dismissedRecommendationIds.includes(recommendationId)
        ? s.dismissedRecommendationIds
        : [...s.dismissedRecommendationIds, recommendationId],
    }));
    persistWorkspaceState(get());
  },
});
