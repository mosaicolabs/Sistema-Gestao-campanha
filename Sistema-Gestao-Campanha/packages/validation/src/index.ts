import { z } from 'zod'

const entityId = z.string().trim().min(1).max(80)

const password = z
  .string()
  .min(10, 'Use pelo menos 10 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[a-z]/, 'Inclua uma letra minúscula')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
  .regex(/[0-9]/, 'Inclua um número')

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(1),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    password,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: 'As senhas precisam ser iguais',
    path: ['passwordConfirmation'],
  })

export const createUserSchema = z
  .object({
    username: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou sublinhado'),
    password,
    passwordConfirmation: z.string(),
    personId: entityId.optional(),
    accessRoleId: entityId,
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: 'As senhas precisam ser iguais',
    path: ['passwordConfirmation'],
  })

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
})

export const createPersonSchema = z.object({
  displayName: z.string().trim().min(2).max(160),
  notes: z.string().trim().max(2000).optional(),
  contacts: z
    .array(
      z.object({
        type: z.enum(['PHONE', 'WHATSAPP', 'EMAIL', 'OTHER']),
        value: z.string().trim().min(3).max(180),
        isPrimary: z.boolean().default(false),
      }),
    )
    .default([]),
  assignments: z
    .array(
      z.object({
        businessRoleId: entityId,
        localityId: entityId,
      }),
    )
    .default([]),
  alliances: z
    .array(
      z.object({
        allianceId: entityId,
        localityId: entityId.optional(),
      }),
    )
    .default([]),
})

export const peopleQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  localityId: entityId.optional(),
  roleId: entityId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const coverageMacroQuerySchema = z.object({
  regionId: entityId.optional(),
})

export const coverageTreeQuerySchema = z.object({
  stateId: entityId.optional(),
})

export const coverageCityParamSchema = z.object({
  cityId: entityId,
})

export const coverageAllianceParamSchema = z.object({
  allianceId: entityId,
})

export const createTaskSchema = z.object({
  boardId: entityId,
  columnId: entityId,
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(3000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueAt: z.iso.datetime().optional(),
  assigneeIds: z.array(entityId).default([]),
})

export const moveTaskSchema = z.object({
  columnId: entityId,
  position: z.number().int().min(0).default(0),
})

export const createEventSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(3000).optional(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    timezone: z.string().default('America/Sao_Paulo'),
    localityId: entityId.optional(),
    address: z.string().trim().max(500).optional(),
    visibility: z.enum(['PRIVATE', 'TEAM']).default('TEAM'),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: 'O término deve ser posterior ao início',
    path: ['endsAt'],
  })

export const updateEventSchema = createEventSchema.and(
  z.object({
    version: z.number().int().min(1),
    status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
  }),
)

export const createDeliverySchema = z.object({
  destination: z.string().trim().min(2).max(200),
  origin: z.string().trim().max(200).optional(),
  localityId: entityId.optional(),
  address: z.string().trim().max(500).optional(),
  responsibleUserId: entityId.optional(),
  scheduledAt: z.iso.datetime().optional(),
  notes: z.string().trim().max(3000).optional(),
  items: z
    .array(
      z.object({
        materialId: entityId,
        quantity: z.coerce.number().positive(),
      }),
    )
    .default([]),
})

export const reconciliationDecisionSchema = z.object({
  decision: z.enum(['KEEP', 'REJECT', 'MERGE', 'SPLIT', 'CORRECT']),
  reason: z.string().trim().min(10).max(2000),
  targetEntityType: z.string().trim().max(80).optional(),
  targetEntityId: z.string().trim().max(80).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreatePersonInput = z.infer<typeof createPersonSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>
