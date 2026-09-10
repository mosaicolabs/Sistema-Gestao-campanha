import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runNormalizeCommand } from './normalize-localities.js'

const manifestPath = resolve('packages/database/prisma/data/campanha-ea-2026-locality-manifest.json')

describe('normalize-localities command', () => {
  it('mantém dry-run sem escritas', async () => {
    let receivedDryRun: boolean | undefined
    const result = await runNormalizeCommand(
      { batchId: 'batch-1', manifestPath, dryRun: true },
      {
        normalizeBatch: async (_batchId, options) => {
          receivedDryRun = options?.dryRun
          return {
            batchId: 'batch-1',
            manifestSha256: 'a'.repeat(64),
            scannedOccurrences: 1,
            canonicalMatches: 1,
            safeAliases: 0,
            manualCandidates: 0,
            unmatched: 0,
            openIssueIds: [],
            writes: { aliases: 0, issues: 0, assignments: 0 },
          }
        },
      },
    )

    expect(receivedDryRun).toBe(true)
    expect(result).toMatchObject({ dryRun: true, writes: { aliases: 0, issues: 0, assignments: 0 } })
  })

  it('propaga apply e a contagem de escritas', async () => {
    let receivedDryRun: boolean | undefined
    const result = await runNormalizeCommand(
      { batchId: 'batch-1', manifestPath, dryRun: false },
      {
        normalizeBatch: async (_batchId, options) => {
          receivedDryRun = options?.dryRun
          return {
            batchId: 'batch-1',
            manifestSha256: 'a'.repeat(64),
            scannedOccurrences: 1,
            canonicalMatches: 0,
            safeAliases: 1,
            manualCandidates: 0,
            unmatched: 0,
            openIssueIds: [],
            writes: { aliases: 1, issues: 0, assignments: 1 },
          }
        },
      },
    )

    expect(receivedDryRun).toBe(false)
    expect(result.writes).toEqual({ aliases: 1, issues: 0, assignments: 1 })
  })
})
