import { useState } from 'react'
import { Buildings, CheckCircle, MapPin, WarningCircle } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { ErrorState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api'
import type { ReferenceData } from '@/lib/types'

type CoverageRow = {
  id: string
  city: string
  region: string
  coordinators: number
  leaderships: number
  alliances: number
  coordinationInformation: 'INFORMED' | 'MISSING_INFORMATION'
  leadershipInformation: 'INFORMED' | 'MISSING_INFORMATION'
}

export function CoveragePage() {
  const [regionId, setRegionId] = useState('all')
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const coverage = useQuery({
    queryKey: ['coverage', regionId],
    queryFn: async () => (await api.get<CoverageRow[]>('/coverage', { params: { regionId: regionId === 'all' ? undefined : regionId } })).data,
  })
  const regions = references.data?.localities.filter((item) => item.type === 'REGION') ?? []
  const informed = coverage.data?.filter((item) => item.coordinationInformation === 'INFORMED' && item.leadershipInformation === 'INFORMED').length ?? 0
  const missing = (coverage.data?.length ?? 0) - informed

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>Cobertura territorial</h2><p>A tela mostra o que foi informado na base. Campo vazio significa informação ausente, não ausência confirmada de atuação.</p></div>
        <Select value={regionId} onValueChange={setRegionId}><SelectTrigger className="region-select" aria-label="Filtrar por região"><MapPin size={18} aria-hidden /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as regiões</SelectItem>{regions.map((region) => <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>)}</SelectContent></Select>
      </section>

      <section className="coverage-summary" aria-label="Resumo de cobertura">
        <article><Buildings size={25} weight="duotone" aria-hidden /><div><span>Cidades na seleção</span><strong>{coverage.data?.length ?? 0}</strong></div></article>
        <article><CheckCircle size={25} weight="duotone" aria-hidden /><div><span>Coordenação e liderança informadas</span><strong>{informed}</strong></div></article>
        <article className="warning-summary"><WarningCircle size={25} weight="duotone" aria-hidden /><div><span>Com informação pendente</span><strong>{missing}</strong></div></article>
      </section>

      {coverage.isLoading ? <LoadingState rows={6} /> : coverage.isError ? <ErrorState message={apiErrorMessage(coverage.error)} retry={() => coverage.refetch()} /> : (
        <section className="coverage-grid" aria-label="Cidades e cobertura">
          {coverage.data?.map((row) => (
            <article key={row.id} className="coverage-row">
              <div className="coverage-place"><MapPin size={22} weight="duotone" aria-hidden /><div><strong>{row.city}</strong><span>{row.region}</span></div></div>
              <dl><div><dt>Coordenação</dt><dd>{row.coordinators || <Badge variant="outline">Informação ausente</Badge>}</dd></div><div><dt>Lideranças</dt><dd>{row.leaderships || <Badge variant="outline">Informação ausente</Badge>}</dd></div><div><dt>Vínculos</dt><dd>{row.alliances}</dd></div></dl>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
