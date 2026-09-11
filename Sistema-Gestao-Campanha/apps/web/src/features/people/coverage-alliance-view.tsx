import { ArrowLeft } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/page-state'
import { api, apiErrorMessage } from '@/lib/api'
import type { CoverageAllianceDetail } from '@/lib/types'
import { CoverageAllianceTable } from './coverage-alliance-table'

type Props = { allianceId: string; onClose: () => void; onOpenCity?: (cityId: string) => void }

export function CoverageAllianceView({ allianceId, onClose, onOpenCity }: Props) {
  const detail = useQuery({
    queryKey: ['coverage-alliance-detail', allianceId],
    queryFn: async () => (await api.get<CoverageAllianceDetail>(`/coverage/alliances/${allianceId}/detail`)).data,
    enabled: Boolean(allianceId),
  })

  if (detail.isLoading) return <LoadingState rows={5} />
  if (detail.isError) return <ErrorState message={apiErrorMessage(detail.error)} retry={() => detail.refetch()} />
  if (!detail.data) return <EmptyState title="Dobrador não encontrado" description="O vínculo não está disponível na base ativa." />

  return (
    <section className="coverage-alliance-view" aria-labelledby="coverage-alliance-title">
      <div className="page-intro">
        <div><Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft size={17} aria-hidden />Voltar para regiões</Button><p className="context-label">Visão por dobrador</p><h2 id="coverage-alliance-title">{detail.data.alliance.name}</h2><p>Relações territoriais da campanha Edson Albertassi, agrupadas por região e cidade.</p></div>
      </div>
      {!detail.data.rows.length ? <EmptyState title="Sem cidades informadas" description="A base não informou pessoas ou cidades para este dobrador." /> : (
        <CoverageAllianceTable rows={detail.data.rows} onOpenCity={onOpenCity} />
      )}
    </section>
  )
}
