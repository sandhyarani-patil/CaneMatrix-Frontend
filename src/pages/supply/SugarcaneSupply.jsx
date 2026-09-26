import { useEffect, useMemo, useState } from 'react'
import { Plus, Download, FileDown, Search, Truck, User, Factory } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, SearchInput, Field, Input, Modal } from '../../components/ui'
import { SupplyAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function SugarcaneSupply() {
  const { isAdmin, isClerk } = useAuth()
  const canWrite = isAdmin || isClerk
  const [supplies, setSupplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data } = await SupplyAPI.all()
      setSupplies(data || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load supply entries.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function applyDateFilter() {
    if (!dateFrom || !dateTo) return toast.error('Pick both start and end dates.')
    setLoading(true)
    try {
      const { data } = await SupplyAPI.filterByDate(dateFrom, dateTo)
      setSupplies(data || [])
      toast.success(`${data.length} entries between ${dateFrom} and ${dateTo}`)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return supplies
    return supplies.filter((s) => [s.farmerCode, s.farmerName, s.tractorNumber, s.farmCode].some((v) => v?.toLowerCase().includes(q)))
  }, [supplies, query])

  async function handleReceipt(id) {
    try {
      await downloadFile(`/sugarcane-supply/receipt/${id}`, `Sugarcane_Receipt_${id}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Could not download receipt.'))
    }
  }

  async function handleExcel() {
    try {
      await downloadFile('/reports/sugarcane-excel', 'Sugarcane_Supply_Report.xlsx')
      toast.success('Report downloaded')
    } catch (err) {
      toast.error(extractError(err, 'Could not download report.'))
    }
  }

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'farmer',
      header: 'Farmer',
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.farmerName || '—'}</div>
          <div className="font-mono text-xs text-ink-soft">{r.farmerCode}</div>
        </div>
      ),
    },
    { key: 'farmCode', header: 'Farm code', render: (r) => r.farmCode || '—' },
    { key: 'tractorNumber', header: 'Vehicle', render: (r) => r.tractorNumber || '—' },
    { key: 'driverName', header: 'Driver', render: (r) => r.driverName || '—' },
    { key: 'tonnes', header: 'Tonnes', render: (r) => <span className="font-mono">{r.tonnes}</span> },
    { key: 'ratePerTon', header: 'Rate/ton', render: (r) => <span className="font-mono">₹{r.ratePerTon}</span> },
    { key: 'totalPrice', header: 'Amount', render: (r) => <span className="font-mono font-medium">₹{r.totalPrice}</span> },
    {
      key: 'supplyDate',
      header: 'Date',
      render: (r) => (r.supplyDate ? new Date(r.supplyDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button onClick={() => handleReceipt(r.id)} className="flex items-center gap-1 rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Download receipt">
          <Download size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="WEIGHBRIDGE INTAKE"
        title="Sugarcane Supply"
        description="Every cane consignment logged at the gate, with cumulative tonnage and payout."
        actions={
          <>
            <Button variant="outline" icon={FileDown} onClick={handleExcel}>Export Excel</Button>
            {canWrite && <Button icon={Plus} onClick={() => setAddOpen(true)}>Log new entry</Button>}
          </>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search farmer, vehicle, farm code…" />
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
            <span className="text-xs text-ink-soft">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
            <Button size="sm" variant="outline" icon={Search} onClick={applyDateFilter}>Filter</Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                load()
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="p-4 pt-0">
          <Table columns={columns} data={filtered} loading={loading} emptyLabel="No supply entries logged yet" />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <FarmerSummaryTool />
        <VehicleSummaryTool />
        <FactorySummaryTool />
      </div>

      <AddSupplyModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load() }} />
    </div>
  )
}

function AddSupplyModal({ open, onClose, onSaved }) {
  const initial = { farmerCode: '', farmCode: '', tonnes: '', tractorNumber: '', driverName: '', plantingDate: '' }
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await SupplyAPI.add({ ...form, tonnes: Number(form.tonnes) })
      toast.success('Supply entry recorded')
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not save supply entry.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log sugarcane supply" subtitle="Weighbridge entry for an incoming cane consignment">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Farmer code" required>
          <Input value={form.farmerCode} onChange={(e) => setForm({ ...form, farmerCode: e.target.value })} required />
        </Field>
        <Field label="Farm code">
          <Input value={form.farmCode} onChange={(e) => setForm({ ...form, farmCode: e.target.value })} />
        </Field>
        <Field label="Tonnes" required>
          <Input type="number" step="0.01" value={form.tonnes} onChange={(e) => setForm({ ...form, tonnes: e.target.value })} required />
        </Field>
        <Field label="Planting date">
          <Input type="date" value={form.plantingDate} onChange={(e) => setForm({ ...form, plantingDate: e.target.value })} />
        </Field>
        <Field label="Tractor number">
          <Input value={form.tractorNumber} onChange={(e) => setForm({ ...form, tractorNumber: e.target.value })} placeholder="MH-14-AB-1234" />
        </Field>
        <Field label="Driver name">
          <Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save entry</Button>
        </div>
      </form>
    </Modal>
  )
}

function ToolCard({ icon: Icon, title, children }) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className="text-cane-600" />
        <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

function FarmerSummaryTool() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!code) return
    setLoading(true)
    try {
      const { data } = await SupplyAPI.summary(code)
      setResult(data)
    } catch (err) {
      toast.error(extractError(err, 'No summary found for that farmer.'))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolCard icon={User} title="Farmer supply summary">
      <div className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Farmer code" />
        <Button size="sm" onClick={search} loading={loading}>Go</Button>
      </div>
      {result && (
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Farmer" value={result.farmerName} />
          <Row label="Trips" value={result.totalTrips} />
          <Row label="Total tonnes" value={result.totalTonnes} />
          <Row label="Total amount" value={`₹${result.grandTotalAmount?.toLocaleString('en-IN')}`} />
        </div>
      )}
    </ToolCard>
  )
}

function VehicleSummaryTool() {
  const [tractor, setTractor] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!tractor || !from || !to) return toast.error('Fill vehicle number and both dates.')
    setLoading(true)
    try {
      const { data } = await SupplyAPI.vehicleSummary(tractor, from, to)
      setResult(data)
    } catch (err) {
      toast.error(extractError(err))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolCard icon={Truck} title="Vehicle summary">
      <div className="space-y-2">
        <Input value={tractor} onChange={(e) => setTractor(e.target.value)} placeholder="Tractor number" />
        <div className="flex gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button size="sm" className="w-full" onClick={search} loading={loading}>View summary</Button>
      </div>
      {result && (
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Trips" value={result.totalTrips} />
          <Row label="Total tonnes" value={result.totalTonnes} />
          <Row label="Amount generated" value={`₹${result.totalAmountGenerated?.toLocaleString('en-IN')}`} />
        </div>
      )}
    </ToolCard>
  )
}

function FactorySummaryTool() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!from || !to) return toast.error('Pick both dates.')
    setLoading(true)
    try {
      const { data } = await SupplyAPI.factorySummary(from, to)
      setResult(data)
    } catch (err) {
      toast.error(extractError(err))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolCard icon={Factory} title="Factory summary">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button size="sm" className="w-full" onClick={search} loading={loading}>View summary</Button>
      </div>
      {result && (
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Trips" value={result.totalTrips} />
          <Row label="Total tonnes" value={result.totalTonnes} />
          <Row label="Total payout" value={`₹${result.totalFactoryPayout?.toLocaleString('en-IN')}`} />
        </div>
      )}
    </ToolCard>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 last:border-none">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value ?? '—'}</span>
    </div>
  )
}
