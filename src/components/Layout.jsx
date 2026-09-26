import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Truck,
  Landmark,
  Repeat2,
  Percent,
  FileSpreadsheet,
  PartyPopper,
  Wheat,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'

// Admin / Clerk see the full operational console.
const STAFF_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/farmers', label: 'Farmers', icon: Users },
  { to: '/supply', label: 'Sugarcane Supply', icon: Truck },
  { to: '/share-allocation', label: 'Share Allocation', icon: Landmark },
  { to: '/share-sugar', label: 'Share Sugar', icon: Wheat },
  { to: '/tonnes-sugar', label: 'Tonnes Sugar', icon: FileSpreadsheet },
  { to: '/share-transfer', label: 'Share Transfer', icon: Repeat2 },
  { to: '/festival-sugar', label: 'Festival Sugar', icon: PartyPopper },
  { to: '/factory-rate', label: 'Factory Rates', icon: Percent },
  { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
]

// Farmers only ever see and act on their own records — scoped, read-mostly views.
const FARMER_NAV = [
  { to: '/', label: 'My Dashboard', icon: LayoutDashboard, end: true },
  { to: '/my-profile', label: 'My Profile', icon: Users },
  { to: '/my-supply', label: 'My Cane Supply', icon: Truck },
  { to: '/my-shares', label: 'My Shares & Sugar', icon: Wheat },
  { to: '/my-transfers', label: 'Share Transfer Status', icon: Repeat2 },
  { to: '/festival-sugar', label: 'Festival Sugar', icon: PartyPopper },
  { to: '/factory-rate', label: 'Factory Rates', icon: Percent },
]

export default function Layout() {
  const { role, username, logout, isAdmin, isFarmer } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleNav = isFarmer ? FARMER_NAV : STAFF_NAV.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-cane-800/40 bg-cane-950 lg:flex">
        <SidebarContent visibleNav={visibleNav} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-cane-800/40 bg-cane-950">
            <SidebarContent visibleNav={visibleNav} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden text-sm text-ink-soft lg:block">
            Krishnamai Sahakari Sakhar Karkhana Ltd. &middot; Season 2026&ndash;27
          </div>
          <div className="group relative ml-auto flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-molasses-600 text-xs font-semibold text-white">
              {username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-medium leading-tight text-ink">{username}</div>
              <div className="text-[11px] leading-tight text-ink-soft">{role}</div>
            </div>
            <ChevronDown size={14} className="hidden text-ink-soft sm:block" />
            <div className="invisible absolute right-0 top-11 w-44 rounded-md border border-border bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rust-600 hover:bg-rust-100/60"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ visibleNav, onNavigate }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-cane-800/40 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-molasses-600 font-display text-sm font-bold text-white">
          CM
        </div>
        <div>
          <div className="font-display text-sm font-semibold leading-tight text-white">CaneMatrix</div>
          <div className="font-mono text-[10px] leading-tight text-cane-100/60">Factory ERP</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-molasses-600 text-white' : 'text-cane-100/75 hover:bg-cane-900 hover:text-white'
              )
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-cane-800/40 px-5 py-4 font-mono text-[10px] text-cane-100/50">
        v1.0 &middot; MCA Final Year Project
      </div>
    </>
  )
}
