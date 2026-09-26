import { useEffect, useState } from 'react'
import { Download, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Table, Badge, statusTone, Spinner } from '../../components/ui'
import { ShareSugarAPI, TonnesSugarAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'
import { matchesFarmerCode } from '../../lib/farmerCode'
import { useAuth } from '../../context/AuthContext'

const TABS = ['Share Sugar', 'Tonnes Sugar']

export default function MyShares() {
  const [tab, setTab] = useState(0)

  return (
    <div>
      <PageHeader
        eyebrow="MY MEMBERSHIP"
        title="My Shares & Sugar"
        description="Your cooperative sugar entitlement, and the history of what you've lifted."
      />

      <div className="mb-5 flex flex-wrap gap-1 border-b border-border pb-3">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === i ? 'bg-cane-800 text-white' : 'text-ink-soft hover:bg-paper-dim'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <MyShareSugar />}
      {tab === 1 && <MyTonnesSugar />}
    </div>
  )
}

function MyShareSugar() {
  const { username } = useAuth()
  const [allocation, setAllocation] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      // Resolve the exact farmerCode as stored for this module first (it may or may
      // not carry the "A-" prefix depending on how the record was created), then use
      // that exact code for the scoped calls so they don't miss due to a prefix mismatch.
      const { data: allRows } = await ShareSugarAPI.list()
      const match = (allRows || []).find((r) => matchesFarmerCode(r.farmerCode, username))
      if (!match) {
        setAllocation(null)
        setHistory([])
        return
      }
      const exactCode = match.farmerCode
      const { data: hist } = await ShareSugarAPI.history(exactCode).catch(() => ({ data: [] }))
      setAllocation(match)
      setHistory(hist || [])
    } catch (err) {
      setAllocation(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  async function downloadReceipt(historyId) {
    try {
      await downloadFile(`/share-sugar-allocation/lift/pdf/${historyId}`, `Sugar_Receipt_${historyId}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Could not download receipt.'))
    }
  }

  if (loading) return <Spinner label="Loading your sugar allocation…" />

  if (!allocation) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">You don&rsquo;t have a share sugar allocation yet. This is created once you hold an A-series share — contact the factory office if you believe this is missing.</p>
      </Card>
    )
  }

  const historyColumns = [
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
    <div className="space-y-5">
      <Card>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <Row label="Season" value={allocation.allocationYear} />
          <Row label="Allocated" value={`${allocation.totalAllocatedSugarKg} kg`} />
          <Row label="Lifted" value={`${allocation.liftedSugarKg} kg`} />
          <Row label="Remaining" value={`${allocation.remainingSugarKg} kg`} />
        </div>
      </Card>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 pt-5">
          <History size={14} className="text-cane-600" />
          <h3 className="font-display text-sm font-semibold text-ink">Lift history</h3>
        </div>
        <div className="p-4">
          <Table columns={historyColumns} data={history} emptyLabel="You have not lifted any sugar yet" />
        </div>
      </Card>
    </div>
  )
}

function MyTonnesSugar() {
  const { username } = useAuth()
  const [allocation, setAllocation] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      // Same tolerant-match approach as Share Sugar: resolve the exact stored farmerCode
      // from the bulk list first (some tonnes-sugar records use an "A-" prefix, some don't),
      // then use that exact code for the history lookup.
      const { data: allRows } = await TonnesSugarAPI.all()
      const match = (allRows || []).find((r) => matchesFarmerCode(r.farmerCode, username))
      if (!match) {
        setAllocation(null)
        setHistory([])
        return
      }
      setAllocation(match)
      const { data: hist } = await TonnesSugarAPI.history(match.farmerCode).catch(() => ({ data: [] }))
      setHistory(hist || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load your tonnes sugar allocation.'))
      setAllocation(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  async function downloadReceipt(historyId) {
    try {
      await downloadFile(`/tonnes-sugar/lift/pdf/${historyId}`, `Cane_Sugar_Receipt_${historyId}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Could not download receipt.'))
    }
  }

  if (loading) return <Spinner label="Loading your tonnes sugar allocation…" />

  if (!allocation) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">No tonnage-based sugar allocation found for your account yet. This is created by the factory office once your season's cane supply is totalled.</p>
      </Card>
    )
  }

  const historyColumns = [
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
    <div className="space-y-5">
      <Card>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <Row label="Cane supplied" value={`${allocation.totalTonnes} t`} />
          <Row label="Sugar earned" value={`${allocation.tonnesSugarKg} kg`} />
          <Row label="Lifted" value={`${allocation.suppliedSugarKg} kg`} />
          <Row label="Remaining" value={`${allocation.remainingSugarKg} kg`} />
        </div>
        <div className="mt-3">
          <Badge tone={statusTone(allocation.status)}>{allocation.status}</Badge>
        </div>
      </Card>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 pt-5">
          <History size={14} className="text-cane-600" />
          <h3 className="font-display text-sm font-semibold text-ink">Lift history</h3>
        </div>
        <div className="p-4">
          <Table columns={historyColumns} data={history} emptyLabel="You have not lifted any tonnage-based sugar yet" />
        </div>
      </Card>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="font-medium text-ink">{value}</div>
    </div>
  )
}
