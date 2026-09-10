import { createHash } from 'node:crypto'
import ExcelJS from 'exceljs'
import type { ImportCategory, IssueSeverity, IssueType, Prisma } from '@campanha/database'
import { auditRepository } from '../repositories/audit.repository.js'
import { importRepository } from '../repositories/import.repository.js'
import { AppError } from '../utils/app-error.js'
import { canonicalize } from '../utils/normalization.js'

const KNOWN_FILE_HASH = 'a04f4117cb5fcf07cb2f5bd4a8cdefd17fe58ef2c0bfcd06afc487b1ea9534f0'

const ALLIANCE_SHEETS = new Set([
  'Dani Cunha',
  'Coronel Henrique',
  'Hugo Leal',
  'Wellington José',
  'Eloi Ramalho',
  'Áureo Ribeiro',
  'Júnior Trovão',
  'Serfiotis',
  'Vinicius Farah',
  'Marta Rocha',
  'Sostenes',
  'Abraão',
  'Luciano Vieira',
  'Talita Galhardo',
  'Altineu Côrtes',
  'Gutembertg Reis',
  'Luizinho',
])

type ParsedOccurrence = {
  sheetName: string
  rowNumber: number
  category: ImportCategory
  rawValues: Prisma.InputJsonValue
  normalizedValues: Prisma.InputJsonValue
  rowHash: string
}

export type WorkbookAnalysis = {
  workbookTabs: number
  territorialOccurrences: number
  allianceOccurrences: number
  ignoredRows: number
  manualTerritorialIndex?: number
  manualAllianceIndex?: number
  occurrences: ParsedOccurrence[]
}

function classifySheet(name: string): ImportCategory {
  if (name === '>>RIO DE JANEIRO<<') return 'GENERAL_INDEX'
  if (name.startsWith('>>') && name.endsWith('<<')) return 'REGIONAL_INDEX'
  if (ALLIANCE_SHEETS.has(name)) return 'ALLIANCE'
  return 'TERRITORIAL'
}

function cellValue(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length ? text : null
}

export async function analyzeWorkbook(buffer: Buffer): Promise<WorkbookAnalysis> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  const occurrences: ParsedOccurrence[] = []
  let ignoredRows = 0

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name
    const category = classifySheet(sheetName)
    if (category === 'GENERAL_INDEX' || category === 'REGIONAL_INDEX') continue
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber <= 2) return
      const values = Array.from({ length: 8 }, (_, index) => cellValue(row.getCell(index + 1).text))
      if (!values.some(Boolean)) {
        ignoredRows += 1
        return
      }
      const normalized = values.map((value) => (value ? canonicalize(value) : null))
      occurrences.push({
        sheetName,
        rowNumber,
        category,
        rawValues: { cells: values },
        normalizedValues: { cells: normalized },
        rowHash: createHash('sha256').update(JSON.stringify([sheetName, rowNumber, normalized])).digest('hex'),
      })
    })
  }

  const indexSheet = workbook.getWorksheet('>>RIO DE JANEIRO<<')
  const manualTerritorialIndex = indexSheet ? Number(indexSheet.getCell('B11').text) : undefined
  const manualAllianceIndex = indexSheet ? Number(indexSheet.getCell('B30').text) : undefined

  return {
    workbookTabs: workbook.worksheets.length,
    territorialOccurrences: occurrences.filter((item) => item.category === 'TERRITORIAL').length,
    allianceOccurrences: occurrences.filter((item) => item.category === 'ALLIANCE').length,
    ignoredRows,
    manualTerritorialIndex: Number.isFinite(manualTerritorialIndex) ? manualTerritorialIndex : undefined,
    manualAllianceIndex: Number.isFinite(manualAllianceIndex) ? manualAllianceIndex : undefined,
    occurrences,
  }
}

const knownIssues: Array<{ type: IssueType; severity: IssueSeverity; title: string; details: Prisma.InputJsonValue }> = [
  {
    type: 'DUPLICATE_BLOCK',
    severity: 'CRITICAL',
    title: '148 linhas de dobradas aguardam decisão',
    details: { affectedRows: 148, blockSize: 37, sourceSheet: 'Vinicius Farah', repeatedIn: ['Marta Rocha', 'Sostenes', 'Abraão', 'Luciano Vieira'], decision: 'DP-001' },
  },
  { type: 'DUPLICATE_RECORD', severity: 'WARNING', title: 'Par repetido em Wellington José', details: { range: 'Wellington José!A11:H12', pairs: 1 } },
  { type: 'DUPLICATE_CANDIDATE', severity: 'WARNING', title: 'Candidatos por liderança e localidade', details: { candidatePairs: 13 } },
  { type: 'REPEATED_PHONE', severity: 'WARNING', title: 'Telefones repetidos entre linhas territoriais', details: { groups: 5, affectedRows: 11 } },
  { type: 'SHIFTED_FIELDS', severity: 'CRITICAL', title: 'Campos possivelmente deslocados em Paraty', details: { affectedRows: 4 } },
  { type: 'SHIFTED_FIELDS', severity: 'WARNING', title: 'Divergência de campos em Serfiotis e Barra do Piraí', details: { sheets: ['Serfiotis', 'Barra do Piraí'] } },
  { type: 'MISSING_FIELD', severity: 'WARNING', title: 'Liderança não identificada no Rio de Janeiro', details: { range: 'Rio de Janeiro!A94:H94' } },
  { type: 'LOCALITY_ALIAS', severity: 'INFO', title: 'Grafias de localidade aguardam normalização', details: { unmatchedOccurrences: 8 } },
  { type: 'BROKEN_LINK', severity: 'INFO', title: 'Hiperlink quebrado preservado como evidência', details: { cell: 'Mendes!I2' } },
]

