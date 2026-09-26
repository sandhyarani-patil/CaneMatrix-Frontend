import { useState } from 'react'
import { FileSpreadsheet, Download, Truck, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, Card, Button, Field, Input, Select } from '../../components/ui'
import { extractError, downloadFile } from '../../lib/api'

export default function Reports() {
  return (
    <div>
      <PageHeader
        eyebrow="EXPORTS"
        title="Reports"
        description="Generate formatted Excel workbooks for supply intake and share allocations, filtered the way you need them."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SugarcaneReport />
        <ShareAllocationReport />
      </div>
    </div>
  )
}

function ReportCard({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Icon size={15} className="text-cane-600" />
        <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      </div>
      <p className="mb-4 text-xs text-ink-soft">{description}</p>
      {children}
    </Card>
  )
}

function SugarcaneReport() {
  const [farmerCode, setFarmerCode] = useState('')
  const [supplyDate, setSupplyDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      await downloadFile('/reports/sugarcane-excel', 'Sugarcane_Supply_Report.xlsx', {
        farmerCode: farmerCode || undefined,
        supplyDate: supplyDate || undefined,
      })
      toast.success('Report downloaded')
    } catch (err) {
      toast.error(extractError(err, 'Could not generate report.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReportCard icon={Truck} title="Sugarcane Supply Report" description="Every weighbridge entry, optionally filtered by farmer code or a single supply date.">
      <div className="space-y-3">
        <Field label="Farmer code (optional)">
          <Input value={farmerCode} onChange={(e) => setFarmerCode(e.target.value)} placeholder="Leave blank for all farmers" />
        </Field>
        <Field label="Supply date (optional)">
          <Input type="date" value={supplyDate} onChange={(e) => setSupplyDate(e.target.value)} />
        </Field>
        <Button icon={Download} loading={loading} onClick={handleDownload} className="w-full">
          Download Excel
        </Button>
      </div>
    </ReportCard>
  )
}

function ShareAllocationReport() {
  const [typeOfShare, setTypeOfShare] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      await downloadFile('/reports/share-allocation-report-excel', 'Share_Allocation_Report.xlsx', {
        typeOfShare: typeOfShare || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      toast.success('Report downloaded')
    } catch (err) {
      toast.error(extractError(err, 'Could not generate report.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReportCard icon={Landmark} title="Share Allocation Report" description="Share purchase ledger with grand total, filtered by share type and purchase date range.">
      <div className="space-y-3">
        <Field label="Share type (optional)">
          <Select value={typeOfShare} onChange={(e) => setTypeOfShare(e.target.value)}>
            <option value="">All types</option>
            <option value="REGULAR">Regular</option>
            <option value="PROVISIONAL">Provisional</option>
            <option value="NOMINAL">Nominal</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End date">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Button icon={Download} loading={loading} onClick={handleDownload} className="w-full">
          Download Excel
        </Button>
      </div>
    </ReportCard>
  )
}
