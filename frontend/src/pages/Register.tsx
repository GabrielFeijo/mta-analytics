import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import { authApi } from '@/lib/api';
import Logo from '@/components/layout/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register(username, email, password);
      navigate('/login');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Não foi possível concluir o cadastro.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg0 p-4 text-ink">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center text-center">
          <Logo iconSize={40} textSize="text-2xl" />
          <p className="mt-2 text-xs text-ink-dim">
            Registro de operador para a central de telemetria MTA Analytics.
          </p>
        </div>

        <div className="rounded-md border border-line-strong bg-bg1 p-5">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-2.5">
            <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
              Novo Operador
            </span>
            <span className="font-mono text-2xs text-brass">CADASTRO</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="rounded-sm border border-line border-l-2 border-l-signal bg-bg2 p-2.5 text-xs text-ink">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-2xs text-ink-dim">Identificação (Usuário)</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Gabriel_Feijo"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <ShieldPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
              {loading ? 'Registrando…' : 'Criar Credencial'}
            </Button>
          </form>

          <div className="mt-4 text-center text-2xs text-ink-dim">
            Já possui credencial?{' '}
            <Link to="/login" className="font-medium text-brass hover:underline">
              Voltar para autenticação
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
