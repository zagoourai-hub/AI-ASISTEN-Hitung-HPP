/**
 * Decimal string formatters & money helpers.
 * Note: Frontend never performs authoritative money arithmetic.
 */

export function parseDecimalToNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  const num = typeof value === "string" ? parseFloat(value) : value
  return isNaN(num) ? 0 : num
}

export function formatIDR(amount: string | number | null | undefined): string {
  const num = parseDecimalToNumber(amount)
  return (
    "Rp " +
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(num)
  )
}

export function formatPercent(
  value: string | number | null | undefined,
  decimals: number = 1
): string {
  const num = parseDecimalToNumber(value)
  return (
    num.toLocaleString("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  )
}
