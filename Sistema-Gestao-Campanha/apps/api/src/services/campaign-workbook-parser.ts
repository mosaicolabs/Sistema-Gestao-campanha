import type { ImportCategory } from '@campanha/database'
import ExcelJS from 'exceljs'
import { canonicalize } from '../utils/normalization.js'

export const ALLIANCE_SHEET_NAMES = [
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
] as const

export type SourceSlot = {
  index: number
  column: string
  present: boolean
  normalized: string | null
}

export type ParsedSourceFields = {
  schemaVersion: 2
  sourceCategory: 'TERRITORIAL' | 'ALLIANCE'
  citySourceName?: string
  allianceSourceName?: string
  slots: Record<string, SourceSlot>
}

export type ParsedIndexControl = {
  scope: 'TERRITORIAL_TOTAL' | 'REGION' | 'CITY' | 'ALLIANCE_TOTAL' | 'ALLIANCE'
  sourceSheet: string
  sourceCell: string
  sourceLabel: string
  normalizedKey: string
  manualCount: number
}

export function classifyCampaignSheet(name: string): ImportCategory {
  if (name === '>>RIO DE JANEIRO<<') return 'GENERAL_INDEX'
  if (name.startsWith('>>') && name.endsWith('<<')) return 'REGIONAL_INDEX'
  if ((ALLIANCE_SHEET_NAMES as readonly string[]).includes(name)) return 'ALLIANCE'
  return 'TERRITORIAL'
}

function columnName(index: number) {
  return String.fromCharCode(65 + index)
}

function safeCellText(cell: ExcelJS.Cell) {
  try {
    return cell.text
  } catch {
    return null
  }
}

function slot(index: number, value: string | null): SourceSlot {
  return {
    index,
    column: columnName(index),
    present: Boolean(value),
    normalized: value ? canonicalize(value) : null,
  }
}

export function parseSourceFields(input: {
  sheetName: string
  category: ImportCategory
  cells: Array<string | null>
}): ParsedSourceFields | null {
  if (input.category !== 'TERRITORIAL' && input.category !== 'ALLIANCE') return null

  if (input.category === 'TERRITORIAL') {
    return {
      schemaVersion: 2,
      sourceCategory: 'TERRITORIAL',
      citySourceName: input.sheetName,
      slots: {
        articulator: slot(0, input.cells[0] ?? null),
        coordinator: slot(1, input.cells[1] ?? null),
        coordinatorContact: slot(2, input.cells[2] ?? null),
        leadership: slot(3, input.cells[3] ?? null),
        localAreaContext: slot(4, input.cells[4] ?? null),
        leadershipContact: slot(5, input.cells[5] ?? null),
        federalDeputy: slot(6, input.cells[6] ?? null),
        sensitiveReligion: slot(7, input.cells[7] ?? null),
      },
    }
  }

  return {
    schemaVersion: 2,
    sourceCategory: 'ALLIANCE',
    allianceSourceName: input.sheetName,
    citySourceName: input.cells[0] ?? undefined,
    slots: {
      city: slot(0, input.cells[0] ?? null),
      articulator: slot(1, input.cells[1] ?? null),
      coordinator: slot(2, input.cells[2] ?? null),
      coordinatorContact: slot(3, input.cells[3] ?? null),
      leadership: slot(4, input.cells[4] ?? null),
      localAreaContext: slot(5, input.cells[5] ?? null),
      leadershipContact: slot(6, input.cells[6] ?? null),
      sensitiveReligion: slot(7, input.cells[7] ?? null),
    },
  }
}

export function sourceCells(value: unknown): Array<string | null> {
  if (!value || typeof value !== 'object' || !('cells' in value)) return []
  const cells = (value as { cells?: unknown }).cells
  return Array.isArray(cells) ? cells.map((cell) => (typeof cell === 'string' && cell.trim() ? cell.trim() : null)) : []
}

function indexNumber(value: unknown) {
  const text = String(value ?? '').trim()
  if (!text) return null
  const parsed = Number(text.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function extractIndexControls(workbook: ExcelJS.Workbook): ParsedIndexControl[] {
  const controls: ParsedIndexControl[] = []
  for (const worksheet of workbook.worksheets) {
    const category = classifyCampaignSheet(worksheet.name)
    if (category !== 'GENERAL_INDEX' && category !== 'REGIONAL_INDEX') continue
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const label = String(safeCellText(row.getCell(1)) ?? '').trim()
      const count = indexNumber(safeCellText(row.getCell(2)))
      if (!label || count === null || label.toUpperCase() === 'QUANTIDADE') return
      const scope = category === 'REGIONAL_INDEX'
        ? 'CITY'
        : rowNumber === 11
          ? 'TERRITORIAL_TOTAL'
          : rowNumber === 30
            ? 'ALLIANCE_TOTAL'
            : rowNumber < 11
              ? 'REGION'
              : 'ALLIANCE'
      controls.push({
        scope,
        sourceSheet: worksheet.name,
        sourceCell: `B${rowNumber}`,
        sourceLabel: label,
        normalizedKey: canonicalize(label),
        manualCount: count,
      })
    })
  }
  return controls
}
