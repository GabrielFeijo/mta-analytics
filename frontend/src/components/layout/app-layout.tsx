import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  DollarSign,
  FileWarning,
  Flag,
  LogOut,
  Menu,
  Server,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/services/auth-api';
import { analyticsApi } from '@/services/analytics-api';
import { AnalyticsSocketProvider } from '@/contexts/analytics-socket-context';
import { useAnalyticsSocket } from '@/hooks/use-analytics-socket';
import { DemoModeBanner } from '@/components/common/demo-mode-banner';
import BrandLogo from './brand-logo';

interface AppLayoutProps {
  children: ReactNode;
}

const NAVIGATION = [
  { name: 'Visão Geral & Mapa', href: '/', icon: Activity, code: '01' },
  { name: 'Jogadores Online', href: '/players', icon: Users, code: '02' },
  { name: 'Economia & Fluxo', href: '/economy', icon: DollarSign, code: '03' },
  { name: 'Radar de Multas', href: '/fines', icon: FileWarning, code: '04' },
  { name: 'Lojas & Corridas', href: '/resources', icon: Flag, code: '05' },
] as const;

function LayoutShell({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isDemoMode } = useAuthStore();
  const { isConnected } = useAnalyticsSocket();

  const { data: serverStatus } = useQuery({
    queryKey: ['server-status'],
    queryFn: analyticsApi.getServerStatus,
    refetchInterval: 30000,
  });

  const activeNav = NAVIGATION.find((n) => n.href === location.pathname) ?? NAVIGATION[0];

  const handleLogout = () => {
    void authApi.logout();
  };

  const connectionBadge = isDemoMode
    ? { label: 'Modo Snapshot', cls: 'border-warn/40 bg-warn/10 text-warn', dot: 'bg-warn' }
    : isConnected
      ? { label: 'WS Ao Vivo', cls: 'border-ok/40 bg-ok/10 text-ok', dot: 'bg-ok' }
      : { label: 'WS Offline', cls: 'border-signal/40 bg-signal/10 text-signal', dot: 'bg-signal' };

  return (
    <div className="flex min-h-screen w-full bg-bg0 text-ink">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-line bg-bg1 transition-transform duration-150 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <BrandLogo iconSize={32} textSize="text-lg" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-line text-ink-dim hover:text-ink lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-3 pb-1.5 pt-3">
          <span className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Módulos de Telemetria
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-2.5">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex h-9 items-center gap-2.5 rounded-sm border px-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'border-line-strong bg-bg2 text-ink'
                    : 'border-transparent text-ink-dim hover:bg-bg2/60 hover:text-ink'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-signal' : 'text-ink-faint'}`}
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate">{item.name}</span>
                <span className="font-mono text-2xs tabular-nums text-ink-faint">
                  {item.code}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line bg-bg1 px-3.5 py-3">
          <div className="mb-2.5 flex items-center justify-between rounded-sm border border-line bg-bg2 px-2.5 py-1.5 text-2xs">
            <span className="text-ink-dim">Coletor Lua</span>
            <span className="font-mono text-brass">mta_analytics_resource</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-bg2 font-mono text-xs font-semibold text-brass">
                {(user?.username || 'A')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink">
                  {user?.username || 'Administrador'}
                </p>
                <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  <ShieldCheck className="h-3 w-3 text-brass" strokeWidth={1.75} />
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-transparent text-ink-dim transition-colors hover:border-signal/40 hover:bg-signal/10 hover:text-signal"
              title="Encerrar sessão"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-line bg-bg1/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-line bg-bg2 text-ink-dim hover:text-ink lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <span className="rounded-sm border border-line bg-bg2 px-1.5 py-0.5 font-mono text-2xs tabular-nums text-brass">
              #{activeNav.code}
            </span>
            <h2 className="font-display text-base font-semibold uppercase tracking-wide text-ink">
              {activeNav.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {serverStatus && (
              <div
                className={`hidden items-center gap-1.5 rounded-sm border px-2.5 py-1 text-2xs font-mono sm:flex ${
                  serverStatus.online
                    ? 'border-line-strong bg-bg2 text-ink'
                    : 'border-line bg-bg2/60 text-ink-faint'
                }`}
                title={serverStatus.serverName || 'Status do servidor MTA'}
              >
                <Server
                  className={`h-3 w-3 ${serverStatus.online ? 'text-brass' : 'text-ink-faint'}`}
                  strokeWidth={1.75}
                />
                <span>
                  {serverStatus.online
                    ? `MTA ${serverStatus.playerCount}/${serverStatus.maxPlayers}`
                    : 'MTA Sem Pulso'}
                </span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-2xs font-medium ${connectionBadge.cls}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${connectionBadge.dot}`} />
              <span className="font-mono uppercase tracking-wider">
                {connectionBadge.label}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <DemoModeBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AnalyticsSocketProvider>
      <LayoutShell>{children}</LayoutShell>
    </AnalyticsSocketProvider>
  );
}
