import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Field, Input, Select, Checkbox, Button } from '../../components/ui'
import { FarmerAPI } from '../../lib/services'
import { extractError } from '../../lib/api'

const emptyFarm = () => ({ gatNumber: '', totalAreaAcre: '', sugarcaneAreaAcre: '', irrigationSource: '', village: '' })

const emptyForm = () => ({
  farmerCode: '',
  farmerName: '',
  gender: 'MALE',
  dateOfBirth: '',
  mobileNumber: '',
  alternateMobileNumber: '',
  email: '',
  password: '',
  address: '',
  village: '',
  taluka: '',
  district: '',
  state: 'Maharashtra',
  pincode: '',
  panNumber: '',
  aadharNumber: '',
  registrationDate: new Date().toISOString().slice(0, 10),
  has712: false,
  has8A: false,
  farmArea: '',
  bankDetail: { bankName: '', branchName: '', accountNumber: '', accountHolderName: '', ifscCode: '', isPrimary: true },
  nominee: { nomineeName: '', relation: '', dateOfBirth: '', mobileNumber: '' },
  farmDetails: [emptyFarm()],
})

const SECTIONS = ['Personal', 'Address & Land', 'Bank Details', 'Nominee', 'Farm Plots']

export default function FarmerFormModal({ open, onClose, farmer, onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(0)
  const isEdit = !!farmer

  useEffect(() => {
    if (open) {
      setTab(0)
      if (farmer) {
        setForm({
          ...emptyForm(),
          ...farmer,
          bankDetail: farmer.bankDetail || emptyForm().bankDetail,
          nominee: farmer.nominee || emptyForm().nominee,
          farmDetails: farmer.farmDetails?.length ? farmer.farmDetails : [emptyFarm()],
          password: '',
        })
      } else {
        setForm(emptyForm())
      }
    }
  }, [open, farmer])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }
  function setNested(section, field, value) {
    setForm((f) => ({ ...f, [section]: { ...f[section], [field]: value } }))
  }
  function setFarmField(idx, field, value) {
    setForm((f) => {
      const next = [...f.farmDetails]
      next[idx] = { ...next[idx], [field]: value }
      return { ...f, farmDetails: next }
    })
  }
  function addFarm() {
    setForm((f) => ({ ...f, farmDetails: [...f.farmDetails, emptyFarm()] }))
  }
  function removeFarm(idx) {
    setForm((f) => ({ ...f, farmDetails: f.farmDetails.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        farmArea: form.farmArea === '' ? 0 : Number(form.farmArea),
        farmDetails: form.farmDetails.map((fd) => ({
          ...fd,
          totalAreaAcre: fd.totalAreaAcre === '' ? null : Number(fd.totalAreaAcre),
          sugarcaneAreaAcre: fd.sugarcaneAreaAcre === '' ? null : Number(fd.sugarcaneAreaAcre),
        })),
      }
      if (isEdit && !payload.password) delete payload.password
      if (isEdit) {
        await FarmerAPI.update(farmer.id, payload)
        toast.success('Farmer updated')
      } else {
        await FarmerAPI.create(payload)
        toast.success('Farmer registered')
      }
      onSaved?.()
    } catch (err) {
      toast.error(extractError(err, 'Could not save farmer.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${farmer.farmerName}` : 'Register new farmer'}
      subtitle={isEdit ? farmer.farmerCode : 'Fill in personal, land, bank and nominee details'}
      width="max-w-3xl"
    >
      <div className="mb-5 flex flex-wrap gap-1 border-b border-border pb-3">
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === i ? 'bg-cane-800 text-white' : 'text-ink-soft hover:bg-paper-dim'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {tab === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Farmer code" required>
              <Input value={form.farmerCode} onChange={(e) => set('farmerCode', e.target.value)} required placeholder="A-FARM2026001" />
            </Field>
            <Field label="Full name" required>
              <Input value={form.farmerName} onChange={(e) => set('farmerName', e.target.value)} required />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </Field>
            <Field label="Mobile number" required>
              <Input value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} required maxLength={10} />
            </Field>
            <Field label="Alternate mobile">
              <Input value={form.alternateMobileNumber || ''} onChange={(e) => set('alternateMobileNumber', e.target.value)} maxLength={10} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label={isEdit ? 'New login password' : 'Login password'} required={!isEdit} hint={isEdit ? 'Leave blank to keep current password' : 'Used for farmer self-service login'}>
              <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required={!isEdit} />
            </Field>
            <Field label="PAN number">
              <Input value={form.panNumber || ''} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} maxLength={10} />
            </Field>
            <Field label="Aadhaar number">
              <Input value={form.aadharNumber || ''} onChange={(e) => set('aadharNumber', e.target.value)} maxLength={12} />
            </Field>
            <Field label="Registration date">
              <Input type="date" value={form.registrationDate || ''} onChange={(e) => set('registrationDate', e.target.value)} />
            </Field>
          </div>
        )}

        {tab === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Address" className="sm:col-span-2">
              <Input value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Village">
              <Input value={form.village || ''} onChange={(e) => set('village', e.target.value)} />
            </Field>
            <Field label="Taluka">
              <Input value={form.taluka || ''} onChange={(e) => set('taluka', e.target.value)} />
            </Field>
            <Field label="District">
              <Input value={form.district || ''} onChange={(e) => set('district', e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={form.state || ''} onChange={(e) => set('state', e.target.value)} />
            </Field>
            <Field label="Pincode">
              <Input value={form.pincode || ''} onChange={(e) => set('pincode', e.target.value)} maxLength={6} />
            </Field>
            <Field label="Total farm area (acre)">
              <Input type="number" step="0.01" value={form.farmArea} onChange={(e) => set('farmArea', e.target.value)} />
            </Field>
            <div className="flex items-center gap-5 pt-6">
              <Checkbox label="Has 7/12 extract" checked={!!form.has712} onChange={(e) => set('has712', e.target.checked)} />
              <Checkbox label="Has 8A extract" checked={!!form.has8A} onChange={(e) => set('has8A', e.target.checked)} />
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bank name">
              <Input value={form.bankDetail.bankName} onChange={(e) => setNested('bankDetail', 'bankName', e.target.value)} />
            </Field>
            <Field label="Branch name">
              <Input value={form.bankDetail.branchName} onChange={(e) => setNested('bankDetail', 'branchName', e.target.value)} />
            </Field>
            <Field label="Account number">
              <Input value={form.bankDetail.accountNumber} onChange={(e) => setNested('bankDetail', 'accountNumber', e.target.value)} />
            </Field>
            <Field label="Account holder name">
              <Input value={form.bankDetail.accountHolderName} onChange={(e) => setNested('bankDetail', 'accountHolderName', e.target.value)} />
            </Field>
            <Field label="IFSC code">
              <Input value={form.bankDetail.ifscCode} onChange={(e) => setNested('bankDetail', 'ifscCode', e.target.value.toUpperCase())} maxLength={11} />
            </Field>
            <div className="flex items-center pt-6">
              <Checkbox
                label="Primary account"
                checked={!!form.bankDetail.isPrimary}
                onChange={(e) => setNested('bankDetail', 'isPrimary', e.target.checked)}
              />
            </div>
          </div>
        )}

        {tab === 3 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nominee name">
              <Input value={form.nominee.nomineeName} onChange={(e) => setNested('nominee', 'nomineeName', e.target.value)} />
            </Field>
            <Field label="Relation">
              <Input value={form.nominee.relation} onChange={(e) => setNested('nominee', 'relation', e.target.value)} placeholder="Son, Spouse, Daughter…" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.nominee.dateOfBirth || ''} onChange={(e) => setNested('nominee', 'dateOfBirth', e.target.value)} />
            </Field>
            <Field label="Mobile number">
              <Input value={form.nominee.mobileNumber || ''} onChange={(e) => setNested('nominee', 'mobileNumber', e.target.value)} maxLength={10} />
            </Field>
          </div>
        )}

        {tab === 4 && (
          <div className="space-y-4">
            {form.farmDetails.map((fd, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-cane-800">Plot {idx + 1}</span>
                  {form.farmDetails.length > 1 && (
                    <button type="button" onClick={() => removeFarm(idx)} className="text-rust-600 hover:text-rust-700">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Gat number">
                    <Input value={fd.gatNumber} onChange={(e) => setFarmField(idx, 'gatNumber', e.target.value)} />
                  </Field>
                  <Field label="Village">
                    <Input value={fd.village} onChange={(e) => setFarmField(idx, 'village', e.target.value)} />
                  </Field>
                  <Field label="Total area (acre)">
                    <Input type="number" step="0.01" value={fd.totalAreaAcre} onChange={(e) => setFarmField(idx, 'totalAreaAcre', e.target.value)} />
                  </Field>
                  <Field label="Sugarcane area (acre)">
                    <Input type="number" step="0.01" value={fd.sugarcaneAreaAcre} onChange={(e) => setFarmField(idx, 'sugarcaneAreaAcre', e.target.value)} />
                  </Field>
                  <Field label="Irrigation source" className="sm:col-span-2">
                    <Select value={fd.irrigationSource} onChange={(e) => setFarmField(idx, 'irrigationSource', e.target.value)}>
                      <option value="">Select source</option>
                      <option value="Well">Well</option>
                      <option value="Canal">Canal</option>
                      <option value="Borewell">Borewell</option>
                      <option value="River">River</option>
                      <option value="Drip">Drip Irrigation</option>
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" icon={Plus} onClick={addFarm}>
              Add another plot
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Register farmer'}</Button>
        </div>
      </form>
    </Modal>
  )
}
