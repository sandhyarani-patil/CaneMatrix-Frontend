import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'

// Admin / Clerk console
import Dashboard from './pages/Dashboard'
import Farmers from './pages/farmers/Farmers'
import FarmerDetail from './pages/farmers/FarmerDetail'
import SugarcaneSupply from './pages/supply/SugarcaneSupply'
import ShareAllocation from './pages/shareAllocation/ShareAllocation'
import ShareSugarAllocation from './pages/shareSugar/ShareSugarAllocation'
import TonnesSugar from './pages/tonnesSugar/TonnesSugar'
import ShareTransfer from './pages/shareTransfer/ShareTransfer'
import FactoryRate from './pages/factoryRate/FactoryRate'
import Reports from './pages/reports/Reports'

// Shared (both staff and farmer see this route, content is role-gated internally)
import FestivalSugar from './pages/festivalSugar/FestivalSugar'

// Farmer self-service portal
import FarmerDashboard from './pages/farmerPortal/FarmerDashboard'
import MyProfile from './pages/farmerPortal/MyProfile'
import MySupply from './pages/farmerPortal/MySupply'
import MyShares from './pages/farmerPortal/MyShares'
import MyTransfers from './pages/farmerPortal/MyTransfers'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '13px', borderRadius: '8px' },
            success: { iconTheme: { primary: '#2A4730', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleHome />} />
            <Route path="festival-sugar" element={<FestivalSugar />} />
            <Route path="factory-rate" element={<FactoryRate />} />

            {/* Farmer self-service — scoped strictly to their own records */}
            <Route path="my-profile" element={<FarmerOnly><MyProfile /></FarmerOnly>} />
            <Route path="my-supply" element={<FarmerOnly><MySupply /></FarmerOnly>} />
            <Route path="my-shares" element={<FarmerOnly><MyShares /></FarmerOnly>} />
            <Route path="my-transfers" element={<FarmerOnly><MyTransfers /></FarmerOnly>} />

            {/* Admin / Clerk operational console */}
            <Route path="farmers" element={<StaffOnly><Farmers /></StaffOnly>} />
            <Route path="farmers/:id" element={<StaffOnly><FarmerDetail /></StaffOnly>} />
            <Route path="supply" element={<StaffOnly><SugarcaneSupply /></StaffOnly>} />
            <Route path="share-allocation" element={<StaffOnly><ShareAllocation /></StaffOnly>} />
            <Route path="share-sugar" element={<StaffOnly><ShareSugarAllocation /></StaffOnly>} />
            <Route path="tonnes-sugar" element={<StaffOnly><TonnesSugar /></StaffOnly>} />
            <Route path="share-transfer" element={<StaffOnly><ShareTransfer /></StaffOnly>} />
            <Route path="reports" element={<StaffOnly><Reports /></StaffOnly>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// "/" shows a different home depending on who's logged in.
function RoleHome() {
  const { isFarmer } = useAuth()
  return isFarmer ? <FarmerDashboard /> : <Dashboard />
}

// Blocks staff-only admin/clerk pages from a farmer account (defense in depth —
// the farmer nav never links here, but a typed URL should still be refused).
function StaffOnly({ children }) {
  const { isFarmer } = useAuth()
  if (isFarmer) return <Navigate to="/" replace />
  return children
}

// Blocks farmer self-service pages from staff accounts, since "my profile" etc.
// only makes sense for the logged-in farmer themselves.
function FarmerOnly({ children }) {
  const { isFarmer } = useAuth()
  if (!isFarmer) return <Navigate to="/" replace />
  return children
}
