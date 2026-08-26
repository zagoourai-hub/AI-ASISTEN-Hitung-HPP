import { create } from "zustand"

interface AppState {
  selectedVariantId: string | null
  aiConversations: AIConversation[]
  activeAIConversationId: string | null
  setSelectedVariantId: (variantId: string | null) => void
  addAIConversation: (question: string) => string
  updateAIConversation: (id: string, answer: string) => void
  selectAIConversation: (id: string | null) => void
}

export interface AIConversation {
  id: string
  question: string
  answer: string
  createdAt: number
}

export const useAppStore = create<AppState>()((set) => ({
  selectedVariantId: null,
  aiConversations: [],
  activeAIConversationId: null,
  setSelectedVariantId: (selectedVariantId) => set({ selectedVariantId }),
  addAIConversation: (question) => {
    const id = crypto.randomUUID()
    set((state) => ({
      aiConversations: [
        { id, question, answer: "", createdAt: Date.now() },
        ...state.aiConversations,
      ].slice(0, 20),
      activeAIConversationId: id,
    }))
    return id
  },
  updateAIConversation: (id, answer) =>
    set((state) => ({
      aiConversations: state.aiConversations.map((conversation) =>
        conversation.id === id ? { ...conversation, answer } : conversation,
      ),
    })),
  selectAIConversation: (activeAIConversationId) => set({ activeAIConversationId }),
}))
