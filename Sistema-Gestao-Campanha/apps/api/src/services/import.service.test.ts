import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { analyzeWorkbook } from './import.service.js'

async function workbookFixture() {
  const workbook = new ExcelJS.Workbook()
  const index = workbook.addWorksheet('>>RIO DE JANEIRO<<')
  index.addRow(['REGIÃO', 'Quantidade'])
  index.getCell('A11').value = 'Territorial'
  index.getCell('B11').value = 2
  index.getCell('A30').value = 'Dobradas'
  index.getCell('B30').value = 1
  workbook.addWorksheet('>>COSTA VERDE<<').addRows([['Cidade'], ['Quantidade']])
  workbook.addWorksheet('Angra dos Reis').addRows([['Articulador'], ['Cabeçalhos'], ['A', null, null, 'Liderança 1'], ['A', null, null, 'Liderança 2']])
  workbook.addWorksheet('Dani Cunha').addRows([['Articulador'], ['Cabeçalhos'], ['A', null, null, 'Liderança 1']])
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

describe('analyzeWorkbook', () => {
  it('separa índices, ocorrências territoriais e dobradas sem consolidar pessoas', async () => {
    const result = await analyzeWorkbook(await workbookFixture())
    expect(result.workbookTabs).toBe(4)
    expect(result.territorialOccurrences).toBe(2)
    expect(result.allianceOccurrences).toBe(1)
    expect(result.manualTerritorialIndex).toBe(2)
    expect(result.manualAllianceIndex).toBe(1)
    expect(result.occurrences.every((item) => item.rowHash.length === 64)).toBe(true)
    expect(result.semanticHash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.parserVersion).toBe('campaign-v2')
  })
})
