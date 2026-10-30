"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  MessageSquareWarning,
  Sparkles,
  ArrowLeft,
  Send,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { Cover } from "@/components/Cover";

function ClientSharePortalInner() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const brands = useHublyStore((s) => s.brands);
  const posts = useHublyStore((s) => s.posts);
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);
  const approveAllBrandPosts = useHublyStore((s) => s.approveAllBrandPosts);

  const [clientName, setClientName] = useState("Dirección de Marca (Cliente)");
  const [commentByPost, setCommentByPost] = useState<Record<string, string>>({});
  const [openCommentBox, setOpenCommentBox] = useState<Record<string, boolean>>({});

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const brand =
    brands.find((b) => b.shareToken === token || b.slug === token) || brands[0];
  const brandPosts = posts.filter((p) => p.brandId === brand?.id);

  if (!brand) return null;

  const approvedCount = brandPosts.filter(
    (p) => p.status === "approved" || p.status === "scheduled" || p.status === "published"
  ).length;
  const pendingCount = brandPosts.filter(
    (p) => p.status === "pending" || p.status === "changes"
  ).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: 64 }}>
      {/* Top Client Banner */}
      <header
        style={{
          background: "#0F241C",
          color: "#fff",
          padding: "18px clamp(20px, 5vw, 56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: brand.color,
              color: "#fff",
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
            }}
          >
            {brand.initials}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>
                {brand.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(16,185,129,0.22)",
                  color: "#6ee7b7",
                  fontWeight: 600,
                }}
              >
                Portal de Revisión Sin Login
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
              Parrilla Noviembre 2026 · {approvedCount} aprobados · {pendingCount} por revisar
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Tu nombre para firmar aprobaciones"
            style={{
              padding: "7px 12px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 12.5,
            }}
          />
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => approveAllBrandPosts(brand.id, clientName)}
              className="saas-btn saas-btn-amber saas-btn-sm"
            >
              <CheckCircle2 size={14} />
              Aprobar todo el mes ({pendingCount})
            </button>
          )}
          <Link
            href="/parrillas"
            className="saas-btn saas-btn-sm"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <ArrowLeft size={13} />
            Volver al estudio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px clamp(20px, 4vw, 40px)" }}>
        <div
          className="saas-card"
          style={{
            padding: 22,
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            background: "#fff",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--forest)",
                marginBottom: 4,
              }}
            >
              <ShieldCheck size={15} />
              Enlace seguro compartido por tu agencia en Hubly
            </div>
            <h1 className="saas-heading-lg">
              Revisa y aprueba las publicaciones de{" "}
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>
                {brand.name}
              </span>
            </h1>
            <p style={{ color: "var(--ink-muted)", fontSize: 13.5, margin: "4px 0 0" }}>
              Haz clic en <strong>Aprobar</strong> para programar la salida o en{" "}
              <strong>Pedir cambios</strong> para dejarle indicaciones exactas a tu equipo creativo.
            </p>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 12, background: "var(--cream)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--forest)" }}>
                {approvedCount}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Listos</div>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 12, background: "var(--cream)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#9a6406" }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Pendientes</div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {brandPosts.map((post) => {
            const isApproved =
              post.status === "approved" || post.status === "scheduled" || post.status === "published";
            const hasChanges = post.status === "changes";

            return (
              <div
                key={post.id}
                className="saas-card"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  border: isApproved
                    ? "2px solid var(--forest)"
                    : hasChanges
                    ? "2px solid var(--coral)"
                    : undefined,
                }}
              >
                <div style={{ position: "relative", height: 220 }}>
                  <Cover kind={post.cover} />
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      right: 12,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      className={`saas-badge ${
                        isApproved
                          ? "saas-badge-forest"
                          : hasChanges
                          ? "saas-badge-coral"
                          : "saas-badge-amber"
                      }`}
                    >
                      {isApproved
                        ? "Aprobado"
                        : hasChanges
                        ? "Cambios solicitados"
                        : "Pendiente de tu visto bueno"}
                    </span>
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: 999,
                        background: "rgba(15,36,28,0.8)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {post.format}
                    </span>
                  </div>
                </div>

                <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--ink-muted)",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={13} />
                      {post.scheduledDate} · {post.scheduledTime}
                    </span>
                    <span>{post.networks.join(" · ")}</span>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>{post.title}</h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--ink-2)",
                      lineHeight: 1.55,
                      whiteSpace: "pre-line",
                      margin: "0 0 16px",
                    }}
                  >
                    {post.caption}
                  </p>

                  {post.comments.length > 0 && (
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: "var(--cream)",
                        border: "1px solid var(--line)",
                        fontSize: 12,
                        marginBottom: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {post.comments.map((c) => (
                        <div key={c.id}>
                          <strong>{c.author}:</strong> {c.text}{" "}
                          <span style={{ color: "var(--ink-muted)" }}>({c.createdAt})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {openCommentBox[post.id] && (
                    <div style={{ marginBottom: 12, display: "flex", gap: 6 }}>
                      <input
                        value={commentByPost[post.id] || ""}
                        onChange={(e) =>
                          setCommentByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Escribe qué ajuste necesitas..."
                        className="saas-input"
                        style={{ fontSize: 12.5, padding: "8px 10px" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const txt = commentByPost[post.id]?.trim();
                          if (!txt) return;
                          updatePostStatus(post.id, "changes", txt, clientName, "client");
                          setCommentByPost((prev) => ({ ...prev, [post.id]: "" }));
                          setOpenCommentBox((prev) => ({ ...prev, [post.id]: false }));
                        }}
                        className="saas-btn saas-btn-primary saas-btn-sm"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        updatePostStatus(
                          post.id,
                          "approved",
                          "Aprobado desde el enlace de revisión.",
                          clientName,
                          "client"
                        )
                      }
                      className="saas-btn saas-btn-primary"
                      style={{ flex: 1 }}
                    >
                      <CheckCircle2 size={15} />
                      {isApproved ? "Aprobado" : "Aprobar post"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCommentBox((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      className="saas-btn"
                    >
                      <MessageSquareWarning size={15} />
                      Pedir cambios
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ClientSharePortalPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--cream)" }}>
          Cargando portal de cliente...
        </div>
      }
    >
      <ClientSharePortalInner />
    </Suspense>
  );
}
