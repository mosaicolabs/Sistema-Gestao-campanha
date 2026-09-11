import { Funnel, MagnifyingGlass, SortAscending, X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export type CoverageSortBy =
  | 'city'
  | 'region'
  | 'articulatorCityRelations'
  | 'uniqueArticulators'
  | 'uniqueCoordinators'
  | 'uniqueLeaderships'
  | 'uniqueAssignments'
  | 'uniqueAlliances'
  | 'pendingAliasCount'

export type CoverageSortDirection = 'asc' | 'desc'
export type CoverageAliasStatus = 'ALL' | 'PENDING' | 'CLEAR'

export type CoverageFilters = {
  search: string
  regionId: string
  role: 'all' | 'ARTICULATOR' | 'COORDINATOR' | 'LEADERSHIP'
  allianceId: string
  aliasStatus: CoverageAliasStatus
  sortBy: CoverageSortBy
  sortDirection: CoverageSortDirection
}

type CoverageReference = { id: string; name: string }

type Props = {
  filters: CoverageFilters
  regions: CoverageReference[]
  alliances: CoverageReference[]
  resultCount: number
  onChange: (change: Partial<CoverageFilters>) => void
  onClear: () => void
}

const sortOptions: Array<{ value: CoverageSortBy; label: string }> = [
  { value: 'city', label: 'Cidade' },
  { value: 'region', label: 'Região' },
  { value: 'articulatorCityRelations', label: 'Relações articulador–cidade' },
  { value: 'uniqueArticulators', label: 'Articuladores únicos' },
  { value: 'uniqueCoordinators', label: 'Coordenadores' },
  { value: 'uniqueLeaderships', label: 'Lideranças' },
  { value: 'uniqueAssignments', label: 'Atribuições' },
  { value: 'uniqueAlliances', label: 'Dobradas' },
  { value: 'pendingAliasCount', label: 'Aliases em revisão' },
]

type FilterFieldsProps = Pick<Props, 'filters' | 'regions' | 'alliances' | 'onChange'>

function SearchField({ filters, onChange }: Pick<FilterFieldsProps, 'filters' | 'onChange'>) {
  return <div className="coverage-filter-field coverage-filter-search"><Label htmlFor="coverage-search">Buscar cidade ou região</Label><div className="search-field"><MagnifyingGlass size={18} aria-hidden /><Input id="coverage-search" placeholder="Nome da cidade ou região" value={filters.search} onChange={(event) => onChange({ search: event.target.value })} /></div></div>
}

function FilterFields({ filters, regions, alliances, onChange, compact = false, showSearch = true }: FilterFieldsProps & { compact?: boolean; showSearch?: boolean }) {
  return (
    <>
      {showSearch ? <SearchField filters={filters} onChange={onChange} /> : null}
      {compact ? null : <>
      <div className="coverage-filter-field">
        <Label htmlFor="coverage-region">Região</Label>
        <Select value={filters.regionId} onValueChange={(value) => onChange({ regionId: value })}>
          <SelectTrigger id="coverage-region" aria-label="Filtrar por região"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as regiões</SelectItem>{regions.map((region) => <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="coverage-filter-field">
        <Label htmlFor="coverage-role">Papel com atuação</Label>
        <Select value={filters.role} onValueChange={(value) => onChange({ role: value as CoverageFilters['role'] })}>
          <SelectTrigger id="coverage-role" aria-label="Filtrar por papel"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os papéis</SelectItem><SelectItem value="ARTICULATOR">Articulador</SelectItem><SelectItem value="COORDINATOR">Coordenador</SelectItem><SelectItem value="LEADERSHIP">Liderança</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="coverage-filter-field">
        <Label htmlFor="coverage-alliance">Dobrador</Label>
        <Select value={filters.allianceId} onValueChange={(value) => onChange({ allianceId: value })}>
          <SelectTrigger id="coverage-alliance" aria-label="Filtrar por dobrador"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os dobradores</SelectItem>{alliances.map((alliance) => <SelectItem key={alliance.id} value={alliance.id}>{alliance.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="coverage-filter-field">
        <Label htmlFor="coverage-alias-status">Situação dos aliases</Label>
        <Select value={filters.aliasStatus} onValueChange={(value) => onChange({ aliasStatus: value as CoverageAliasStatus })}>
          <SelectTrigger id="coverage-alias-status" aria-label="Filtrar por situação dos aliases"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">Todos os aliases</SelectItem><SelectItem value="PENDING">Com alias em revisão</SelectItem><SelectItem value="CLEAR">Sem alias em revisão</SelectItem></SelectContent>
        </Select>
      </div>
      </>}
    </>
  )
}

export function parseCoverageFilters(params: URLSearchParams): CoverageFilters {
  const role = params.get('role')
  const aliasStatus = params.get('aliasStatus')
  const sortBy = params.get('sortBy')
  const sortDirection = params.get('sortDirection')
  const validSortValues = sortOptions.map((option) => option.value)
  return {
    search: params.get('search') ?? '',
    regionId: params.get('regionId') ?? 'all',
    role: role === 'ARTICULATOR' || role === 'COORDINATOR' || role === 'LEADERSHIP' ? role : 'all',
    allianceId: params.get('allianceId') ?? 'all',
    aliasStatus: aliasStatus === 'PENDING' || aliasStatus === 'CLEAR' ? aliasStatus : 'ALL',
    sortBy: sortBy && validSortValues.includes(sortBy as CoverageSortBy) ? sortBy as CoverageSortBy : 'city',
    sortDirection: sortDirection === 'desc' ? 'desc' : 'asc',
  }
}

export function writeCoverageFilters(params: URLSearchParams, filters: CoverageFilters) {
  const next = new URLSearchParams(params)
  const values: Array<[string, string | undefined]> = [
    ['search', filters.search.trim() || undefined],
    ['regionId', filters.regionId === 'all' ? undefined : filters.regionId],
    ['role', filters.role === 'all' ? undefined : filters.role],
    ['allianceId', filters.allianceId === 'all' ? undefined : filters.allianceId],
    ['aliasStatus', filters.aliasStatus === 'ALL' ? undefined : filters.aliasStatus],
    ['sortBy', filters.sortBy === 'city' ? undefined : filters.sortBy],
    ['sortDirection', filters.sortBy === 'city' && filters.sortDirection === 'asc' ? undefined : filters.sortDirection],
  ]
  for (const [key, value] of values) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  return next
}

export function CoverageFiltersBar({ filters, regions, alliances, resultCount, onChange, onClear }: Props) {
  const activeCount = [filters.search, filters.regionId !== 'all', filters.role !== 'all', filters.allianceId !== 'all', filters.aliasStatus !== 'ALL'].filter(Boolean).length
  const activeSortLabel = sortOptions.find((option) => option.value === filters.sortBy)?.label ?? 'Cidade'

  return (
    <section className="coverage-query" aria-label="Filtros e ordenação da cobertura">
      <div className="coverage-filter-desktop">
        <FilterFields filters={filters} regions={regions} alliances={alliances} onChange={onChange} compact />
      </div>
      <div className="coverage-filter-advanced-desktop"><FilterFields filters={filters} regions={regions} alliances={alliances} onChange={onChange} showSearch={false} /></div>
      <div className="coverage-filter-actions">
        <div className="coverage-sort-field">
          <Label htmlFor="coverage-sort">Ordenar por</Label>
          <Select value={filters.sortBy} onValueChange={(value) => onChange({ sortBy: value as CoverageSortBy, sortDirection: value === filters.sortBy ? filters.sortDirection : value === 'city' || value === 'region' ? 'asc' : 'desc' })}>
            <SelectTrigger id="coverage-sort" aria-label="Ordenar cobertura"><SortAscending size={17} aria-hidden /><SelectValue /></SelectTrigger>
            <SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" aria-label={`Inverter ordenação atual: ${activeSortLabel}`} onClick={() => onChange({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' })}>{filters.sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}</Button>
        </div>
        <Sheet>
          <SheetTrigger asChild><Button type="button" variant="outline" className="coverage-filter-trigger"><Funnel size={17} aria-hidden />Filtros{activeCount ? <Badge variant="secondary">{activeCount}</Badge> : null}</Button></SheetTrigger>
          <SheetContent side="right" className="coverage-filter-sheet">
            <SheetHeader><SheetTitle>Filtrar cobertura</SheetTitle><SheetDescription>Combine os critérios para encontrar as cidades que precisa consultar.</SheetDescription></SheetHeader>
            <div className="coverage-filter-sheet-fields"><FilterFields filters={filters} regions={regions} alliances={alliances} onChange={onChange} /></div>
            <SheetFooter><SheetClose asChild><Button type="button" variant="outline">Aplicar filtros</Button></SheetClose><Button type="button" onClick={onClear}><X size={17} aria-hidden />Limpar filtros</Button></SheetFooter>
          </SheetContent>
        </Sheet>
        {activeCount ? <Button type="button" variant="ghost" size="sm" onClick={onClear}>Limpar filtros</Button> : null}
      </div>
      <p className="coverage-result-count" role="status">{resultCount} {resultCount === 1 ? 'cidade encontrada' : 'cidades encontradas'}</p>
    </section>
  )
}
