export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type PermissionKey = `${string}:${string}`

export type SessionUser = {
  id: string
  username: string
  displayName: string
  mustChangePassword: boolean
  permissions: PermissionKey[]
}

export type AuthResponse = {
  accessToken: string
  expiresIn: number
  user: SessionUser
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
  pageCount: number
}

export type Paginated<T> = {
  data: T[]
  pagination: Pagination
}

export type DiagnosticSnapshot = {
  workbookTabs: 80
  territorialOccurrences: 681
  allianceOccurrences: 739
  manualTerritorialIndex: 672
  manualAllianceIndex: 591
  duplicatedAllianceRowsPending: 148
}

export const DIAGNOSTIC_SNAPSHOT: DiagnosticSnapshot = {
  workbookTabs: 80,
  territorialOccurrences: 681,
  allianceOccurrences: 739,
  manualTerritorialIndex: 672,
  manualAllianceIndex: 591,
  duplicatedAllianceRowsPending: 148,
}

export type PendingDecision = {
  id: string
  title: string
  impact: string
  status: 'PENDING'
}

export type LocalityManifestCandidate = {
  sourceLine: number
  rawValue: string
  normalizedKey: string
  candidateDisplayName: string
  similarity: number
  reviewRequired: true
}

export type LocalityManifestEntry = {
  sourceLine: number
  canonicalDisplayName: string
  canonicalKey: string
  observedValues: string[]
}

export type LocalityManifest = {
  sourceReport: string
  sourceSection: string
  sourceSha256: string
  entries: LocalityManifestEntry[]
  manualCandidates: LocalityManifestCandidate[]
}

export type LocalityNameClassification = 'CANONICAL' | 'SAFE_ALIAS' | 'MANUAL_CANDIDATE' | 'UNMATCHED'

export type LocalityNameResolution = {
  rawValue: string
  normalizedKey: string
  classification: LocalityNameClassification
  candidateKeys: string[]
}

export type MacroCoverageRow = {
  id: string
  city: string
  canonicalKey: string
  region: string
  uniqueArticulators: number
  articulatorCityRelations: number
  uniqueAssignments: number
  uniqueAlliances: number
  observedVariants: string[]
  pendingAliasCount: number
}
