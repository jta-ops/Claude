import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import VerificationGate from './components/VerificationGate'
import HomePage from './pages/HomePage'
import AuditPage from './pages/AuditPage'
import ScorecardPage from './pages/ScorecardPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OwnerLogin from './pages/owner/OwnerLogin'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import SchoolDashboard from './pages/school/SchoolDashboard'
import { getSchoolToken, getOwnerToken } from './lib/auth'

function RequireSchool({ children }) {
  return getSchoolToken() ? children : <Navigate to="/login" replace />
}

function RequireOwner({ children }) {
  return getOwnerToken() ? children : <Navigate to="/owner/login" replace />
}

const UNGATED = ['/login', '/signup', '/owner', '/dashboard', '/audit/result']

function GatedApp() {
  const [verified, setVerified] = useState(false)
  const location = useLocation()
  const noGate = UNGATED.some(p => location.pathname.startsWith(p))

  return (
    <div className={`page ${!verified && !noGate ? 'is-locked' : ''}`}>
      <div className="page-inner" {...(!verified && !noGate ? { inert: 'true' } : {})} aria-hidden={!verified && !noGate}>
        <Routes>
          <Route path="/"                       element={<HomePage />} />
          <Route path="/audit"                  element={<AuditPage />} />
          <Route path="/audit/result/:token"    element={<ScorecardPage />} />
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/signup"                 element={<SignupPage />} />
          <Route path="/owner/login"            element={<OwnerLogin />} />
          <Route path="/owner/*"                element={<RequireOwner><OwnerDashboard /></RequireOwner>} />
          <Route path="/dashboard/*"            element={<RequireSchool><SchoolDashboard /></RequireSchool>} />
          <Route path="*"                       element={<NotFoundPage />} />
        </Routes>
      </div>
      {!verified && !noGate && <VerificationGate onVerified={() => setVerified(true)} />}
    </div>
  )
}

export default function App() {
  return <BrowserRouter><GatedApp /></BrowserRouter>
}
