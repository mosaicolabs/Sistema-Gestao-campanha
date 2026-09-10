import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/page-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, apiErrorMessage } from '@/lib/api'
import type { CoverageCityDetail } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'

type Props = {
  cityId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CoverageCityDialog({ cityId, open, onOpenChange }: Props) {
  const detail = useQuery({
    queryKey: ['coverage-city-detail', cityId],
    queryFn: async () => (await api.get<CoverageCityDetail>(`/coverage/cities/${cityId}/detail`)).data,
    enabled: open && Boolean(cityId),
  })

  const city = detail.data?.city.name ?? 'Cidade'
  const region = detail.data?.region?.name ?? 'Região não informada'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="coverage-city-dialog">
        <DialogHeader>
          <p className="context-label">Detalhe da cobertura</p>
          <DialogTitle>{city}</DialogTitle>
          <DialogDescription>{region} · vínculos ativos encontrados no cadastro único.</DialogDescription>
        </DialogHeader>
        {detail.isLoading ? <LoadingState rows={4} /> : detail.isError ? <ErrorState message={apiErrorMessage(detail.error)} retry={() => detail.refetch()} /> : !detail.data ? <EmptyState title="Cidade não encontrada" description="A cidade não está disponível na cobertura ativa." /> : (
          <div className="coverage-detail-stack">
            <div className="coverage-detail-summary" aria-label="Resumo da cidade">
              <span><strong>{detail.data.summary.articulatorCityRelations}</strong> relações articulador–cidade</span>
              <span><strong>{detail.data.summary.coordinators}</strong> coordenadores</span>
              <span><strong>{detail.data.summary.leaderships}</strong> lideranças</span>
            </div>
            {!detail.data.rows.length ? <EmptyState title="Sem pessoas informadas" description="A base não informou atribuições ativas para esta cidade." /> : (
              <div className="coverage-detail-table-wrap">
                <Table className="coverage-detail-table">
                  <TableHeader><TableRow><TableHead>Papel</TableHead><TableHead>Pessoa</TableHead><TableHead>Contatos</TableHead><TableHead>Dobradas apoiadas</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {detail.data.rows.map((row) => (
                      <TableRow key={row.assignmentId}>
                        <TableCell><Badge variant="outline">{row.roleName}</Badge></TableCell>
                        <TableCell><strong>{row.displayName}</strong></TableCell>
                        <TableCell>{row.contacts.length ? <div className="coverage-contact-list">{row.contacts.map((contact) => <span key={contact.id}>{contact.type}: {contact.valueRaw}{contact.isPrimary ? ' · principal' : ''}</span>)}</div> : <span className="coverage-muted">Sem contato informado</span>}</TableCell>
                        <TableCell>{row.alliances.length ? <div className="coverage-alliance-list">{row.alliances.map((alliance) => <Badge key={`${row.assignmentId}-${alliance.id}`} variant={alliance.status === 'PENDING_REVIEW' ? 'outline' : 'secondary'}>{alliance.name}{alliance.status === 'PENDING_REVIEW' ? ' · revisão' : ''}</Badge>)}</div> : <span className="coverage-muted">Sem dobrada informada</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {detail.data.observedVariants.length ? <p className="coverage-source-note">Variações observadas: {detail.data.observedVariants.join(', ')}</p> : null}
          </div>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
