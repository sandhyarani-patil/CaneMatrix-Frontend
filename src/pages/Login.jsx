import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [mode, setMode] = useState('staff') // 'staff' | 'farmer'
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, farmerLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const result = mode === 'staff' ? await login(id, password) : await farmerLogin(id, password)
    setLoading(false)
    if (result.ok) {
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-cane-950 lg:flex lg:flex-col lg:justify-between">
        <FieldPattern />
        <div className="relative z-10 px-14 pt-14">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-molasses-600 font-display text-base font-bold text-white">
              CM
            </div>
            <span className="font-display text-lg font-semibold text-white">CaneMatrix</span>
          </div>
        </div>
        <div className="relative z-10 px-14 pb-16">
          <h1 className="font-display text-[40px] font-semibold leading-[1.1] text-white">
            One ledger for every<br />tonne of cane, every<br />farmer, every season.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-cane-100/70">
            Supply intake, share allocations, sugar lifting and factory rates &mdash; tracked end to end
            for the cooperative&rsquo;s clerks, administrators and member farmers.
          </p>
          <div className="mt-10 flex gap-8 font-mono text-xs text-cane-100/60">
            <div>
              <div className="font-display text-2xl font-semibold text-white">24/7</div>
              Ledger uptime
            </div>
            <div>
              <div className="font-display text-2xl font-semibold text-white">JWT</div>
              Secured access
            </div>
            <div>
              <div className="font-display text-2xl font-semibold text-white">100%</div>
              Digitised receipts
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-molasses-600 font-display text-base font-bold text-white">
              CM
            </div>
            <span className="font-display text-lg font-semibold text-ink">CaneMatrix</span>
          </div>

          <div className="mb-1 font-mono text-[11px] tracking-wide text-cane-600">SIGN IN</div>
          <h2 className="font-display text-2xl font-semibold text-ink">Access your workspace</h2>
          <p className="mt-1 text-sm text-ink-soft">Choose your login type to continue.</p>

          <div className="mt-6 grid grid-cols-2 rounded-md border border-border bg-white p-1 text-sm">
            <button
              onClick={() => setMode('staff')}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                mode === 'staff' ? 'bg-cane-800 text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Admin / Clerk
            </button>
            <button
              onClick={() => setMode('farmer')}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                mode === 'farmer' ? 'bg-cane-800 text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Farmer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                {mode === 'staff' ? 'Username' : 'Farmer code'}
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
                <input
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  placeholder={mode === 'staff' ? 'admin' : 'A-FARM2026002'}
                  className="w-full rounded-md border border-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cane-600 focus:ring-2 focus:ring-cane-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cane-600 focus:ring-2 focus:ring-cane-100"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-molasses-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-molasses-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              Sign in
            </button>
          </form>

          <div className="mt-6 rounded-md border border-cane-100 bg-cane-50 px-3.5 py-3 text-xs text-cane-800">
            <span className="font-medium">Demo admin credentials:</span> username <code className="font-mono">admin</code>,
            password <code className="font-mono">admin123</code>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldPattern() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice">
      {Array.from({ length: 26 }).map((_, row) =>
        Array.from({ length: 14 }).map((_, col) => (
          <g key={`${row}-${col}`} transform={`translate(${col * 30 + (row % 2 === 0 ? 0 : 15)}, ${row * 30})`}>
            <path
              d="M0 22 L0 6 M-3 10 L0 6 L3 10 M-3 14 L0 10 L3 14 M-3 18 L0 14 L3 18"
              stroke="#EEF2E8"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))
      )}
    </svg>
  )
}
