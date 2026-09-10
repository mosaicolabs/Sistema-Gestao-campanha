import { describe, expect, it } from 'vitest'
import { toMacroCoverageRow } from './coverage.repository.js'

describe('coverageRepository macro aggregation', () => {
  it('deduplica relações por pessoa e mantém aliases pendentes como metadado', () => {
    const row = toMacroCoverageRow({
      id: 'city-paty',
      name: 'Paty do Alferes',
      canonicalName: 'PATY DO ALFERES',
      parent: { name: 'Centro Sul' },
      aliases: [
        { value: 'PATY DO ALFERES', status: 'ACTIVE' },
        { value: 'PATY DO ALVERES', status: 'PENDING_REVIEW' },
        { value: 'PATY DO ALVERES', status: 'PENDING_REVIEW' },
      ],
      assignments: [
        { id: 'assignment-1', personId: 'person-1', status: 'ACTIVE', businessRole: { code: 'ARTICULATOR' } },
        { id: 'assignment-2', personId: 'person-1', status: 'ACTIVE', businessRole: { code: 'ARTICULATOR' } },
        { id: 'assignment-3', personId: 'person-2', status: 'ACTIVE', businessRole: { code: 'LEADERSHIP' } },
      ],
      alliances: [
        { id: 'alliance-1', personId: 'person-1', status: 'ACTIVE' },
        { id: 'alliance-1', personId: 'person-1', status: 'ACTIVE' },
      ],
    })

    expect(row).toMatchObject({
      id: 'city-paty',
      articulatorCityRelations: 1,
      uniqueArticulators: 1,
      uniqueAssignments: 3,
      uniqueAlliances: 1,
      pendingAliasCount: 2,
      observedVariants: ['PATY DO ALFERES', 'PATY DO ALVERES'],
    })
  })
})
