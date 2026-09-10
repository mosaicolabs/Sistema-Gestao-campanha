import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Package, Path, Plus, WarningCircle } from '@phosphor-icons/react'
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
import type { Delivery, ReferenceData } from '@/lib/types'

const deliveryFormSchema = z.object({
  destination: z.string().trim().min(2, 'Informe o destino'),
  localityId: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  responsibleUserId: z.string().optional(),
  scheduledAt: z.string().optional(),
  materialId: z.string().optional(),
  quantity: z.string().optional().refine((value) => !value || Number(value) > 0, 'Use uma quantidade maior que zero'),
  notes: z.string().trim().max(3000).optional(),
})

type DeliveryForm = z.infer<typeof deliveryFormSchema>
const statusLabel = { REQUESTED: 'Solicitada', PLANNED: 'Planejada', IN_TRANSIT: 'Em trânsito', DELIVERED: 'Entregue', CANCELLED: 'Cancelada', BLOCKED: 'Bloqueada' }

export function DeliveriesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const deliveries = useQuery({ queryKey: ['deliveries'], queryFn: async () => (await api.get<Delivery[]>('/deliveries')).data })
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const form = useForm<DeliveryForm>({ resolver: zodResolver(deliveryFormSchema), defaultValues: { destination: '', localityId: '', address: '', responsibleUserId: '', scheduledAt: '', materialId: '', notes: '' } })
  const createMutation = useMutation({
    mutationFn: async (values: DeliveryForm) => (await api.post('/deliveries', { destination: values.destination, localityId: values.localityId || undefined, address: values.address || undefined, responsibleUserId: values.responsibleUserId || undefined, scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined, notes: values.notes || undefined, items: values.materialId && values.quantity ? [{ materialId: values.materialId, quantity: Number(values.quantity) }] : [] })).data,
    onSuccess: () => {
      toast.success('Entrega registrada.')
      setDialogOpen(false)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    },
  })
  const cities = references.data?.localities.filter((item) => item.type === 'CITY') ?? []

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>Entregas de materiais</h2><p>Controle administrativo de destino, responsável e situação. Estoque e otimização de rotas aguardam definição.</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus size={19} aria-hidden />Nova entrega</Button></DialogTrigger>
          <DialogContent className="form-dialog"><DialogHeader><DialogTitle>Registrar entrega</DialogTitle><DialogDescription>Endereço vazio será salvo como informação pendente, sem validação automática.</DialogDescription></DialogHeader>
            <form className="form-stack" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="field-group"><Label htmlFor="delivery-destination">Destino</Label><Input id="delivery-destination" {...form.register('destination')} />{form.formState.errors.destination ? <p className="field-error">{form.formState.errors.destination.message}</p> : null}</div>
              <div className="form-grid-two"><div className="field-group"><Label>Localidade</Label><Controller name="localityId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{cities.map((city) => <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>)}</SelectContent></Select>} /></div><div className="field-group"><Label htmlFor="delivery-address">Endereço informado</Label><Input id="delivery-address" {...form.register('address')} /></div></div>
              <div className="form-grid-two"><div className="field-group"><Label>Responsável</Label><Controller name="responsibleUserId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{references.data?.users.map((user) => <SelectItem key={user.id} value={user.id}>{user.person?.displayName ?? user.username}</SelectItem>)}</SelectContent></Select>} /></div><div className="field-group"><Label htmlFor="delivery-date">Data prevista</Label><Input id="delivery-date" type="datetime-local" {...form.register('scheduledAt')} /></div></div>
              <div className="form-grid-two"><div className="field-group"><Label>Material</Label><Controller name="materialId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{references.data?.materials.map((material) => <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>)}</SelectContent></Select>} /></div><div className="field-group"><Label htmlFor="delivery-quantity">Quantidade</Label><Input id="delivery-quantity" type="number" min="0" step="1" {...form.register('quantity')} /></div></div>
              <div className="field-group"><Label htmlFor="delivery-notes">Observações</Label><Textarea id="delivery-notes" rows={3} {...form.register('notes')} /></div>
              {createMutation.isError ? <p className="field-error">{apiErrorMessage(createMutation.error)}</p> : null}
              <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvando...' : 'Salvar entrega'}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <section className="scope-banner"><Path size={25} weight="duotone" aria-hidden /><div><strong>Sem cálculo de rotas</strong><p>O módulo registra a operação aprovada. Nenhuma rota ou saldo de estoque é calculado nesta versão.</p></div><Badge variant="outline">DP-013</Badge></section>

      {deliveries.isLoading ? <LoadingState rows={5} /> : deliveries.isError ? <ErrorState message={apiErrorMessage(deliveries.error)} retry={() => deliveries.refetch()} /> : !deliveries.data?.length ? <EmptyState title="Nenhuma entrega registrada" description="Crie uma solicitação para acompanhar destino, responsável e situação." /> : (
        <section className="delivery-list" aria-label="Entregas">
          {deliveries.data.map((delivery) => <article key={delivery.id}><div className="delivery-icon"><Package size={26} weight="duotone" aria-hidden /></div><div className="delivery-main"><div><h3>{delivery.destination}</h3><Badge variant="secondary">{statusLabel[delivery.status]}</Badge></div><p className={delivery.address ? '' : 'missing-info'}>{delivery.address ? <MapPin size={17} aria-hidden /> : <WarningCircle size={17} aria-hidden />}{delivery.address || 'Endereço não informado'}</p><span>{delivery.locality?.name ?? 'Localidade não informada'}{delivery.scheduledAt ? `, ${new Intl.DateTimeFormat('pt-BR').format(new Date(delivery.scheduledAt))}` : ''}</span>{delivery.items.length ? <div className="delivery-items">{delivery.items.map((item) => <Badge variant="outline" key={item.material.name}>{item.material.name}: {item.quantity} {item.material.unit}</Badge>)}</div> : null}</div></article>)}
        </section>
      )}
    </div>
  )
}
