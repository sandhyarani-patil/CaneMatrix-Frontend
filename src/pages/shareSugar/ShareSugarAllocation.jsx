import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, History, PackageMinus, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, SearchInput, Badge, statusTone, Modal, Field, Input, ConfirmModal } from '../../components/ui'
import { ShareSugarAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'

export default function ShareSugarAllocation() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [liftTarget, setLiftTarget] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await ShareSugarAPI.list()
      setRows(data || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load share sugar allocations.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.farmerCode, r.farmerName, r.allocationYear].some((v) => v?.toLowerCase?.().includes(q)))
  }, [rows, query])

  async function handleDelete() {
    setDeleting(true)
    try {
      await ShareSugarAPI.remove(deleteTarget.id)
      toast.success('Allocation deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'farmer',
      header: 'Farmer',
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.farmerName}</div>
          <div className="font-mono text-xs text-ink-soft">{r.farmerCode}</div>
        </div>
      ),
    },
    { key: 'allocationYear', header: 'Year' },
    { key: 'totalAllocatedSugarKg', header: 'Allocated (kg)', render: (r) => <span className="font-mono">{r.totalAllocatedSugarKg?.toFixed?.(1) ?? r.totalAllocatedSugarKg}</span> },
    { key: 'liftedSugarKg', header: 'Lifted (kg)', render: (r) => <span className="font-mono text-molasses-700">{r.liftedSugarKg?.toFixed?.(1) ?? r.liftedSugarKg}</span> },
    { key: 'remainingSugarKg', header: 'Remaining (kg)', render: (r) => <span className="font-mono text-cane-800">{r.remainingSugarKg?.toFixed?.(1) ?? r.remainingSugarKg}</span> },
    { key: 'totalBillAmount', header: 'Bill amount', render: (r) => `₹${r.totalBillAmount ?? 0}` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button className="rounded p-1.5 text-ink-soft hover:bg-molasses-100 hover:text-molasses-700" title="Lift sugar" onClick={() => setLiftTarget(r)}>
            <PackageMinus size={14} />
          </button>
          <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Lift history" onClick={() => setHistoryTarget(r)}>
            <History size={14} />
          </button>
          <button className="rounded p-1.5 text-ink-soft hover:bg-rust-100 hover:text-rust-600" title="Delete" onClick={() => setDeleteTarget(r)}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="MEMBER SUGAR QUOTA"
        title="Share Sugar Allocation"
        description="Yearly and festival sugar entitlement earned against 'A' series shares, and lifting against it."
        actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>New allocation</Button>}
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search farmer or year…" />
          <span className="text-xs text-ink-soft">{filtered.length} of {rows.length}</span>
        </div>
        <div className="p-4 pt-0">
          <Table columns={columns} data={filtered} loading={loading} emptyLabel="No share sugar allocations yet" />
        </div>
      </Card>

      <AddAllocationModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load() }} />
      <LiftModal target={liftTarget} onClose={() => setLiftTarget(null)} onDone={() => { setLiftTarget(null); load() }} />
      <HistoryModal target={historyTarget} onClose={() => setHistoryTarget(null)} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete allocation?"
        description={`Remove the ${deleteTarget?.allocationYear} share sugar allocation for ${deleteTarget?.farmerName}.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function AddAllocationModal({ open, onClose, onSaved }) {
  const [farmerCode, setFarmerCode] = useState('')
  const [allocationYear, setAllocationYear] = useState('2026-2027')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFarmerCode('')
      setAllocationYear('2026-2027')
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await ShareSugarAPI.create({ farmerCode, allocationYear })
      toast.success('Share sugar allocation created')
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not create allocation. Farmer must hold an A-series share first.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New share sugar allocation" subtitle="Only eligible for A-series share members">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Farmer code" required hint="A-series member code, e.g. A-FARM2026001">
          <Input value={farmerCode} onChange={(e) => setFarmerCode(e.target.value)} required />
        </Field>
        <Field label="Allocation year" required>
          <Input value={allocationYear} onChange={(e) => setAllocationYear(e.target.value)} required />
        </Field>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

function LiftModal({ target, onClose, onDone }) {
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    setQuantity('')
    setReceipt(null)
  }, [target])

  if (!target) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await ShareSugarAPI.lift(target.farmerCode, Number(quantity))
      setReceipt(data)
      toast.success('Sugar lifted successfully')
    } catch (err) {
      toast.error(extractError(err, 'Could not process sugar lift.'))
    } finally {
      setSaving(false)
    }
  }

  async function downloadReceipt() {
    try {
      await downloadFile(`/share-sugar-allocation/lift/pdf/${receipt.liftHistoryId}`, `Sugar_Receipt_${receipt.liftHistoryId}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Could not download receipt.'))
    }
  }

  return (
    <Modal open={!!target} onClose={onClose} title={`Lift sugar — ${target.farmerName}`} subtitle={`Remaining: ${target.remainingSugarKg} kg`}>
      {!receipt ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Quantity to lift (kg)" required>
            <Input type="number" step="0.1" max={target.remainingSugarKg} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>Confirm lift</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border border-cane-100 bg-cane-50 p-4 text-sm">
            <Row label="Lifted this round" value={`${receipt.currentLiftedKg} kg`} />
            <Row label="Bill amount" value={`₹${receipt.currentBillAmount}`} />
            <Row label="Total lifted so far" value={`${receipt.totalLiftedSoFar} kg`} />
            <Row label="Remaining" value={`${receipt.remainingSugarKg} kg`} />
            <Row label="Lift date" value={receipt.liftDate} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={Download} onClick={downloadReceipt}>Download receipt</Button>
            <Button onClick={onDone}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function HistoryModal({ target, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (target) {
      setLoading(true)
      ShareSugarAPI.history(target.farmerCode)
        .then(({ data }) => setHistory(data || []))
        .catch((err) => toast.error(extractError(err)))
        .finally(() => setLoading(false))
    }
  }, [target])

  if (!target) return null

  async function downloadReceipt(historyId) {
    try {
      await downloadFile(`/share-sugar-allocation/lift/pdf/${historyId}`, `Sugar_Receipt_${historyId}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Could not download receipt.'))
    }
  }

  const columns = [
    { key: 'liftDate', header: 'Date' },
    { key: 'quantityLifted', header: 'Lifted (kg)', render: (r) => <span className="font-mono">{r.quantityLifted}</span> },
    { key: 'liftBillAmount', header: 'Bill', render: (r) => `₹${r.liftBillAmount}` },
    { key: 'remainingSugarKg', header: 'Remaining (kg)', render: (r) => <span className="font-mono">{r.remainingSugarKg}</span> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" onClick={() => downloadReceipt(r.id)}>
          <Download size={14} />
        </button>
      ),
    },
  ]

  return (
    <Modal open={!!target} onClose={onClose} title={`Lift history — ${target.farmerName}`} width="max-w-2xl">
      <Table columns={columns} data={history} loading={loading} emptyLabel="No sugar has been lifted yet" />
    </Modal>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}
