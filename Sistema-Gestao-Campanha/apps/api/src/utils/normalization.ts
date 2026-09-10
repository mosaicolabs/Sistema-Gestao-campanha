import type { LocalityNameResolution } from '@campanha/types'

export function canonicalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function normalizeLocalityKey(value: string) {
  return canonicalize(value)
}

export function classifyLocalityName(input: {
  rawValue: string
  canonicalNames: ReadonlyMap<string, string>
  aliasKeys: ReadonlySet<string>
  candidateKeys: ReadonlySet<string>
}): LocalityNameResolution {
  const normalizedKey = normalizeLocalityKey(input.rawValue)
  const canonicalName = input.canonicalNames.get(normalizedKey)
  const classification =
    canonicalName && input.rawValue === canonicalName
      ? 'CANONICAL'
      : canonicalName || input.aliasKeys.has(normalizedKey)
        ? 'SAFE_ALIAS'
        : input.candidateKeys.has(normalizedKey)
          ? 'MANUAL_CANDIDATE'
          : 'UNMATCHED'

  return {
    rawValue: input.rawValue,
    normalizedKey,
    classification,
    candidateKeys: input.candidateKeys.has(normalizedKey) ? [normalizedKey] : [],
  }
}

export function normalizeContact(value: string) {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 8 ? digits : canonicalize(trimmed)
}
