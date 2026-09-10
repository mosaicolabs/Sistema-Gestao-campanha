import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@campanha/database'

/**
 * This contract test is opt-in because it writes only short-lived fixtures to
 * the configured database. Run it against a disposable PostgreSQL database
 * with RUN_DB_TESTS=1 after applying the Prisma migration.
 */
const runDbTests = process.env.RUN_DB_TESTS === '1'

describe.skipIf(!runDbTests)('LocalityAlias schema contract', () => {
  const suffix = randomUUID()
  let localityId: string

  beforeAll(async () => {
    const locality = await prisma.locality.create({
      data: {
        name: `Fixture ${suffix}`,
        canonicalName: `FIXTURE ${suffix}`,
        type: 'CITY',
      },
    })
    localityId = locality.id
  })

  afterAll(async () => {
    if (localityId) await prisma.locality.delete({ where: { id: localityId } })
    await prisma.$disconnect()
  })

  it('preserva a grafia original e bloqueia duas chaves normalizadas iguais', async () => {
    const first = await prisma.localityAlias.create({
      data: {
        localityId,
        value: 'Paty   do Alferes',
        valueNormalized: 'PATY DO ALFERES',
        status: 'ACTIVE',
      },
    })

    expect(first.value).toBe('Paty   do Alferes')
    expect(first.valueNormalized).toBe('PATY DO ALFERES')
    expect(first.status).toBe('ACTIVE')

    await expect(
      prisma.localityAlias.create({
        data: {
          localityId,
          value: 'PATY DO ALFERES',
          valueNormalized: 'PATY DO ALFERES',
          status: 'PENDING_REVIEW',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' })

    const aliases = await prisma.localityAlias.findMany({ where: { localityId } })
    expect(aliases).toHaveLength(1)
    expect(aliases[0]?.value).toBe('Paty   do Alferes')
  })
})
