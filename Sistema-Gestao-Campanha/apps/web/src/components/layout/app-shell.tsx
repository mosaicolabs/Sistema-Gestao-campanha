import { useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import {
  CalendarDots,
  CaretRight,
  ClipboardText,
  Database,
  House,
  Kanban,
  List,
  MapTrifold,
  Package,
  SignOut,
  UsersThree,
} from '@phosphor-icons/react'
import { gsap } from 'gsap'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

const navItems = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/pessoas', label: 'Pessoas', icon: UsersThree },
  { to: '/cobertura', label: 'Cobertura', icon: MapTrifold },
  { to: '/tarefas', label: 'Tarefas', icon: Kanban },
  { to: '/agenda', label: 'Agenda', icon: CalendarDots },
  { to: '/entregas', label: 'Entregas', icon: Package },
  { to: '/importacao', label: 'Importação', icon: Database },
  { to: '/auditoria', label: 'Auditoria', icon: ClipboardText },
] as const

const mobilePrimary = navItems.filter((item) => ['/', '/pessoas', '/tarefas', '/agenda'].includes(item.to))
const mobileSecondary = navItems.filter((item) => !mobilePrimary.includes(item))

function Brand() {
  return (
    <NavLink to="/" className="brand-lockup" aria-label="Base de Campanha, página inicial">
      <span className="brand-mark" aria-hidden>BC</span>
      <span><strong>Base de Campanha</strong><small>Gestão territorial</small></span>
    </NavLink>
  )
}

function NavigationLink({ item, onClick }: { item: (typeof navItems)[number]; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={'end' in item ? item.end : false}
      onClick={onClick}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
    >
      <Icon size={21} weight="duotone" aria-hidden />
      <span>{item.label}</span>
      <CaretRight className="nav-link-caret" size={15} aria-hidden />
    </NavLink>
  )
}

export function AppShell() {
  const root = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const mobileMenuOpen = useUiStore((state) => state.mobileMenuOpen)
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen)
  const title = navItems.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))?.label ?? 'Base de Campanha'

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.shell-reveal', { autoAlpha: 0, y: 12, duration: 0.35, stagger: 0.04, ease: 'power2.out', clearProps: 'all' })
      })
      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <div ref={root} className="app-shell">
      <aside className="desktop-sidebar shell-reveal">
        <Brand />
        <nav aria-label="Navegação principal" className="sidebar-nav">
          {navItems.map((item) => <NavigationLink key={item.to} item={item} />)}
        </nav>
        <div className="sidebar-account">
          <span className="account-avatar" aria-hidden>{user?.displayName.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><strong>{user?.displayName}</strong><small>{user?.username}</small></span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={clearSession} aria-label="Sair">
                <SignOut size={19} aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sair</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <div className="shell-main">
        <header className="mobile-header shell-reveal">
          <Brand />
          <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu">
            <List size={22} aria-hidden />
          </Button>
        </header>
        <header className="page-topbar shell-reveal">
          <div><p className="context-label">Operação</p><h1>{title}</h1></div>
          <div className="topbar-user"><span>{user?.displayName}</span><span className="account-avatar" aria-hidden>{user?.displayName.slice(0, 2).toUpperCase()}</span></div>
        </header>
        <main className="page-content shell-reveal" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Navegação rápida">
        {mobilePrimary.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={22} weight="duotone" aria-hidden /><span>{item.label}</span>
            </NavLink>
          )
        })}
        <button type="button" onClick={() => setMobileMenuOpen(true)}><List size={22} aria-hidden /><span>Menu</span></button>
      </nav>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="mobile-menu-sheet">
          <SheetHeader>
            <SheetTitle>Outros módulos</SheetTitle>
            <SheetDescription>Acesse cobertura, entregas, importação e histórico.</SheetDescription>
          </SheetHeader>
          <nav className="sheet-nav" aria-label="Outros módulos">
            {mobileSecondary.map((item) => <NavigationLink key={item.to} item={item} onClick={() => setMobileMenuOpen(false)} />)}
          </nav>
          <Button variant="outline" onClick={clearSession}><SignOut size={18} aria-hidden />Sair da conta</Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
