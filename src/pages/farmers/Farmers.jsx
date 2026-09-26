import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, SearchInput, Badge, statusTone, ConfirmModal } from '../../components/ui'
import { FarmerAPI } from '../../lib/services'
import { extractError } from '../../lib/api'
import FarmerFormModal from './FarmerFormModal'

export default function Farmers() {
  const navigate = useNavigate()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await FarmerAPI.list()
      setFarmers(data || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load farmers.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return farmers
    return farmers.filter((f) =>
      [f.farmerCode, f.farmerName, f.mobileNumber, f.village, f.district].some((v) => v?.toLowerCase().includes(q))
    )
  }, [farmers, query])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await FarmerAPI.remove(deleteTarget.id)
      toast.success('Farmer record deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(extractError(err, 'Could not delete farmer.'))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'farmerCode', header: 'Code', render: (r) => <span className="font-mono text-xs text-cane-800">{r.farmerCode}</span> },
    {
      key: 'farmerName',
      header: 'Farmer',
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.farmerName}</div>
          <div className="flex items-center gap-1 text-xs text-ink-soft">
            <Phone size={11} /> {r.mobileNumber || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (r) => (
        <div className="flex items-center gap-1 text-xs text-ink-soft">
          <MapPin size={11} /> {[r.village, r.taluka, r.district].filter(Boolean).join(', ') || '—'}
        </div>
      ),
    },
    { key: 'farmArea', header: 'Land (acre)', render: (r) => r.farmArea ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status || 'N/A'}</Badge>,
    },
    { key: 'registrationDate', header: 'Registered', render: (r) => r.registrationDate || '—' },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800"
            onClick={() => {
              setEditing(r)
              setFormOpen(true)
            }}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            className="rounded p-1.5 text-ink-soft hover:bg-rust-100 hover:text-rust-600"
            onClick={() => setDeleteTarget(r)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="MEMBER REGISTRY"
        title="Farmers"
        description="Every registered cane-grower with land records, bank and nominee details."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Register farmer
          </Button>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, code, mobile, village…" />
          <span className="text-xs text-ink-soft">{filtered.length} of {farmers.length} farmers</span>
        </div>
        <div className="p-4 pt-0">
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            onRowClick={(r) => navigate(`/farmers/${r.id}`)}
            emptyLabel="No farmers registered yet"
          />
        </div>
      </Card>

      <FarmerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        farmer={editing}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete farmer record?"
        description={`This permanently removes ${deleteTarget?.farmerName || 'this farmer'} (${deleteTarget?.farmerCode}) and cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
