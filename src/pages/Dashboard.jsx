import { useEffect, useMemo, useState } from 'react'
import { Truck, Users, Landmark, Wheat, IndianRupee, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { PageHeader, Card, StatCard, Spinner, Badge } from '../components/ui'
import { FarmerAPI, SupplyAPI, ShareAllocationAPI, FactoryRateAPI } from '../lib/services'
import { useAuth } from '../context/AuthContext'

const PIE_COLORS = ['#2A4730', '#B9791F', '#47774C', '#D18F2C', '#8F5A16']

export default function Dashboard() {
  const { username } = useAuth()
  const [loading, setLoading] = useState(true)
  const [farmers, setFarmers] = useState([])
  const [supplies, setSupplies] = useState([])
  const [shareAllocations, setShareAllocations] = useState([])
  const [rate, setRate] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await Promise.allSettled([
        FarmerAPI.list(),
        SupplyAPI.all(),
        ShareAllocationAPI.list(),
        FactoryRateAPI.latest(),
      ])
      if (results[0].status === 'fulfilled') setFarmers(results[0].value.data || [])
      if (results[1].status === 'fulfilled') setSupplies(results[1].value.data || [])
      if (results[2].status === 'fulfilled') setShareAllocations(results[2].value.data || [])
      if (results[3].status === 'fulfilled') setRate(results[3].value.data)
      setLoading(false)
    }
    load()
  }, [])

  const totalTonnes = useMemo(() => supplies.reduce((sum, s) => sum + (s.tonnes || 0), 0), [supplies])
  const totalPayout = useMemo(() => supplies.reduce((sum, s) => sum + (s.totalPrice || 0), 0), [supplies])
  const totalShareValue = useMemo(
    () => shareAllocations.reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0),
    [shareAllocations]
  )

  const recentSupplies = useMemo(
    () =>
      [...supplies]
        .sort((a, b) => new Date(b.supplyDate) - new Date(a.supplyDate))
        .slice(0, 6),
    [supplies]
  )

  const supplyByFarmer = useMemo(() => {
    const map = {}
    supplies.forEach((s) => {
      const key = s.farmerName || s.farmerCode || 'Unknown'
      map[key] = (map[key] || 0) + (s.tonnes || 0)
    })
    return Object.entries(map)
      .map(([name, tonnes]) => ({ name, tonnes: Number(tonnes.toFixed(2)) }))
      .sort((a, b) => b.tonnes - a.tonnes)
      .slice(0, 6)
  }, [supplies])

  const shareTypeSplit = useMemo(() => {
    const map = {}
    shareAllocations.forEach((s) => {
      const key = s.typeOfShare || 'OTHER'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [shareAllocations])

  if (loading) return <Spinner label="Loading dashboard…" />

  return (
    <div>
      <PageHeader
        eyebrow="OVERVIEW"
        title={`Good to see you, ${username || 'there'}`}
        description="A live snapshot of farmer intake, share value and today's factory rate."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered farmers" value={farmers.length} icon={Users} tone="cane" />
        <StatCard
          label="Cane supplied"
          value={`${totalTonnes.toLocaleString('en-IN', { maximumFractionDigits: 1 })} t`}
          sub={`${supplies.length} supply entries`}
          icon={Truck}
          tone="molasses"
        />
        <StatCard
          label="Total payout"
          value={`₹${totalPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub="Across all supply entries"
          icon={IndianRupee}
          tone="cane"
        />
        <StatCard
          label="Share capital value"
          value={`₹${totalShareValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`${shareAllocations.length} share allocations`}
          icon={Landmark}
          tone="molasses"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">Top suppliers by tonnage</h3>
            <TrendingUp size={15} className="text-cane-600" />
          </div>
          {supplyByFarmer.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">No supply data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={supplyByFarmer} margin={{ left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E8DA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4A5545' }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#4A5545' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#DBE0D0' }} />
                <Bar dataKey="tonnes" fill="#2A4730" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-sm font-semibold text-ink">Share type split</h3>
          {shareTypeSplit.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">No share allocations yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={shareTypeSplit} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {shareTypeSplit.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {shareTypeSplit.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" padded={false}>
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="font-display text-sm font-semibold text-ink">Recent supply entries</h3>
            <Wheat size={15} className="text-molasses-600" />
          </div>
          <div className="mt-3 divide-y divide-border">
            {recentSupplies.length === 0 && <p className="px-5 pb-5 text-sm text-ink-soft">No entries yet.</p>}
            {recentSupplies.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-ink">{s.farmerName || s.farmerCode}</div>
                  <div className="text-xs text-ink-soft">
                    {s.tractorNumber} &middot; {s.supplyDate ? new Date(s.supplyDate).toLocaleDateString('en-IN') : '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-ink">{s.tonnes} t</div>
                  <div className="text-xs text-ink-soft">₹{Number(s.totalPrice || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Current factory rate</h3>
          {rate ? (
            <div className="space-y-2.5 text-sm">
              <RateRow label="Sugarcane / ton" value={`₹${rate.rateOfSugarcanePerTon}`} />
              <RateRow label="Share sugar / kg" value={`₹${rate.rateOfShareSugar}`} />
              <RateRow label="Cane sugar / kg" value={`₹${rate.rateOfSugarcaneSugar}`} />
              <RateRow label="Share purchase amount" value={`₹${rate.sharePurchaseAmount}`} />
              <RateRow label="Monthly share sugar" value={`${rate.perMonthShareSugar} kg`} />
              <div className="pt-2">
                <Badge tone="green">Updated {rate.updatedDate}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No factory rate configured yet.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function RateRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 pb-2 last:border-none">
      <span className="text-ink-soft">{label}</span>
      <span className="font-mono font-medium text-ink">{value}</span>
    </div>
  )
}
