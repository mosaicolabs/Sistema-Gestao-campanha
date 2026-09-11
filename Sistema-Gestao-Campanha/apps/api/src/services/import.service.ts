import { createHash } from 'node:crypto'
import ExcelJS from 'exceljs'
import type { ImportCategory, Prisma } from '@campanha/database'
import { auditRepository } from '../repositories/audit.repository.js'
import { importRepository } from '../repositories/import.repository.js'
import { localityNormalizationService } from './locality-normalization.service.js'
import { AppError } from '../utils/app-error.js'
import { canonicalize } from '../utils/normalization.js'
import { fingerprintWorkbookInstance, type WorkbookFingerprint } from './workbook-fingerprint.js'
import { classifyCampaignSheet, extractIndexControls, parseSourceFields, type ParsedIndexControl } from './campaign-workbook-parser.js'
import { detectImportIssues } from './import-issue-detector.js'

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
  semanticHash: string
  parserVersion: string
  indexControls: ParsedIndexControl[]
}

function cellValue(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function safeCellText(cell: ExcelJS.Cell) {
  try {
    return cell.text
  } catch {
    return null
  }
}

export async function analyzeWorkbook(buffer: Buffer): Promise<WorkbookAnalysis> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  const occurrences: ParsedOccurrence[] = []
  let ignoredRows = 0

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name
    const category = classifyCampaignSheet(sheetName)
    if (category === 'GENERAL_INDEX' || category === 'REGIONAL_INDEX') continue
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber <= 2) return
      const values = Array.from({ length: 8 }, (_, index) => cellValue(safeCellText(row.getCell(index + 1))))
      if (!values.some(Boolean)) {
        ignoredRows += 1
        return
      }
      const normalized = values.map((value, index) => (index === 7 ? null : value ? canonicalize(value) : null))
      const namedFields = parseSourceFields({ sheetName, category, cells: values })
      occurrences.push({
        sheetName,
        rowNumber,
        category,
        rawValues: { cells: values },
        normalizedValues: namedFields ? { cells: normalized, ...namedFields } : { cells: normalized },
        rowHash: createHash('sha256').update(JSON.stringify([sheetName, rowNumber, normalized])).digest('hex'),
      })
    })
  }

  const indexSheet = workbook.getWorksheet('>>RIO DE JANEIRO<<')
  const territorialIndexText = indexSheet ? safeCellText(indexSheet.getCell('B11')) : null
  const allianceIndexText = indexSheet ? safeCellText(indexSheet.getCell('B30')) : null
  const manualTerritorialIndex = territorialIndexText ? Number(territorialIndexText) : undefined
  const manualAllianceIndex = allianceIndexText ? Number(allianceIndexText) : undefined

  const fingerprint: WorkbookFingerprint = fingerprintWorkbookInstance(workbook)
  const indexControls = extractIndexControls(workbook)
  return {
    workbookTabs: workbook.worksheets.length,
    territorialOccurrences: occurrences.filter((item) => item.category === 'TERRITORIAL').length,
    allianceOccurrences: occurrences.filter((item) => item.category === 'ALLIANCE').length,
    ignoredRows,
    manualTerritorialIndex: Number.isFinite(manualTerritorialIndex) ? manualTerritorialIndex : undefined,
    manualAllianceIndex: Number.isFinite(manualAllianceIndex) ? manualAllianceIndex : undefined,
    occurrences,
    semanticHash: fingerprint.semanticHash,
    parserVersion: fingerprint.parserVersion,
    indexControls,
  }
}

