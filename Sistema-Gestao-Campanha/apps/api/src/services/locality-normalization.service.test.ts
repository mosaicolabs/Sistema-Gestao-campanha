import { describe, expect, it } from 'vitest'
import type { LocalityManifest } from '@campanha/types'
import type { LocalityRepository } from '../repositories/locality.repository.js'
import { createLocalityNormalizationService } from './locality-normalization.service.js'

const manifest: LocalityManifest = {
  sourceReport: 'Campanha_EA_2026_articuladores_por_cidade.md',
  sourceSection: 'Chave normalizada | Variações encontradas',
  sourceSha256: 'a'.repeat(64),
  entries: [
    {
      sourceLine: 280,
      canonicalDisplayName: 'Paty do Alferes',
      canonicalKey: 'PATY DO ALFERES',
      observedValues: ['Paty do Alferes', 'PATY DO ALFERES'],
    },
  ],
  manualCandidates: [
    {
      sourceLine: 344,
      rawValue: 'Paty do Alferes',
      normalizedKey: 'PATY DO ALFERES',
      candidateDisplayName: 'PATY DO ALVERES',
      similarity: 0.933,
      reviewRequired: true,
    },
  ],
}

function repositoryFixture() {
  const city = { id: 'city-paty', name: 'Paty do Alferes', canonicalName: 'PATY DO ALFERES', type: 'CITY' as const, parentId: null }
  const issues: any[] = []
  const aliases: any[] = []
  const sources: any[] = []
  let aliasSequence = 0
  let issueSequence = 0
  const occurrences = [
    {
      id: 'occ-safe',
      sheetName: 'Paty do Alferes',
      rowNumber: 4,
      category: 'TERRITORIAL',
      rawValues: { cells: ['Paty   do   Alferes'] },
      normalizedValues: { cells: ['PATY DO ALFERES'] },
      rowHash: 'b'.repeat(64),
    },
    {
      id: 'occ-manual',
      sheetName: 'Paty do Alferes',
      rowNumber: 5,
      category: 'TERRITORIAL',
      rawValues: { cells: ['PATY DO ALVERES'] },
      normalizedValues: { cells: ['PATY DO ALVERES'] },
      rowHash: 'c'.repeat(64),
    },
  ]

  const fake = {
    listCities: async () => [city],
    listActiveAliases: async () => aliases.filter((item) => item.status === 'ACTIVE'),
    listOccurrences: async () => occurrences,
    listOpenLocalityIssues: async () => issues.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING'),
    getIssue: async (id: string) => issues.find((item) => item.id === id) ?? null,
    getCity: async (id: string) => (id === city.id ? city : null),
    createAlias: async (data: any) => {
      const existing = aliases.find((item) => item.localityId === data.localityId && item.valueNormalized === data.valueNormalized)
      if (existing) return { ...existing, created: false }
      const alias = { id: `alias-${++aliasSequence}`, ...data, created: true }
      aliases.push(alias)
      return alias
    },
    createIssue: async (data: any) => {
      const issue = { id: `issue-${++issueSequence}`, status: 'OPEN', type: 'LOCALITY_ALIAS', occurrence: null, ...data }
      issues.push(issue)
      return issue
    },
    createEntitySource: async (data: any) => {
      const existing = sources.find((item) => item.entityType === data.entityType && item.entityId === data.entityId && item.occurrenceId === data.occurrenceId)
      if (existing) return { ...existing, created: false }
      sources.push(data)
      return { ...data, created: true }
    },
    createDecision: async (data: any) => data,
    updateIssue: async (id: string, status: string) => {
      const issue = issues.find((item) => item.id === id)
      if (issue) issue.status = status
      return issue
    },
    recordAudit: async () => undefined,
    transaction: async (callback: (repository: LocalityRepository) => Promise<unknown>) => callback(fake as unknown as LocalityRepository),
  }
  return { fake: fake as unknown as LocalityRepository, aliases, issues, sources, city }
}

describe('localityNormalizationService', () => {
  it('distingue canonical, alias seguro e aproximação pendente', async () => {
    const { fake } = repositoryFixture()
    const service = createLocalityNormalizationService({ repository: fake, manifest })

    await expect(service.resolveName('Paty do Alferes', 'CITY')).resolves.toMatchObject({ classification: 'CANONICAL', localityId: 'city-paty' })
    await expect(service.resolveName('PATY DO ALFERES', 'CITY')).resolves.toMatchObject({ classification: 'SAFE_ALIAS', localityId: 'city-paty' })
    await expect(service.resolveName('Paty   do   Alferes', 'CITY')).resolves.toMatchObject({ classification: 'SAFE_ALIAS', localityId: 'city-paty' })
    await expect(service.resolveName('PATY DO ALVERES', 'CITY')).resolves.toMatchObject({ classification: 'SAFE_ALIAS', localityId: 'city-paty', candidateLocalityIds: ['city-paty'] })
  })

  it('mantém a ocorrência bruta, cria pendência e é idempotente', async () => {
    const { fake, aliases, issues, sources } = repositoryFixture()
    const service = createLocalityNormalizationService({ repository: fake, manifest })

    const first = await service.normalizeBatch('batch-1')
    const second = await service.normalizeBatch('batch-1')

    expect(first).toMatchObject({ scannedOccurrences: 2, canonicalMatches: 0, safeAliases: 2, manualCandidates: 0, unmatched: 0 })
    expect(first.writes).toEqual({ aliases: 2, issues: 0, assignments: 2 })
    expect(second.writes).toEqual({ aliases: 0, issues: 0, assignments: 0 })
    expect(aliases).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'Paty   do   Alferes', valueNormalized: 'PATY DO ALFERES', status: 'ACTIVE' }),
      expect.objectContaining({ value: 'PATY DO ALVERES', valueNormalized: 'PATY DO ALVERES', status: 'ACTIVE' }),
    ]))
    expect(issues).toHaveLength(0)
    expect(sources[0]).toMatchObject({ entityType: 'LocalityAlias', occurrenceId: 'occ-safe' })
  })

  it('não permite corrigir pendência sem cidade alvo', async () => {
    const { fake, issues } = repositoryFixture()
    const service = createLocalityNormalizationService({ repository: fake, manifest })
    const issue = {
      id: 'issue-manual',
      status: 'OPEN',
      type: 'LOCALITY_ALIAS',
      details: { rawValue: 'Cidade não catalogada', normalizedKey: 'CIDADE NAO CATALOGADA' },
    }
    issues.push(issue)

    await expect(service.applyAliasDecision({ issueId: issue.id, userId: 'user-1', decision: 'CORRECT', reason: 'Confirmar grafia da cidade' })).rejects.toMatchObject({ code: 'TARGET_LOCALITY_REQUIRED' })
  })
})
