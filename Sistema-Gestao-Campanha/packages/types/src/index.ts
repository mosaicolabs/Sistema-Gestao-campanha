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
