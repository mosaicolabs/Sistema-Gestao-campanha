export function canonicalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function normalizeContact(value: string) {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 8 ? digits : canonicalize(trimmed)
}
