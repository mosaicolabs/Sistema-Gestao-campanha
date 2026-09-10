import { useState } from 'react'
import { Buildings, CheckCircle, MapPin, WarningCircle } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { MacroCoverageRow } from '@campanha/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api'
import type { ReferenceData } from '@/lib/types'
import { CoverageAllianceView } from './coverage-alliance-view'
import { CoverageCityDialog } from './coverage-city-dialog'

export function CoveragePage() {
  const [regionId, setRegionId] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCityId = searchParams.get('cityId') ?? undefined
  const selectedAllianceId = searchParams.get('allianceId') ?? undefined
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const coverage = useQuery({
    queryKey: ['coverage-macro', regionId],
    queryFn: async () => (await api.get<MacroCoverageRow[]>('/coverage/macro', { params: { regionId: regionId === 'all' ? undefined : regionId } })).data,
  })
  const regions = references.data?.localities.filter((item) => item.type === 'REGION') ?? []
  const relationCount = coverage.data?.reduce((total, item) => total + item.articulatorCityRelations, 0) ?? 0
  const pendingAliasCount = coverage.data?.reduce((total, item) => total + item.pendingAliasCount, 0) ?? 0

  const closeCity = (open: boolean) => {
    if (!open) {
      const next = new URLSearchParams(searchParams)
      next.delete('cityId')
      setSearchParams(next)
    }
  }

  const closeAlliance = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('allianceId')
    setSearchParams(next)
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>Visão macro por cidade</h2><p>A métrica principal mostra relações únicas entre articulador e cidade. As variações de grafia permanecem visíveis para auditoria.</p></div>
        <Select value={regionId} onValueChange={setRegionId}><SelectTrigger className="region-select" aria-label="Filtrar por região"><MapPin size={18} aria-hidden /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as regiões</SelectItem>{regions.map((region) => <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>)}</SelectContent></Select>
      </section>

      <section className="coverage-summary" aria-label="Resumo de cobertura">
        <article><Buildings size={25} weight="duotone" aria-hidden /><div><span>Cidades na seleção</span><strong>{coverage.data?.length ?? 0}</strong></div></article>
        <article><CheckCircle size={25} weight="duotone" aria-hidden /><div><span>Relações articulador–cidade</span><strong>{relationCount}</strong></div></article>
        <article className="warning-summary"><WarningCircle size={25} weight="duotone" aria-hidden /><div><span>Aliases em revisão</span><strong>{pendingAliasCount}</strong></div></article>
      </section>

      {selectedAllianceId ? <CoverageAllianceView allianceId={selectedAllianceId} onClose={closeAlliance} /> : coverage.isLoading ? <LoadingState rows={6} /> : coverage.isError ? <ErrorState message={apiErrorMessage(coverage.error)} retry={() => coverage.refetch()} /> : (
        !coverage.data?.length ? <EmptyState title="Nenhuma cidade na seleção" description="Ajuste o filtro ou importe um lote com localidades catalogadas." /> : <section className="coverage-grid" aria-label="Cidades e cobertura">
          {coverage.data.map((row) => (
            <article key={row.id} className="coverage-row">
              <button type="button" className="coverage-row-trigger" onClick={() => { const next = new URLSearchParams(searchParams); next.set('cityId', row.id); next.delete('allianceId'); setSearchParams(next) }} aria-label={`Abrir detalhes de ${row.city}`}>
                <div className="coverage-place"><MapPin size={22} weight="duotone" aria-hidden /><div><strong>{row.city}</strong><span>{row.region}</span></div></div>
                <dl><div><dt>Articulador–cidade</dt><dd>{row.articulatorCityRelations}</dd></div><div><dt>Articuladores únicos</dt><dd>{row.uniqueArticulators}</dd></div><div><dt>Atribuições</dt><dd>{row.uniqueAssignments}</dd></div></dl>
                <dl><div><dt>Dobradas</dt><dd>{row.uniqueAlliances}</dd></div><div><dt>Variantes observadas</dt><dd>{row.observedVariants.length ? row.observedVariants.join(', ') : <Badge variant="outline">Nenhuma registrada</Badge>}</dd></div><div><dt>Revisão</dt><dd>{row.pendingAliasCount ? <Badge variant="outline">{row.pendingAliasCount} pendente(s)</Badge> : 'Sem pendências'}</dd></div></dl>
              </button>
              <Button variant="outline" size="sm" className="coverage-row-open" onClick={() => { const next = new URLSearchParams(searchParams); next.set('cityId', row.id); next.delete('allianceId'); setSearchParams(next) }}>Ver pessoas</Button>
            </article>
          ))}
        </section>
      )}
      <CoverageCityDialog cityId={selectedCityId} open={Boolean(selectedCityId) && !selectedAllianceId} onOpenChange={closeCity} />
    </div>
  )
}
