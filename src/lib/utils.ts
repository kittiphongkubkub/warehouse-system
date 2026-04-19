import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import { th } from 'date-fns/locale'

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy', { locale: th })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: th })
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: th })
}

export function isExpired(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return isBefore(new Date(date), new Date())
}

export function isExpiringSoon(date: Date | string | null | undefined, daysAhead: number = 30): boolean {
  if (!date) return false
  const expiryDate = new Date(date)
  return isBefore(expiryDate, addDays(new Date(), daysAhead)) && isAfter(expiryDate, new Date())
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('th-TH')
}

export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined) return '฿0.00'
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function generateTransactionNo(prefix: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getTime()).slice(-6)
  return `${prefix}-${year}${month}${day}-${time}`
}
