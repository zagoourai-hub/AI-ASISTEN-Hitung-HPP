import { ApiError } from "@/lib/api/client"
import { ENV } from "@/lib/env"
import type { ApiErrorResponse } from "@/lib/types/api"

export type AIStreamEvent =
  | { type: "token"; content: string }
  | { type: "done" }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseEvent(block: string): AIStreamEvent | null {
  let eventName = "message"
  const dataLines: string[] = []

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim()
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart())
    }
  }

  if (dataLines.length === 0) return null

  let payload: unknown
  try {
    payload = JSON.parse(dataLines.join("\n")) as unknown
  } catch {
    return null
  }

  if (eventName === "token" && isRecord(payload) && typeof payload.content === "string") {
    return { type: "token", content: payload.content }
  }
  if (eventName === "done") return { type: "done" }
  if (eventName === "error" && isRecord(payload)) {
    const code = typeof payload.code === "string" ? payload.code : "AI_PROVIDER_ERROR"
    const message = typeof payload.message === "string" ? payload.message : "AI request failed."
    throw new ApiError(502, { code, message })
  }
  return null
}

function toApiError(status: number, payload: unknown): ApiError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const error = payload.error
    if (typeof error.code === "string" && typeof error.message === "string") {
      return new ApiError(status, {
        code: error.code,
        message: error.message,
        details: isRecord(error.details) ? error.details : undefined,
        requestId: typeof error.requestId === "string" ? error.requestId : undefined,
      })
    }
  }
  return new ApiError(status, {
    code: "INTERNAL_ERROR",
    message: "Request failed.",
  })
}

export async function* streamAIResponse(
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<AIStreamEvent> {
  const response = await fetch(`${ENV.API_BASE_URL}/ai/stream`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
    signal,
  })

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = (await response.json()) as ApiErrorResponse
    } catch {
      payload = null
    }
    throw toApiError(response.status, payload)
  }

  if (!response.body) {
    throw new ApiError(502, {
      code: "AI_PROVIDER_ERROR",
      message: "AI stream is unavailable.",
    })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      const normalized = buffer.replace(/\r\n/g, "\n")
      let separatorIndex = normalized.indexOf("\n\n")
      while (separatorIndex >= 0) {
        const block = normalized.slice(0, separatorIndex)
        buffer = normalized.slice(separatorIndex + 2)
        const event = parseEvent(block)
        if (event) yield event
        separatorIndex = buffer.indexOf("\n\n")
      }

      if (done) {
        const event = parseEvent(buffer)
        if (event) yield event
        return
      }
    }
  } finally {
    reader.releaseLock()
  }
}
