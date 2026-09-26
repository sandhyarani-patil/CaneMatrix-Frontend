import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, Modal, Field, Input, ConfirmModal } from '../../components/ui'
import { FestivalSugarAPI } from '../../lib/services'
import { extractError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const emptyForm = () => ({
  allocationYear: '2026-2027',
  festivalName: '',
  sugarQuantityPerFarmerKg: '',
  distributionStartDate: '',
})

export default function FestivalSugar() {
  const { isAdmin, isClerk } = useAuth()
  const canWrite = isAdmin || isClerk
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await FestivalSugarAPI.list()
      setRows(data || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load festival sugar rules.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete() {
    setDeleting(true)
    try {
      await FestivalSugarAPI.remove(deleteTarget.id)
      toast.success('Festival sugar rule removed')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setDeleting(false)
    }
  }

  const totalPerFarmer = rows.reduce((sum, r) => sum + (r.sugarQuantityPerFarmerKg || 0), 0)

  const columns = [
    { key: 'festivalName', header: 'Festival', render: (r) => (
      <div className="flex items-center gap-2">
        <PartyPopper size={13} className="text-molasses-600" />
        <span className="font-medium text-ink">{r.festivalName}</span>
      </div>
    ) },
    { key: 'allocationYear', header: 'Season' },
    { key: 'sugarQuantityPerFarmerKg', header: 'Qty / farmer (kg)', render: (r) => <span className="font-mono">{r.sugarQuantityPerFarmerKg}</span> },
    { key: 'distributionStartDate', header: 'Distribution starts', render: (r) => r.distributionStartDate || '—' },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <div className="flex items-center gap-1">
                <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" onClick={() => { setEditing(r); setFormOpen(true) }}>
                  <Pencil size={14} />
                </button>
                <button className="rounded p-1.5 text-ink-soft hover:bg-rust-100 hover:text-rust-600" onClick={() => setDeleteTarget(r)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <PageHeader
        eyebrow="SEASONAL BONUS"
        title="Festival Sugar Master"
        description="Extra sugar quantity granted to every A-series member for each festival in the season."
        actions={canWrite && <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true) }}>Add festival rule</Button>}
      />

      <Card padded={false} className="mb-5 overflow-hidden">
        <div className="p-4">
          <Table columns={columns} data={rows} loading={loading} emptyLabel="No festival sugar rules configured" />
        </div>
      </Card>

      {rows.length > 0 && (
        <Card className="inline-flex items-center gap-2 text-sm text-ink-soft">
          Total festival sugar per member this season:
          <span className="font-mono font-semibold text-ink">{totalPerFarmer.toFixed(1)} kg</span>
        </Card>
      )}

      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        record={editing}
        onSaved={() => { setFormOpen(false); load() }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove festival rule?"
        description={`This deletes the ${deleteTarget?.festivalName} allocation for ${deleteTarget?.allocationYear}.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function FormModal({ open, onClose, record, onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const isEdit = !!record

  useEffect(() => {
    if (open) setForm(record ? { ...emptyForm(), ...record } : emptyForm())
  }, [open, record])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, sugarQuantityPerFarmerKg: Number(form.sugarQuantityPerFarmerKg) }
      if (isEdit) {
        await FestivalSugarAPI.update(record.id, payload)
        toast.success('Festival rule updated')
      } else {
        await FestivalSugarAPI.create(payload)
        toast.success('Festival rule added')
      }
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not save festival sugar rule.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit festival rule' : 'New festival rule'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Festival name" required>
          <Input value={form.festivalName} onChange={(e) => set('festivalName', e.target.value)} placeholder="Diwali, Gudi Padwa…" required />
        </Field>
        <Field label="Allocation season" required>
          <Input value={form.allocationYear} onChange={(e) => set('allocationYear', e.target.value)} required />
        </Field>
        <Field label="Sugar quantity per farmer (kg)" required>
          <Input type="number" step="0.1" value={form.sugarQuantityPerFarmerKg} onChange={(e) => set('sugarQuantityPerFarmerKg', e.target.value)} required />
        </Field>
        <Field label="Distribution start date">
          <Input type="date" value={form.distributionStartDate || ''} onChange={(e) => set('distributionStartDate', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Add rule'}</Button>
        </div>
      </form>
    </Modal>
  )
}
