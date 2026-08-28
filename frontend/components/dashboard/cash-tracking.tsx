"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react"
import { ApiError } from "@/lib/api/client"
import {
  createCashTransaction,
  deleteCashTransaction,
  getCashBalance,
  getCashSummary,
  listCashTransactions,
  updateCashBalance,
  updateCashTransaction,
  type CashPeriod,
  type CashTransactionPayload,
} from "@/lib/api/cash"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR } from "@/lib/format"
import type { CashTransaction, CashTransactionType } from "@/lib/types/api"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { useToast } from "@/components/feedback/toast-provider"

const today = () => new Date().toISOString().slice(0, 10)

function monthStart() {
  const current = new Date()
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-01`
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return mapSemanticErrorToMessage(error.code, error.message)
  }
  return "Data kas belum dapat dimuat. Pastikan backend aktif lalu coba lagi."
}

function isValidPeriod(period: CashPeriod) {
  return period.dateFrom <= period.dateTo
}

export function CashTrackingSection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [transactionFormKey, setTransactionFormKey] = useState(0)
  const period = { dateFrom, dateTo }

  const balanceQuery = useQuery({
    queryKey: ["cash", "balance"],
    queryFn: ({ signal }: { signal: AbortSignal }) => getCashBalance(signal),
  })
  const summaryQuery = useQuery({
    queryKey: ["cash", "summary", dateFrom, dateTo],
    queryFn: ({ signal }: { signal: AbortSignal }) => getCashSummary(period, signal),
    enabled: isValidPeriod(period),
  })
  const transactionsQuery = useQuery({
    queryKey: ["cash", "transactions", dateFrom, dateTo],
    queryFn: ({ signal }: { signal: AbortSignal }) => listCashTransactions(period, signal),
    enabled: isValidPeriod(period),
  })

  const invalidateCash = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cash"] })
  }
  const balanceMutation = useMutation({
    mutationFn: updateCashBalance,
    onSuccess: async () => {
      await invalidateCash()
      toast({ variant: "success", title: "Saldo awal tersimpan", description: "Ringkasan kas sudah diperbarui." })
    },
    onError: (error: unknown) => toast({ variant: "error", title: "Saldo belum tersimpan", description: errorMessage(error) }),
  })
  const createMutation = useMutation({
    mutationFn: createCashTransaction,
    onSuccess: async () => {
      setTransactionFormKey((key) => key + 1)
      await invalidateCash()
      toast({ variant: "success", title: "Transaksi ditambahkan", description: "Catatan kas dan saldo sudah diperbarui." })
    },
    onError: (error: unknown) => toast({ variant: "error", title: "Transaksi belum tersimpan", description: errorMessage(error) }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CashTransactionPayload> }) => updateCashTransaction(id, payload),
    onSuccess: async () => {
      setEditingTransaction(null)
      await invalidateCash()
      toast({ variant: "success", title: "Transaksi diperbarui", description: "Perubahan sudah tersimpan." })
    },
    onError: (error: unknown) => toast({ variant: "error", title: "Transaksi belum diperbarui", description: errorMessage(error) }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCashTransaction,
    onSuccess: async () => {
      setDeleteId(null)
      await invalidateCash()
      toast({ variant: "success", title: "Transaksi dihapus", description: "Ringkasan kas sudah dihitung ulang." })
    },
    onError: (error: unknown) => toast({ variant: "error", title: "Transaksi belum dihapus", description: errorMessage(error) }),
  })

  const firstError = [summaryQuery.error, transactionsQuery.error, balanceQuery.error].find(
    (error) => error && !(error instanceof ApiError && error.status === 404)
  )
  if (summaryQuery.isPending || transactionsQuery.isPending || balanceQuery.isPending) {
    return (
      <section aria-labelledby="cash-tracking-title" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div><h2 id="cash-tracking-title" className="text-lg font-bold">Catatan Kas</h2><p className="text-xs text-[#737B76] dark:text-[#98A09B]">Memuat ringkasan kas manual...</p></div>
        </div>
        <LoadingSpinner label="Memuat data kas..." className="rounded-[18px] border border-[#E8ECE9] bg-white dark:border-[#2B312E] dark:bg-[#161A18]" />
      </section>
    )
  }
  if (firstError) {
    return <section aria-labelledby="cash-tracking-title" className="space-y-4"><h2 id="cash-tracking-title" className="text-lg font-bold">Catatan Kas</h2><ErrorBanner message={errorMessage(firstError)} onRetry={() => { balanceQuery.refetch(); summaryQuery.refetch(); transactionsQuery.refetch() }} /></section>
  }
  if (!isValidPeriod(period)) {
    return <section aria-labelledby="cash-tracking-title" className="space-y-4"><h2 id="cash-tracking-title" className="text-lg font-bold">Catatan Kas</h2><ErrorBanner message="Tanggal mulai tidak boleh melewati tanggal akhir." /></section>
  }

  const summary = summaryQuery.data
  const transactions = transactionsQuery.data?.data ?? []
  const openingBalance = balanceQuery.data?.openingBalance ?? summary?.openingBalance ?? "0"
  const formBusy = createMutation.isPending || updateMutation.isPending

  return (
    <section aria-labelledby="cash-tracking-title" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#14804A]">Arus kas manual</p>
          <h2 id="cash-tracking-title" className="mt-1 text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Catatan Kas</h2>
          <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">Pantau uang masuk dan keluar tanpa terhubung ke bank, ATM, atau e-wallet.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <label className="text-[11px] font-semibold text-[#444B47] dark:text-[#D5DAD7]">Dari<input aria-label="Tanggal mulai periode kas" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E8ECE9] bg-white px-2 text-xs text-[#161A18] outline-none focus:border-[#14804A] focus:ring-1 focus:ring-[#14804A] dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]" /></label>
          <label className="text-[11px] font-semibold text-[#444B47] dark:text-[#D5DAD7]">Sampai<input aria-label="Tanggal akhir periode kas" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E8ECE9] bg-white px-2 text-xs text-[#161A18] outline-none focus:border-[#14804A] focus:ring-1 focus:ring-[#14804A] dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]" /></label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <CashMetric label="Saldo awal" value={formatIDR(summary?.openingBalance)} icon={<Wallet className="h-4 w-4" />} />
        <CashMetric label="Pemasukan" value={formatIDR(summary?.totalIncome)} icon={<ArrowDownLeft className="h-4 w-4" />} tone="income" />
        <CashMetric label="Pengeluaran" value={formatIDR(summary?.totalExpense)} icon={<ArrowUpRight className="h-4 w-4" />} tone="expense" />
        <CashMetric label="Arus kas bersih" value={formatIDR(summary?.netCashflow)} icon={<CalendarDays className="h-4 w-4" />} tone={Number(summary?.netCashflow ?? 0) >= 0 ? "income" : "expense"} />
        <CashMetric label="Saldo penutupan" value={formatIDR(summary?.closingBalance)} icon={<Check className="h-4 w-4" />} prominent />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <BalanceForm initialValue={openingBalance} isPending={balanceMutation.isPending} onSubmit={(value) => balanceMutation.mutate(value)} />
        <TransactionForm key={`${editingTransaction?.id ?? "new"}-${transactionFormKey}`} initialTransaction={editingTransaction} isPending={formBusy} onCancel={() => setEditingTransaction(null)} onSubmit={(payload) => {
          if (editingTransaction) updateMutation.mutate({ id: editingTransaction.id, payload })
          else createMutation.mutate(payload as CashTransactionPayload)
        }} />
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader className="border-b border-[#E8ECE9] p-4 sm:p-5 dark:border-[#2B312E]">
          <div className="flex items-center justify-between gap-3"><div><CardTitle>Transaksi periode ini</CardTitle><CardDescription className="mt-1">{transactions.length ? `${transactions.length} transaksi terbaru` : "Belum ada transaksi pada periode ini."}</CardDescription></div><span className="rounded-full bg-[#EEF9F2] px-2.5 py-1 text-[11px] font-semibold text-[#10673C] dark:bg-[#10673C33] dark:text-[#8BE0AC]">{summary?.dateFrom} s/d {summary?.dateTo}</span></div>
        </CardHeader>
        {transactions.length === 0 ? <EmptyState title="Belum ada transaksi" description="Tambahkan pemasukan atau pengeluaran untuk mulai mencatat arus kas." className="m-4" /> : <TransactionList transactions={transactions} deleteId={deleteId} isDeleting={deleteMutation.isPending} onEdit={setEditingTransaction} onDeleteRequest={setDeleteId} onDelete={() => { if (deleteId) deleteMutation.mutate(deleteId) }} onCancelDelete={() => setDeleteId(null)} />}
      </Card>
    </section>
  )
}

function CashMetric({ label, value, icon, tone, prominent = false }: { label: string; value: string; icon: React.ReactNode; tone?: "income" | "expense"; prominent?: boolean }) {
  const toneClass = tone === "expense" ? "text-[#C63C3C] bg-[#FEF2F2] dark:bg-[#7F1D1D33]" : tone === "income" ? "text-[#10673C] bg-[#EEF9F2] dark:bg-[#10673C33]" : "text-[#14804A] bg-[#DDF5E7] dark:bg-[#10673C44]"
  return <article className={`rounded-[14px] border p-4 ${prominent ? "border-[#14804A] bg-[#F2FCF5] dark:border-[#1B9556] dark:bg-[#163322]" : "border-[#E8ECE9] bg-white dark:border-[#2B312E] dark:bg-[#161A18]"}`}><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]">{label}</p><span className={`flex h-7 w-7 items-center justify-center rounded-full ${toneClass}`}>{icon}</span></div><p className="mt-3 truncate text-base font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">{value}</p></article>
}

function BalanceForm({ initialValue, isPending, onSubmit }: { initialValue: string; isPending: boolean; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0) {
      setError("Masukkan saldo awal IDR nol atau lebih.")
      inputRef.current?.focus()
      return
    }
    setError(null)
    onSubmit(value.trim())
  }

  return <Card><CardHeader className="p-0 pb-4"><CardTitle>Saldo awal</CardTitle><CardDescription>Atur saldo kas manual untuk periode perhitungan.</CardDescription></CardHeader><form onSubmit={submit} noValidate><label htmlFor="opening-balance" className="text-xs font-semibold text-[#444B47] dark:text-[#D5DAD7]">Saldo awal (IDR)</label><Input ref={inputRef} id="opening-balance" className="mt-2" type="number" min="0" step="0.0001" inputMode="decimal" value={value} onChange={(event) => { setValue(event.target.value); setError(null) }} aria-invalid={Boolean(error)} aria-describedby={error ? "opening-balance-error" : "opening-balance-help"} /><p id="opening-balance-help" className="mt-1.5 text-[11px] text-[#737B76] dark:text-[#98A09B]">Boleh diubah kapan saja. Tidak terhubung ke rekening eksternal.</p>{error && <p id="opening-balance-error" role="alert" className="mt-1.5 text-xs font-medium text-[#991B1B]">{error}</p>}<Button type="submit" size="sm" className="mt-4" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan saldo"}</Button></form></Card>
}

function TransactionForm({ initialTransaction, isPending, onCancel, onSubmit }: { initialTransaction: CashTransaction | null; isPending: boolean; onCancel: () => void; onSubmit: (payload: Partial<CashTransactionPayload>) => void }) {
  const [type, setType] = useState<CashTransactionType>(initialTransaction?.type ?? "INCOME")
  const [amount, setAmount] = useState(initialTransaction?.amount ?? "")
  const [category, setCategory] = useState(initialTransaction?.category ?? "")
  const [note, setNote] = useState(initialTransaction?.note ?? "")
  const [transactionDate, setTransactionDate] = useState(initialTransaction?.transactionDate ?? today())
  const [error, setError] = useState<string | null>(null)
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Masukkan nominal transaksi yang lebih besar dari nol.")
      document.getElementById("cash-amount")?.focus()
      return
    }
    if (!transactionDate) {
      setError("Pilih tanggal transaksi.")
      document.getElementById("cash-date")?.focus()
      return
    }
    setError(null)
    onSubmit({ type, amount: amount.trim(), category: category.trim() || null, note: note.trim() || null, transactionDate })
  }
  return <Card><CardHeader className="p-0 pb-4"><CardTitle>{initialTransaction ? "Edit transaksi" : "Tambah transaksi"}</CardTitle><CardDescription>{initialTransaction ? "Perbarui detail transaksi kas." : "Catat pemasukan atau pengeluaran secara manual."}</CardDescription></CardHeader><form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#444B47] dark:text-[#D5DAD7]">Jenis<select value={type} onChange={(event) => setType(event.target.value as CashTransactionType)} className="mt-2 h-11 w-full rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 text-xs text-[#161A18] outline-none focus:border-[#14804A] focus:ring-1 focus:ring-[#14804A] dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"><option value="INCOME">Pemasukan</option><option value="EXPENSE">Pengeluaran</option></select></label><label htmlFor="cash-amount" className="text-xs font-semibold text-[#444B47] dark:text-[#D5DAD7]">Nominal (IDR)<Input id="cash-amount" className="mt-2" type="number" min="0.0001" step="0.0001" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError(null) }} aria-invalid={Boolean(error)} /></label><label htmlFor="cash-date" className="text-xs font-semibold text-[#444B47] dark:text-[#D5DAD7]">Tanggal<Input id="cash-date" className="mt-2" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} /></label><label htmlFor="cash-category" className="text-xs font-semibold text-[#444B47] dark:text-[#D5DAD7]">Kategori (opsional)<Input id="cash-category" className="mt-2" maxLength={100} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Contoh: Penjualan" /></label><label htmlFor="cash-note" className="text-xs font-semibold text-[#444B47] dark:text-[#D5DAD7] sm:col-span-2">Catatan (opsional)<Input id="cash-note" className="mt-2" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tambahkan konteks singkat" /></label>{error && <p role="alert" className="text-xs font-medium text-[#991B1B] sm:col-span-2">{error}</p>}<div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" size="sm" disabled={isPending}>{isPending ? "Menyimpan..." : initialTransaction ? "Simpan perubahan" : <><Plus className="h-4 w-4" />Tambah transaksi</>}</Button>{initialTransaction && <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isPending}>Batal</Button>}</div></form></Card>
}

function TransactionList({ transactions, deleteId, isDeleting, onEdit, onDeleteRequest, onDelete, onCancelDelete }: { transactions: CashTransaction[]; deleteId: string | null; isDeleting: boolean; onEdit: (transaction: CashTransaction) => void; onDeleteRequest: (id: string) => void; onDelete: () => void; onCancelDelete: () => void }) {
  return <><div className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E] md:hidden">{transactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} deleteId={deleteId} isDeleting={isDeleting} onEdit={onEdit} onDeleteRequest={onDeleteRequest} onDelete={onDelete} onCancelDelete={onCancelDelete} />)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-xs"><caption className="sr-only">Daftar transaksi kas</caption><thead className="bg-[#FAFBFA] text-[11px] text-[#737B76] dark:bg-[#141A16] dark:text-[#98A09B]"><tr><th scope="col" className="px-5 py-3 font-semibold">Tanggal</th><th scope="col" className="px-5 py-3 font-semibold">Jenis</th><th scope="col" className="px-5 py-3 font-semibold">Kategori / catatan</th><th scope="col" className="px-5 py-3 text-right font-semibold">Nominal</th><th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">{transactions.map((transaction) => <tr key={transaction.id} className="hover:bg-[#FAFBFA] dark:hover:bg-[#141A16]"><td className="whitespace-nowrap px-5 py-3.5 text-[#444B47] dark:text-[#D5DAD7]">{formatTransactionDate(transaction.transactionDate)}</td><td className="px-5 py-3.5"><TypeLabel type={transaction.type} /></td><td className="max-w-[240px] px-5 py-3.5"><p className="truncate font-medium text-[#161A18] dark:text-[#FAFBFA]">{transaction.category ?? "Tanpa kategori"}</p><p className="truncate text-[11px] text-[#737B76]">{transaction.note ?? "Tanpa catatan"}</p></td><td className={`whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums ${transaction.type === "EXPENSE" ? "text-[#C63C3C]" : "text-[#10673C]"}`}>{transaction.type === "EXPENSE" ? "-" : "+"}{formatIDR(transaction.amount)}</td><td className="px-5 py-3.5"><TransactionActions transaction={transaction} deleteId={deleteId} isDeleting={isDeleting} onEdit={onEdit} onDeleteRequest={onDeleteRequest} onDelete={onDelete} onCancelDelete={onCancelDelete} /></td></tr>)}</tbody></table></div></>
}

function TransactionItem({ transaction, deleteId, isDeleting, onEdit, onDeleteRequest, onDelete, onCancelDelete }: { transaction: CashTransaction; deleteId: string | null; isDeleting: boolean; onEdit: (transaction: CashTransaction) => void; onDeleteRequest: (id: string) => void; onDelete: () => void; onCancelDelete: () => void }) {
  return <article className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">{transaction.category ?? "Tanpa kategori"}</p><p className="mt-1 text-[11px] text-[#737B76]">{formatTransactionDate(transaction.transactionDate)} · {transaction.note ?? "Tanpa catatan"}</p></div><p className={`whitespace-nowrap text-sm font-bold tabular-nums ${transaction.type === "EXPENSE" ? "text-[#C63C3C]" : "text-[#10673C]"}`}>{transaction.type === "EXPENSE" ? "-" : "+"}{formatIDR(transaction.amount)}</p></div><div className="mt-3 flex items-center justify-between gap-3"><TypeLabel type={transaction.type} /><TransactionActions transaction={transaction} deleteId={deleteId} isDeleting={isDeleting} onEdit={onEdit} onDeleteRequest={onDeleteRequest} onDelete={onDelete} onCancelDelete={onCancelDelete} /></div></article>
}

function TypeLabel({ type }: { type: CashTransactionType }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${type === "INCOME" ? "bg-[#EEF9F2] text-[#10673C] dark:bg-[#10673C33] dark:text-[#8BE0AC]" : "bg-[#FEF2F2] text-[#991B1B] dark:bg-[#7F1D1D33] dark:text-[#FCA5A5]"}`}>{type === "INCOME" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}{type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</span>
}

