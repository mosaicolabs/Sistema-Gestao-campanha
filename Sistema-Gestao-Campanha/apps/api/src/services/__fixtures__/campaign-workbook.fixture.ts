import ExcelJS from 'exceljs'

export type CampaignWorkbookOptions = {
  metadata?: string
  value?: string
  sheetName?: string
  rowNumber?: number
  index?: number
}

export async function campaignWorkbookFixture(options: CampaignWorkbookOptions = {}) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = options.metadata ?? 'fixture'

  for (let index = 1; index <= 80; index += 1) {
    const name = index === 1 ? '>>RIO DE JANEIRO<<' : `Cidade ${index}`
    const sheet = workbook.addWorksheet(name)
    if (index === 1) {
      sheet.getCell('A11').value = 'Territorial'
      sheet.getCell('B11').value = options.index ?? 2
      sheet.getCell('A30').value = 'Dobradas'
      sheet.getCell('B30').value = 1
    } else {
      sheet.getRow(3).values = ['Pessoa', 'Cidade', options.value ?? 'Liderança']
    }
  }

  if (options.sheetName) {
    const sheet = workbook.getWorksheet(options.sheetName)
    if (sheet) sheet.name = `${options.sheetName} alterada`
  }
  if (options.rowNumber && options.rowNumber > 3) {
    const sheet = workbook.getWorksheet('Cidade 2')
    if (sheet) {
      sheet.spliceRows(options.rowNumber, 0, [])
      sheet.getRow(options.rowNumber).values = ['Pessoa nova', 'Cidade 2', 'Liderança']
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
