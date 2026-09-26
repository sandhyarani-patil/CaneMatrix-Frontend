import { useEffect, useMemo, useState } from 'react'
import { Plus, Check, X as XIcon, Download, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Table, SearchInput, Badge, statusTone, Modal, Field, Input, Textarea } from '../../components/ui'
import { ShareTransferAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ShareTransfer() {
  const { isAdmin, isClerk } = useAuth()
  const canCreate = isAdmin || isClerk
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await ShareTransferAPI.all()
      setRows(data || [])
    } catch (err) {
      toast.error(extractError(err, 'Could not load share transfer requests.'))
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
    return rows.filter((r) => [r.farmerCode, r.farmerName, r.transferReason, r.transfereeName].some((v) => v?.toLowerCase?.().includes(q)))
  }, [rows, query])

  async function updateStatus(id, status) {
    setBusyId(id)
    try {
      await ShareTransferAPI.updateStatus(id, status)
      toast.success(`Request ${status.toLowerCase()}`)
      load()
    } catch (err) {
      toast.error(extractError(err, 'Could not update status.'))
    } finally {
      setBusyId(null)
    }
  }

  async function downloadReceipt(id) {
    try {
      await downloadFile(`/share-transfer/receipt/pdf/${id}`, `Share_Transfer_Certificate_${id}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Certificate is only available once the transfer is approved.'))
    }
  }

  const columns = [
    {
      key: 'farmer',
      header: 'Requested by',
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.farmerName}</div>
          <div className="font-mono text-xs text-ink-soft">{r.farmerCode}</div>
        </div>
      ),
    },
    { key: 'transferReason', header: 'Reason' },
    { key: 'transferDate', header: 'Requested on', render: (r) => r.transferDate || '—' },
    { key: 'documentPath', header: 'Document', render: (r) => (r.documentPath ? <Paperclip size={13} className="text-cane-600" /> : '—') },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          {isAdmin && r.status === 'PENDING' && (
            <>
              <button
                className="rounded p-1.5 text-cane-700 hover:bg-cane-50"
                title="Approve"
                disabled={busyId === r.id}
                onClick={() => updateStatus(r.id, 'APPROVED')}
              >
                <Check size={14} />
              </button>
              <button
                className="rounded p-1.5 text-rust-600 hover:bg-rust-100"
                title="Reject"
                disabled={busyId === r.id}
                onClick={() => updateStatus(r.id, 'REJECTED')}
              >
                <XIcon size={14} />
              </button>
            </>
          )}
          {r.status === 'APPROVED' && (
            <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Download certificate" onClick={() => downloadReceipt(r.id)}>
              <Download size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="MEMBERSHIP CHANGE"
        title="Share Transfer"
        description="Requests to transfer cooperative shares between members, with admin approval workflow."
        actions={canCreate && <Button icon={Plus} onClick={() => setAddOpen(true)}>New transfer request</Button>}
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search farmer, reason…" />
          <span className="text-xs text-ink-soft">{filtered.length} of {rows.length}</span>
        </div>
        <div className="p-4 pt-0">
          <Table columns={columns} data={filtered} loading={loading} emptyLabel="No transfer requests yet" />
        </div>
      </Card>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load() }} />
    </div>
  )
}

function AddModal({ open, onClose, onSaved }) {
  const [farmerCode, setFarmerCode] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [document, setDocument] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFarmerCode('')
      setTransferReason('')
      setDocument(null)
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await ShareTransferAPI.create(farmerCode, transferReason, document)
      toast.success('Transfer request submitted')
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not submit transfer request.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request share transfer" subtitle="e.g. death of member, voluntary sale of shares">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Farmer code" required>
          <Input value={farmerCode} onChange={(e) => setFarmerCode(e.target.value)} required />
        </Field>
        <Field label="Reason for transfer" required>
          <Textarea value={transferReason} onChange={(e) => setTransferReason(e.target.value)} required placeholder="Death of member, voluntary sale…" />
        </Field>
        <Field label="Supporting document" hint="Death certificate or affidavit, optional">
          <input
            type="file"
            onChange={(e) => setDocument(e.target.files?.[0] || null)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-cane-50 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-cane-800"
          />
        </Field>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Submit request</Button>
        </div>
      </form>
    </Modal>
  )
}
