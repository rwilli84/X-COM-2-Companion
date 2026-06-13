import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useCampaignStore } from './store/campaignStore'
import { Layout } from './components/Layout'
import { CampaignPicker } from './pages/CampaignPicker'
import { Roster } from './pages/Roster'
import { EnemyDatabase } from './pages/EnemyDatabase'
import { AvatarTracker } from './pages/AvatarTracker'
import { Research } from './pages/Research'
import { Missions } from './pages/Missions'
import { Settings } from './pages/Settings'
import { Advisor } from './pages/Advisor'

function ProtectedRoutes() {
  const activeCampaignId = useCampaignStore(s => s.activeCampaignId)
  if (!activeCampaignId) return <Navigate to="/campaigns" replace />
  return (
    <Layout>
      <Routes>
        <Route path="/roster" element={<Roster />} />
        <Route path="/enemies" element={<EnemyDatabase />} />
        <Route path="/avatar" element={<AvatarTracker />} />
        <Route path="/research" element={<Research />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="*" element={<Navigate to="/roster" replace />} />
      </Routes>
    </Layout>
  )
}

function AppRoutes() {
  const { loadAll, loaded } = useCampaignStore()

  useEffect(() => {
    if (!loaded) loadAll()
  }, [])

  return (
    <Routes>
      <Route path="/campaigns" element={<CampaignPicker />} />
      <Route path="/" element={<Navigate to="/campaigns" replace />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
