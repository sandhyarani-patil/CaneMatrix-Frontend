import { useEffect, useRef } from 'react'
import { X, Loader2, Inbox, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

// ---------------------------------------------------------------------------
// Page scaffolding
// ---------------------------------------------------------------------------
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1 font-mono text-[11px] tracking-wide text-cane-600">{eyebrow}</div>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Breadcrumbs({ items }) {
  return (
    <div className="mb-2 flex items-center gap-1 text-xs text-ink-soft">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} />}
          <span className={i === items.length - 1 ? 'text-ink' : ''}>{item}</span>
        </span>
      ))}
    </div>
  )
}

export function Card({ children, className, padded = true }) {
  return (
    <div className={clsx('rounded-lg border border-border bg-white', padded && 'p-5', className)}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
const buttonVariants = {
  primary: 'bg-cane-800 text-white hover:bg-cane-900 border border-cane-800',
  accent: 'bg-molasses-600 text-white hover:bg-molasses-700 border border-molasses-600',
  outline: 'bg-white text-ink border border-border hover:border-cane-600 hover:text-cane-800',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-cane-50 border border-transparent',
  danger: 'bg-white text-rust-600 border border-rust-100 hover:bg-rust-100',
}

export function Button({ children, variant = 'primary', size = 'md', className, icon: Icon, loading, ...props }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------
export function Field({ label, hint, required, error, children, className }) {
  return (
    <label className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-xs font-medium text-ink-soft">
          {label} {required && <span className="text-rust-600">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="text-[11px] text-ink-soft/70">{hint}</span>}
      {error && <span className="text-[11px] text-rust-600">{error}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition-colors focus:border-cane-600 focus:ring-2 focus:ring-cane-100 disabled:bg-paper-dim disabled:text-ink-soft'

export function Input({ className, ...props }) {
  return <input className={clsx(inputBase, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={clsx(inputBase, 'appearance-none bg-no-repeat', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return <textarea className={clsx(inputBase, 'min-h-[80px] resize-y', className)} {...props} />
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={clsx('flex items-center gap-2 text-sm text-ink', className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-border text-cane-700 focus:ring-cane-300" {...props} />
      {label}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
const badgeTones = {
  green: 'bg-cane-50 text-cane-800 border-cane-100',
  amber: 'bg-molasses-100 text-molasses-700 border-molasses-100',
  red: 'bg-rust-100 text-rust-600 border-rust-100',
  slate: 'bg-paper-dim text-ink-soft border-border',
}

export function Badge({ tone = 'slate', children }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', badgeTones[tone])}>
      {children}
    </span>
  )
}

export function statusTone(status) {
  const s = (status || '').toUpperCase()
  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'PAID'].includes(s)) return 'green'
  if (['PENDING', 'PROCESSING'].includes(s)) return 'amber'
  if (['REJECTED', 'INACTIVE', 'CANCELLED'].includes(s)) return 'red'
  return 'slate'
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
export function Table({ columns, data, keyField = 'id', onRowClick, loading, emptyLabel = 'No records found' }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> Loading data…
      </div>
    )
  }
  if (!data || data.length === 0) {
    return <EmptyState label={emptyLabel} />
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-cane-50/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-cane-800"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[keyField] ?? idx}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'border-b border-border/70 last:border-b-0',
                onRowClick && 'cursor-pointer hover:bg-paper-dim'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-ink">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({ label = 'Nothing here yet', hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
      <Inbox size={22} className="text-ink-soft/50" />
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      {hint && <p className="max-w-xs text-xs text-ink-soft/70">{hint}</p>}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal / Drawer
// ---------------------------------------------------------------------------
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-xl' }) {
  const ref = useRef(null)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-[2px]">
      <div
        ref={ref}
        className={clsx('animate-fade-in w-full rounded-xl border border-border bg-white shadow-xl', width)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-ink-soft hover:bg-paper-dim hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm', loading }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-ink-soft">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
export function StatCard({ label, value, sub, icon: Icon, tone = 'cane' }) {
  const tones = {
    cane: 'text-cane-800 bg-cane-50',
    molasses: 'text-molasses-700 bg-molasses-100',
    rust: 'text-rust-600 bg-rust-100',
  }
  return (
    <Card className="flex items-start justify-between">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">{label}</div>
        <div className="mt-2 font-display text-2xl font-semibold text-ink">{value}</div>
        {sub && <div className="mt-1 text-xs text-ink-soft">{sub}</div>}
      </div>
      {Icon && (
        <div className={clsx('rounded-md p-2', tones[tone])}>
          <Icon size={18} />
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(inputBase, 'max-w-xs', className)}
    />
  )
}
