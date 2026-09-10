export type ReferenceData = {
  localities: Array<{ id: string; name: string; type: 'STATE' | 'REGION' | 'CITY' | 'LOCAL_AREA'; parentId?: string }>
  businessRoles: Array<{ id: string; code: string; name: string }>
  alliances: Array<{ id: string; name: string }>
  users: Array<{ id: string; username: string; person?: { displayName: string } }>
  materials: Array<{ id: string; name: string; unit: string }>
  accessRoles: Array<{ id: string; code: string; name: string }>
  people: Array<{ id: string; displayName: string }>
}

export type Person = {
  id: string
  displayName: string
  status: string
  notes?: string
  contacts: Array<{ id: string; type: string; valueRaw: string; isPrimary: boolean }>
  assignments: Array<{ id: string; businessRole: { id: string; name: string }; locality: { id: string; name: string } }>
  alliances: Array<{ id: string; alliance: { id: string; name: string }; locality?: { id: string; name: string }; status: string }>
}

export type Board = {
  id: string
  name: string
  columns: Array<{
    id: string
    name: string
    position: number
    isTerminal: boolean
    tasks: Array<{
      id: string
      title: string
      description?: string
      dueAt?: string
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      columnId: string
      assignees: Array<{ user: { username: string; person?: { displayName: string } } }>
    }>
  }>
}

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  startsAt: string
  endsAt: string
  timezone: string
  address?: string
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
  version: number
  locality?: { name: string }
}

export type Delivery = {
  id: string
  destination: string
  address?: string
  scheduledAt?: string
  status: 'REQUESTED' | 'PLANNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'BLOCKED'
  locality?: { name: string }
  responsible?: { username: string; person?: { displayName: string } }
  items: Array<{ quantity: string; material: { name: string; unit: string } }>
}

export type ImportBatch = {
  id: string
  filename: string
  status: string
  workbookTabs: number
  territorialOccurrences: number
  allianceOccurrences: number
  manualTerritorialIndex?: number
  manualAllianceIndex?: number
  createdAt: string
  _count?: { issues: number; occurrences: number }
}

export type ImportIssue = {
  id: string
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  details: Record<string, unknown>
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
  importBatch: { filename: string }
}
