import { WarningCircleIcon, TrayIcon } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Carregando conteúdo">
      {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <TrayIcon size={30} weight="duotone" aria-hidden />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <WarningCircleIcon size={28} weight="duotone" aria-hidden />
      <div><strong>Não foi possível carregar</strong><p>{message}</p></div>
      {retry ? <button className="text-button" type="button" onClick={retry}>Tentar novamente</button> : null}
    </div>
  )
}
