import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type {
  LocalityManifest,
  LocalityManifestCandidate,
  LocalityNameClassification,
  LocalityNameResolution,
} from '@campanha/types'
import { type LocalityCityRecord, type LocalityIssueRecord, type LocalityRepository, localityRepository } from '../repositories/locality.repository.js'
import { classifyLocalityName, normalizeLocalityKey } from '../utils/normalization.js'
import { AppError } from '../utils/app-error.js'

export type LocalityResolution = LocalityNameResolution & {
  localityId?: string
  candidateLocalityIds: string[]
}

export type NormalizationReport = {
  batchId: string
  manifestSha256: string
  scannedOccurrences: number
  canonicalMatches: number
  safeAliases: number
  manualCandidates: number
  unmatched: number
  openIssueIds: string[]
  writes: { aliases: number; issues: number; assignments: number }
}

export type AliasDecisionInput = {
  issueId: string
  userId: string
  decision: 'KEEP' | 'REJECT' | 'MERGE' | 'SPLIT' | 'CORRECT'
  targetLocalityId?: string
  reason: string
}

type NormalizationDependencies = {
  repository: LocalityRepository
  manifest: LocalityManifest
  safeAliasStatus: 'ACTIVE' | 'PENDING_REVIEW'
  autoApproveManifestCandidates: boolean
}

type ManifestCandidateIndex = {
  keys: Set<string>
  byKey: Map<string, LocalityManifestCandidate[]>
}

function loadManifest(): LocalityManifest {
  const url = new URL('../../../../packages/database/prisma/data/campanha-ea-2026-locality-manifest.json', import.meta.url)
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8')) as LocalityManifest
}

function candidateIndex(manifest: LocalityManifest): ManifestCandidateIndex {
  const byKey = new Map<string, LocalityManifestCandidate[]>()
  for (const candidate of manifest.manualCandidates) {
    const keys = [candidate.normalizedKey, normalizeLocalityKey(candidate.candidateDisplayName)]
    for (const key of keys) {
      const current = byKey.get(key) ?? []
      current.push(candidate)
      byKey.set(key, current)
    }
  }
  return { keys: new Set(byKey.keys()), byKey }
}

function collectStrings(value: unknown, output: string[]) {
  if (typeof value === 'string' && value.trim()) {
    output.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, output)
  }
}

function occurrenceValues(occurrence: { rawValues: unknown }, knownKeys: Set<string>) {
  const values: string[] = []
  collectStrings(occurrence.rawValues, values)
  const unique = new Set<string>()
  return values.filter((value) => {
    const key = normalizeLocalityKey(value)
    if (!knownKeys.has(key) || unique.has(value)) return false
    unique.add(value)
    return true
  })
}

function fingerprint(batchId: string, normalizedKey: string, candidateLocalityIds: string[]) {
  return createHash('sha256')
    .update(JSON.stringify({ batchId, normalizedKey, candidateLocalityIds: [...candidateLocalityIds].sort() }))
    .digest('hex')
}

function issueDetails(issue: LocalityIssueRecord) {
  return issue.details && typeof issue.details === 'object' ? (issue.details as Record<string, unknown>) : {}
}