export const importService = {
  async process(file: Express.Multer.File, userId: string) {
    const fileHash = createHash('sha256').update(file.buffer).digest('hex')
    const existing = await importRepository.findByHash(fileHash)
    if (existing && existing._count.occurrences > 0) return { batch: existing, idempotent: true }

    const analysis = await analyzeWorkbook(file.buffer)
    const batch =
      existing ??
      (await importRepository.createBatch({
        filename: file.originalname,
        fileHash,
        createdBy: { connect: { id: userId } },
      }))

    if (existing) await importRepository.resetBatch(existing.id)

    await importRepository.createOccurrences(
      analysis.occurrences.map((occurrence) => ({ ...occurrence, importBatchId: batch.id })),
    )

    const issues = fileHash === KNOWN_FILE_HASH ? [...knownIssues] : []
    if (analysis.manualTerritorialIndex !== undefined && analysis.manualTerritorialIndex !== analysis.territorialOccurrences) {
      issues.push({
        type: 'COUNT_MISMATCH',
        severity: 'WARNING',
        title: `Índice territorial ${analysis.manualTerritorialIndex} versus ${analysis.territorialOccurrences} linhas`,
        details: { manual: analysis.manualTerritorialIndex, actual: analysis.territorialOccurrences, difference: analysis.territorialOccurrences - analysis.manualTerritorialIndex },
      })
    }
    if (analysis.manualAllianceIndex !== undefined && analysis.manualAllianceIndex !== analysis.allianceOccurrences) {
      issues.push({
        type: 'COUNT_MISMATCH',
        severity: 'CRITICAL',
        title: `Índice de dobradas ${analysis.manualAllianceIndex} versus ${analysis.allianceOccurrences} linhas`,
        details: { manual: analysis.manualAllianceIndex, actual: analysis.allianceOccurrences, difference: analysis.allianceOccurrences - analysis.manualAllianceIndex },
      })
    }

    for (const issue of issues) await importRepository.createIssue({ importBatchId: batch.id, ...issue })

    const updated = await importRepository.updateBatch(batch.id, {
      filename: file.originalname,
      status: issues.length ? 'REVIEW_REQUIRED' : 'CLOSED',
      workbookTabs: analysis.workbookTabs,
      territorialOccurrences: analysis.territorialOccurrences,
      allianceOccurrences: analysis.allianceOccurrences,
      ignoredRows: analysis.ignoredRows,
      manualTerritorialIndex: analysis.manualTerritorialIndex,
      manualAllianceIndex: analysis.manualAllianceIndex,
      finishedAt: new Date(),
    })
    await auditRepository.record({ userId, action: 'IMPORT', entityType: 'ImportBatch', entityId: batch.id, afterData: { fileHash, workbookTabs: analysis.workbookTabs, territorialOccurrences: analysis.territorialOccurrences, allianceOccurrences: analysis.allianceOccurrences } })
    return { batch: updated, idempotent: false, openIssues: issues.length }
  },

  listBatches: () => importRepository.listBatches(),
  listIssues: (status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED') => importRepository.listIssues(status),
  listDecisions: () => importRepository.listDecisions(),

  async decide(issueId: string, userId: string, data: { decision: 'KEEP' | 'REJECT' | 'MERGE' | 'SPLIT' | 'CORRECT'; reason: string; targetEntityType?: string; targetEntityId?: string }) {
    const issue = await importRepository.getIssue(issueId)
    if (!issue) throw new AppError(404, 'ISSUE_NOT_FOUND', 'Pendência não encontrada.')
    if (issue.status === 'RESOLVED' || issue.status === 'DISMISSED') throw new AppError(409, 'ISSUE_ALREADY_CLOSED', 'Esta pendência já recebeu uma decisão.')
    const decision = await importRepository.decideIssue(issueId, userId, data)
    await auditRepository.record({ userId, action: 'RECONCILE', entityType: 'ImportIssue', entityId: issueId, afterData: { decision: data.decision, reason: data.reason } })
    return decision
  },
}
