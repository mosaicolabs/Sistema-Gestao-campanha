import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { MacroCoverageRow } from '@campanha/types'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/page-state'
import { api, apiErrorMessage } from '@/lib/api'
import type { ReferenceData } from '@/lib/types'
import { CoverageAllianceView } from './coverage-alliance-view'
import { CoverageCityDialog } from './coverage-city-dialog'
import { CoverageFiltersBar, parseCoverageFilters, writeCoverageFilters, type CoverageFilters } from './coverage-filters'
import { CoverageTable } from './coverage-table'

export function CoveragePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseCoverageFilters(searchParams)
  const selectedCityId = searchParams.get('cityId') ?? undefined
  const selectedAllianceId = searchParams.get('allianceId') ?? undefined
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const coverage = useQuery({
    queryKey: ['coverage-macro', filters],
    queryFn: async () => (await api.get<MacroCoverageRow[]>('/coverage/macro', {
      params: {
        search: filters.search || undefined,
        regionId: filters.regionId === 'all' ? undefined : filters.regionId,
        role: filters.role === 'all' ? undefined : filters.role,
        allianceId: filters.allianceId === 'all' ? undefined : filters.allianceId,
        aliasStatus: filters.aliasStatus === 'ALL' ? undefined : filters.aliasStatus,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      },
    })).data,
    placeholderData: (previous) => previous,
  })
  const regions = references.data?.localities.filter((item) => item.type === 'REGION').map(({ id, name }) => ({ id, name })) ?? []
  const alliances = references.data?.alliances ?? []

  const updateFilters = (change: Partial<CoverageFilters>) => {
    const nextFilters = { ...filters, ...change }
    setSearchParams(writeCoverageFilters(searchParams, nextFilters))
  }

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams)
    for (const key of ['search', 'regionId', 'role', 'allianceId', 'aliasStatus', 'sortBy', 'sortDirection']) next.delete(key)
    setSearchParams(next)
  }

  const openCity = (cityId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('cityId', cityId)
    next.delete('allianceId')
    setSearchParams(next)
  }

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
        <div><h2>Visão macro por cidade</h2><p>Consulte relações entre articuladores, cidades, papéis, contatos e dobradas com os dados de origem preservados.</p></div>
      </section>

      <CoverageFiltersBar filters={filters} regions={regions} alliances={alliances} resultCount={coverage.data?.length ?? 0} onChange={updateFilters} onClear={clearFilters} />

      {selectedAllianceId ? <CoverageAllianceView allianceId={selectedAllianceId} onClose={closeAlliance} onOpenCity={openCity} /> : coverage.isLoading ? <LoadingState rows={6} /> : coverage.isError ? <ErrorState message={apiErrorMessage(coverage.error)} retry={() => coverage.refetch()} /> : (
        !coverage.data?.length ? <EmptyState title="Nenhuma cidade encontrada" description="Ajuste os filtros ou importe um lote com localidades catalogadas"><button type="button" className="text-button" onClick={clearFilters}>Limpar filtros</button></EmptyState> : <CoverageTable data={coverage.data} filters={filters} onSortChange={(sortBy, sortDirection) => updateFilters({ sortBy, sortDirection })} onOpenCity={openCity} />
      )}
      <CoverageCityDialog cityId={selectedCityId} open={Boolean(selectedCityId) && !selectedAllianceId} onOpenChange={closeCity} />
    </div>
  )
}
