import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClockCounterClockwise, Key, Plus, ShieldCheck, UserGear } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createUserSchema, type CreateUserInput } from '@campanha/validation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api'
import type { ReferenceData } from '@/lib/types'
import { useAuthStore } from '@/store/auth-store'

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string
  createdAt: string
  user?: { username: string }
}

type SystemUser = {
  id: string
  username: string
  status: 'ACTIVE' | 'SUSPENDED'
  mustChangePassword: boolean
  person?: { displayName: string }
  roles: Array<{ accessRole: { name: string } }>
}

export function AuditPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logs = useQuery({ queryKey: ['audit'], queryFn: async () => (await api.get<AuditLog[]>('/audit-logs')).data })
  const users = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get<SystemUser[]>('/users')).data })
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const form = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: { username: '', password: '', passwordConfirmation: '', accessRoleId: '', personId: undefined } })
  const createMutation = useMutation({
    mutationFn: async (values: CreateUserInput) => (await api.post('/users', { ...values, personId: values.personId || undefined })).data,
    onSuccess: () => { toast.success('Usuário criado com troca obrigatória de senha.'); setDialogOpen(false); form.reset(); queryClient.invalidateQueries({ queryKey: ['users'] }); queryClient.invalidateQueries({ queryKey: ['references'] }) },
  })
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => (await api.patch(`/users/${id}/status`, { status })).data,
    onSuccess: () => { toast.success('Situação de acesso atualizada.'); queryClient.invalidateQueries({ queryKey: ['users'] }) },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  return (
    <div className="page-stack">
      <section className="page-intro"><div><h2>Acesso e auditoria</h2><p>As permissões são verificadas na API. Alterações protegidas registram autor, data, ação e entidade.</p></div></section>
      <section className="access-overview">
        <article><ShieldCheck size={29} weight="duotone" aria-hidden /><div><span>Usuário atual</span><strong>{user?.displayName}</strong><small>{user?.username}</small></div></article>
        <article><Key size={29} weight="duotone" aria-hidden /><div><span>Permissões ativas</span><strong>{user?.permissions.length ?? 0}</strong><small>recebidas pelo JWT de 15 minutos</small></div></article>
      </section>
      <section className="permission-cloud" aria-labelledby="permissions-title"><h2 id="permissions-title">Permissões desta sessão</h2><div>{user?.permissions.map((permission) => <Badge variant="outline" key={permission}>{permission}</Badge>)}</div></section>
      <section aria-labelledby="users-title">
        <div className="section-heading"><div><h2 id="users-title">Usuários habilitados</h2><p>Contas de acesso permanecem separadas do cadastro de pessoas.</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button><Plus size={18} aria-hidden />Novo usuário</Button></DialogTrigger><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Criar usuário</DialogTitle><DialogDescription>A conta receberá senha temporária e exigirá troca no primeiro login.</DialogDescription></DialogHeader><form className="form-stack" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}><div className="field-group"><Label htmlFor="new-username">Usuário</Label><Input id="new-username" autoCapitalize="none" {...form.register('username')} />{form.formState.errors.username ? <p className="field-error">{form.formState.errors.username.message}</p> : null}</div><div className="field-group"><Label>Pessoa vinculada</Label><Controller name="personId" control={form.control} render={({ field }) => <Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{references.data?.people.map((person) => <SelectItem key={person.id} value={person.id}>{person.displayName}</SelectItem>)}</SelectContent></Select>} /></div><div className="field-group"><Label>Papel de acesso</Label><Controller name="accessRoleId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{references.data?.accessRoles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent></Select>} />{form.formState.errors.accessRoleId ? <p className="field-error">{form.formState.errors.accessRoleId.message}</p> : null}</div><div className="form-grid-two"><div className="field-group"><Label htmlFor="temp-password">Senha temporária</Label><Input id="temp-password" type="password" autoComplete="new-password" {...form.register('password')} />{form.formState.errors.password ? <p className="field-error">{form.formState.errors.password.message}</p> : null}</div><div className="field-group"><Label htmlFor="temp-password-confirmation">Confirmar senha</Label><Input id="temp-password-confirmation" type="password" autoComplete="new-password" {...form.register('passwordConfirmation')} />{form.formState.errors.passwordConfirmation ? <p className="field-error">{form.formState.errors.passwordConfirmation.message}</p> : null}</div></div>{createMutation.isError ? <p className="field-error">{apiErrorMessage(createMutation.error)}</p> : null}<div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button disabled={createMutation.isPending}>{createMutation.isPending ? 'Criando...' : 'Criar usuário'}</Button></div></form></DialogContent></Dialog></div>
        {users.isLoading ? <LoadingState rows={3} /> : users.isError ? <ErrorState message={apiErrorMessage(users.error)} retry={() => users.refetch()} /> : <div className="user-list">{users.data?.map((systemUser) => <article key={systemUser.id}><div className="user-avatar"><UserGear size={23} weight="duotone" aria-hidden /></div><div><strong>{systemUser.person?.displayName ?? systemUser.username}</strong><span>{systemUser.username}, {systemUser.roles.map((item) => item.accessRole.name).join(', ')}</span></div><Badge variant={systemUser.status === 'ACTIVE' ? 'secondary' : 'outline'}>{systemUser.status === 'ACTIVE' ? (systemUser.mustChangePassword ? 'Troca pendente' : 'Ativo') : 'Suspenso'}</Badge><Button variant="outline" size="sm" disabled={systemUser.id === user?.id || statusMutation.isPending} onClick={() => statusMutation.mutate({ id: systemUser.id, status: systemUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}>{systemUser.status === 'ACTIVE' ? 'Suspender' : 'Reativar'}</Button></article>)}</div>}
      </section>
      <section aria-labelledby="audit-title">
        <div className="section-heading"><div><h2 id="audit-title">Histórico recente</h2><p>Últimas 100 operações registradas.</p></div><ClockCounterClockwise size={27} weight="duotone" aria-hidden /></div>
        {logs.isLoading ? <LoadingState rows={5} /> : logs.isError ? <ErrorState message={apiErrorMessage(logs.error)} retry={() => logs.refetch()} /> : !logs.data?.length ? <EmptyState title="Nenhuma alteração registrada" description="Criações, movimentações e conciliações aparecerão aqui." /> : <div className="audit-list">{logs.data.map((log) => <article key={log.id}><div><strong>{log.action}</strong><span>{log.entityType}</span></div><code>{log.entityId}</code><div><span>{log.user?.username ?? 'sistema'}</span><time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(log.createdAt))}</time></div></article>)}</div>}
      </section>
    </div>
  )
}
