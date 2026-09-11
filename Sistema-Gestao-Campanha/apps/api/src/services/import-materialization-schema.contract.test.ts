import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const schema = readFileSync(
  new URL('../../../../packages/database/prisma/schema.prisma', import.meta.url),
  'utf8',
)
const migration = readFileSync(
  new URL(
    '../../../../packages/database/prisma/migrations/20260910_import_materialization/migration.sql',
    import.meta.url,
  ),
  'utf8',
)
const seed = readFileSync(
  new URL('../../../../packages/database/prisma/seed.ts', import.meta.url),
  'utf8',
)

describe('import materialization schema contract', () => {
  it('separa revisão lógica, artefato binário e estado de materialização', () => {
    expect(schema).toMatch(/enum MaterializationStatus\s*{[\s\S]*NOT_STARTED[\s\S]*COMPLETED[\s\S]*FAILED[\s\S]*}/)
    expect(schema).toMatch(/model ImportBatch\s*{[\s\S]*semanticHash\s+String\?[\s\S]*parserVersion\s+String\?[\s\S]*materializationStatus\s+MaterializationStatus/)
    expect(schema).toMatch(/model ImportArtifact\s*{[\s\S]*importBatchId\s+String[\s\S]*fileHash\s+String\s+@unique/)
  })

  it('preserva controles manuais com origem e contagem observada separadas', () => {
    expect(schema).toMatch(/enum IndexControlScope\s*{[\s\S]*TERRITORIAL_TOTAL[\s\S]*REGION[\s\S]*CITY[\s\S]*ALLIANCE_TOTAL[\s\S]*ALLIANCE[\s\S]*}/)
    expect(schema).toMatch(/model ImportIndexControl\s*{[\s\S]*sourceSheet\s+String[\s\S]*sourceCell\s+String[\s\S]*manualCount\s+Int[\s\S]*observedCount\s+Int\?[\s\S]*difference\s+Int\?/)
  })

  it('distingue o significado e a identidade idempotente dos vínculos com dobradores', () => {
    expect(schema).toMatch(/enum AllianceRelationType\s*{[\s\S]*SUPPORTS[\s\S]*ARTICULATES_FOR[\s\S]*COORDINATES_FOR[\s\S]*}/)
    expect(schema).toMatch(/model PersonAlliance\s*{[\s\S]*relationType\s+AllianceRelationType[\s\S]*relationKey\s+String\s+@unique/)
  })

  it('faz backfill aditivo dos lotes e vínculos legados', () => {
    expect(migration).toContain('DEFAULT \'NOT_STARTED\'')
    expect(migration).toMatch(/INSERT INTO "ImportArtifact"[\s\S]*SELECT[\s\S]*"fileHash"[\s\S]*FROM "ImportBatch"/)
    expect(migration).toMatch(/UPDATE "PersonAlliance"[\s\S]*SET "relationKey"/)
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)/i)
  })

  it('mantém o lote diagnóstico enriquecível e explicita a ausência de ocorrências', () => {
    expect(seed).toContain("semanticHash: 'd83aa3b24bf2bef09166f632f7463950a1ce6749f6b0c5cf724e9f30f568b5e1'")
    expect(seed).toContain("parserVersion: 'campaign-v2'")
    expect(seed).toContain("materializationStatus: 'NOT_STARTED'")
    expect(seed).toContain('Ocorrências de origem ainda não persistidas')
  })
})