export function createLocalityNormalizationService(options?: {
  repository?: LocalityRepository
  manifest?: LocalityManifest
  safeAliasStatus?: 'ACTIVE' | 'PENDING_REVIEW'
  autoApproveManifestCandidates?: boolean
}) {
  const dependencies: NormalizationDependencies = {
    repository: options?.repository ?? localityRepository,
    manifest: options?.manifest ?? loadManifest(),
    safeAliasStatus: options?.safeAliasStatus ?? 'ACTIVE',
    autoApproveManifestCandidates: options?.autoApproveManifestCandidates ?? true,
  }

  async function context() {
    const [cities, aliases] = await Promise.all([
      dependencies.repository.listCities(),
      dependencies.repository.listActiveAliases(),
    ])
    const citiesByKey = new Map<string, LocalityCityRecord[]>()
    for (const city of cities) {
      const key = normalizeLocalityKey(city.canonicalName)
      const current = citiesByKey.get(key) ?? []
      current.push(city)
      citiesByKey.set(key, current)
    }

    const canonicalNames = new Map<string, string>()
    for (const [key, records] of citiesByKey) {
      if (records.length === 1) canonicalNames.set(key, records[0]!.name)
    }

    const aliasesByKey = new Map<string, LocalityAliasRecordLike[]>()
    for (const alias of aliases) {
      const current = aliasesByKey.get(alias.valueNormalized) ?? []
      current.push(alias)
      aliasesByKey.set(alias.valueNormalized, current)
    }

    const candidates = candidateIndex(dependencies.manifest)
    const knownKeys = new Set<string>([...citiesByKey.keys(), ...candidates.keys])
    for (const entry of dependencies.manifest.entries) {
      for (const observedValue of entry.observedValues) knownKeys.add(normalizeLocalityKey(observedValue))
    }

    return { cities, citiesByKey, canonicalNames, aliasesByKey, candidates, knownKeys }
  }

  async function resolveName(rawValue: string, type: 'CITY'): Promise<LocalityResolution> {
    if (type !== 'CITY') throw new AppError(422, 'LOCALITY_TYPE_UNSUPPORTED', 'A normalização atual aceita apenas cidades.')
    const data = await context()
    const normalizedKey = normalizeLocalityKey(rawValue)
    const base = classifyLocalityName({
      rawValue,
      canonicalNames: data.canonicalNames,
      aliasKeys: new Set(data.aliasesByKey.keys()),
      candidateKeys: data.candidates.keys,
    })
    const canonicalRecords = data.citiesByKey.get(normalizedKey) ?? []
    const aliasRecords = data.aliasesByKey.get(normalizedKey) ?? []
    const candidateRecords = data.candidates.byKey.get(normalizedKey) ?? []
    const candidateLocalityIds = new Set<string>()

    for (const candidate of candidateRecords) {
      const candidateKey = normalizeLocalityKey(candidate.candidateDisplayName)
      for (const city of data.citiesByKey.get(candidateKey) ?? []) candidateLocalityIds.add(city.id)
      for (const city of data.citiesByKey.get(candidate.normalizedKey) ?? []) candidateLocalityIds.add(city.id)
    }

    let classification: LocalityNameClassification = base.classification
    let localityId: string | undefined
    if (canonicalRecords.length > 1 || aliasRecords.length > 1) {
      classification = 'MANUAL_CANDIDATE'
    } else if (canonicalRecords.length === 1 && base.classification !== 'MANUAL_CANDIDATE') {
      localityId = canonicalRecords[0]!.id
    } else if (aliasRecords.length === 1 && base.classification !== 'MANUAL_CANDIDATE') {
      localityId = aliasRecords[0]!.localityId
      classification = 'SAFE_ALIAS'
    }

    // DP-021 was confirmed by the gestor: the six city pairs explicitly
    // listed in the source report use the canonical city already present in
    // the database. Only those report candidates are auto-approved; names
    // outside the manifest continue through the manual-review path.
    if (classification === 'MANUAL_CANDIDATE' && dependencies.autoApproveManifestCandidates && candidateLocalityIds.size === 1) {
      classification = 'SAFE_ALIAS'
      localityId = [...candidateLocalityIds][0]
    }

    return {
      ...base,
      classification,
      localityId,
      candidateLocalityIds: [...candidateLocalityIds],
    }
  }

  async function normalizeBatch(batchId: string, options?: { dryRun?: boolean; userId?: string }): Promise<NormalizationReport> {
    const dryRun = options?.dryRun ?? false
    const data = await context()
    const occurrences = await dependencies.repository.listOccurrences(batchId)
    const existingIssues = await dependencies.repository.listOpenLocalityIssues(batchId)
    const existingFingerprints = new Map<string, string>()
    for (const issue of existingIssues) {
      const value = issueDetails(issue).fingerprint
      if (typeof value === 'string') existingFingerprints.set(value, issue.id)
    }

    const knownKeys = data.knownKeys
    const report: NormalizationReport = {
      batchId,
      manifestSha256: dependencies.manifest.sourceSha256,
      scannedOccurrences: occurrences.length,
      canonicalMatches: 0,
      safeAliases: 0,
      manualCandidates: 0,
      unmatched: 0,
      openIssueIds: [...existingIssues.map((issue) => issue.id)],
      writes: { aliases: 0, issues: 0, assignments: 0 },
    }

    const writes: Array<(repository: LocalityRepository) => Promise<void>> = []
    for (const occurrence of occurrences) {
      for (const rawValue of occurrenceValues(occurrence, knownKeys)) {
        const resolution = await resolveName(rawValue, 'CITY')
        const candidateIds = resolution.candidateLocalityIds
        const issueFingerprint = fingerprint(batchId, resolution.normalizedKey, candidateIds)
        if (resolution.classification === 'CANONICAL' && resolution.localityId) {
          report.canonicalMatches += 1
          if (!dryRun) {
            writes.push(async (repository) => {
              const source = await repository.createEntitySource({ entityType: 'Locality', entityId: resolution.localityId!, occurrenceId: occurrence.id })
              if ((source as { created?: boolean }).created !== false) report.writes.assignments += 1
            })
          }
          continue
        }
        if (resolution.classification === 'SAFE_ALIAS' && resolution.localityId) {
          report.safeAliases += 1
          if (!dryRun) {
            writes.push(async (repository) => {
              const alias = await repository.createAlias({ localityId: resolution.localityId!, value: rawValue, valueNormalized: resolution.normalizedKey, status: dependencies.safeAliasStatus, sourceOccurrenceId: occurrence.id })
              const source = await repository.createEntitySource({ entityType: 'LocalityAlias', entityId: alias.id, occurrenceId: occurrence.id })
              if ((alias as { created?: boolean }).created !== false) report.writes.aliases += 1
              if ((source as { created?: boolean }).created !== false) report.writes.assignments += 1
            })
          }
          continue
        }

        if (resolution.classification === 'MANUAL_CANDIDATE') report.manualCandidates += 1
        else report.unmatched += 1
        const existingIssueId = existingFingerprints.get(issueFingerprint)
        if (existingIssueId) {
          if (!report.openIssueIds.includes(existingIssueId)) report.openIssueIds.push(existingIssueId)
          continue
        }
        const candidate = data.candidates.byKey.get(resolution.normalizedKey)?.[0]
        const details = {
          fingerprint: issueFingerprint,
          rawValue,
          normalizedKey: resolution.normalizedKey,
          sourceReport: dependencies.manifest.sourceReport,
          sourceReportLine: candidate?.sourceLine,
          similarity: candidate?.similarity,
          candidateDisplayName: candidate?.candidateDisplayName,
          candidateLocalityIds: candidateIds,
          occurrence: { sheetName: occurrence.sheetName, rowNumber: occurrence.rowNumber, rowHash: occurrence.rowHash },
        }
        if (!dryRun) {
          writes.push(async (repository) => {
            const issue = await repository.createIssue({ importBatchId: batchId, occurrenceId: occurrence.id, title: `Grafia de localidade aguardando confirmação: ${rawValue}`, details })
            report.openIssueIds.push(issue.id)
            report.writes.issues += 1
          })
        }
      }
    }

    if (!dryRun && writes.length) {
      await dependencies.repository.transaction(async (transactionRepository) => {
        // Run every alias, issue, provenance link and audit write in one DB
        // transaction. The closure is deliberately sequential for deterministic
        // upsert order and easy rollback on any failure.
        for (const write of writes) await write(transactionRepository)
        await transactionRepository.recordAudit({
          userId: options?.userId,
          action: 'LOCALITY_NORMALIZE',
          entityType: 'ImportBatch',
          entityId: batchId,
          afterData: { ...report },
        })
      })
    }

    return report
  }

  async function applyAliasDecision(input: AliasDecisionInput) {
    if (!input.reason.trim()) throw new AppError(422, 'DECISION_REASON_REQUIRED', 'A justificativa é obrigatória.')
    const issue = await dependencies.repository.getIssue(input.issueId)
    if (!issue) throw new AppError(404, 'ISSUE_NOT_FOUND', 'Pendência de localidade não encontrada.')
    if (issue.type !== 'LOCALITY_ALIAS') throw new AppError(422, 'ISSUE_TYPE_INVALID', 'A pendência informada não é de localidade.')
    if (issue.status === 'RESOLVED' || issue.status === 'DISMISSED') throw new AppError(409, 'ISSUE_ALREADY_CLOSED', 'Esta pendência já recebeu uma decisão.')

    const needsTarget = input.decision === 'CORRECT' || input.decision === 'MERGE'
    if (needsTarget && !input.targetLocalityId) throw new AppError(422, 'TARGET_LOCALITY_REQUIRED', 'Informe a cidade alvo para corrigir a grafia.')
    const target = input.targetLocalityId ? await dependencies.repository.getCity(input.targetLocalityId) : null
    if (input.targetLocalityId && !target) throw new AppError(422, 'TARGET_LOCALITY_INVALID', 'A entidade alvo precisa ser uma cidade ativa.')

    return dependencies.repository.transaction(async (transactionRepository) => {
      const details = issueDetails(issue)
      let aliasId: string | undefined
      if (needsTarget && target) {
        const rawValue = typeof details.rawValue === 'string' ? details.rawValue : target.name
        const normalizedKey = typeof details.normalizedKey === 'string' ? details.normalizedKey : normalizeLocalityKey(rawValue)
        const alias = await transactionRepository.createAlias({
          localityId: target.id,
          value: rawValue,
          valueNormalized: normalizedKey,
          status: 'ACTIVE',
          sourceOccurrenceId: issue.occurrenceId ?? undefined,
        })
        aliasId = alias.id
        if (issue.occurrenceId) await transactionRepository.createEntitySource({ entityType: 'LocalityAlias', entityId: alias.id, occurrenceId: issue.occurrenceId })
      }
      await transactionRepository.createDecision({
        issueId: input.issueId,
        decision: input.decision,
        targetEntityType: target ? 'Locality' : undefined,
        targetEntityId: target?.id,
        reason: input.reason,
        decidedById: input.userId,
      })
      const status = input.decision === 'REJECT' ? 'DISMISSED' : 'RESOLVED'
      await transactionRepository.updateIssue(input.issueId, status)
      await transactionRepository.recordAudit({
        userId: input.userId,
        action: 'LOCALITY_ALIAS_DECISION',
        entityType: 'ImportIssue',
        entityId: input.issueId,
        afterData: { decision: input.decision, targetLocalityId: target?.id, aliasId, reason: input.reason },
      })
      return { issueId: input.issueId, aliasId, status }
    })
  }

  return { resolveName, normalizeBatch, applyAliasDecision }
}

type LocalityAliasRecordLike = {
  id: string
  localityId: string
  value: string
  valueNormalized: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
}

export const localityNormalizationService = createLocalityNormalizationService()
