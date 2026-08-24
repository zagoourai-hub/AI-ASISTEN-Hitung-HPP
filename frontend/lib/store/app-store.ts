import { create } from "zustand"

interface AppState {
  selectedVariantId: string | null
  setSelectedVariantId: (variantId: string | null) => void
}

export const useAppStore = create<AppState>()((set) => ({
  selectedVariantId: null,
  setSelectedVariantId: (selectedVariantId) => set({ selectedVariantId }),
}))
