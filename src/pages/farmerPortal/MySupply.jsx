import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, StatCard, Table, Spinner, EmptyState } from '../../components/ui'
import { SupplyAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Truck, IndianRupee, Package } from 'lucide-react'

export default function MySupply() {
  const { username } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data } = await SupplyAPI.summary(username)
        setSummary(data)
      } catch (err) {
        setError(extractError(err, 'No supply records found for your account yet.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username])

  async function handleReceipt(id) {
    try {
      await downloadFile(`/sugarcane-supply/receipt/${id}`, `Sugarcane_Receipt_${id}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Could not download receipt.'))
    }
  }

  if (loading) return <Spinner label="Loading your supply history…" />

  const columns = [
    { key: 'tractorNumber', header: 'Vehicle', render: (r) => r.tractorNumber || '—' },
    { key: 'driverName', header: 'Driver', render: (r) => r.driverName || '—' },
    { key: 'tonnes', header: 'Tonnes', render: (r) => <span className="font-mono">{r.tonnes}</span> },
    { key: 'ratePerTon', header: 'Rate/ton', render: (r) => <span className="font-mono">₹{r.ratePerTon}</span> },
    { key: 'totalPrice', header: 'Amount', render: (r) => <span className="font-mono font-medium">₹{r.totalPrice}</span> },
    { key: 'supplyDate', header: 'Date', render: (r) => (r.supplyDate ? new Date(r.supplyDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—') },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button onClick={() => handleReceipt(r.id)} className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Download receipt">
          <Download size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="MY LEDGER"
        title="My Sugarcane Supply"
        description="Every consignment weighed in under your farmer code, with downloadable receipts."
      />

      {error || !summary ? (
        <EmptyState label={error || 'No supply entries recorded yet'} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total trips" value={summary.totalTrips} icon={Package} tone="cane" />
            <StatCard label="Total tonnes" value={`${summary.totalTonnes.toLocaleString('en-IN')} t`} icon={Truck} tone="molasses" />
            <StatCard label="Total payout" value={`₹${summary.grandTotalAmount.toLocaleString('en-IN')}`} icon={IndianRupee} tone="cane" />
          </div>

          <Card padded={false} className="mt-5 overflow-hidden">
            <div className="p-4">
              <Table columns={columns} data={summary.supplies || []} emptyLabel="No supply entries recorded yet" />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
