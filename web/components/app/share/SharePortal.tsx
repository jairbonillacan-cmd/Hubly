"use client";

import "./share.css";
import "./share-cards.css";
import { SharePortalCabecera } from "./SharePortalCabecera";
import { SharePortalResumen } from "./SharePortalResumen";
import { SharePostCard } from "./SharePostCard";
import { useSharePortal } from "./useSharePortal";

export function SharePortal() {
  const { token, brand, posts, counts, liveLoading, clientName, setClientName, decide, approveAll } =
    useSharePortal();

  if (liveLoading) {
    return <main className="hubly-share hubly-share--center">Cargando…</main>;
  }

  if (!brand) {
    return (
      <main className="hubly-share hubly-share--center">
        <div>
          <h1 className="hubly-share-invalid-title">Este enlace no es válido</h1>
          <p className="hubly-share-invalid-text">Pide a tu agencia un enlace de revisión nuevo.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="hubly-share">
      <SharePortalCabecera
        brand={brand}
        counts={counts}
        clientName={clientName}
        onClientNameChange={setClientName}
        onApproveAll={() => void approveAll(brand.id, clientName)}
      />

      <div className="hubly-share-body">
        <SharePortalResumen brandName={brand.name} counts={counts} />

        <div className="hubly-share-grid">
          {posts.map((post) => (
            <SharePostCard
              key={post.id}
              post={post}
              brand={brand}
              token={token}
              clientName={clientName}
              onDecide={decide}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
