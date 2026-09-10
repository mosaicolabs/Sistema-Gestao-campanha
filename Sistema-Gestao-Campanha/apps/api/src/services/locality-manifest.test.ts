import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LocalityManifest } from '@campanha/types'

const manifestPath = fileURLToPath(new URL('../../../../packages/database/prisma/data/campanha-ea-2026-locality-manifest.json', import.meta.url))

function loadManifest(): LocalityManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as LocalityManifest
}

describe('manifesto de localidades', () => {
  it('preserva as variações e marca candidatos para revisão', () => {
    const manifest = loadManifest()

    expect(manifest.sourceSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(manifest.entries.length).toBe(47)
    expect(manifest.entries.every((entry) => entry.canonicalKey === entry.canonicalKey.trim().toUpperCase())).toBe(true)
    expect(manifest.manualCandidates).toHaveLength(6)
    expect(manifest.manualCandidates.every((candidate) => candidate.reviewRequired)).toBe(true)
    expect(manifest.manualCandidates.flatMap((candidate) => [candidate.rawValue, candidate.candidateDisplayName])).toContain('PATY DO ALVERES')
  })
})
