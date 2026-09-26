import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, SearchInput, Badge, statusTone, Modal, Field, Input, Select, ConfirmModal } from '../../components/ui'
import { ShareAllocationAPI, FarmerAPI, FactoryRateAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const emptyForm = () => ({
  farmerCode: '',
  farmerName: '',
  typeOfShare: 'REGULAR',
  sharePrice: '',
  sharePurchased: '',
  purchasingDate: new Date().toISOString().slice(0, 10),
  ratePerKg: '',
  typeOfSugarcane: 'Co 86032',
  plantingDate: '',
  perMonthSugarKg: '',
  nomineeName: '',
  directorName: '',
  status: 'ACTIVE',
})

export default function ShareAllocation() {
  const { isFarmer, user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

async function load() {
    setLoading(true)
    try {
      // सर्व रेकॉर्ड्स एकाच वेळी आणून फ्रंटेंडवर सेफली फिल्टर करूया
      const res = await ShareAllocationAPI.list()
      const allRows = res.data || res || []
      
      if (isFarmer && user?.username) {
        const rawCode = user.username.toUpperCase()
        const cleanCode = rawCode.replace('A-', '')
        
        const filteredRows = allRows.filter(r => {
          const rCode = (r.farmerCode || '').toUpperCase()
          return rCode.includes(cleanCode) || cleanCode.includes(rCode.replace('A-', ''))
        })
        setRows(filteredRows)
      } else {
        setRows(Array.isArray(allRows) ? allRows : [allRows])
      }
    } catch (err) {
      toast.error(extractError(err, 'Could not load share allocations.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [isFarmer, user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.farmerCode, r.farmerName, r.typeOfShare, r.directorName].some((v) => v?.toLowerCase?.().includes(q)))
  }, [rows, query])

  async function handleDelete() {
    setDeleting(true)
    try {
      await ShareAllocationAPI.remove(deleteTarget.id)
      toast.success('Share allocation deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setDeleting(false)
    }
  }

  async function handleExcel() {
    try {
      await downloadFile('/reports/share-allocation-report-excel', 'Share_Allocation_Report.xlsx')
      toast.success('Report downloaded')
    } catch (err) {
      toast.error(extractError(err, 'Could not download report.'))
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
    { key: 'typeOfShare', header: 'Type', render: (r) => <Badge tone="amber">{r.typeOfShare}</Badge> },
    { key: 'sharePurchased', header: 'Shares' },
    { key: 'sharePrice', header: 'Price/share', render: (r) => `₹${r.sharePrice}` },
    { key: 'totalPrice', header: 'Total', render: (r) => <span className="font-medium">₹{r.totalPrice}</span> },
    { key: 'typeOfSugarcane', header: 'Cane variety' },
    { key: 'purchasingDate', header: 'Purchased' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          {!isFarmer && (
            <>
              <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" onClick={() => { setEditing(r); setFormOpen(true) }}>
                <Pencil size={14} />
              </button>
              <button className="rounded p-1.5 text-ink-soft hover:bg-rust-100 hover:text-rust-600" onClick={() => setDeleteTarget(r)}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="MEMBERSHIP CAPITAL"
        title="Share Allocation"
        description="Cooperative shares purchased by each farmer against their sugarcane commitment."
        actions={
          !isFarmer && (
            <>
              <Button variant="outline" icon={FileDown} onClick={handleExcel}>Export Excel</Button>
              <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true) }}>New allocation</Button>
            </>
          )
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search farmer, share type, director…" />
          <span className="text-xs text-ink-soft">{filtered.length} of {rows.length}</span>
        </div>
        <div className="p-4 pt-0">
          <Table columns={columns} data={filtered} loading={loading} emptyLabel="No share allocations yet" />
        </div>
      </Card>

      {!isFarmer && (
        <ShareAllocationFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          record={editing}
          onSaved={() => { setFormOpen(false); load() }}
        />
      )}

      {!isFarmer && (
        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Delete share allocation?"
          description={`This removes the ${deleteTarget?.typeOfShare} allocation for ${deleteTarget?.farmerName}.`}
          confirmLabel="Delete"
        />
      )}
    </div>
  )
}

function ShareAllocationFormModal({ open, onClose, record, onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const isEdit = !!record

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({ ...emptyForm(), ...record })
      } else {
        setForm(emptyForm())
        fetchLatestFactoryRates()
      }
    }
  }, [open, record])

  async function fetchLatestFactoryRates() {
    try {
      const res = await FactoryRateAPI.list()
      const list = res.data || res || []
      const latest = Array.isArray(list) ? list[list.length - 1] : list

      if (latest) {
        setForm((f) => ({
          ...f,
          sharePrice: latest.sharePurchaseAmount ?? latest.sharePrice ?? '',
          ratePerKg: latest.rateOfSugarcaneSugar ?? latest.ratePerKg ?? '',
          perMonthSugarKg: latest.perMonthShareSugar ?? latest.perMonthSugarKg ?? '',
        }))
      }
    } catch (err) {
      console.error('Could not load factory rates', err)
    }
  }

  async function handleFarmerCodeBlur(code) {
    if (!code || isEdit) return
    try {
      const res = await FarmerAPI.list()
      const farmers = res.data || res || []
      const farmer = farmers.find(f => f.farmerCode?.toLowerCase() === code.trim().toLowerCase())
      
      if (farmer) {
        setForm((f) => ({
          ...f,
          farmerName: farmer.farmerName || farmer.fullName || '',
          nomineeName: farmer.nomineeName || farmer.nominee?.nomineeName || '',
        }))
        toast.success('Farmer details fetched!')
      } else {
        toast.error('Farmer code not found!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const formattedFarmerCode = form.farmerCode.startsWith('A-') 
        ? form.farmerCode 
        : `A-${form.farmerCode}`
      const payload = {
        ...form,
        farmerCode: formattedFarmerCode,
        sharePrice: Number(form.sharePrice),
        sharePurchased: Number(form.sharePurchased),
        ratePerKg: Number(form.ratePerKg),
        perMonthSugarKg: Number(form.perMonthSugarKg),
      }
      if (isEdit) {
        await ShareAllocationAPI.update(record.id, payload)
        toast.success('Share allocation updated')
      } else {
        await ShareAllocationAPI.create(payload)
        toast.success('Share allocation created')
      }
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not save share allocation.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit share allocation' : 'New share allocation'} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Farmer code" required>
          <Input 
            value={form.farmerCode} 
            onChange={(e) => set('farmerCode', e.target.value)} 
            onBlur={(e) => handleFarmerCodeBlur(e.target.value)}
            placeholder="FARM2026001" 
            required 
          />
        </Field>
        
        <Field label="Farmer name" required>
          <Input 
            value={form.farmerName} 
            onChange={(e) => set('farmerName', e.target.value)} 
            readOnly 
            className="bg-slate-100 cursor-not-allowed"
            placeholder="Auto-fetched from farmer code"
            required 
          />
        </Field>

        <Field label="Share type">
          <Select value={form.typeOfShare} onChange={(e) => set('typeOfShare', e.target.value)}>
            <option value="REGULAR">Regular</option>
            <option value="PROVISIONAL">Provisional</option>
            <option value="NOMINAL">Nominal</option>
          </Select>
        </Field>

        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRANSFERRED">Transferred</option>
          </Select>
        </Field>

        <Field label="Shares purchased" required>
          <Input type="number" value={form.sharePurchased} onChange={(e) => set('sharePurchased', e.target.value)} required />
        </Field>

        <Field label="Price per share (₹)" required>
          <Input 
            type="number" 
            step="0.01" 
            value={form.sharePrice} 
            readOnly 
            className="bg-slate-100 cursor-not-allowed"
            placeholder="Auto-fetched from Rate Master"
            required 
          />
        </Field>

        <Field label="Purchasing date" required>
          <Input type="date" value={form.purchasingDate} onChange={(e) => set('purchasingDate', e.target.value)} required />
        </Field>

        <Field label="Planting date" required>
          <Input type="date" value={form.plantingDate} onChange={(e) => set('plantingDate', e.target.value)} required />
        </Field>

        <Field label="Sugarcane variety" required>
          <Input value={form.typeOfSugarcane} onChange={(e) => set('typeOfSugarcane', e.target.value)} placeholder="Co 86032" required />
        </Field>

        <Field label="Rate per kg sugar (₹)" required>
          <Input 
            type="number" 
            step="0.01" 
            value={form.ratePerKg} 
            readOnly 
            className="bg-slate-100 cursor-not-allowed"
            placeholder="Auto-fetched from Rate Master"
            required 
          />
        </Field>

        <Field label="Per-month sugar (kg)" required>
          <Input 
            type="number" 
            step="0.01" 
            value={form.perMonthSugarKg} 
            readOnly 
            className="bg-slate-100 cursor-not-allowed"
            placeholder="Auto-fetched from Rate Master"
            required 
          />
        </Field>

        <Field label="Nominee name">
          <Input 
            value={form.nomineeName} 
            onChange={(e) => set('nomineeName', e.target.value)} 
            readOnly 
            className="bg-slate-100 cursor-not-allowed"
            placeholder="Auto-fetched from farmer code"
          />
        </Field>

        <Field label="Director name" className="sm:col-span-2">
          <Input value={form.directorName} onChange={(e) => set('directorName', e.target.value)} />
        </Field>

        <div className="sm:col-span-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create allocation'}</Button>
        </div>
      </form>
    </Modal>
  )
}