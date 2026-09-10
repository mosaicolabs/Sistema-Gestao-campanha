import { describe, expect, it } from 'vitest'
import { coverageAllianceParamSchema, coverageCityParamSchema, coverageTreeQuerySchema } from '@campanha/validation'
import type { CoverageAllianceDetail, CoverageCityDetail, CoverageTreeRegion } from '@campanha/types'
import { toCoverageAllianceDetail, toCoverageCityDetail, toCoverageTreeRegion } from './coverage.repository.js'

describe('coverage macro contracts', () => {
  it('representa uma árvore de regiões e cidades', () => {
    const tree: CoverageTreeRegion[] = [
      {
        id: 'region-1',
        name: 'Centro Sul',
        cities: [{ id: 'city-1', name: 'Paty do Alferes', regionId: 'region-1', canonicalKey: 'PATY DO ALFERES', articulatorCityRelations: 2, peopleCount: 3, pendingAliasCount: 0 }],
      },
    ]

    expect(tree[0]?.cities[0]).toMatchObject({ name: 'Paty do Alferes', articulatorCityRelations: 2 })
  })

  it('representa o detalhe de cidade com papéis, contatos e dobradas', () => {
    const detail: CoverageCityDetail = {
      city: { id: 'city-1', name: 'Paty do Alferes', canonicalKey: 'PATY DO ALFERES' },
      region: { id: 'region-1', name: 'Centro Sul' },
      summary: { articulators: 1, coordinators: 1, leaderships: 1, articulatorCityRelations: 1 },
      rows: [{
        assignmentId: 'assignment-1',
        personId: 'person-1',
        roleCode: 'LEADERSHIP',
        roleName: 'Liderança',
        displayName: 'Pessoa de teste',
        contacts: [{ id: 'contact-1', type: 'PHONE', valueRaw: 'fixture-contact', isPrimary: true }],
        alliances: [{ id: 'alliance-1', name: 'Dobrador de teste', status: 'ACTIVE', localityId: 'city-1' }],
      }],
      observedVariants: ['PATY DO ALFERES'],
    }

    expect(detail.rows[0]?.alliances[0]).toMatchObject({ name: 'Dobrador de teste', localityId: 'city-1' })
  })

  it('representa o detalhe por dobrador', () => {
    const detail: CoverageAllianceDetail = {
      alliance: { id: 'alliance-1', name: 'Dobrador de teste' },
      rows: [{ city: { id: 'city-1', name: 'Paty do Alferes', region: 'Centro Sul' }, people: [] }],
    }

    expect(detail.rows).toHaveLength(1)
  })

  it('valida filtros e parâmetros da API', () => {
    expect(coverageTreeQuerySchema.parse({ stateId: 'state-1' })).toEqual({ stateId: 'state-1' })
    expect(coverageTreeQuerySchema.parse({})).toEqual({})
    expect(coverageCityParamSchema.safeParse({ cityId: '' }).success).toBe(false)
    expect(coverageAllianceParamSchema.safeParse({ allianceId: 'alliance-1' }).success).toBe(true)
  })

  it('agrupa a árvore e o detalhe sem duplicar pessoa ou cidade', () => {
    const region = toCoverageTreeRegion({
      id: 'region-1',
      name: 'Centro Sul',
      children: [{
        id: 'city-1',
        name: 'Paty do Alferes',
        canonicalName: 'PATY DO ALFERES',
        parent: { name: 'Centro Sul' },
        aliases: [{ value: 'PATY DO ALFERES', status: 'ACTIVE' }],
        assignments: [
          { id: 'assignment-1', personId: 'person-1', status: 'ACTIVE', businessRole: { code: 'ARTICULATOR' } },
          { id: 'assignment-2', personId: 'person-1', status: 'ACTIVE', businessRole: { code: 'ARTICULATOR' } },
        ],
        alliances: [],
      }],
    })
    const detail = toCoverageCityDetail({
      id: 'city-1',
      name: 'Paty do Alferes',
      canonicalName: 'PATY DO ALFERES',
      parentId: 'region-1',
      parent: { name: 'Centro Sul' },
      aliases: [],
      assignments: [{
        id: 'assignment-1',
        personId: 'person-1',
        status: 'ACTIVE',
        businessRole: { code: 'ARTICULATOR', name: 'Articulador' },
        person: {
          id: 'person-1',
          displayName: 'Pessoa de teste',
          contacts: [],
          alliances: [],
        },
      }],
      alliances: [],
    })
    const alliance = toCoverageAllianceDetail({ id: 'alliance-1', name: 'Dobrador de teste' }, [
      { id: 'city-1', name: 'Paty do Alferes', region: 'Centro Sul', people: [] },
      { id: 'city-1', name: 'Paty do Alferes', region: 'Centro Sul', people: [] },
    ])

    expect(region.cities[0]).toMatchObject({ regionId: 'region-1', articulatorCityRelations: 1, peopleCount: 1 })
    expect(detail.summary).toMatchObject({ articulators: 1, articulatorCityRelations: 1 })
    expect(detail.rows).toHaveLength(1)
    expect(alliance.rows).toHaveLength(1)
  })
})
