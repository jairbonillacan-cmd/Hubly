"use client";

import { useState } from "react";
import { Cover, type CoverKind } from "./Cover";

type PostStatus = "pending" | "approved" | "changes";

type Post = {
  id: string;
  day: string;
  date: number;
  kind: CoverKind;
  format: string;
  networks: string;
  title: string;
  caption: string;
  status: PostStatus;
};

const POSTS: Post[] = [
  {
    id: "lunes",
    day: "Lun",
    date: 12,
    kind: "cup",
    format: "Reel",
    networks: "Instagram · TikTok",
    title: "Tu primer café del lunes",
    caption: "El lunes pesa menos con una taza recién hecha. ¿Con qué café arrancas la semana?",
    status: "approved",
  },
  {
    id: "origen",
    day: "Mar",
    date: 13,
    kind: "beans",
    format: "Carrusel",
    networks: "Instagram · Facebook",
    title: "De la finca a tu taza",
    caption: "Cinco pasos, una sola finca y ningún atajo. Así llega nuestro grano a tu mesa.",
    status: "pending",
  },
  {
    id: "amanecer",
    day: "Mié",
    date: 14,
    kind: "sun",
    format: "Foto",
    networks: "Instagram",
    title: "Tostado amanecer",
    caption: "Nuevo tostado, notas de naranja y panela. Disponible desde este viernes.",
    status: "pending",
  },
  {
    id: "receta",
    day: "Jue",
    date: 15,
    kind: "steam",
    format: "Reel",
    networks: "TikTok · YouTube",
    title: "Prensa francesa en 4 minutos",
    caption: "Cuatro minutos, una prensa y cero excusas. Te enseñamos el paso a paso.",
    status: "pending",
  },
];

const STATUS_LABEL: Record<PostStatus, string> = {
  pending: "Por aprobar",
  approved: "Aprobada",
  changes: "Con cambios",
};

const BRANDS = ["Café Lunar", "Tierra Viva", "Norte Bici"];

export function HeroDemo() {
  const [posts, setPosts] = useState(POSTS);
  const [selectedId, setSelectedId] = useState("origen");
  const selected = posts.find((post) => post.id === selectedId) ?? posts[0];
  const approved = posts.filter((post) => post.status === "approved").length;

  function setStatus(status: PostStatus) {
    setPosts((current) =>
      current.map((post) => (post.id === selected.id ? { ...post, status } : post)),
    );
    if (status === "approved") {
      const next = posts.find((post) => post.status === "pending" && post.id !== selected.id);
      if (next) setSelectedId(next.id);
    }
  }

  return (
    <figure className="demo">
      <div className="demo-window">
        <header className="demo-bar">
          <ul className="demo-brands" aria-label="Marcas de ejemplo">
            {BRANDS.map((brand, index) => (
              <li key={brand} className={index === 0 ? "is-current" : undefined}>
                {brand}
              </li>
            ))}
          </ul>
          <p className="demo-progress" aria-live="polite">
            <strong>{approved}</strong> de {posts.length} aprobadas
          </p>
        </header>

        <div className="demo-body">
          <ol className="demo-week">
            {posts.map((post) => (
              <li key={post.id}>
                <span className="demo-day">
                  {post.day} <b>{post.date}</b>
                </span>
                <button
                  type="button"
                  className="demo-post"
                  aria-pressed={post.id === selected.id}
                  onClick={() => setSelectedId(post.id)}
                >
                  <Cover kind={post.kind} />
                  <span className="demo-post-title">{post.title}</span>
                  <span className={`status status--${post.status}`}>{STATUS_LABEL[post.status]}</span>
                </button>
              </li>
            ))}
          </ol>

          <aside className="demo-review" aria-label="Revisión del cliente">
            <p className="demo-review-format">
              {selected.format} · {selected.networks}
            </p>
            <h3>{selected.title}</h3>
            <p className="demo-review-caption">{selected.caption}</p>
            <div className="demo-review-actions">
              <button
                type="button"
                className="button button--primary button--small"
                disabled={selected.status === "approved"}
                onClick={() => setStatus("approved")}
              >
                {selected.status === "approved" ? "Aprobada" : "Aprobar"}
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                disabled={selected.status === "changes"}
                onClick={() => setStatus("changes")}
              >
                Pedir cambios
              </button>
            </div>
          </aside>
        </div>
      </div>
      <figcaption>
        Prueba a aprobar una publicación. Es una demostración con marcas y datos de ejemplo: la app todavía está en desarrollo.
      </figcaption>
    </figure>
  );
}
