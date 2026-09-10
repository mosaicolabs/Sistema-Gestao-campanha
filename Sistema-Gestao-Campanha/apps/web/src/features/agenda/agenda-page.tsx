import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDots, Clock, LinkSimple, MapPin, Plus, WarningCircle } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api, apiErrorMessage } from '@/lib/api'
import type { CalendarEvent, ReferenceData } from '@/lib/types'

const agendaFormSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título').max(180),
  startsAt: z.string().min(1, 'Informe o início'),
  endsAt: z.string().min(1, 'Informe o término'),
  localityId: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  description: z.string().trim().max(3000).optional(),
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), { message: 'O término deve ser posterior ao início', path: ['endsAt'] })

type AgendaForm = z.infer<typeof agendaFormSchema>

function eventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(value))
}

function eventTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function AgendaPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const events = useQuery({ queryKey: ['events'], queryFn: async () => (await api.get<CalendarEvent[]>('/calendar-events')).data })
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const form = useForm<AgendaForm>({ resolver: zodResolver(agendaFormSchema), defaultValues: { title: '', startsAt: '', endsAt: '', localityId: '', address: '', description: '' } })
  const createMutation = useMutation({
    mutationFn: async (values: AgendaForm) => (await api.post('/calendar-events', { ...values, localityId: values.localityId || undefined, startsAt: new Date(values.startsAt).toISOString(), endsAt: new Date(values.endsAt).toISOString(), timezone: 'America/Sao_Paulo', visibility: 'TEAM' })).data,
    onSuccess: () => {
      toast.success('Compromisso adicionado à agenda.')
      setDialogOpen(false)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  const cancelMutation = useMutation({
    mutationFn: async (event: CalendarEvent) => (await api.put(`/calendar-events/${event.id}`, { title: event.title, description: event.description, startsAt: event.startsAt, endsAt: event.endsAt, timezone: event.timezone, address: event.address, visibility: 'TEAM', version: event.version, status: 'CANCELLED' })).data,
    onSuccess: () => { toast.success('Compromisso cancelado.'); queryClient.invalidateQueries({ queryKey: ['events'] }) },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const cities = references.data?.localities.filter((item) => item.type === 'CITY') ?? []

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>Agenda compartilhada</h2><p>Compromissos atualizados para usuários autorizados, com proteção contra sobrescrita silenciosa.</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus size={19} aria-hidden />Novo compromisso</Button></DialogTrigger>
          <DialogContent className="form-dialog"><DialogHeader><DialogTitle>Adicionar compromisso</DialogTitle><DialogDescription>O evento será salvo mesmo que uma futura integração de alertas esteja indisponível.</DialogDescription></DialogHeader>
            <form className="form-stack" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="field-group"><Label htmlFor="event-title">Título</Label><Input id="event-title" {...form.register('title')} />{form.formState.errors.title ? <p className="field-error">{form.formState.errors.title.message}</p> : null}</div>
              <div className="form-grid-two"><div className="field-group"><Label htmlFor="event-start">Início</Label><Input id="event-start" type="datetime-local" {...form.register('startsAt')} />{form.formState.errors.startsAt ? <p className="field-error">{form.formState.errors.startsAt.message}</p> : null}</div><div className="field-group"><Label htmlFor="event-end">Término</Label><Input id="event-end" type="datetime-local" {...form.register('endsAt')} />{form.formState.errors.endsAt ? <p className="field-error">{form.formState.errors.endsAt.message}</p> : null}</div></div>
              <div className="field-group"><Label>Localidade</Label><Controller name="localityId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{cities.map((city) => <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>)}</SelectContent></Select>} /></div>
              <div className="field-group"><Label htmlFor="event-address">Local ou endereço informado</Label><Input id="event-address" {...form.register('address')} /></div>
              <div className="field-group"><Label htmlFor="event-description">Descrição</Label><Textarea id="event-description" rows={3} {...form.register('description')} /></div>
              {createMutation.isError ? <p className="field-error">{apiErrorMessage(createMutation.error)}</p> : null}
              <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvando...' : 'Salvar compromisso'}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <section className="pending-policy"><LinkSimple size={25} weight="duotone" aria-hidden /><div><strong>Link simples aguarda definição</strong><p>Consulta, edição, autenticação, expiração e revogação dependem da DP-011.</p></div><Badge variant="outline">Não publicado</Badge></section>

      {events.isLoading ? <LoadingState rows={5} /> : events.isError ? <ErrorState message={apiErrorMessage(events.error)} retry={() => events.refetch()} /> : !events.data?.length ? <EmptyState title="Agenda livre" description="Adicione o primeiro compromisso para compartilhar com a equipe autorizada." /> : (
        <section className="agenda-list" aria-label="Compromissos">
          {events.data.map((event) => (
            <article key={event.id} className={event.status === 'CANCELLED' ? 'event-cancelled' : ''}>
              <div className="event-date"><CalendarDots size={24} weight="duotone" aria-hidden /><strong>{eventDate(event.startsAt)}</strong></div>
              <div className="event-main"><div><h3>{event.title}</h3><Badge variant={event.status === 'CANCELLED' ? 'outline' : 'secondary'}>{event.status === 'CANCELLED' ? 'Cancelado' : 'Agendado'}</Badge></div><p><Clock size={17} aria-hidden />{eventTime(event.startsAt)} até {eventTime(event.endsAt)}</p>{event.locality || event.address ? <p><MapPin size={17} aria-hidden />{[event.locality?.name, event.address].filter(Boolean).join(', ')}</p> : <p className="missing-info"><WarningCircle size={17} aria-hidden />Local não informado</p>}</div>
              {event.status === 'SCHEDULED' ? <Button variant="outline" size="sm" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(event)}>Cancelar</Button> : null}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
