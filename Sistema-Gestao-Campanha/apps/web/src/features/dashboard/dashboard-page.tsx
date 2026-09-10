import { ArrowRight, CalendarDots, CheckCircle, ClockCountdown, Database, MapPin, Warning } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { DIAGNOSTIC_SNAPSHOT } from '@campanha/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState } from '@/components/ui/page-state'
import { api, apiErrorMessage } from '@/lib/api'

type DashboardData = {
  people: number
  assignments: number
  alliances: number
  openIssues: number
  tasks: number
  localitiesMissingCoverage: number
  nextEvents: Array<{ id: string; title: string; startsAt: string; locality?: { name: string } }>
  lastBatch?: { territorialOccurrences: number; allianceOccurrences: number; manualTerritorialIndex?: number; manualAllianceIndex?: number }
}

const chartData = [
  { name: 'Territorial', manual: 672, encontrado: 681 },
  { name: 'Dobradas', manual: 591, encontrado: 739 },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function DashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get<DashboardData>('/dashboard')).data })
  if (query.isLoading) return <LoadingState rows={5} />
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} />
  const data = query.data!

  return (
    <div className="dashboard-page page-stack">
      <section className="dashboard-hero">
        <div>
          <Badge variant="secondary">Base em revisão</Badge>
          <h2>O trabalho começa pelas pendências que mudam os dados.</h2>
          <p>As contagens da planilha permanecem separadas do cadastro consolidado até a decisão do gestor.</p>
          <Button asChild><Link to="/importacao">Abrir revisão <ArrowRight size={18} aria-hidden /></Link></Button>
        </div>
        <div className="hero-number" aria-label="148 linhas duplicadas pendentes">
          <strong>{DIAGNOSTIC_SNAPSHOT.duplicatedAllianceRowsPending}</strong>
          <span>linhas aguardam decisão</span>
        </div>
      </section>

      <section aria-labelledby="resumo-title">
        <div className="section-heading"><div><p className="context-label">Situação atual</p><h2 id="resumo-title">Resumo operacional</h2></div></div>
        <div className="metric-strip">
          <article><Database size={24} weight="duotone" aria-hidden /><span>Cadastros únicos</span><strong>{data.people}</strong></article>
          <article><ClockCountdown size={24} weight="duotone" aria-hidden /><span>Tarefas abertas</span><strong>{data.tasks}</strong></article>
          <article><Warning size={24} weight="duotone" aria-hidden /><span>Pendências de importação</span><strong>{data.openIssues}</strong></article>
          <article><MapPin size={24} weight="duotone" aria-hidden /><span>Cidades sem informação</span><strong>{data.localitiesMissingCoverage}</strong></article>
        </div>
      </section>

      <div className="dashboard-split">
        <section className="data-panel" aria-labelledby="indices-title">
          <div className="panel-heading"><div><h2 id="indices-title">Índices e linhas encontradas</h2><p>Os valores não representam pessoas únicas.</p></div><Badge variant="outline">DP-002 pendente</Badge></div>
          <div className="chart-wrap" aria-label="Comparação entre índices manuais e linhas encontradas">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#c9e3e0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: '#E8F6F5' }} />
                <Bar dataKey="manual" name="Índice manual" fill="#FFD23F" radius={[8, 8, 0, 0]} />
                <Bar dataKey="encontrado" name="Linhas encontradas" fill="#2BA8A2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="data-note"><Warning size={18} aria-hidden /> Territorial: diferença de +9. Dobradas: diferença de +148.</p>
        </section>

        <section className="schedule-panel" aria-labelledby="agenda-title">
          <div className="panel-heading"><div><h2 id="agenda-title">Próximos compromissos</h2><p>Agenda compartilhada da equipe.</p></div><CalendarDots size={28} weight="duotone" aria-hidden /></div>
          {data.nextEvents.length ? (
            <div className="schedule-list">
              {data.nextEvents.map((event) => <article key={event.id}><div className="date-tile"><strong>{new Date(event.startsAt).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(event.startsAt))}</span></div><div><strong>{event.title}</strong><span>{formatDate(event.startsAt)}{event.locality ? `, ${event.locality.name}` : ''}</span></div></article>)}
            </div>
          ) : (
            <div className="compact-empty"><CalendarDots size={28} aria-hidden /><p>Nenhum compromisso futuro cadastrado.</p></div>
          )}
          <Button variant="outline" asChild><Link to="/agenda">Ver agenda</Link></Button>
        </section>
      </div>

      <section className="conditional-feature">
        <div className="conditional-icon"><CheckCircle size={28} weight="duotone" aria-hidden /></div>
        <div><strong>Agenda independente do WhatsApp</strong><p>A agenda funciona normalmente. O alerta por WhatsApp permanece como possibilidade não confirmada e sem fornecedor escolhido.</p></div>
        <Badge variant="outline">DP-004 e DP-014</Badge>
      </section>
    </div>
  )
}
