"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Plus, Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { streamAIResponse } from "@/lib/api/ai"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { useAppStore, type AIConversation } from "@/lib/store/app-store"

const AI_STREAM_IDLE_TIMEOUT_MS = 30_000

function getAIErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return mapSemanticErrorToMessage(error.code, error.message)
  }
  return "AI belum bisa menjawab. Periksa koneksi lalu coba lagi."
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function AssistantText({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/)
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const lines = block.split("\n")
        const isCode = lines[0].startsWith("```") && lines.at(-1)?.startsWith("```")
        if (isCode) {
          return (
            <pre key={`${index}-${block.slice(0, 12)}`} className="overflow-x-auto rounded-xl bg-muted p-4 text-sm leading-6">
              <code>{lines.slice(1, -1).join("\n")}</code>
            </pre>
          )
        }
        const isBulleted = lines.every((line) => /^[-*] /.test(line))
        if (isBulleted) {
          return <ul key={`${index}-${block.slice(0, 12)}`} className="list-disc space-y-2 ps-5">{lines.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{renderInline(line.slice(2))}</li>)}</ul>
        }
        const isNumbered = lines.every((line) => /^\d+[.)] /.test(line))
        if (isNumbered) {
          return <ol key={`${index}-${block.slice(0, 12)}`} className="list-decimal space-y-2 ps-5">{lines.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{renderInline(line.replace(/^\d+[.)] /, ""))}</li>)}</ol>
        }
        return <p key={`${index}-${block.slice(0, 12)}`}>{renderInline(block.replace(/\n/g, " "))}</p>
      })}
    </div>
  )
}

