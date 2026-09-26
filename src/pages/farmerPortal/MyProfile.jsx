import { Phone, Mail, MapPin, CreditCard, UserCheck, Sprout } from 'lucide-react'
import { PageHeader, Card, Badge, statusTone, Spinner, EmptyState } from '../../components/ui'
import { useMyFarmer } from '../../hooks/useMyFarmer'

export default function MyProfile() {
  const { farmer, loading, error } = useMyFarmer()

  if (loading) return <Spinner label="Loading your profile…" />
  if (error || !farmer) return <EmptyState label={error || 'Profile not found'} />

  return (
    <div>
      <PageHeader
        eyebrow="MY RECORD"
        title="My Profile"
        description="This is exactly what the factory office has on file for you. Contact them to correct any detail."
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cane-800 font-display text-xl font-semibold text-white">
          {farmer.farmerName?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{farmer.farmerName}</h2>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <span className="font-mono">{farmer.farmerCode}</span>
            <Badge tone={statusTone(farmer.status)}>{farmer.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle icon={Phone} title="Contact" />
          <InfoRow icon={Phone} label="Mobile" value={farmer.mobileNumber} />
          <InfoRow icon={Phone} label="Alternate" value={farmer.alternateMobileNumber} />
          <InfoRow icon={Mail} label="Email" value={farmer.email} />
          <InfoRow icon={MapPin} label="Address" value={[farmer.address, farmer.village, farmer.taluka, farmer.district, farmer.state, farmer.pincode].filter(Boolean).join(', ')} />
        </Card>

        <Card>
          <SectionTitle icon={UserCheck} title="Identity & Land" />
          <InfoRow label="Gender" value={farmer.gender} />
          <InfoRow label="Date of birth" value={farmer.dateOfBirth} />
          <InfoRow label="PAN" value={farmer.panNumber} />
          <InfoRow label="Aadhaar" value={farmer.aadharNumber} />
          <InfoRow label="Farm area" value={farmer.farmArea ? `${farmer.farmArea} acre` : '—'} />
          <InfoRow label="Registered on" value={farmer.registrationDate} />
          <div className="mt-3 flex gap-2">
            <Badge tone={farmer.has712 ? 'green' : 'slate'}>7/12 {farmer.has712 ? 'available' : 'missing'}</Badge>
            <Badge tone={farmer.has8A ? 'green' : 'slate'}>8A {farmer.has8A ? 'available' : 'missing'}</Badge>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={CreditCard} title="Bank details" />
          {farmer.bankDetail ? (
            <>
              <InfoRow label="Bank" value={farmer.bankDetail.bankName} />
              <InfoRow label="Branch" value={farmer.bankDetail.branchName} />
              <InfoRow label="Account no." value={farmer.bankDetail.accountNumber} />
              <InfoRow label="Holder" value={farmer.bankDetail.accountHolderName} />
              <InfoRow label="IFSC" value={farmer.bankDetail.ifscCode} />
            </>
          ) : (
            <p className="text-sm text-ink-soft">No bank details on file.</p>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle icon={UserCheck} title="Nominee" />
          {farmer.nominee ? (
            <>
              <InfoRow label="Name" value={farmer.nominee.nomineeName} />
              <InfoRow label="Relation" value={farmer.nominee.relation} />
              <InfoRow label="Date of birth" value={farmer.nominee.dateOfBirth} />
              <InfoRow label="Mobile" value={farmer.nominee.mobileNumber} />
            </>
          ) : (
            <p className="text-sm text-ink-soft">No nominee registered.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle icon={Sprout} title="Farm plots" />
          {farmer.farmDetails?.length ? (
            <div className="space-y-3">
              {farmer.farmDetails.map((fd) => (
                <div key={fd.id} className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-cane-800">Gat No. {fd.gatNumber || '—'}</span>
                    <Badge tone="slate">{fd.irrigationSource || 'Unspecified irrigation'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft sm:grid-cols-3">
                    <span>Village: <span className="text-ink">{fd.village || '—'}</span></span>
                    <span>Total area: <span className="text-ink">{fd.totalAreaAcre ?? '—'} acre</span></span>
                    <span>Cane area: <span className="text-ink">{fd.sugarcaneAreaAcre ?? '—'} acre</span></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No farm plots recorded.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={14} className="text-cane-600" />
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm last:border-none">
      <span className="text-ink-soft">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-ink" title={value}>{value || '—'}</span>
    </div>
  )
}
