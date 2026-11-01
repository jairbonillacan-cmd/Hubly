"use client";

import React from "react";
import { PhonePreview, } from "@/components/previews/phone/PhonePreview";
import { networkFormatLabel, networkSpec } from "@/lib/network-catalog";
import {
  captionFor,
} from "@/lib/post-draft";
import { networkInk, } from "./PostComposerModal-shared";
import type { PostComposerModalModel } from "./usePostComposerModal";

export function ComposerVistaPrevia({ view }: { view: PostComposerModalModel }) {
  const { draft, setPreviewNet, brand, previewMedia, previewNetwork, previewFormat, activeMediaIndex } = view;

  return (
    <aside className="hubly-composer-preview" aria-label="Vista previa">
      <div className="hubly-composer-netpills">
        {draft.networks.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={n === previewNetwork}
            onClick={() => setPreviewNet(n)}
            style={{ "--net": networkInk(networkSpec(n).color), "--net-on": networkSpec(n).color === "#000000" ? "var(--ui-surface)" : "var(--on-accent)" } as React.CSSProperties}
          >
            <i />
            {n}
          </button>
        ))}
      </div>
      <PhonePreview
        key={`${previewNetwork}-${previewFormat}-${activeMediaIndex}`}
        post={{
          network: previewNetwork,
          format: previewFormat,
          brandName: brand.name,
          handle: (brand.handle || "tu_marca").replace("@", ""),
          initials: brand.initials || brand.name.slice(0, 2).toUpperCase(),
          color: brand.color || "#16324F",
          caption: captionFor(draft, previewNetwork),
          media: previewMedia,
          cover: draft.cover,
          settings: draft.platformSettings[previewNetwork],
          activeIndex: activeMediaIndex,
        }}
      />
      <small>{previewNetwork} · {networkFormatLabel(previewNetwork, previewFormat)}</small>
    </aside>
  );
}