export default function AIAssistantPage() {
  const [prompt, setPrompt] = useState("")
  const [activeQuestion, setActiveQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const aiConversations = useAppStore((state) => state.aiConversations)
  const activeAIConversationId = useAppStore((state) => state.activeAIConversationId)
  const addAIConversation = useAppStore((state) => state.addAIConversation)
  const updateAIConversation = useAppStore((state) => state.updateAIConversation)
  const selectAIConversation = useAppStore((state) => state.selectAIConversation)
  const abortControllerRef = useRef<AbortController | null>(null)
  const answerRef = useRef("")
  const answerEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const suggestions = [
    "Kenapa HPP naik?",
    "Simulasikan diskon 10%",
    "Produk paling menguntungkan",
    "Bahan baku mana yang paling boros?",
  ]

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
    const conversationId = activeAIConversationId && activeQuestion === question
      ? activeAIConversationId
      : addAIConversation(question)
    setPrompt("")
    setError(null)
    answerRef.current = ""
    setAnswer("")
    setActiveQuestion(question)
    setIsStreaming(true)

    try {
      for await (const event of streamAIResponse(question, controller.signal)) {
        if (controller.signal.aborted) break
        resetIdleTimeout()
        if (event.type === "token") {
          answerRef.current += event.content
          setAnswer(answerRef.current)
          updateAIConversation(conversationId, answerRef.current)
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
    selectAIConversation(null)
    setActiveQuestion("")
    answerRef.current = ""
    setAnswer("")
    setPrompt("")
    setError(null)
    setIsStreaming(false)
    inputRef.current?.focus()
  }

  const handleSelectConversation = (conversation: AIConversation) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    selectAIConversation(conversation.id)
    setActiveQuestion(conversation.question)
    answerRef.current = conversation.answer
    setAnswer(conversation.answer)
    setPrompt("")
    setError(null)
    setIsStreaming(false)
    inputRef.current?.focus()
  }

  const handleCancel = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    void sendPrompt(prompt)
  }

  useEffect(() => {
    if (answer) answerEndRef.current?.scrollIntoView({ block: "nearest" })
  }, [answer])

  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-4xl flex-col lg:min-h-[calc(100dvh-4rem)]">
      <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI Hitung HPP
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Tanya tentang HPP, margin, bahan baku, atau strategi harga dari data bisnis terbarumu.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNewConversation}
          disabled={!activeQuestion && !prompt && !answer}
          className="min-h-11 shrink-0 px-3 sm:px-4"
        >
          <Plus aria-hidden="true" />
          <span className="hidden sm:inline">Chat baru</span>
          <span className="sr-only sm:hidden">Chat baru</span>
        </Button>
      </header>

      {aiConversations.length > 0 && (
        <aside aria-label="Riwayat percakapan" className="mt-5 border-b border-border pb-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Riwayat chat</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-2">
            {aiConversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                aria-pressed={conversation.id === activeAIConversationId}
                onClick={() => handleSelectConversation(conversation)}
                className="min-w-56 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary-100 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary-50"
              >
                <span className="block truncate font-medium">{conversation.question}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {conversation.answer ? "Jawaban tersedia" : "Menunggu jawaban"}
                </span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <section
        aria-label="Percakapan AI Hitung HPP"
        aria-busy={isStreaming}
        className="flex flex-1 flex-col py-6 sm:py-8"
      >
        {!activeQuestion ? (
          <div className="my-auto py-8 sm:py-14">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Apa yang ingin kamu hitung?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pilih contoh pertanyaan atau tulis pertanyaan sendiri. AI memakai data tenant aktif, bukan data demo.
              </p>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Contoh pertanyaan">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => {
                    setPrompt(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="min-h-11 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary-100 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            <article aria-label="Pertanyaan kamu" className="flex justify-end">
              <div className="max-w-[88%] rounded-[18px] rounded-br-md bg-primary-50 px-4 py-3 text-sm leading-6 text-primary-700 sm:max-w-[75%] dark:text-foreground">
                <p className="whitespace-pre-wrap">{activeQuestion}</p>
              </div>
            </article>

            <article aria-label="Jawaban AI" className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold text-primary">HPP Pintar AI</p>
              <div aria-live="polite" className="text-base leading-7 text-foreground">
                {answer ? (
                  <p className="whitespace-pre-wrap">
                    <AssistantText content={answer} />
                    {isStreaming && (
                      <span
                        aria-hidden="true"
                        className="ms-1 inline-block h-5 w-0.5 translate-y-1 bg-primary motion-safe:animate-pulse"
                      />
                    )}
                  </p>
                ) : isStreaming ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Menyiapkan jawaban dari data bisnis terbaru
                    <span aria-hidden="true" className="motion-safe:animate-pulse">...</span>
                  </p>
                ) : null}
              </div>

              {error && (
                <div role="alert" className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
                  <span>{error}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void sendPrompt(activeQuestion)}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    Coba lagi
                  </Button>
                </div>
              )}
              <div ref={answerEndRef} />
            </article>
          </div>
        )}
      </section>

      <div className="sticky bottom-20 z-10 bg-background/95 pb-2 pt-3 backdrop-blur-md lg:bottom-0">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void sendPrompt(prompt)
          }}
          className="relative rounded-[18px] border border-border bg-card p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20"
        >
          <label htmlFor="ai-prompt" className="sr-only">
            Pertanyaan untuk AI Hitung HPP
          </label>
          <textarea
            ref={inputRef}
            id="ai-prompt"
            rows={2}
            placeholder="Tanyakan apa saja tentang HPP bisnismu"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            disabled={isStreaming}
            aria-describedby="ai-prompt-help"
            className="min-h-14 max-h-40 w-full resize-none bg-transparent px-3 py-2 pe-14 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          />
          {isStreaming ? (
            <button
              type="button"
              aria-label="Hentikan jawaban"
              onClick={handleCancel}
              className="absolute bottom-3 end-3 flex size-11 items-center justify-center rounded-xl bg-foreground text-background transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Square aria-hidden="true" className="size-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Kirim pertanyaan"
              disabled={!prompt.trim()}
              className="absolute bottom-3 end-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send aria-hidden="true" className="size-4" />
            </button>
          )}
        </form>
        <div id="ai-prompt-help" className="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
          <span>Enter untuk kirim, Shift+Enter untuk baris baru.</span>
          <span className="hidden text-right sm:inline">Sumber: database bisnis terbaru</span>
        </div>
      </div>
    </div>
  )
}
