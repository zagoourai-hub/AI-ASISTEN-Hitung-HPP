"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Plus,
  Send,
} from "lucide-react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { ApiError } from "@/lib/api/client"
import { streamAIResponse } from "@/lib/api/ai"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"

const AI_STREAM_IDLE_TIMEOUT_MS = 30_000

type ChatMessage = {
  role: "user"
  content: string
}

function getLatestUserPrompt(messages: ChatMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") return messages[index].content
  }
  return null
}

function getAIErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return mapSemanticErrorToMessage(error.code, error.message)
  }
  return "AI belum bisa menjawab. Periksa koneksi lalu coba lagi."
}

export default function AIAssistantPage() {
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [answer, setAnswer] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const suggestions = [
    "Kenapa HPP naik?",
    "Simulasikan diskon 10%",
    "Produk paling menguntungkan",
    "Bahan baku mana yang paling boros?",
  ]

  const latestQuestion = getLatestUserPrompt(messages)

  const sendPrompt = async (value: string) => {
    const question = value.trim()
    if (!question || isStreaming) return

    const controller = new AbortController()
    abortControllerRef.current?.abort()
    abortControllerRef.current = controller
    let timedOut = false
    let timeoutId: number | null = null
    const resetIdleTimeout = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        if (controller.signal.aborted) return
        timedOut = true
        controller.abort()
        setError("Provider AI berhenti mengirim jawaban. Coba lagi sebentar.")
        setIsStreaming(false)
      }, AI_STREAM_IDLE_TIMEOUT_MS)
    }
    resetIdleTimeout()
    setPrompt("")
    setError(null)
    setAnswer("")
    setMessages([{ role: "user", content: question }])
    setIsStreaming(true)

    try {
      for await (const event of streamAIResponse(question, controller.signal)) {
        if (controller.signal.aborted) break
        resetIdleTimeout()
        if (event.type === "token") {
          setAnswer((current) => current + event.content)
        }
      }
    } catch (streamError: unknown) {
      if (!controller.signal.aborted || timedOut) {
        setError(
          timedOut
            ? "Provider AI berhenti mengirim jawaban. Coba lagi sebentar."
            : getAIErrorMessage(streamError),
        )
      }
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
        setIsStreaming(false)
      }
    }
  }

  const handleNewConversation = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessages([])
    setAnswer("")
    setPrompt("")
    setError(null)
    setIsStreaming(false)
  }

  const handleCancel = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
  }

  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  return (
    <div className="space-y-6 pb-16">
      <Header
        title=""
        showDemoButton={true}
        showPeriodSelector={false}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Col (3 cols): Conversation List */}
        <aside aria-label="Riwayat Percakapan AI" className="space-y-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">
              Percakapan
            </h2>
            <button
              type="button"
              aria-label="Percakapan Baru"
              onClick={handleNewConversation}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E8ECE9] bg-white text-[#737B76] hover:bg-[#F3F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] dark:border-[#2B312E] dark:bg-[#161A18]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {latestQuestion ? (
              <div className="relative rounded-2xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs dark:border-[#10673C55] dark:bg-[#10673C22]">
                <div className="flex items-start">
                  <span className="font-semibold text-[#14804A] dark:text-[#1EA65E]">
                    {latestQuestion}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#14804A]/80 dark:text-[#86EFAC]">
                  Percakapan aktif
                </p>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#D5DAD7] p-3 text-xs leading-relaxed text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                Belum ada percakapan.
              </p>
            )}
          </div>
        </aside>

        <section aria-label="Chat AI" className="space-y-5 xl:col-span-6">
          <div>
            <h1 className="text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">
              AI Assistant
            </h1>
            <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">
              Tanyakan HPP, margin, bahan baku, atau strategi harga.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D5DAD7] p-5 text-sm leading-relaxed text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
              Ajukan pertanyaan untuk memulai percakapan.
            </div>
          ) : (
            <Card className="space-y-5 border-[#DDF5E7] p-4 dark:border-[#10673C55]">
              <div className="ml-auto max-w-[85%] rounded-2xl bg-[#EEF9F2] px-4 py-3 text-sm leading-relaxed text-[#10673C] dark:bg-[#10673C33] dark:text-[#DDF5E7]">
                <p className="whitespace-pre-wrap">{latestQuestion}</p>
              </div>

              <div
                aria-live="polite"
                aria-busy={isStreaming}
                className="max-w-[92%] text-sm leading-7 text-[#161A18] dark:text-[#FAFBFA]"
              >
                {answer ? (
                  <p className="whitespace-pre-wrap">
                    {answer}
                    {isStreaming && (
                      <span
                        aria-hidden="true"
                        className="ml-1 inline-block h-4 w-0.5 translate-y-0.5 bg-[#14804A] motion-safe:animate-pulse"
                      />
                    )}
                  </p>
                ) : isStreaming ? (
                  <p className="text-[#737B76] dark:text-[#98A09B]">
                    Mengetik
                    <span aria-hidden="true" className="motion-safe:animate-pulse">...</span>
                  </p>
                ) : null}
              </div>

              {isStreaming && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="min-h-11 rounded-lg border border-[#E8ECE9] px-3 text-xs font-semibold text-[#737B76] hover:bg-[#F3F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] dark:border-[#2B312E] dark:hover:bg-[#232826]"
                >
                  Hentikan jawaban
                </button>
              )}

              {error && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F3C7C7] bg-[#FFF5F5] p-3 text-xs text-[#9B2C2C] dark:border-[#7F1D1D] dark:bg-[#3B1515] dark:text-[#FCA5A5]">
                  <span>{error}</span>
                  {latestQuestion && (
                    <button
                      type="button"
                      onClick={() => void sendPrompt(latestQuestion)}
                      className="min-h-11 rounded-lg border border-current px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A]"
                    >
                      Coba lagi
                    </button>
                  )}
                </div>
              )}
            </Card>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void sendPrompt(prompt)
            }}
            className="relative flex items-center pt-2"
          >
            <label htmlFor="ai-prompt" className="sr-only">
              Pertanyaan untuk AI Assistant
            </label>
            <input
              id="ai-prompt"
              type="text"
              placeholder="Tanyakan apa saja tentang HPP bisnismu..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={isStreaming}
              className="h-12 w-full rounded-2xl border border-[#E8ECE9] bg-white pl-4 pr-12 text-xs text-[#161A18] shadow-xs focus-visible:border-[#14804A] focus-visible:outline-none dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"
            />
            <button
              type="submit"
              aria-label="Kirim Pesan"
              disabled={isStreaming || !prompt.trim()}
              className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#14804A] text-white transition-colors hover:bg-[#10673C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]">
              Coba pertanyaan berikut:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  disabled={isStreaming}
                  className="min-h-11 rounded-full border border-[#DDF5E7] bg-[#EEF9F2] px-3 py-2.5 text-[11px] font-medium text-[#10673C] transition-colors hover:bg-[#DDF5E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#10673C44] dark:bg-[#10673C22] dark:text-[#1EA65E]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside aria-label="Konteks AI" className="space-y-4 xl:col-span-3">
          <h2 className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Sumber jawaban
          </h2>

          <Card className="space-y-3 p-4">
            <p className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
              Database bisnis terbaru
            </p>
            <p className="text-xs leading-relaxed text-[#737B76] dark:text-[#98A09B]">
              Jawaban memakai produk, harga jual, histori HPP, dan harga bahan baku dari bisnismu.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
