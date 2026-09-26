import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Landmark, Wheat, IndianRupee, ArrowRight, MapPin, Phone } from 'lucide-react'
import { PageHeader, Card, StatCard, Spinner, Badge, statusTone } from '../../components/ui'
import { SupplyAPI, ShareAllocationAPI, ShareSugarAPI, FactoryRateAPI } from '../../lib/services'
import { useAuth } from '../../context/AuthContext'
import { useMyFarmer } from '../../hooks/useMyFarmer'

export default function FarmerDashboard() {
  const { username } = useAuth()
  const { farmer, loading: farmerLoading } = useMyFarmer()
  const [supplySummary, setSupplySummary] = useState(null)
  const [shareAllocations, setShareAllocations] = useState([])
  const [shareSugar, setShareSugar] = useState(null)
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await Promise.allSettled([
        SupplyAPI.summary(username),
        ShareAllocationAPI.byFarmerCode(username),
        ShareSugarAPI.byFarmerCode(username),
        FactoryRateAPI.latest(),
      ])
      if (results[0].status === 'fulfilled') setSupplySummary(results[0].value.data)
      if (results[1].status === 'fulfilled') setShareAllocations(results[1].value.data || [])
      if (results[2].status === 'fulfilled') setShareSugar(results[2].value.data)
      if (results[3].status === 'fulfilled') setRate(results[3].value.data)
      setLoading(false)
    }
    load()
  }, [username])

  if (loading || farmerLoading) return <Spinner label="Loading your dashboard…" />

  const shareValue = shareAllocations.reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0)

  return (
    <div>
      <PageHeader
        eyebrow="MY WORKSPACE"
        title={`Welcome, ${farmer?.farmerName || username}`}
        description="A quick look at your cane supply, shares and sugar entitlement this season."
      />

      {farmer && (
        <Card className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cane-800 font-display text-base font-semibold text-white">
              {farmer.farmerName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-ink">{farmer.farmerName}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-soft">
                <span className="font-mono">{farmer.farmerCode}</span>
                <span className="flex items-center gap-1"><Phone size={11} /> {farmer.mobileNumber || '—'}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {[farmer.village, farmer.district].filter(Boolean).join(', ') || '—'}</span>
              </div>
            </div>
          </div>
          <Link to="/my-profile" className="flex items-center gap-1 text-sm font-medium text-cane-700 hover:text-cane-900">
            View full profile <ArrowRight size={14} />
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cane supplied" value={`${(supplySummary?.totalTonnes ?? 0).toLocaleString('en-IN')} t`} sub={`${supplySummary?.totalTrips ?? 0} trips this season`} icon={Truck} tone="molasses" />
        <StatCard label="Payout earned" value={`₹${(supplySummary?.grandTotalAmount ?? 0).toLocaleString('en-IN')}`} sub="From sugarcane supply" icon={IndianRupee} tone="cane" />
        <StatCard label="Share capital" value={`₹${shareValue.toLocaleString('en-IN')}`} sub={`${shareAllocations.length} share allocation(s)`} icon={Landmark} tone="molasses" />
        <StatCard label="Sugar remaining" value={`${(shareSugar?.remainingSugarKg ?? 0).toLocaleString('en-IN')} kg`} sub={shareSugar ? `of ${shareSugar.totalAllocatedSugarKg} kg allocated` : 'No allocation yet'} icon={Wheat} tone="cane" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Recent supply entries</h3>
          {supplySummary?.supplies?.length ? (
            <div className="divide-y divide-border">
              {[...supplySummary.supplies]
                .sort((a, b) => new Date(b.supplyDate) - new Date(a.supplyDate))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="text-ink">{s.tractorNumber || 'Vehicle N/A'}</div>
                      <div className="text-xs text-ink-soft">{s.supplyDate ? new Date(s.supplyDate).toLocaleDateString('en-IN') : '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-ink">{s.tonnes} t</div>
                      <div className="text-xs text-ink-soft">₹{Number(s.totalPrice || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No supply entries recorded yet.</p>
          )}
          <Link to="/my-supply" className="mt-3 flex items-center gap-1 text-xs font-medium text-cane-700 hover:text-cane-900">
            View all supply history <ArrowRight size={12} />
          </Link>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Sugar entitlement status</h3>
          {shareSugar ? (
            <div className="space-y-2 text-sm">
              <Row label="Season" value={shareSugar.allocationYear} />
              <Row label="Total allocated" value={`${shareSugar.totalAllocatedSugarKg} kg`} />
              <Row label="Lifted so far" value={`${shareSugar.liftedSugarKg} kg`} />
              <Row label="Remaining" value={`${shareSugar.remainingSugarKg} kg`} />
              <div className="pt-1">
                <Badge tone={statusTone(shareSugar.status)}>{shareSugar.status}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No share sugar allocation found for your account yet.</p>
          )}
          <Link to="/my-shares" className="mt-3 flex items-center gap-1 text-xs font-medium text-cane-700 hover:text-cane-900">
            Manage shares & lift sugar <ArrowRight size={12} />
          </Link>
        </Card>
      </div>

      {rate && (
        <Card className="mt-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Current factory rate</h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Row label="Cane / ton" value={`₹${rate.rateOfSugarcanePerTon}`} />
            <Row label="Share sugar / kg" value={`₹${rate.rateOfShareSugar}`} />
            <Row label="Cane sugar / kg" value={`₹${rate.rateOfSugarcaneSugar}`} />
            <Row label="Effective from" value={rate.updatedDate} />
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 last:border-none sm:block sm:border-none sm:pb-0">
      <span className="text-ink-soft">{label}</span>
      <span className="block font-medium text-ink sm:mt-0.5">{value ?? '—'}</span>
    </div>
  )
}
