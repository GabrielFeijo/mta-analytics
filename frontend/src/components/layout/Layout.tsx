import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Users,
  DollarSign,
  LogOut,
  Flag,
  FileWarning,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsSocket } from '@/hooks/useAnalyticsSocket';
import Logo from './Logo';

interface LayoutProps {
  children: ReactNode;
}

const NAVIGATION = [
  { name: 'Visão Geral & Mapa', href: '/', icon: Activity, code: '01' },
  { name: 'Jogadores Online', href: '/players', icon: Users, code: '02' },
  { name: 'Economia & Fluxo', href: '/economy', icon: DollarSign, code: '03' },
  { name: 'Radar de Multas', href: '/fines', icon: FileWarning, code: '04' },
  { name: 'Lojas & Corridas', href: '/resources', icon: Flag, code: '05' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { isConnected } = useAnalyticsSocket();

  const activeNav =
    NAVIGATION.find((n) => n.href === location.pathname) ?? NAVIGATION[0];

  return (
    <div className="flex min-h-screen w-full bg-bg0 text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-line bg-bg1">
        <div className="border-b border-line px-4 py-3.5">
          <Logo iconSize={32} textSize="text-lg" />
        </div>

        <div className="px-3 pt-3 pb-1.5">
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
              onClick={logout}
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-transparent text-ink-dim transition-colors hover:border-signal/40 hover:bg-signal/10 hover:text-signal"
              title="Encerrar sessão"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-60">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-line bg-bg1/95 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-sm border border-line bg-bg2 px-1.5 py-0.5 font-mono text-2xs tabular-nums text-brass">
              #{activeNav.code}
            </span>
            <h2 className="font-display text-base font-semibold uppercase tracking-wide text-ink">
              {activeNav.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-2xs font-medium ${
                isConnected
                  ? 'border-ok/40 bg-ok/10 text-ok'
                  : 'border-warn/40 bg-warn/10 text-warn'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? 'bg-ok' : 'bg-warn'
                }`}
              />
              <span className="font-mono uppercase tracking-wider">
                {isConnected ? 'WS Ao Vivo' : 'Modo Snapshot'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
