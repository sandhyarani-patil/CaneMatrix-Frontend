import { useEffect, useState } from 'react'
import { Download, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Table, Badge, statusTone } from '../../components/ui'
import { ShareTransferAPI } from '../../lib/services'
import { extractError, downloadFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function MyTransfers() {
  const { username } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ShareTransferAPI.byFarmer(username)
      .then(({ data }) => setRows(data || []))
      .catch((err) => toast.error(extractError(err, 'Could not load your transfer requests.')))
      .finally(() => setLoading(false))
  }, [username])

  async function downloadReceipt(id) {
    try {
      await downloadFile(`/share-transfer/receipt/pdf/${id}`, `Share_Transfer_Certificate_${id}.pdf`)
    } catch (err) {
      toast.error(extractError(err, 'Certificate is only available once approved.'))
    }
  }

  const columns = [
    { key: 'transferReason', header: 'Reason' },
    { key: 'transferDate', header: 'Requested on', render: (r) => r.transferDate || '—' },
    { key: 'documentPath', header: 'Document', render: (r) => (r.documentPath ? <Paperclip size={13} className="text-cane-600" /> : '—') },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.status === 'APPROVED' ? (
          <button className="rounded p-1.5 text-ink-soft hover:bg-cane-50 hover:text-cane-800" title="Download certificate" onClick={() => downloadReceipt(r.id)}>
            <Download size={14} />
          </button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="MEMBERSHIP CHANGE"
        title="Share Transfer Status"
        description="To request a share transfer, please visit or call the factory office — requests are lodged by the cooperative's staff on your behalf."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="p-4">
          <Table columns={columns} data={rows} loading={loading} emptyLabel="You have no share transfer requests on record" />
        </div>
      </Card>
    </div>
  )
}
