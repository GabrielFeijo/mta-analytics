import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { AxiosError } from 'axios';
import { authApi } from '@/services/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate } from '@/lib/formatters';
import { OperatorRecord, UserRole } from '@/types/telemetry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QueryErrorState } from '@/components/common/query-error-state';

const ROLE_OPTIONS: UserRole[] = ['VIEWER', 'MODERATOR', 'ADMIN'];

const ROLE_VARIANT: Record<UserRole, 'brass' | 'ok' | 'secondary'> = {
  ADMIN: 'brass',
  MODERATOR: 'ok',
  VIEWER: 'secondary',
};

export default function Operators() {
  const queryClient = useQueryClient();
  const { user: currentUser, isDemoMode } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [formError, setFormError] = useState('');

  const {
    data: operators = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['operators'],
    queryFn: authApi.listOperators,
  });

  const createMutation = useMutation({
    mutationFn: authApi.createOperator,
    onSuccess: (created) => {
      if (isDemoMode) {
        queryClient.setQueryData<OperatorRecord[]>(['operators'], (prev = []) => [...prev, created]);
      } else {
        void queryClient.invalidateQueries({ queryKey: ['operators'] });
      }
      setCreateOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      setFormError('');
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosErr.response?.data?.message;
      setFormError(
        (Array.isArray(msg) ? msg[0] : msg) || 'Não foi possível cadastrar o operador.',
      );
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, nextRole }: { id: number; nextRole: UserRole }) =>
      authApi.updateOperatorRole(id, nextRole),
    onSuccess: (updated) => {
      if (isDemoMode) {
        queryClient.setQueryData<OperatorRecord[]>(['operators'], (prev = []) =>
          prev.map((op) => (op.id === updated.id ? { ...op, role: updated.role } : op)),
        );
      } else {
        void queryClient.invalidateQueries({ queryKey: ['operators'] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteOperator,
    onSuccess: (_, deletedId) => {
      if (isDemoMode) {
        queryClient.setQueryData<OperatorRecord[]>(['operators'], (prev = []) =>
          prev.filter((op) => op.id !== deletedId),
        );
      } else {
        void queryClient.invalidateQueries({ queryKey: ['operators'] });
      }
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    createMutation.mutate({ username, email, password, role });
  };

  if (isError) {
    return (
      <QueryErrorState
        message="Não foi possível carregar a lista de operadores."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brass" strokeWidth={1.75} />
              Operadores & Controle de Acesso (RBAC)
            </CardTitle>
            <CardDescription>
              Gerencie credenciais administrativas, permissões de moderação e auditoria.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="brass" className="font-mono">
              {operators.length} operador(es)
            </Badge>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Novo Operador
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-ink-dim">
              Carregando operadores autorizados…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo Atual</TableHead>
                  <TableHead>Alterar Permissão</TableHead>
                  <TableHead className="text-right">Cadastro</TableHead>
                  <TableHead className="w-[56px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((op) => {
                  const isSelf = op.id === currentUser?.id;
                  return (
                    <TableRow key={op.id}>
                      <TableCell className="whitespace-nowrap font-medium text-ink">
                        <span>{op.username}</span>
                        {isSelf && (
                          <span className="ml-2 font-mono text-[10px] text-brass">(Você)</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink-dim">{op.email}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[op.role]} className="font-mono">
                          {op.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <select
                          aria-label={`Permissão de ${op.username}`}
                          value={op.role}
                          disabled={roleMutation.isPending || isSelf}
                          onChange={(e) =>
                            roleMutation.mutate({
                              id: op.id,
                              nextRole: e.target.value as UserRole,
                            })
                          }
                          className="h-7 rounded-sm border border-line bg-bg2 px-2 font-mono text-2xs text-ink outline-none transition-colors focus:border-line-strong disabled:opacity-40"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-2xs tabular-nums text-ink-faint">
                        {formatDate(op.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isSelf || deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(op.id)}
                          title={
                            isSelf
                              ? 'Você não pode excluir sua própria conta'
                              : 'Remover operador'
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-signal" strokeWidth={1.75} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Operador</DialogTitle>
            <DialogDescription>
              Crie uma credencial de acesso com nível RBAC definido.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3">
            {formError && (
              <div className="rounded-sm border border-line border-l-2 border-l-signal bg-bg2 p-2.5 text-xs text-ink">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="op-username" className="mb-1 block text-2xs text-ink-dim">
                Usuário
              </label>
              <Input
                id="op-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Moderador_RP"
                required
                minLength={3}
              />
            </div>

            <div>
              <label htmlFor="op-email" className="mb-1 block text-2xs text-ink-dim">
                E-mail Operacional
              </label>
              <Input
                id="op-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@servidor.rp"
                required
              />
            </div>

            <div>
              <label htmlFor="op-password" className="mb-1 block text-2xs text-ink-dim">
                Chave de Acesso
              </label>
              <Input
                id="op-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="op-role" className="mb-1 block text-2xs text-ink-dim">
                Nível de Permissão (RBAC)
              </label>
              <select
                id="op-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-8 w-full rounded-sm border border-line bg-bg2 px-2.5 font-mono text-xs text-ink outline-none focus:border-line-strong"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando…' : 'Criar Operador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
