import { useMemo, useState } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import type { CoverageAllianceRow, CoveragePersonRow } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Props = {
  rows: CoverageAllianceRow[]
  onOpenCity?: (cityId: string) => void
}

function peopleForRole(people: CoveragePersonRow[], roleCode: CoveragePersonRow['roleCode']) {
  return people.filter((person) => person.roleCode === roleCode)
}

function peopleCell(people: CoveragePersonRow[], roleCode: CoveragePersonRow['roleCode']) {
  const names = peopleForRole(people, roleCode)
  return names.length ? <div className="coverage-alliance-people">{names.map((person) => <span className="coverage-alliance-person" key={`${person.assignmentId}-${person.personId}`}>{person.displayName}</span>)}</div> : <span className="coverage-alliance-empty">Sem informação</span>
}

export function CoverageAllianceTable({ rows, onOpenCity }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const sortedRows = useMemo(() => [...rows].sort((left, right) => left.city.region.localeCompare(right.city.region, 'pt-BR') || left.city.name.localeCompare(right.city.name, 'pt-BR')), [rows])

  const toggleExpanded = (cityId: string) => {
    setExpandedRows((current) => {
      const next = new Set(current)
      if (next.has(cityId)) next.delete(cityId)
      else next.add(cityId)
      return next
    })
  }

  return (
    <div className="coverage-alliance-table-wrap">
      <Table className="coverage-alliance-table">
        <TableHeader><TableRow><TableHead>Região</TableHead><TableHead>Cidade</TableHead><TableHead>Articuladores</TableHead><TableHead>Coordenadores</TableHead><TableHead>Lideranças</TableHead><TableHead>Atribuições</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
        <TableBody>
          {sortedRows.map((row) => <TableRow key={row.city.id}>
            <TableCell><span className="coverage-muted">{row.city.region}</span></TableCell>
            <TableCell><strong>{row.city.name}</strong></TableCell>
            <TableCell>{peopleCell(row.people, 'ARTICULATOR')}</TableCell>
            <TableCell>{peopleCell(row.people, 'COORDINATOR')}</TableCell>
            <TableCell>{peopleCell(row.people, 'LEADERSHIP')}</TableCell>
            <TableCell><strong className="coverage-number">{row.people.length}</strong></TableCell>
            <TableCell>{onOpenCity ? <Button type="button" variant="outline" size="sm" onClick={() => onOpenCity(row.city.id)}>Ver pessoas</Button> : null}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>

      <div className="coverage-alliance-mobile-list">
        {sortedRows.map((row) => {
          const expanded = expandedRows.has(row.city.id)
          return <article className="coverage-alliance-mobile-row" key={row.city.id}>
            <div className="coverage-alliance-mobile-heading"><div><span className="coverage-muted">{row.city.region}</span><strong>{row.city.name}</strong></div><Button type="button" variant="ghost" size="sm" aria-expanded={expanded} onClick={() => toggleExpanded(row.city.id)}>{expanded ? 'Ocultar' : 'Ver papéis'}{expanded ? <CaretUp size={16} aria-hidden /> : <CaretDown size={16} aria-hidden />}</Button></div>
            {expanded ? <div className="coverage-alliance-mobile-fields"><div><span>Articuladores</span>{peopleCell(row.people, 'ARTICULATOR')}</div><div><span>Coordenadores</span>{peopleCell(row.people, 'COORDINATOR')}</div><div><span>Lideranças</span>{peopleCell(row.people, 'LEADERSHIP')}</div><div><span>Atribuições</span><strong>{row.people.length}</strong></div>{onOpenCity ? <Button type="button" variant="outline" size="sm" onClick={() => onOpenCity(row.city.id)}>Ver pessoas</Button> : null}</div> : null}
          </article>
        })}
      </div>
    </div>
  )
}
