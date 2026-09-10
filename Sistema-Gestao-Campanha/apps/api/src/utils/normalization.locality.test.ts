import { describe, expect, it } from 'vitest'
import { classifyLocalityName, normalizeLocalityKey } from './normalization.js'

const canonicalNames = new Map([['PATY DO ALFERES', 'Paty do Alferes']])

function classify(rawValue: string) {
  return classifyLocalityName({
    rawValue,
    canonicalNames,
    aliasKeys: new Set(['PATY DO ALFERES']),
    candidateKeys: new Set(['PATY DO ALVERES']),
  })
}

describe('normalização de localidades', () => {
  it('normaliza caixa, acento e espaços sem corrigir letras', () => {
    expect(normalizeLocalityKey('  Paty   do Alferes ')).toBe('PATY DO ALFERES')
    expect(normalizeLocalityKey('PATY DO ALVERES')).toBe('PATY DO ALVERES')
    expect(normalizeLocalityKey('PATY DO ALVERES')).not.toBe(normalizeLocalityKey('Paty do Alferes'))
  })

  it('é idempotente', () => {
    const value = 'São José  do Vale do Rio Preto'
    expect(normalizeLocalityKey(normalizeLocalityKey(value))).toBe(normalizeLocalityKey(value))
  })

  it('classifica nome canônico e variação segura', () => {
    expect(classify('Paty do Alferes').classification).toBe('CANONICAL')
    expect(classify('PATY DO ALFERES').classification).toBe('SAFE_ALIAS')
  })

  it('mantém aproximação de grafia em revisão manual', () => {
    expect(classify('PATY DO ALVERES')).toMatchObject({
      classification: 'MANUAL_CANDIDATE',
      normalizedKey: 'PATY DO ALVERES',
      candidateKeys: ['PATY DO ALVERES'],
    })
  })

  it('marca valor desconhecido como não encontrado', () => {
    expect(classify('Cidade não cadastrada').classification).toBe('UNMATCHED')
  })
})
