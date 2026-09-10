import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { ChangePasswordPage, LoginPage } from '@/features/auth/auth-pages'
import { LoadingState } from '@/components/ui/page-state'
import { useAuthStore } from '@/store/auth-store'

const DashboardPage = lazy(() => import('@/features/dashboard/dashboard-page').then((module) => ({ default: module.DashboardPage })))
const PeoplePage = lazy(() => import('@/features/people/people-page').then((module) => ({ default: module.PeoplePage })))
const CoveragePage = lazy(() => import('@/features/people/coverage-page').then((module) => ({ default: module.CoveragePage })))
const KanbanPage = lazy(() => import('@/features/kanban/kanban-page').then((module) => ({ default: module.KanbanPage })))
const AgendaPage = lazy(() => import('@/features/agenda/agenda-page').then((module) => ({ default: module.AgendaPage })))
const DeliveriesPage = lazy(() => import('@/features/deliveries/deliveries-page').then((module) => ({ default: module.DeliveriesPage })))
const ImportsPage = lazy(() => import('@/features/imports/imports-page').then((module) => ({ default: module.ImportsPage })))
const AuditPage = lazy(() => import('@/features/imports/audit-page').then((module) => ({ default: module.AuditPage })))

function ProtectedShell() {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword) return <Navigate to="/trocar-senha" replace />
  return <AppShell />
}

export function App() {
  return (
    <Suspense fallback={<div className="route-loading"><LoadingState rows={4} /></div>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/trocar-senha" element={<ChangePasswordPage />} />
      <Route element={<ProtectedShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="pessoas" element={<PeoplePage />} />
        <Route path="cobertura" element={<CoveragePage />} />
        <Route path="tarefas" element={<KanbanPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="entregas" element={<DeliveriesPage />} />
        <Route path="importacao" element={<ImportsPage />} />
        <Route path="auditoria" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
