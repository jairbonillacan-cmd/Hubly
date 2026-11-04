import type { StateCreator } from "zustand";
import { runAutomations } from "../domain/automations";
import { duplicatePostAsDraft, withPostLog } from "../domain/posts";
import { createActivityItem } from "../domain/activity";
import { POST_STATUS_LABEL } from "../labels";
import { localIsoDate } from "../date";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { ContentIdea, PostExtrasPatch, PostStatus, SocialPost } from "../types";

export interface PostsSlice {
  savePost: (post: Omit<SocialPost, "id" | "comments"> & { id?: string }) => void;
  updatePostStatus: (
    postId: string,
    status: PostStatus,
    commentText?: string,
    authorName?: string,
    role?: "client" | "agency"
  ) => void;
  approveAllBrandPosts: (brandId: string, authorName?: string, role?: "client" | "agency") => void;
  /** Cambio puntual desde tabla o Kanban; el estado de publicación va por updatePostStatus. */
  updatePostFields: (postId: string, patch: Partial<Pick<SocialPost, "workflowStatusId" | "format" | "assigneeIds" | "assignee" | "customFields" | "pillar">>) => void;
  deletePost: (postId: string) => void;
  /** Devuelve el id de la copia, que nace como borrador sin fecha ni resultados. */
  duplicatePost: (postId: string) => string | null;
  movePost: (postId: string, scheduledDate: string) => void;
  recordPublication: (postId: string, publication: { url: string; date: string }) => void;
  setPostResults: (postId: string, metrics: NonNullable<SocialPost["metrics"]>) => void;
  setCalendarActivities: (activities: unknown[]) => void;
  patchPost: (postId: string, patch: PostExtrasPatch) => void;
  addPostComment: (postId: string, text: string, authorName: string, role: "client" | "agency") => void;
  addIdea: (idea: Pick<ContentIdea, "brandId" | "title" | "notes" | "pillar">) => void;
  removeIdea: (ideaId: string) => void;
  convertIdeaToPost: (ideaId: string) => void;
}

