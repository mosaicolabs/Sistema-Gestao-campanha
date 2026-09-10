import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeSlash, LockKey, SignIn, UserCircle } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import type { z } from 'zod'
import { changePasswordSchema, loginSchema } from '@campanha/validation'
import type { AuthResponse } from '@campanha/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Sistema de gestão da campanha">
        <div className="brand-mark brand-mark-large" aria-hidden>BC</div>
        <div>
          <p className="context-label">Base única</p>
          <h1>Informação de campo, organizada para agir.</h1>
          <p>Pessoas, território, tarefas e agenda em uma experiência direta para o celular.</p>
        </div>
        <div className="auth-fact"><strong>80 abas</strong><span>preservadas como origem, consolidadas em um só modelo.</span></div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand"><span className="brand-mark" aria-hidden>BC</span><strong>Base de Campanha</strong></div>
          <div className="auth-heading"><h2>{title}</h2><p>{description}</p></div>
          {children}
        </div>
      </section>
    </main>
  )
}

function PasswordInput({ id, registration, autoComplete }: { id: string; registration: UseFormRegisterReturn; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-field">
      <Input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} {...registration} />
      <Button type="button" variant="ghost" size="icon" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>
        {visible ? <EyeSlash size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
      </Button>
    </div>
  )
}

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { username: '', password: '' } })
  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => (await api.post<AuthResponse>('/auth/login', values)).data,
    onSuccess: setSession,
  })

  if (user) return <Navigate to={user.mustChangePassword ? '/trocar-senha' : '/'} replace />

  return (
    <AuthFrame title="Entre na operação" description="Use o acesso fornecido pelo administrador.">
      {mutation.isError ? <Alert variant="destructive"><LockKey aria-hidden /><AlertTitle>Acesso não concluído</AlertTitle><AlertDescription>{apiErrorMessage(mutation.error)}</AlertDescription></Alert> : null}
      <form className="form-stack" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="field-group">
          <Label htmlFor="username">Usuário</Label>
          <div className="icon-field"><UserCircle size={20} aria-hidden /><Input id="username" autoComplete="username" autoCapitalize="none" {...form.register('username')} /></div>
          {form.formState.errors.username ? <p className="field-error">{form.formState.errors.username.message}</p> : null}
        </div>
        <div className="field-group">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput id="password" registration={form.register('password')} autoComplete="current-password" />
          {form.formState.errors.password ? <p className="field-error">{form.formState.errors.password.message}</p> : null}
        </div>
        <Button className="w-full" size="lg" disabled={mutation.isPending}>
          <SignIn size={20} aria-hidden />{mutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthFrame>
  )
}

type PasswordValues = z.infer<typeof changePasswordSchema>

export function ChangePasswordPage() {
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const form = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '' },
  })
  const mutation = useMutation({
    mutationFn: async (values: PasswordValues) => (await api.post<AuthResponse>('/auth/change-password', values)).data,
    onSuccess: setSession,
  })

  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChangePassword) return <Navigate to="/" replace />

  return (
    <AuthFrame title="Defina sua senha" description="A senha temporária precisa ser trocada antes do primeiro acesso.">
      {mutation.isError ? <Alert variant="destructive"><LockKey aria-hidden /><AlertTitle>Senha não alterada</AlertTitle><AlertDescription>{apiErrorMessage(mutation.error)}</AlertDescription></Alert> : null}
      <form className="form-stack" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="field-group"><Label htmlFor="currentPassword">Senha temporária</Label><PasswordInput id="currentPassword" registration={form.register('currentPassword')} autoComplete="current-password" />{form.formState.errors.currentPassword ? <p className="field-error">{form.formState.errors.currentPassword.message}</p> : null}</div>
        <div className="field-group"><Label htmlFor="newPassword">Nova senha</Label><PasswordInput id="newPassword" registration={form.register('password')} autoComplete="new-password" />{form.formState.errors.password ? <p className="field-error">{form.formState.errors.password.message}</p> : <p className="field-help">Use 10 caracteres, com maiúscula, minúscula e número.</p>}</div>
        <div className="field-group"><Label htmlFor="passwordConfirmation">Confirme a nova senha</Label><PasswordInput id="passwordConfirmation" registration={form.register('passwordConfirmation')} autoComplete="new-password" />{form.formState.errors.passwordConfirmation ? <p className="field-error">{form.formState.errors.passwordConfirmation.message}</p> : null}</div>
        <Button className="w-full" size="lg" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando...' : 'Salvar e continuar'}</Button>
      </form>
    </AuthFrame>
  )
}
