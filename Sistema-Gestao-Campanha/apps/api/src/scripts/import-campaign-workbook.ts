import { readFile } from 'node:fs/promises'
import { prisma } from '@campanha/database'
import { importMaterializationService } from '../services/import-materialization.service.js'
import { importService } from '../services/import.service.js'

type Options = {
  file?: string
  dryRun: boolean
  apply: boolean
  batchId?: string
  actorUserId?: string
  acknowledgePending: boolean
}

function parseArgs(argv: string[]): Options {
  const options: Options = { dryRun: false, apply: false, acknowledgePending: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--file') options.file = argv[++index]
    else if (argument === '--batch-id') options.batchId = argv[++index]
    else if (argument === '--actor-user-id') options.actorUserId = argv[++index]
    else if (argument === '--dry-run') options.dryRun = true
    else if (argument === '--apply') options.apply = true
    else if (argument === '--acknowledge-pending') options.acknowledgePending = true
    else if (argument === '--help' || argument === '-h') {
      console.log('Uso: npm run import:campaign -w @campanha/api -- --file caminho.xlsx --dry-run')
      console.log('     npm run import:campaign -w @campanha/api -- --batch-id ID --apply --actor-user-id USER_ID')
      process.exit(0)
    } else throw new Error(`Argumento desconhecido: ${argument}`)
  }
  if (options.dryRun && options.apply) throw new Error('Escolha apenas --dry-run ou --apply.')
  if (!options.dryRun && !options.apply && !options.batchId) throw new Error('Informe --dry-run, --apply ou --batch-id.')
  if ((options.dryRun || options.apply) && !options.file && !options.batchId) throw new Error('Informe --file ou --batch-id.')
  if (options.apply && !options.actorUserId) throw new Error('--actor-user-id é obrigatório para --apply.')
  return options
}

async function resolveActor(actorUserId?: string) {
  if (actorUserId) {
    const user = await prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true } })
    if (!user) throw new Error('Usuário responsável não encontrado.')
    return user.id
  }
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin'
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!user) throw new Error('Usuário administrador não encontrado; informe --actor-user-id.')
  return user.id
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  let batchId = options.batchId
  if (options.file) {
    const buffer = await readFile(options.file)
    const actorId = await resolveActor(options.actorUserId)
    const result = await importService.process({
      fieldname: 'file', originalname: options.file.split('/').pop() ?? 'campaign.xlsx', encoding: '7bit', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: buffer.byteLength, destination: '', filename: '', path: '', buffer,
      stream: undefined,
    } as never, actorId)
    batchId = result.batch.id
    console.log(JSON.stringify({ batchId, fileHash: result.fileHash, semanticHash: result.semanticHash, idempotent: result.idempotent }, null, 2))
  }
  if (!batchId) throw new Error('Não foi possível determinar o lote.')
  if (options.apply) {
    const actorId = await resolveActor(options.actorUserId)
    const result = await importMaterializationService.apply(batchId, actorId, { acknowledgePending: options.acknowledgePending })
    console.log(JSON.stringify({ batchId, applied: result.applied, materializedAt: result.materializedAt, sourceRows: result.sourceRows, assignments: result.assignments, alliances: result.alliances }, null, 2))
  } else {
    const result = await importMaterializationService.preview(batchId)
    console.log(JSON.stringify(result, null, 2))
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falha na carga da planilha.')
  process.exitCode = 1
}).finally(async () => prisma.$disconnect())