function TransactionActions({ transaction, deleteId, isDeleting, onEdit, onDeleteRequest, onDelete, onCancelDelete }: { transaction: CashTransaction; deleteId: string | null; isDeleting: boolean; onEdit: (transaction: CashTransaction) => void; onDeleteRequest: (id: string) => void; onDelete: () => void; onCancelDelete: () => void }) {
  if (deleteId === transaction.id) return <div className="flex flex-wrap items-center justify-end gap-2" role="alert"><span className="text-[11px] font-medium text-[#991B1B]">Hapus transaksi?</span><Button type="button" size="xs" variant="destructive" onClick={onDelete} disabled={isDeleting}>{isDeleting ? "Menghapus..." : "Hapus"}</Button><Button type="button" size="xs" variant="outline" onClick={onCancelDelete} disabled={isDeleting}>Batal</Button></div>
  return <div className="flex items-center justify-end gap-1"><Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit transaksi ${transaction.category ?? "tanpa kategori"}`} onClick={() => onEdit(transaction)}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" size="icon-sm" variant="ghost" aria-label={`Hapus transaksi ${transaction.category ?? "tanpa kategori"}`} onClick={() => onDeleteRequest(transaction.id)}><Trash2 className="h-3.5 w-3.5 text-[#C63C3C]" /></Button></div>
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`))
}
