import { createHash } from 'node:crypto'
import ExcelJS from 'exceljs'
import { canonicalize } from '../utils/normalization.js'

export const WORKBOOK_PARSER_VERSION = 'campaign-v2'

const ALLIANCE_SHEETS = new Set([
  'Dani Cunha', 'Coronel Henrique', 'Hugo Leal', 'Wellington José', 'Eloi Ramalho', 'Áureo Ribeiro',
  'Júnior Trovão', 'Serfiotis', 'Vinicius Farah', 'Marta Rocha', 'Sostenes', 'Abraão', 'Luciano Vieira',
  'Talita Galhardo', 'Altineu Côrtes', 'Gutembertg Reis', 'Luizinho',
])

function categoryForSheet(name: string) {
  if (name === '>>RIO DE JANEIRO<<') return 'GENERAL_INDEX'
  if (name.startsWith('>>') && name.endsWith('<<')) return 'REGIONAL_INDEX'
  if (ALLIANCE_SHEETS.has(name)) return 'ALLIANCE'
  return 'TERRITORIAL'
}

function normalizedCellValue(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length ? canonicalize(text) : null
}

function safeCellText(cell: ExcelJS.Cell) {
  try {
    return cell.text
  } catch {
    return null
  }
}

function canonicalWorkbook(workbook: ExcelJS.Workbook) {
  return {
    parserVersion: WORKBOOK_PARSER_VERSION,
    sheets: workbook.worksheets.map((worksheet) => {
      const category = categoryForSheet(worksheet.name)
      const rows: Array<{ row: number; cells: Array<string | null> }> = []
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (category !== 'GENERAL_INDEX' && category !== 'REGIONAL_INDEX' && rowNumber <= 2) return
        const cells = Array.from({ length: 8 }, (_, index) => normalizedCellValue(safeCellText(row.getCell(index + 1))))
        if (cells.some(Boolean)) rows.push({ row: rowNumber, cells })
      })

      return { name: worksheet.name, category, rows }
    }),
  }
}

export type WorkbookFingerprint = {
  semanticHash: string
  parserVersion: string
}

export function fingerprintWorkbookInstance(workbook: ExcelJS.Workbook): WorkbookFingerprint {
  const serialized = JSON.stringify(canonicalWorkbook(workbook))
  return {
    semanticHash: createHash('sha256').update(serialized).digest('hex'),
    parserVersion: WORKBOOK_PARSER_VERSION,
  }
}

export async function fingerprintWorkbook(buffer: Buffer): Promise<WorkbookFingerprint> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  return fingerprintWorkbookInstance(workbook)
}

export const computeWorkbookFingerprint = fingerprintWorkbook
