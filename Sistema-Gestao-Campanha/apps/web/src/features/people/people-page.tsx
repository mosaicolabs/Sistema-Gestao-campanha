import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Funnel, MagnifyingGlass, Plus, UserCircle, Warning } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { IMaskInput } from 'react-imask'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Paginated } from '@campanha/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { api, apiErrorMessage } from '@/lib/api'
import type { Person, ReferenceData } from '@/lib/types'

const personFormSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe o nome').max(160),
    phone: z.string().trim().optional(),
    businessRoleId: z.string().optional(),
    localityId: z.string().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Boolean(value.businessRoleId) === Boolean(value.localityId), {
    message: 'Selecione o papel e a localidade juntos',
    path: ['localityId'],
  })

type PersonForm = z.infer<typeof personFormSchema>
const columnHelper = createColumnHelper<Person>()

function roleNames(person: Person) {
  return [...new Set(person.assignments.map((assignment) => assignment.businessRole.name))].join(', ') || 'Papel não informado'
}

function localityNames(person: Person) {
  return [...new Set(person.assignments.map((assignment) => assignment.locality.name))].join(', ') || 'Localidade não informada'
}

export function PeoplePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleId, setRoleId] = useState('all')
  const [localityId, setLocalityId] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const references = useQuery({ queryKey: ['references'], queryFn: async () => (await api.get<ReferenceData>('/references')).data })
  const people = useQuery({
    queryKey: ['people', search, roleId, localityId, page],
    queryFn: async () =>
      (
        await api.get<Paginated<Person>>('/people', {
          params: { search: search || undefined, roleId: roleId === 'all' ? undefined : roleId, localityId: localityId === 'all' ? undefined : localityId, page, pageSize: 20 },
        })
      ).data,
  })

  const form = useForm<PersonForm>({ resolver: zodResolver(personFormSchema), defaultValues: { displayName: '', phone: '', businessRoleId: '', localityId: '', notes: '' } })
  const createMutation = useMutation({
    mutationFn: async (values: PersonForm) =>
      (
        await api.post('/people', {
          displayName: values.displayName,
          notes: values.notes || undefined,
          contacts: values.phone ? [{ type: 'WHATSAPP', value: values.phone, isPrimary: true }] : [],
          assignments: values.businessRoleId && values.localityId ? [{ businessRoleId: values.businessRoleId, localityId: values.localityId }] : [],
          alliances: [],
        })
      ).data as { warning?: string },
    onSuccess: (result) => {
      toast.success('Pessoa cadastrada sem duplicar vínculos.')
      if (result.warning) toast.warning(result.warning)
      setDialogOpen(false)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('displayName', { header: 'Pessoa', cell: (info) => <strong>{info.getValue()}</strong> }),
      columnHelper.display({ id: 'roles', header: 'Papel', cell: ({ row }) => roleNames(row.original) }),
      columnHelper.display({ id: 'localities', header: 'Localidade', cell: ({ row }) => localityNames(row.original) }),
      columnHelper.display({ id: 'contact', header: 'Contato', cell: ({ row }) => row.original.contacts[0]?.valueRaw ?? 'Não informado' }),
      columnHelper.display({ id: 'status', header: 'Situação', cell: ({ row }) => <Badge variant={row.original.assignments.length ? 'secondary' : 'outline'}>{row.original.assignments.length ? 'Contextualizado' : 'Incompleto'}</Badge> }),
    ],
    [],
  )
  const table = useReactTable({ data: people.data?.data ?? [], columns, getCoreRowModel: getCoreRowModel() })
  const cities = references.data?.localities.filter((locality) => locality.type === 'CITY') ?? []

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>Cadastro único de pessoas</h2><p>Nome, contato, papel e localidade ficam relacionados sem repetir a pessoa nas visões de território e dobrada.</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus size={19} aria-hidden />Nova pessoa</Button></DialogTrigger>
          <DialogContent className="form-dialog">
            <DialogHeader><DialogTitle>Cadastrar pessoa</DialogTitle><DialogDescription>Coincidências geram aviso de revisão. O sistema não funde cadastros automaticamente.</DialogDescription></DialogHeader>
            <form className="form-stack" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="field-group"><Label htmlFor="person-name">Nome</Label><Input id="person-name" {...form.register('displayName')} />{form.formState.errors.displayName ? <p className="field-error">{form.formState.errors.displayName.message}</p> : null}</div>
              <div className="field-group"><Label htmlFor="person-phone">WhatsApp ou telefone</Label><Controller name="phone" control={form.control} render={({ field }) => <IMaskInput id="person-phone" className="masked-input" mask="(00) 00000-0000" value={field.value} onAccept={(value) => field.onChange(value)} onBlur={field.onBlur} inputMode="tel" />} /><p className="field-help">Opcional. O valor original e o normalizado são preservados.</p></div>
              <div className="form-grid-two">
                <div className="field-group"><Label>Papel de atuação</Label><Controller name="businessRoleId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{references.data?.businessRoles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent></Select>} /></div>
                <div className="field-group"><Label>Localidade</Label><Controller name="localityId" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{cities.map((city) => <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>)}</SelectContent></Select>} />{form.formState.errors.localityId ? <p className="field-error">{form.formState.errors.localityId.message}</p> : null}</div>
              </div>
              <div className="field-group"><Label htmlFor="person-notes">Observações</Label><Textarea id="person-notes" rows={3} {...form.register('notes')} /></div>
              {createMutation.isError ? <p className="field-error" role="alert">{apiErrorMessage(createMutation.error)}</p> : null}
              <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvando...' : 'Salvar pessoa'}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <section className="filter-bar" aria-label="Filtros de pessoas">
        <div className="search-field"><MagnifyingGlass size={19} aria-hidden /><Input aria-label="Buscar por nome ou contato" placeholder="Buscar pessoa ou contato" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
        <Select value={roleId} onValueChange={(value) => { setRoleId(value); setPage(1) }}><SelectTrigger aria-label="Filtrar por papel"><Funnel size={18} aria-hidden /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os papéis</SelectItem>{references.data?.businessRoles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent></Select>
        <Select value={localityId} onValueChange={(value) => { setLocalityId(value); setPage(1) }}><SelectTrigger aria-label="Filtrar por cidade"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as cidades</SelectItem>{cities.map((city) => <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>)}</SelectContent></Select>
      </section>

      {people.isLoading ? <LoadingState rows={5} /> : people.isError ? <ErrorState message={apiErrorMessage(people.error)} retry={() => people.refetch()} /> : !people.data?.data.length ? <EmptyState title="Nenhuma pessoa encontrada" description="Ajuste os filtros ou cadastre a primeira pessoa da base consolidada." /> : (
        <>
          <div className="desktop-table-wrap">
            <Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table>
          </div>
          <div className="mobile-entity-list">
            {people.data.data.map((person) => <article key={person.id} className="entity-card"><div className="entity-card-icon"><UserCircle size={26} weight="duotone" aria-hidden /></div><div><strong>{person.displayName}</strong><p>{roleNames(person)}</p><span>{localityNames(person)}</span></div>{person.assignments.length ? null : <Warning className="warning-icon" size={21} aria-label="Cadastro incompleto" />}</article>)}
          </div>
          <div className="pagination-bar"><span>{people.data.pagination.total} cadastros</span><div><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span>{page} de {Math.max(people.data.pagination.pageCount, 1)}</span><Button variant="outline" size="sm" disabled={page >= people.data.pagination.pageCount} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></div>
        </>
      )}
    </div>
  )
}
