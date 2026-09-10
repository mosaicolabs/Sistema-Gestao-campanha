import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, CalendarBlank, Plus } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'
import { createTaskSchema, type CreateTaskInput } from '@campanha/validation'
import type { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/page-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api, apiErrorMessage } from '@/lib/api'
import type { Board } from '@/lib/types'

const priorityLabel = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' }
type TaskFormInput = z.input<typeof createTaskSchema>

export function KanbanPage() {
  const reduceMotion = useReducedMotion()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const boards = useQuery({ queryKey: ['boards'], queryFn: async () => (await api.get<Board[]>('/boards')).data })
  const board = boards.data?.[0]
  const form = useForm<TaskFormInput>({
    resolver: zodResolver(createTaskSchema),
    values: {
      boardId: board?.id ?? '',
      columnId: board?.columns[0]?.id ?? '',
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeIds: [],
    },
  })
  const createMutation = useMutation({
    mutationFn: async (values: CreateTaskInput) => (await api.post('/tasks', values)).data,
    onSuccess: () => {
      toast.success('Tarefa criada.')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  const moveMutation = useMutation({
    mutationFn: async ({ id, columnId }: { id: string; columnId: string }) => (await api.patch(`/tasks/${id}/move`, { columnId, position: 0 })).data,
    onMutate: async ({ id, columnId }) => {
      await queryClient.cancelQueries({ queryKey: ['boards'] })
      const previous = queryClient.getQueryData<Board[]>(['boards'])
      if (previous) {
        queryClient.setQueryData<Board[]>(['boards'], previous.map((item) => ({ ...item, columns: item.columns.map((column) => ({ ...column, tasks: column.tasks.filter((task) => task.id !== id).concat(previous.flatMap((b) => b.columns.flatMap((c) => c.tasks)).filter((task) => task.id === id && column.id === columnId).map((task) => ({ ...task, columnId }))) })) })))
      }
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['boards'], context.previous)
      toast.error(apiErrorMessage(error))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (boards.isLoading) return <LoadingState rows={4} />
  if (boards.isError) return <ErrorState message={apiErrorMessage(boards.error)} retry={() => boards.refetch()} />
  if (!board) return <EmptyState title="Quadro não configurado" description="Crie o quadro inicial durante a preparação do ambiente." />

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><h2>{board.name}</h2><p>As colunas iniciais seguem a proposta do diagnóstico e podem mudar depois da validação do gestor.</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus size={19} aria-hidden />Nova tarefa</Button></DialogTrigger>
          <DialogContent className="form-dialog"><DialogHeader><DialogTitle>Criar tarefa</DialogTitle><DialogDescription>Registre uma pendência e mova o cartão conforme o trabalho avançar.</DialogDescription></DialogHeader>
            <form className="form-stack" onSubmit={form.handleSubmit((values) => createMutation.mutate(createTaskSchema.parse(values)))}>
              <input type="hidden" {...form.register('boardId')} /><input type="hidden" {...form.register('columnId')} />
              <div className="field-group"><Label htmlFor="task-title">Título</Label><Input id="task-title" {...form.register('title')} />{form.formState.errors.title ? <p className="field-error">{form.formState.errors.title.message}</p> : null}</div>
              <div className="field-group"><Label htmlFor="task-description">Descrição</Label><Textarea id="task-description" rows={3} {...form.register('description')} /></div>
              <div className="field-group"><Label>Prioridade</Label><Controller name="priority" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>} /></div>
              {createMutation.isError ? <p className="field-error">{apiErrorMessage(createMutation.error)}</p> : null}
              <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button disabled={createMutation.isPending}>{createMutation.isPending ? 'Criando...' : 'Criar tarefa'}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <div className="kanban-board" aria-label={`Quadro ${board.name}`}>
        {board.columns.map((column, columnIndex) => (
          <section key={column.id} className="kanban-column" aria-labelledby={`column-${column.id}`}>
            <header><div><h3 id={`column-${column.id}`}>{column.name}</h3><span>{column.tasks.length}</span></div><span className={`column-line column-${columnIndex}`} /></header>
            <div className="kanban-cards">
              <AnimatePresence initial={false}>
                {column.tasks.map((task) => (
                  <motion.article
                    layout
                    key={task.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    className="task-card"
                  >
                    <div className="task-card-top"><Badge className={`priority-${task.priority.toLowerCase()}`} variant="outline">{priorityLabel[task.priority]}</Badge></div>
                    <h4>{task.title}</h4>
                    {task.description ? <p>{task.description}</p> : null}
                    {task.dueAt ? <span className="task-date"><CalendarBlank size={16} aria-hidden />{new Intl.DateTimeFormat('pt-BR').format(new Date(task.dueAt))}</span> : null}
                    <footer>
                      <Button variant="ghost" size="icon" disabled={columnIndex === 0 || moveMutation.isPending} onClick={() => moveMutation.mutate({ id: task.id, columnId: board.columns[columnIndex - 1]!.id })} aria-label="Mover para a coluna anterior"><ArrowLeft size={18} aria-hidden /></Button>
                      <span>{task.assignees[0]?.user.person?.displayName ?? task.assignees[0]?.user.username ?? 'Sem responsável'}</span>
                      <Button variant="ghost" size="icon" disabled={columnIndex === board.columns.length - 1 || moveMutation.isPending} onClick={() => moveMutation.mutate({ id: task.id, columnId: board.columns[columnIndex + 1]!.id })} aria-label="Mover para a próxima coluna"><ArrowRight size={18} aria-hidden /></Button>
                    </footer>
                  </motion.article>
                ))}
              </AnimatePresence>
              {!column.tasks.length ? <div className="kanban-empty">Nenhuma tarefa nesta coluna.</div> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
