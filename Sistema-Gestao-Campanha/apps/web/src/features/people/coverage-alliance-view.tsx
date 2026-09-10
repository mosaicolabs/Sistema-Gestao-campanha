import { ArrowLeft, UsersThree } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/page-state'
import { api, apiErrorMessage } from '@/lib/api'
import type { CoverageAllianceDetail } from '@/lib/types'

type Props = { allianceId: string; onClose: () => void }

export function CoverageAllianceView({ allianceId, onClose }: Props) {
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
        <div className="coverage-alliance-grid">
          {detail.data.rows.map((row) => {
            const articulators = row.people.filter((person) => person.roleCode === 'ARTICULATOR')
            const coordinators = row.people.filter((person) => person.roleCode === 'COORDINATOR')
            const leaderships = row.people.filter((person) => person.roleCode === 'LEADERSHIP')
            return <article key={row.city.id} className="coverage-alliance-card"><header><div><p className="context-label">{row.city.region}</p><h3>{row.city.name}</h3></div><UsersThree size={23} weight="duotone" aria-hidden /></header><dl><div><dt>Articuladores</dt><dd>{articulators.length ? articulators.map((person) => <span key={person.assignmentId}>{person.displayName}</span>) : <em>Sem informação</em>}</dd></div><div><dt>Coordenadores</dt><dd>{coordinators.length ? coordinators.map((person) => <span key={person.assignmentId}>{person.displayName}</span>) : <em>Sem informação</em>}</dd></div><div><dt>Lideranças</dt><dd>{leaderships.length ? leaderships.map((person) => <span key={person.assignmentId}>{person.displayName}</span>) : <em>Sem informação</em>}</dd></div></dl><footer><Badge variant="outline">{row.people.length} atribuição(ões)</Badge></footer></article>
          })}
        </div>
      )}
    </section>
  )
}
