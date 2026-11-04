import type { StateCreator } from "zustand";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { MediaAsset } from "../types";

export interface AssetsSlice {
  addAsset: (asset: Omit<MediaAsset, "id" | "uploadedAt" | "usedInPosts">) => void;
}

export const createAssetsSlice: StateCreator<HublyStoreState, [], [], AssetsSlice> = (set, get) => ({
  addAsset: (assetInput) => {
    set((s) => ({
      assets: [
        {
          ...assetInput,
          id: `asset-${Date.now()}`,
          uploadedAt: "Ahora mismo",
          usedInPosts: 0,
        },
        ...s.assets,
      ],
    }));
    persistWorkspaceState(get());
  },
});
