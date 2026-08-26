/**
 * Frontend environment variables with strict runtime validation.
 */
export const ENV = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  APP_NAME: "M0neyku",
  DEFAULT_CURRENCY: "IDR",
} as const
