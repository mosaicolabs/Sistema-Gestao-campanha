import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { LocalityManifest } from '@campanha/types'
import { createLocalityNormalizationService, type NormalizationReport } from '../services/locality-normalization.service.js'

export type NormalizeCommand = {
  batchId: string
  manifestPath: string
  dryRun: boolean
}

export type NormalizeCommandResult = NormalizationReport & {
  dryRun: boolean
}

type NormalizationRunner = Pick<ReturnType<typeof createLocalityNormalizationService>, 'normalizeBatch'>

function readManifest(manifestPath: string) {
  return JSON.parse(readFileSync(resolve(manifestPath), 'utf8')) as LocalityManifest
}

export async function runNormalizeCommand(input: NormalizeCommand, runner?: NormalizationRunner): Promise<NormalizeCommandResult> {
  const manifest = readManifest(input.manifestPath)
  const service = runner ?? createLocalityNormalizationService({ manifest })
  const report = await service.normalizeBatch(input.batchId, { dryRun: input.dryRun })
  return { ...report, dryRun: input.dryRun }
}

function parseArgs(args: string[]): NormalizeCommand {
  let batchId = ''
  let manifestPath = 'packages/database/prisma/data/campanha-ea-2026-locality-manifest.json'
  let dryRun = true

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--batch-id') batchId = args[++index] ?? ''
    else if (arg === '--manifest') manifestPath = args[++index] ?? ''
    else if (arg === '--apply') dryRun = false
    else if (arg === '--dry-run') dryRun = true
    else if (arg === '--help') {
      console.log('Uso: npm run normalize:localities -w @campanha/api -- --batch-id <id> [--manifest <arquivo>] [--dry-run|--apply]')
      process.exit(0)
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`)
    }
  }
  if (!batchId) throw new Error('Informe --batch-id.')
  if (!manifestPath) throw new Error('Informe um caminho em --manifest.')
  return { batchId, manifestPath, dryRun }
}

if (process.argv[1]?.endsWith('normalize-localities.ts') || process.argv[1]?.endsWith('normalize-localities.js')) {
  runNormalizeCommand(parseArgs(process.argv.slice(2)))
    .then((result) => {
      console.log(JSON.stringify({
        ...result,
        note: 'A normalização não altera as 148 duplicidades, os índices 672/591 ou as contagens históricas 681/739.',
      }, null, 2))
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    })
}