export const createPostsSlice: StateCreator<HublyStoreState, [], [], PostsSlice> = (set, get) => ({
  savePost: (postInput) => {
    const previousStatus = get().posts.find((p) => p.id === postInput.id)?.status;
    set((s) => {
      const statusLabel =
        postInput.statusLabel || POST_STATUS_LABEL[postInput.status] || "Borrador";
      if (postInput.id) {
        return {
          posts: s.posts.map((p) =>
            p.id === postInput.id
              ? withPostLog(
                  {
                    ...p,
                    ...postInput,
                    statusLabel,
                    id: p.id,
                    comments: p.comments,
                  },
                  `Guardó el post como «${statusLabel}»`,
                  s.profile?.name || "Equipo"
                )
              : p
          ),
          composerOpen: false,
          editingPostId: null,
        };
      }
      const createdId = `post-${Date.now()}`;
      const created = withPostLog(
        {
          ...postInput,
          id: createdId,
          statusLabel,
          comments: [],
        },
        "Creó el post",
        s.profile?.name || "Equipo"
      );
      const event = createActivityItem(s, {
        type: created.status === "published" ? "post_published" : "post_submitted",
        brandId: created.brandId,
        durationMinutes: 25,
        metadata: { postId: createdId, title: created.title },
      });
      return {
        posts: [created, ...s.posts],
        onboarding: {
          ...s.onboarding,
          postCreatedOrScheduled: true,
        },
        activityEvents: [event, ...s.activityEvents],
        composerOpen: false,
        editingPostId: null,
      };
    });
    const savedId = postInput.id || get().posts[0]?.id;
    if (savedId && previousStatus !== postInput.status) {
      runAutomations(get, set, savedId, postInput.status);
    }
    persistWorkspaceState(get());
  },

  updatePostStatus: (postId, status, commentText, authorName = "Cliente", role = "client") => {
    set((s) => {
      let targetBrandId = s.activeBrandId;
      const nextPosts = s.posts.map((p) => {
        if (p.id !== postId) return p;
        targetBrandId = p.brandId;
        const nextComments = commentText?.trim()
          ? [
              ...p.comments,
              {
                id: `c-${Date.now()}`,
                author: authorName,
                role,
                text: commentText.trim(),
                createdAt: "Ahora mismo",
              },
            ]
          : p.comments;
        return withPostLog(
          {
            ...p,
            status,
            statusLabel: POST_STATUS_LABEL[status] || p.statusLabel,
            comments: nextComments,
          },
          `Cambió el estado a «${POST_STATUS_LABEL[status] || status}»`,
          authorName
        );
      });

      const event = createActivityItem(s, {
        type: status === "published" ? "post_published" : status === "approved" ? "post_approved" : "post_submitted",
        brandId: targetBrandId,
        durationMinutes: 15,
        metadata: { postId, status },
      });

      return {
        posts: nextPosts,
        activityEvents: [event, ...s.activityEvents],
      };
    });
    runAutomations(get, set, postId, status);
    persistWorkspaceState(get());
  },




  recordPublication: (postId, { url, date }) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? withPostLog(
              { ...p, status: "published", statusLabel: "Publicado", publishedUrl: url || undefined, scheduledDate: date || p.scheduledDate },
              "Registró la publicación a mano",
              s.profile?.name || "Equipo"
            )
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  setPostResults: (postId, metrics) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? withPostLog({ ...p, metrics, metricsSource: "manual" }, "Capturó resultados a mano", s.profile?.name || "Equipo")
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  setCalendarActivities: (activities) => {
    set({ calendarActivities: activities });
    persistWorkspaceState(get());
  },

  updatePostFields: (postId, patch) => {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === postId ? withPostLog({ ...p, ...patch }, "Actualizó el post desde el calendario", s.profile?.name || "Equipo") : p)),
    }));
    persistWorkspaceState(get());
  },

  deletePost: (postId) => {
    set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) }));
    persistWorkspaceState(get());
  },

  duplicatePost: (postId) => {
    const source = get().posts.find((p) => p.id === postId);
    if (!source) return null;
    const id = `post-${Date.now()}`;
    const copy = duplicatePostAsDraft(source, id, get().profile?.name || "Equipo");
    set((s) => ({ posts: [copy, ...s.posts] }));
    persistWorkspaceState(get());
    return id;
  },

  movePost: (postId, scheduledDate) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId && p.scheduledDate !== scheduledDate
          ? withPostLog({ ...p, scheduledDate }, `Movió la fecha a ${scheduledDate}`, s.profile?.name || "Equipo")
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  patchPost: (postId, patch) => {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
    }));
    persistWorkspaceState(get());
  },

  addPostComment: (postId, text, authorName, role) => {
    const clean = text.trim();
    if (!clean) return;
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: `c-${Date.now()}`, author: authorName, role, text: clean, createdAt: "Ahora mismo" },
              ],
            }
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  addIdea: (idea) => {
    set((s) => ({
      ideas: [
        { ...idea, id: `idea-${Date.now()}`, createdAt: new Date().toISOString() },
        ...(s.ideas || []),
      ],
    }));
    persistWorkspaceState(get());
  },

  removeIdea: (ideaId) => {
    set((s) => ({ ideas: (s.ideas || []).filter((i) => i.id !== ideaId) }));
    persistWorkspaceState(get());
  },

  convertIdeaToPost: (ideaId) => {
    const idea = (get().ideas || []).find((i) => i.id === ideaId);
    if (!idea) return;
    const postId = idea.convertedPostId || `post-${Date.now()}`;
    if (!idea.convertedPostId) {
      set((s) => {
        const created = withPostLog(
          {
            id: postId,
            brandId: idea.brandId,
            title: idea.title,
            caption: idea.notes,
            network: "Instagram",
            networks: ["Instagram"],
            format: "Carrusel",
            cover: "steam",
            scheduledDate: localIsoDate(),
            scheduledTime: "11:30",
            status: "draft",
            statusLabel: "Borrador",
            assignee: s.profile?.name || "Equipo",
            pillar: idea.pillar || "General",
            comments: [],
          },
          "Creó el post desde una idea",
          s.profile?.name || "Equipo"
        );
        return {
          posts: [created, ...s.posts],
          ideas: (s.ideas || []).map((i) => (i.id === ideaId ? { ...i, convertedPostId: postId } : i)),
        };
      });
      persistWorkspaceState(get());
    }
    get().openComposer(postId);
  },

  approveAllBrandPosts: (brandId, authorName = "Cliente", role = "client") => {
    const approvedIds = get()
      .posts.filter((p) => p.brandId === brandId && (p.status === "pending" || p.status === "changes"))
      .map((p) => p.id);
    if (approvedIds.length === 0) return;
    const commentText = role === "client" ? "Aprobado en lote desde el enlace de revisión." : "Aprobado en lote por la agencia.";
    set((s) => ({
      posts: s.posts.map((p, index) => {
        if (!approvedIds.includes(p.id)) return p;
        return withPostLog(
          {
            ...p,
            status: "approved",
            statusLabel: "Aprobado",
            comments: [
              ...p.comments,
              { id: `c-${Date.now()}-${index}`, author: authorName, role, text: commentText, createdAt: "Ahora mismo" },
            ],
          },
          "Aprobó el post en lote",
          authorName
        );
      }),
      activityEvents: [
        ...approvedIds.map((postId) =>
          createActivityItem(s, { type: "post_approved", brandId, durationMinutes: 5, metadata: { postId, status: "approved" } })
        ),
        ...s.activityEvents,
      ],
    }));
    for (const id of approvedIds) runAutomations(get, set, id, "approved");
    persistWorkspaceState(get());
  },
});
