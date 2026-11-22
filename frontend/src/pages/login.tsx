import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Terminal } from 'lucide-react';
import { AxiosError } from 'axios';
import { authApi } from '@/services/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import BrandLogo from '@/components/layout/brand-logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth, enterDemoMode } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      setAuth(response.access_token, response.user);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      if (!axiosErr.response) {
        setError(
          'Backend indisponível no momento. Inicie a API ou use o Snapshot Local abaixo.',
        );
      } else {
        const msg = axiosErr.response.data?.message;
        setError(
          (Array.isArray(msg) ? msg[0] : msg) ||
            'Credenciais inválidas. Verifique seu e-mail e senha.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg0 p-4 text-ink">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center text-center">
          <BrandLogo iconSize={40} textSize="text-2xl" />
          <p className="mt-2 text-xs text-ink-dim">
            Central de telemetria, auditoria econômica e monitoramento em tempo real.
          </p>
        </div>

        <div className="rounded-md border border-line-strong bg-bg1 p-5">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-2.5">
            <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
              Credencial Administrativa
            </span>
            <span className="font-mono text-2xs text-brass">GARAGE NIGHT</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="rounded-sm border border-line border-l-2 border-l-signal bg-bg2 p-2.5 text-xs text-ink">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-2xs text-ink-dim">E-mail Operacional</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@servidor.rp"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-2xs text-ink-dim">Chave de Acesso</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
              {loading ? 'Autenticando…' : 'Autenticar no Painel'}
            </Button>
          </form>

          <div className="mt-3 border-t border-line pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={enterDemoMode}
              className="w-full"
            >
              <Terminal className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
              Inspecionar Telemetria (Snapshot Local)
            </Button>
          </div>

          <div className="mt-4 text-center text-2xs text-ink-dim">
            Novo operador autorizado?{' '}
            <Link to="/register" className="font-medium text-brass hover:underline">
              Registrar credencial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
