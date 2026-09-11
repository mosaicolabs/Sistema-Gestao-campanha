import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { campaignWorkbookFixture } from './__fixtures__/campaign-workbook.fixture.js'
import { fingerprintWorkbook, WORKBOOK_PARSER_VERSION } from './workbook-fingerprint.js'

describe('fingerprintWorkbook', () => {
  it('identifica a mesma revisão em pacotes XLSX binariamente diferentes', async () => {
    const first = await campaignWorkbookFixture({ metadata: 'Google Sheets' })
    const second = await campaignWorkbookFixture({ metadata: 'LibreOffice' })

    expect(createHash('sha256').update(first).digest('hex')).not.toBe(createHash('sha256').update(second).digest('hex'))
    expect((await fingerprintWorkbook(first)).semanticHash).toBe((await fingerprintWorkbook(second)).semanticHash)
  })

  it('expõe uma versão do algoritmo junto com o hash', async () => {
    const result = await fingerprintWorkbook(await campaignWorkbookFixture())
    expect(result.parserVersion).toBe(WORKBOOK_PARSER_VERSION)
    expect(result.semanticHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it.each([
    ['valor', { value: 'Outro valor' }],
    ['aba', { sheetName: 'Cidade 2' }],
    ['linha', { rowNumber: 4 }],
    ['índice', { index: 3 }],
  ])('altera o hash quando muda %s', async (_description, options) => {
    const baseline = await fingerprintWorkbook(await campaignWorkbookFixture())
    const changed = await fingerprintWorkbook(await campaignWorkbookFixture(options))
    expect(changed.semanticHash).not.toBe(baseline.semanticHash)
  })
})
