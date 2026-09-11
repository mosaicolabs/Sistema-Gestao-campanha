import { CaretDown, CaretUp, MapPin, SortAscending, SortDescending } from '@phosphor-icons/react'
import { Fragment, useMemo, useState } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, type SortingState, useReactTable } from '@tanstack/react-table'
import type { MacroCoverageRow } from '@campanha/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CoverageFilters, CoverageSortBy, CoverageSortDirection } from './coverage-filters'

type Props = {
  data: MacroCoverageRow[]
  filters: CoverageFilters
  onSortChange: (sortBy: CoverageSortBy, direction: CoverageSortDirection) => void
  onOpenCity: (cityId: string) => void
}

const columnHelper = createColumnHelper<MacroCoverageRow>()

function metricCell(value: number) {
  return <strong className="coverage-number">{value}</strong>
}

function variantsCell(row: MacroCoverageRow) {
  return row.observedVariants.length ? <span className="coverage-variants">{row.observedVariants.join(', ')}</span> : <span className="coverage-muted">Nenhuma variação registrada</span>
}

function aliasCell(row: MacroCoverageRow) {
  return row.pendingAliasCount ? <Badge variant="outline">{row.pendingAliasCount} em revisão</Badge> : <span className="coverage-muted">Sem pendências</span>
}

function rowFields(row: MacroCoverageRow, onOpenCity: () => void) {
  return (
    <dl className="coverage-mobile-fields">
      <div><dt>Relações articulador–cidade</dt><dd>{metricCell(row.articulatorCityRelations)}</dd></div>
      <div><dt>Articuladores únicos</dt><dd>{metricCell(row.uniqueArticulators)}</dd></div>
      <div><dt>Coordenadores</dt><dd>{metricCell(row.uniqueCoordinators)}</dd></div>
      <div><dt>Lideranças</dt><dd>{metricCell(row.uniqueLeaderships)}</dd></div>
      <div><dt>Atribuições</dt><dd>{metricCell(row.uniqueAssignments)}</dd></div>
      <div><dt>Dobradas</dt><dd>{metricCell(row.uniqueAlliances)}</dd></div>
      <div><dt>Variações observadas</dt><dd>{variantsCell(row)}</dd></div>
      <div><dt>Aliases em revisão</dt><dd>{aliasCell(row)}</dd></div>
      <div><dt>Ação</dt><dd><Button type="button" variant="outline" size="sm" onClick={onOpenCity}>Ver pessoas</Button></dd></div>
    </dl>
  )
}

export function CoverageTable({ data, filters, onSortChange, onOpenCity }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const sorting: SortingState = [{ id: filters.sortBy, desc: filters.sortDirection === 'desc' }]

  const columns = useMemo(() => [
    columnHelper.accessor('city', {
      header: 'Cidade',
      cell: ({ row }) => <div className="coverage-city-cell"><MapPin size={18} weight="duotone" aria-hidden /><div><strong>{row.original.city}</strong><span>{row.original.region}</span></div></div>,
    }),
    columnHelper.accessor('articulatorCityRelations', { header: 'Relações A–C', cell: ({ getValue }) => metricCell(getValue()) }),
    columnHelper.accessor('uniqueArticulators', { header: 'Articuladores', cell: ({ getValue }) => metricCell(getValue()) }),
    columnHelper.accessor('uniqueCoordinators', { header: 'Coordenadores', cell: ({ getValue }) => metricCell(getValue()) }),
    columnHelper.accessor('uniqueLeaderships', { header: 'Lideranças', cell: ({ getValue }) => metricCell(getValue()) }),
    columnHelper.accessor('uniqueAssignments', { header: 'Atribuições', cell: ({ getValue }) => metricCell(getValue()) }),
    columnHelper.accessor('uniqueAlliances', { header: 'Dobradas', cell: ({ getValue }) => metricCell(getValue()) }),
    columnHelper.display({ id: 'observedVariants', header: 'Variações observadas', cell: ({ row }) => variantsCell(row.original) }),
    columnHelper.accessor('pendingAliasCount', { header: 'Aliases em revisão', cell: ({ row }) => aliasCell(row.original) }),
    columnHelper.display({ id: 'actions', header: 'Ação', enableSorting: false, cell: ({ row }) => <Button type="button" variant="outline" size="sm" onClick={() => onOpenCity(row.original.id)}>Ver pessoas</Button> }),
  ], [onOpenCity])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting },
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater
      const next = nextSorting[0]
      if (next) onSortChange(next.id as CoverageSortBy, next.desc ? 'desc' : 'asc')
    },
  })

  const toggleExpanded = (cityId: string) => {
    setExpandedRows((current) => {
      const next = new Set(current)
      if (next.has(cityId)) next.delete(cityId)
      else next.add(cityId)
      return next
    })
  }

  return (
    <section className="coverage-table-section" aria-label="Tabela de cobertura por cidade">
      <div className="coverage-table-desktop">
        <Table className="coverage-data-table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => {
              const sorted = header.column.getIsSorted()
              const ariaSort = sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
              return <TableHead key={header.id} aria-sort={ariaSort} className={header.column.id === 'city' ? 'coverage-sticky-column' : undefined}>{header.isPlaceholder ? null : header.column.getCanSort() ? <button type="button" className="coverage-sort-button" onClick={() => header.column.toggleSorting(sorted === 'asc')} aria-label={`Ordenar por ${String(header.column.columnDef.header)}: ${sorted === 'asc' ? 'decrescente' : 'crescente'}`}><span>{flexRender(header.column.columnDef.header, header.getContext())}</span>{sorted === 'asc' ? <SortAscending size={15} aria-hidden /> : sorted === 'desc' ? <SortDescending size={15} aria-hidden /> : null}</button> : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
            })}</TableRow>)}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => <TableRow key={row.id} tabIndex={0} aria-label={`Abrir detalhes de ${row.original.city}`} onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenCity(row.original.id)
              }
            }}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className={cell.column.id === 'city' ? 'coverage-sticky-column' : undefined}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}
          </TableBody>
        </Table>
      </div>

      <div className="coverage-table-mobile">
        <Table className="coverage-data-table coverage-mobile-data-table">
          <TableHeader><TableRow><TableHead>Cidade</TableHead><TableHead className="coverage-mobile-heading">Dados</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => {
              const expanded = expandedRows.has(row.id)
              return <Fragment key={row.id}>
                <TableRow key={row.id}>
                  <TableCell><div className="coverage-city-cell"><MapPin size={18} weight="duotone" aria-hidden /><div><strong>{row.city}</strong><span>{row.region}</span></div></div></TableCell>
                  <TableCell className="coverage-mobile-actions"><Button type="button" variant="ghost" size="sm" aria-expanded={expanded} aria-controls={`coverage-row-${row.id}`} onClick={() => toggleExpanded(row.id)}>{expanded ? 'Ocultar dados' : 'Mostrar dados'}{expanded ? <CaretUp size={16} aria-hidden /> : <CaretDown size={16} aria-hidden />}</Button></TableCell>
                </TableRow>
                {expanded ? <TableRow key={`${row.id}-details`} id={`coverage-row-${row.id}`}><TableCell colSpan={2}>{rowFields(row, () => onOpenCity(row.id))}</TableCell></TableRow> : null}
              </Fragment>
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
