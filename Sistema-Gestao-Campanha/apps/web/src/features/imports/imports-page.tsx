import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Database, FileXls, UploadSimple, Warning, WhatsappLogo } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reconciliationDecisionSchema } from '@campanha/validation'
import type { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { api, apiErrorMessage } from '@/lib/api'
import type { ImportBatch, ImportIssue } from '@/lib/types'
import { LocalityAliasReview } from './locality-alias-review'

type ProductDecision = { id: string; title: string; impact: string; status: 'PENDING' | 'CONFIRMED'; source: string }
type DecisionForm = z.infer<typeof reconciliationDecisionSchema>

function issueDetails(details: Record<string, unknown>) {
  return Object.entries(details).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' | ')
}

export function ImportsPage() {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<ImportIssue | null>(null)
  const batches = useQuery({ queryKey: ['imports'], queryFn: async () => (await api.get<ImportBatch[]>('/imports')).data })
  const issues = useQuery({ queryKey: ['issues'], queryFn: async () => (await api.get<ImportIssue[]>('/reconciliation-issues')).data })
  const decisions = useQuery({ queryKey: ['product-decisions'], queryFn: async () => (await api.get<ProductDecision[]>('/product-decisions')).data })
  const latest = batches.data?.[0]
  const form = useForm<DecisionForm>({ resolver: zodResolver(reconciliationDecisionSchema), defaultValues: { decision: 'KEEP', reason: '' } })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione uma planilha.')
      const body = new FormData()
      body.append('file', file)
      return (await api.post('/imports', body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 })).data
    },
    onSuccess: (result) => {
      toast.success(result.idempotent ? 'Este lote já havia sido importado.' : 'Planilha lida e enviada para revisão.')
      setFile(null)
      queryClient.invalidateQueries({ queryKey: ['imports'] })
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['coverage-macro'] })
    },
  })

  const decisionMutation = useMutation({
    mutationFn: async (values: DecisionForm) => (await api.post(`/reconciliation-issues/${selectedIssue!.id}/decisions`, values)).data,
    onSuccess: () => {
      toast.success('Decisão registrada com autor e data.')
      setSelectedIssue(null)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>Importação e conciliação</h2><p>Arquivo, aba, linha e valores originais permanecem rastreáveis. Coincidências nunca geram fusão automática.</p></div>
      </section>

      <section className="import-dropzone">
        <div className="upload-icon"><FileXls size={31} weight="duotone" aria-hidden /></div>
        <div><h3>Importar revisão da planilha</h3><p>Somente `.xlsx`, até 25 MB. Reimportações usam o hash do arquivo e não criam um novo lote.</p></div>
        <div className="upload-actions"><Label className="file-picker" htmlFor="workbook-file"><UploadSimple size={19} aria-hidden />{file ? file.name : 'Escolher arquivo'}</Label><Input id="workbook-file" className="sr-only" type="file" accept=".xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button disabled={!file || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>{uploadMutation.isPending ? 'Analisando...' : 'Importar lote'}</Button></div>
        {uploadMutation.isError ? <p className="field-error">{apiErrorMessage(uploadMutation.error)}</p> : null}
      </section>

      {latest ? (
        <section className="reconciliation-summary" aria-labelledby="last-batch-title">
          <div className="panel-heading"><div><p className="context-label">Último lote</p><h2 id="last-batch-title">{latest.filename}</h2></div><Badge variant="outline">{latest.status === 'REVIEW_REQUIRED' ? 'Revisão necessária' : latest.status}</Badge></div>
          <div className="reconciliation-numbers">
            <article><span>Abas</span><strong>{latest.workbookTabs}</strong></article>
            <article><span>Territorial</span><strong>{latest.territorialOccurrences}</strong><small>índice manual {latest.manualTerritorialIndex ?? 'não lido'}</small></article>
            <article className="accent-number"><span>Dobradas</span><strong>{latest.allianceOccurrences}</strong><small>índice manual {latest.manualAllianceIndex ?? 'não lido'}</small></article>
            <article><span>Ocorrências rastreadas</span><strong>{latest._count?.occurrences ?? 0}</strong><small>{latest._count?.issues ?? 0} pendências registradas</small></article>
          </div>
          <Alert><Warning aria-hidden /><AlertTitle>As contagens medem ocorrências</AlertTitle><AlertDescription>681 e 739 não são quantidades de pessoas únicas. Os índices 672 e 591 continuam como controles históricos.</AlertDescription></Alert>
        </section>
      ) : null}

      <Tabs defaultValue="issues" className="review-tabs">
        <TabsList><TabsTrigger value="issues">Fila de revisão</TabsTrigger><TabsTrigger value="decisions">Decisões pendentes</TabsTrigger><TabsTrigger value="whatsapp">WhatsApp</TabsTrigger></TabsList>
        <TabsContent value="issues">
          {issues.isLoading ? <LoadingState rows={6} /> : issues.isError ? <ErrorState message={apiErrorMessage(issues.error)} retry={() => issues.refetch()} /> : <>
            <LocalityAliasReview issues={issues.data ?? []} onReview={setSelectedIssue} />
            {(() => {
              const generalIssues = issues.data?.filter((issue) => issue.type !== 'LOCALITY_ALIAS') ?? []
              return !generalIssues.length ? <EmptyState title="Fila sem outras pendências" description="Novas divergências de importação aparecerão aqui." /> : (
                <section className="issue-list" aria-label="Pendências de importação">
                  {generalIssues.map((issue) => <article key={issue.id} className={`issue-row severity-${issue.severity.toLowerCase()}`}><div className="issue-icon">{issue.status === 'RESOLVED' ? <CheckCircle size={24} weight="duotone" aria-hidden /> : <Warning size={24} weight="duotone" aria-hidden />}</div><div><div className="issue-title"><h3>{issue.title}</h3><Badge variant="outline">{issue.status === 'RESOLVED' ? 'Resolvida' : issue.severity === 'CRITICAL' ? 'Crítica' : issue.severity === 'WARNING' ? 'Atenção' : 'Informativa'}</Badge></div><p>{issueDetails(issue.details)}</p><span>Origem: {issue.importBatch.filename}</span></div>{issue.status === 'OPEN' ? <Button variant="outline" size="sm" onClick={() => setSelectedIssue(issue)}>Registrar decisão</Button> : null}</article>)}
                </section>
              )
            })()}
          </>}
        </TabsContent>
        <TabsContent value="decisions">
          {decisions.isLoading ? <LoadingState rows={6} /> : decisions.isError ? <ErrorState message={apiErrorMessage(decisions.error)} retry={() => decisions.refetch()} /> : (
            <section className="decision-grid" aria-label="Decisões do PRD pendentes">
              {decisions.data?.map((decision) => <article key={decision.id}><span className="decision-id">{decision.id}</span><h3>{decision.title}</h3><p>{decision.impact}</p><Badge variant="outline">Aguardando gestor</Badge></article>)}
            </section>
          )}
        </TabsContent>
        <TabsContent value="whatsapp">
          <section className="whatsapp-placeholder"><WhatsappLogo size={38} weight="duotone" aria-hidden /><div><Badge variant="outline">Possibilidade mencionada</Badge><h3>Integração ainda não ativada</h3><p>O áudio cita alertas de agenda como opção. Fornecedor, destinatários, gatilhos e a expressão “API do WhatsApp” dependem das DP-004 e DP-014.</p></div></section>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedIssue)} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="form-dialog"><DialogHeader><DialogTitle>Registrar decisão de conciliação</DialogTitle><DialogDescription>{selectedIssue?.title}. Esta ação registra usuário, data e justificativa.</DialogDescription></DialogHeader>
          <form className="form-stack" onSubmit={form.handleSubmit((values) => decisionMutation.mutate(values))}>
            <div className="field-group"><Label>Decisão</Label><Controller name="decision" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="KEEP">Manter ocorrência</SelectItem><SelectItem value="REJECT">Rejeitar ocorrência</SelectItem><SelectItem value="MERGE">Vincular a entidade existente</SelectItem><SelectItem value="SPLIT">Manter como entidades separadas</SelectItem><SelectItem value="CORRECT">Corrigir mapeamento</SelectItem></SelectContent></Select>} /></div>
            <div className="field-group"><Label htmlFor="decision-reason">Justificativa</Label><Textarea id="decision-reason" rows={5} {...form.register('reason')} />{form.formState.errors.reason ? <p className="field-error">{form.formState.errors.reason.message}</p> : null}</div>
            {decisionMutation.isError ? <p className="field-error">{apiErrorMessage(decisionMutation.error)}</p> : null}
            <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setSelectedIssue(null)}>Cancelar</Button><Button disabled={decisionMutation.isPending}>{decisionMutation.isPending ? 'Registrando...' : 'Confirmar decisão'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
