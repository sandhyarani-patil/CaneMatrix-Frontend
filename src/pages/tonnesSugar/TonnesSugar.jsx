import { useEffect, useMemo, useState } from 'react'
import { Plus, History, Download, Package, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, SearchInput, Badge, statusTone, Modal, Field, Input, ConfirmModal } from '../../components/ui'
import { TonnesSugarAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'

export default function TonnesSugar() {
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
      const { data } = await TonnesSugarAPI.all()
      setRows(data || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load tonnes sugar allocations.'))
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
    return rows.filter((r) => [r.farmerCode, r.farmerName].some((v) => v?.toLowerCase?.().includes(q)))
  }, [rows, query])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await TonnesSugarAPI.remove(deleteTarget.id)
      toast.success('Tonnes sugar allocation deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(extractError(err, 'Could not delete allocation.'))
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
    { key: 'totalTonnes', header: 'Cane (t)', render: (r) => <span className="font-mono">{r.totalTonnes}</span> },
    { key: 'tonnesSugarKg', header: 'Sugar earned (kg)', render: (r) => <span className="font-mono">{r.tonnesSugarKg}</span> },
    { key: 'suppliedSugarKg', header: 'Lifted (kg)', render: (r) => <span className="font-mono text-molasses-700">{r.suppliedSugarKg}</span> },
    { key: 'remainingSugarKg', header: 'Remaining (kg)', render: (r) => <span className="font-mono text-cane-800">{r.remainingSugarKg}</span> },
    { key: 'amountOfTonnesSugar', header: 'Amount', render: (r) => `₹${r.amountOfTonnesSugar}` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Lift Sugar" onClick={() => setLiftTarget(r)}>
            <Package size={14} />
          </button>
          <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Lift History" onClick={() => setHistoryTarget(r)}>
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
        eyebrow="TONNAGE-BASED QUOTA"
        title="Tonnes Sugar Allocation"
        description="Sugar entitlement calculated directly from a farmer's total cane supply, at the tonnage sugar rate."
        actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>New allocation</Button>}
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search farmer…" />
          <span className="text-xs text-ink-soft">{filtered.length} of {rows.length}</span>
        </div>
        <div className="p-4 pt-0">
          <Table columns={columns} data={filtered} loading={loading} emptyLabel="No tonnes sugar allocations yet" />
        </div>
      </Card>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load() }} />
      <LiftModal target={liftTarget} onClose={() => setLiftTarget(null)} onLifted={() => { setLiftTarget(null); load() }} />
      <HistoryModal target={historyTarget} onClose={() => setHistoryTarget(null)} />
      
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete allocation?"
        description={`This will remove the tonnes sugar allocation for ${deleteTarget?.farmerName}.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function AddModal({ open, onClose, onSaved }) {
  const [farmerCode, setFarmerCode] = useState('')
  const [totalTonnes, setTotalTonnes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFarmerCode('')
      setTotalTonnes('')
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await TonnesSugarAPI.create(farmerCode, Number(totalTonnes))
      toast.success('Tonnes sugar allocation created')
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not create allocation.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New tonnes sugar allocation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Farmer code" required>
          <Input value={farmerCode} onChange={(e) => setFarmerCode(e.target.value)} required />
        </Field>
        <Field label="Total cane supplied (tonnes)" required>
          <Input type="number" step="0.01" value={totalTonnes} onChange={(e) => setTotalTonnes(e.target.value)} required />
        </Field>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

function LiftModal({ target, onClose, onLifted }) {
  const [quantityLifted, setQuantityLifted] = useState('')
  const [liftDate, setLiftDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (target) {
      setQuantityLifted('')
      setLiftDate(new Date().toISOString().slice(0, 10))
    }
  }, [target])

  if (!target) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await TonnesSugarAPI.lift(target.farmerCode, Number(quantityLifted), liftDate)
      toast.success('Sugar lifted successfully')
      onLifted?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not process lifting.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!target} onClose={onClose} title={`Lift sugar — ${target.farmerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-xs text-ink-soft">
          Remaining quota: <span className="font-semibold text-ink">{target.remainingSugarKg} kg</span>
        </div>
        <Field label="Quantity to lift (kg)" required>
          <Input type="number" step="0.01" max={target.remainingSugarKg} value={quantityLifted} onChange={(e) => setQuantityLifted(e.target.value)} required />
        </Field>
        <Field label="Lift date" required>
          <Input type="date" value={liftDate} onChange={(e) => setLiftDate(e.target.value)} required />
        </Field>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Lift Sugar</Button>
        </div>
      </form>
    </Modal>
  )
}

function HistoryModal({ target, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (target) {
      setLoading(true)
      TonnesSugarAPI.history(target.farmerCode)
        .then(({ data }) => setHistory(data || []))
        .catch((err) => toast.error(extractError(err)))
        .finally(() => setLoading(false))
    }
  }, [target])

  if (!target) return null

  async function downloadReceipt(historyId) {
    try {
      await downloadFile(`/tonnes-sugar/lift/pdf/${historyId}`, `Cane_Sugar_Receipt_${historyId}.pdf`)
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
      <Table columns={columns} data={history} loading={loading} emptyLabel="No lifting history for this allocation" />
    </Modal>
  )
}