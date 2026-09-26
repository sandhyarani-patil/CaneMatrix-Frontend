import { useEffect, useState } from 'react'
import { Percent, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, Field, Input, Badge } from '../../components/ui'
import { FactoryRateAPI } from '../../lib/services'
import { extractError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const emptyForm = () => ({
  sugarFactoryName: '',
  sharePurchaseAmount: '',
  perMonthShareSugar: '',
  rateOfShareSugar: '',
  rateOfSugarcaneSugar: '',
  rateOfSugarcanePerTon: '',
  updatedDate: new Date().toISOString().slice(0, 10),
})

export default function FactoryRate() {
  const { isAdmin } = useAuth()
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await FactoryRateAPI.all()
      setRates([...data].reverse())
    } catch (err) {
      toast.error(extractError(err, 'Could not load factory rates.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await FactoryRateAPI.saveOrUpdate({
        ...form,
        sharePurchaseAmount: Number(form.sharePurchaseAmount),
        perMonthShareSugar: Number(form.perMonthShareSugar),
        rateOfShareSugar: Number(form.rateOfShareSugar),
        rateOfSugarcaneSugar: Number(form.rateOfSugarcaneSugar),
        rateOfSugarcanePerTon: Number(form.rateOfSugarcanePerTon),
      })
      toast.success('Factory rate published')
      setForm(emptyForm())
      load()
    } catch (err) {
      toast.error(extractError(err, 'Could not save factory rate.'))
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'sugarFactoryName', header: 'Factory' },
    { key: 'rateOfSugarcanePerTon', header: '₹ / ton cane', render: (r) => <span className="font-mono">₹{r.rateOfSugarcanePerTon}</span> },
    { key: 'rateOfShareSugar', header: '₹ / kg share sugar', render: (r) => <span className="font-mono">₹{r.rateOfShareSugar}</span> },
    { key: 'rateOfSugarcaneSugar', header: '₹ / kg cane sugar', render: (r) => <span className="font-mono">₹{r.rateOfSugarcaneSugar}</span> },
    { key: 'sharePurchaseAmount', header: 'Share price', render: (r) => `₹${r.sharePurchaseAmount}` },
    { key: 'perMonthShareSugar', header: 'Monthly share sugar (kg)', render: (r) => r.perMonthShareSugar },
    { key: 'updatedDate', header: 'Effective from' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="RATE MASTER"
        title="Sugar Factory Rates"
        description="The rates driving every share, tonnes-sugar and payout calculation across the system."
      />

      <div className={`grid grid-cols-1 gap-5 ${isAdmin ? 'lg:grid-cols-[1fr_1.4fr]' : ''}`}>
        {isAdmin && (
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Percent size={14} className="text-cane-600" />
              <h3 className="font-display text-sm font-semibold text-ink">Publish new rate</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Field label="Factory name" required>
                <Input value={form.sugarFactoryName} onChange={(e) => set('sugarFactoryName', e.target.value)} required />
              </Field>
              <Field label="Rate of sugarcane / ton (₹)" required>
                <Input type="number" step="0.01" value={form.rateOfSugarcanePerTon} onChange={(e) => set('rateOfSugarcanePerTon', e.target.value)} required />
              </Field>
              <Field label="Rate of share sugar / kg (₹)" required>
                <Input type="number" step="0.01" value={form.rateOfShareSugar} onChange={(e) => set('rateOfShareSugar', e.target.value)} required />
              </Field>
              <Field label="Rate of cane sugar / kg (₹)" required>
                <Input type="number" step="0.01" value={form.rateOfSugarcaneSugar} onChange={(e) => set('rateOfSugarcaneSugar', e.target.value)} required />
              </Field>
              <Field label="Share purchase amount (₹)" required>
                <Input type="number" step="0.01" value={form.sharePurchaseAmount} onChange={(e) => set('sharePurchaseAmount', e.target.value)} required />
              </Field>
              <Field label="Monthly share sugar (kg)" required>
                <Input type="number" step="0.01" value={form.perMonthShareSugar} onChange={(e) => set('perMonthShareSugar', e.target.value)} required />
              </Field>
              <Field label="Effective date" required>
                <Input type="date" value={form.updatedDate} onChange={(e) => set('updatedDate', e.target.value)} required />
              </Field>
              <Button type="submit" icon={Save} loading={saving} className="w-full">Publish rate</Button>
            </form>
          </Card>
        )}

        <Card padded={false}>
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="font-display text-sm font-semibold text-ink">Rate history</h3>
            {rates[0] && <Badge tone="green">Current: {rates[0].sugarFactoryName}</Badge>}
          </div>
          <div className="p-4">
            <Table columns={columns} data={rates} loading={loading} emptyLabel="No factory rate published yet" />
          </div>
        </Card>
      </div>
    </div>
  )
}
