import { Terminal, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

export function DemoModeBanner() {
  const { isDemoMode, logout } = useAuthStore();

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-brass/40 bg-brass/10 px-3.5 py-2 text-xs text-ink">
      <div className="flex items-center gap-2">
        <Terminal className="h-3.5 w-3.5 shrink-0 text-brass" strokeWidth={1.75} />
        <span>
          Você está visualizando o{' '}
          <strong className="font-semibold text-brass">Modo Snapshot Local</strong> (dados
          simulados). Autentique com suas credenciais para acompanhar a telemetria real da API.
        </span>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={logout}>
        <LogOut className="h-3 w-3" strokeWidth={1.75} />
        Sair do Snapshot
      </Button>
    </div>
  );
}