export const importService = {
  async process(file: Express.Multer.File, userId: string) {
    const fileHash = createHash('sha256').update(file.buffer).digest('hex')
    const analysis = await analyzeWorkbook(file.buffer)
    const existingArtifact = await importRepository.findByHash(fileHash)
    const existingLogicalBatch = await importRepository.findBySemanticHash(analysis.semanticHash)
    const existing = existingArtifact ?? existingLogicalBatch
    if (existing && existing._count.occurrences > 0) {
      if (!existingArtifact) await importRepository.createArtifact({ importBatchId: existing.id, filename: file.originalname, fileHash })
      return { batch: existing, fileHash, semanticHash: analysis.semanticHash, parserVersion: analysis.parserVersion, idempotent: true }
    }
    const batch =
      existing ??
      (await importRepository.createBatch({
        filename: file.originalname,
        fileHash,
        createdBy: { connect: { id: userId } },
      }))

    if (existing) await importRepository.resetBatch(existing.id)
    await importRepository.createArtifact({ importBatchId: batch.id, filename: file.originalname, fileHash })

    await importRepository.createOccurrences(
      analysis.occurrences.map((occurrence) => ({ ...occurrence, importBatchId: batch.id })),
    )
    await importRepository.createIndexControls(batch.id, analysis.indexControls)
    await importRepository.updateIndexControlObservations(batch.id, analysis)

    const issues = detectImportIssues(analysis)
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

    const normalization = await localityNormalizationService.normalizeBatch(batch.id, { userId })

    const updated = await importRepository.updateBatch(batch.id, {
      filename: file.originalname,
      status: issues.length || normalization.openIssueIds.length ? 'REVIEW_REQUIRED' : 'CLOSED',
      workbookTabs: analysis.workbookTabs,
      territorialOccurrences: analysis.territorialOccurrences,
      allianceOccurrences: analysis.allianceOccurrences,
      ignoredRows: analysis.ignoredRows,
      manualTerritorialIndex: analysis.manualTerritorialIndex,
      manualAllianceIndex: analysis.manualAllianceIndex,
      semanticHash: analysis.semanticHash,
      parserVersion: analysis.parserVersion,
      finishedAt: new Date(),
    })
    await auditRepository.record({ userId, action: 'IMPORT', entityType: 'ImportBatch', entityId: batch.id, afterData: { fileHash, workbookTabs: analysis.workbookTabs, territorialOccurrences: analysis.territorialOccurrences, allianceOccurrences: analysis.allianceOccurrences } })
    return { batch: updated, fileHash, semanticHash: analysis.semanticHash, parserVersion: analysis.parserVersion, idempotent: false, openIssues: issues.length + normalization.writes.issues, normalization }
  },

  listBatches: () => importRepository.listBatches(),
  listIssues: (status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED') => importRepository.listIssues(status),
  listDecisions: () => importRepository.listDecisions(),

  async decide(issueId: string, userId: string, data: { decision: 'KEEP' | 'REJECT' | 'MERGE' | 'SPLIT' | 'CORRECT'; reason: string; targetEntityType?: string; targetEntityId?: string }) {
    const issue = await importRepository.getIssue(issueId)
    if (!issue) throw new AppError(404, 'ISSUE_NOT_FOUND', 'Pendência não encontrada.')
    if (issue.status === 'RESOLVED' || issue.status === 'DISMISSED') throw new AppError(409, 'ISSUE_ALREADY_CLOSED', 'Esta pendência já recebeu uma decisão.')
    if (issue.type === 'LOCALITY_ALIAS') {
      if (data.targetEntityId && data.targetEntityType && data.targetEntityType !== 'Locality') {
        throw new AppError(422, 'TARGET_ENTITY_TYPE_INVALID', 'Uma pendência de localidade só aceita uma cidade como alvo.')
      }
      return localityNormalizationService.applyAliasDecision({ issueId, userId, decision: data.decision, reason: data.reason, targetLocalityId: data.targetEntityId })
    }
    const decision = await importRepository.decideIssue(issueId, userId, data)
    await auditRepository.record({ userId, action: 'RECONCILE', entityType: 'ImportIssue', entityId: issueId, afterData: { decision: data.decision, reason: data.reason } })
    return decision
  },
}
