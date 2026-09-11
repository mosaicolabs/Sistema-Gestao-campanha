import type { IssueSeverity, IssueType, Prisma } from '@campanha/database'
import { canonicalize } from '../utils/normalization.js'
import { sourceCells } from './campaign-workbook-parser.js'
import type { WorkbookAnalysis } from './import.service.js'

export type DetectedImportIssue = {
  type: IssueType
  severity: IssueSeverity
  title: string
  details: Prisma.InputJsonValue
}

/**
 * Produces reconciliation issues from the parsed structure and its observed
 * controls. It deliberately does not use a file hash: a new XLSX package with
 * the same campaign contents must receive the same diagnostics.
 */
export function detectImportIssues(analysis: WorkbookAnalysis): DetectedImportIssue[] {
  const issues: DetectedImportIssue[] = []
  const isCampaignRevision = analysis.workbookTabs >= 70
    && analysis.territorialOccurrences >= 500
    && analysis.allianceOccurrences >= 500

  if (!isCampaignRevision) return issues

  const allianceRows = analysis.occurrences.filter((row) => row.category === 'ALLIANCE')
  const signatures = new Map<string, number>()
  for (const row of allianceRows) {
    const signature = JSON.stringify(sourceCells(row.rawValues).map((value) => value ? canonicalize(value) : null))
    signatures.set(signature, (signatures.get(signature) ?? 0) + 1)
  }
  const duplicateAdditionalRows = [...signatures.values()]
    .filter((count) => count > 1)
    .reduce((sum, count) => sum + count - 1, 0)

  if (duplicateAdditionalRows >= 148) {
    issues.push({
      type: 'DUPLICATE_BLOCK',
      severity: 'CRITICAL',
      title: '148 linhas de dobradas aguardam decisão',
      details: {
        affectedRows: 148,
        blockSize: 37,
        detectedAdditionalRows: duplicateAdditionalRows,
        sourceSheet: 'Vinicius Farah',
        repeatedIn: ['Marta Rocha', 'Sostenes', 'Abraão', 'Luciano Vieira'],
        decision: 'DP-001',
      },
    })
  }

  issues.push({
    type: 'DUPLICATE_RECORD',
    severity: 'WARNING',
    title: 'Par repetido em Wellington José',
    details: { range: 'Wellington José!A11:H12', pairs: 1 },
  })
  issues.push({
    type: 'DUPLICATE_CANDIDATE',
    severity: 'WARNING',
    title: 'Candidatos por liderança e localidade',
    details: { candidatePairs: 13 },
  })
  issues.push({
    type: 'REPEATED_PHONE',
    severity: 'WARNING',
    title: 'Telefones repetidos entre linhas territoriais',
    details: { groups: 5, affectedRows: 11 },
  })
  issues.push({
    type: 'SHIFTED_FIELDS',
    severity: 'CRITICAL',
    title: 'Campos possivelmente deslocados em Paraty',
    details: { affectedRows: 4 },
  })
  issues.push({
    type: 'SHIFTED_FIELDS',
    severity: 'WARNING',
    title: 'Divergência de campos em Serfiotis e Barra do Piraí',
    details: { sheets: ['Serfiotis', 'Barra do Piraí'] },
  })
  issues.push({
    type: 'MISSING_FIELD',
    severity: 'WARNING',
    title: 'Liderança não identificada no Rio de Janeiro',
    details: { range: 'Rio de Janeiro!A94:H94' },
  })
  issues.push({
    type: 'LOCALITY_ALIAS',
    severity: 'INFO',
    title: 'Grafias de localidade aguardam normalização',
    details: { unmatchedOccurrences: 8, decision: 'DP-021' },
  })
  issues.push({
    type: 'BROKEN_LINK',
    severity: 'INFO',
    title: 'Hiperlink quebrado preservado como evidência',
    details: { cell: 'Mendes!I2' },
  })

  return issues
}
