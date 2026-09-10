import { MapPin, Warning } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ImportIssue } from '@/lib/types'

type Props = {
  issues: ImportIssue[]
  onReview: (issue: ImportIssue) => void
}

function detail(issue: ImportIssue, key: string) {
  const value = issue.details[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined
}

export function LocalityAliasReview({ issues, onReview }: Props) {
  const pending = issues.filter((issue) => issue.type === 'LOCALITY_ALIAS' && issue.status === 'OPEN')
  if (!pending.length) return null

  return (
    <section className="alias-review-panel" aria-labelledby="locality-alias-review-title">
      <div className="panel-heading">
        <div>
          <p className="context-label">Normalização de localidades</p>
          <h3 id="locality-alias-review-title">Variações que aguardam confirmação</h3>
        </div>
        <Badge variant="outline">{pending.length} pendente(s)</Badge>
      </div>
      <div className="issue-list">
        {pending.map((issue) => (
          <article key={issue.id} className="issue-row severity-warning">
            <div className="issue-icon"><MapPin size={24} weight="duotone" aria-hidden /></div>
            <div>
              <div className="issue-title"><h4>{detail(issue, 'rawValue') ?? issue.title}</h4><Badge variant="outline">Alias de cidade</Badge></div>
              <p><strong>Nome canônico sugerido:</strong> {detail(issue, 'candidateDisplayName') ?? 'confirmação necessária'}</p>
              <span><Warning size={14} aria-hidden /> Relatório: linha {detail(issue, 'sourceReportLine') ?? 'não informada'} · valor normalizado {detail(issue, 'normalizedKey') ?? 'não informado'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onReview(issue)}>Revisar</Button>
          </article>
        ))}
      </div>
    </section>
  )
}
