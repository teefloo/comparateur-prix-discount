import dotenv from 'dotenv'
import path from 'path'
import { appendFileSync, writeFileSync } from 'fs'

import { RETAILERS, RETAILER_INFO, SUPPORTED_CATEGORIES, CATEGORY_LABELS, type Retailer, type SupportedCategory } from '../src/lib/catalog'
import { scrapeRetailers } from '../src/lib/scrape-runtime'
import type {
  RetailerCoverageReport,
  ScrapeIssue,
  OfferValidationReport,
} from '../src/lib/types'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const EXPECTED_CATEGORIES: Record<Retailer, SupportedCategory[]> = {
  action: ['alimentation', 'hygiene', 'menage', 'maison-deco', 'bricolage', 'jouets', 'loisirs', 'animaux', 'jardin', 'mode', 'high-tech', 'bazar'],
  stokomani: [...SUPPORTED_CATEGORIES],
  bm: ['maison-deco', 'loisirs', 'alimentation', 'jardin', 'bricolage', 'animaux', 'menage', 'textile', 'high-tech', 'jouets', 'hygiene'],
  centrakor: [...SUPPORTED_CATEGORIES],
  aldi: ['alimentation', 'hygiene', 'menage', 'animaux'],
  gifi: [...SUPPORTED_CATEGORIES],
  lafoirfouille: [...SUPPORTED_CATEGORIES],
  lidl: [...SUPPORTED_CATEGORIES],
}

interface CategoryCoverageEntry {
  category: SupportedCategory
  label: string
  found: number
  expected: boolean
  status: 'ok' | 'missing_expected' | 'unexpected'
}

interface SupervisionReport {
  retailer: Retailer
  retailerName: string
  timestamp: string
  coverage: RetailerCoverageReport
  validation: OfferValidationReport
  issues: ScrapeIssue[]
  errors: string[]
  attempts: number
  durationMs: number
  categoryAnalysis: CategoryCoverageEntry[]
  categoryCoverageRate: number
  anomalyFlags: AnomalyFlag[]
}

interface AnomalyFlag {
  severity: 'critical' | 'warning' | 'info'
  code: string
  message: string
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = (ms / 1000).toFixed(1)
  if (ms < 60000) return `${seconds}s`
  const minutes = Math.floor(ms / 60000)
  const remainingSeconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${remainingSeconds}s`
}

function createEmptyCategoryCounts(): Record<SupportedCategory, number> {
  return SUPPORTED_CATEGORIES.reduce(
    (acc, cat) => { acc[cat] = 0; return acc },
    {} as Record<SupportedCategory, number>,
  )
}

function hasCriticalIssue(issues: ScrapeIssue[]): boolean {
  return issues.some((issue) => issue.severity !== 'warning')
}

function analyzeCategories(
  retailer: Retailer,
  categoryCounts: Record<SupportedCategory, number>,
): { analysis: CategoryCoverageEntry[]; coverageRate: number } {
  const expected = new Set(EXPECTED_CATEGORIES[retailer] || SUPPORTED_CATEGORIES)
  const analysis: CategoryCoverageEntry[] = []
  let expectedPresent = 0
  let expectedTotal = expected.size

  for (const category of SUPPORTED_CATEGORIES) {
    const found = categoryCounts[category] || 0
    const isExpected = expected.has(category)
    let status: 'ok' | 'missing_expected' | 'unexpected'

    if (found > 0 && isExpected) {
      status = 'ok'
      expectedPresent += 1
    } else if (found === 0 && isExpected) {
      status = 'missing_expected'
    } else {
      status = 'unexpected'
      if (found > 0) expectedPresent += 1
    }

    analysis.push({
      category,
      label: CATEGORY_LABELS[category],
      found,
      expected: isExpected,
      status,
    })
  }

  return {
    analysis,
    coverageRate: expectedTotal === 0 ? 100 : Math.round((expectedPresent / expectedTotal) * 100),
  }
}

function detectAnomalies(
  retailer: Retailer,
  coverage: RetailerCoverageReport,
  validation: OfferValidationReport,
  issues: ScrapeIssue[],
  errors: string[],
  categoryAnalysis: CategoryCoverageEntry[],
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = []

  if (errors.length > 0) {
    flags.push({
      severity: 'critical',
      code: 'SCRAPER_ERROR',
      message: `Erreur(s) lors de l'exécution du scraper : ${errors.join(' | ')}`,
    })
  }

  if (!coverage.isComplete) {
    flags.push({
      severity: coverage.collectionRate === 0 ? 'critical' : 'warning',
      code: 'COVERAGE_INCOMPLETE',
      message: `Couverture incomplète : ${coverage.completedListings}/${coverage.discoveredListings} pages traitées (${coverage.collectionRate}%)`,
    })
  }

  if (coverage.collectionRate < 100) {
    flags.push({
      severity: 'warning',
      code: 'PARTIAL_COVERAGE',
      message: `Couverture partielle à ${coverage.collectionRate}% — ${coverage.discoveredListings - coverage.completedListings} page(s) non traitée(s)`,
    })
  }

  if (hasCriticalIssue(issues)) {
    flags.push({
      severity: 'critical',
      code: 'BLOCKING_ISSUES',
      message: `${issues.filter((i) => i.severity !== 'warning').length} problème(s) bloquant(s) détecté(s)`,
    })
  }

  if (issues.filter((i) => i.severity === 'warning').length > 0) {
    flags.push({
      severity: 'warning',
      code: 'NON_BLOCKING_ISSUES',
      message: `${issues.filter((i) => i.severity === 'warning').length} avertissement(s) non bloquant(s)`,
    })
  }

  if (validation.rejectedCount > 0) {
    const rejectionDetails = Object.entries(validation.rejectedReasons)
      .filter(([, count]) => count > 0)
      .map(([reason, count]) => `${reason}=${count}`)
      .join(', ')
    flags.push({
      severity: validation.rejectedCount > validation.validatedCount * 0.1 ? 'critical' : 'warning',
      code: 'VALIDATION_REJECTIONS',
      message: `${validation.rejectedCount}/${validation.rawCount} offre(s) rejetée(s) à la validation (${rejectionDetails})`,
    })
  }

  if (validation.validatedCount === 0 && validation.rawCount > 0) {
    flags.push({
      severity: 'critical',
      code: 'ALL_REJECTED',
      message: `Toutes les ${validation.rawCount} offres brutes ont été rejetées — aucun produit validé`,
    })
  }

  if (validation.validatedCount === 0 && coverage.discoveredListings > 0) {
    flags.push({
      severity: 'critical',
      code: 'ZERO_VALIDATED',
      message: `Aucun produit validé malgré ${coverage.discoveredListings} liste(s) découverte(s)`,
    })
  }

  const missingExpected = categoryAnalysis.filter((c) => c.status === 'missing_expected')
  if (missingExpected.length > 0) {
    flags.push({
      severity: 'warning',
      code: 'MISSING_CATEGORIES',
      message: `Catégorie(s) attendue(s) mais absente(s) : ${missingExpected.map((c) => c.label).join(', ')}`,
    })
  }

  const unexpected = categoryAnalysis.filter((c) => c.status === 'unexpected' && c.found > 0)
  if (unexpected.length > 0) {
    flags.push({
      severity: 'info',
      code: 'UNEXPECTED_CATEGORIES',
      message: `Produit(s) dans des catégories non attendues : ${unexpected.map((c) => `${c.label} (${c.found})`).join(', ')}`,
    })
  }

  if (validation.categoryFallbackCount > validation.validatedCount * 0.2) {
    flags.push({
      severity: 'warning',
      code: 'HIGH_CATEGORY_FALLBACK',
      message: `${validation.categoryFallbackCount}/${validation.validatedCount} produits en fallback catégoriel (> 20%)`,
    })
  }

  if (validation.rejectedCount > validation.rawCount * 0.5) {
    flags.push({
      severity: 'critical',
      code: 'HIGH_REJECTION_RATE',
      message: `Taux de rejet de ${Math.round((validation.rejectedCount / validation.rawCount) * 100)}% — plus de 50% des offres brutes rejetées`,
    })
  }

  return flags
}

function buildReport(result: {
  retailer: Retailer
  offers: { id: string; name: string; category: SupportedCategory; price: number; sourceUrl: string; sourceProductId: string }[]
  report: OfferValidationReport
  issues: ScrapeIssue[]
  coverage: RetailerCoverageReport
  attempts: number
  durationMs: number
  errors: string[]
}): SupervisionReport {
  const { analysis: categoryAnalysis, coverageRate: categoryCoverageRate } = analyzeCategories(
    result.retailer,
    result.report.categoryCounts,
  )

  const anomalyFlags = detectAnomalies(
    result.retailer,
    result.coverage,
    result.report,
    result.issues,
    result.errors,
    categoryAnalysis,
  )

  return {
    retailer: result.retailer,
    retailerName: RETAILER_INFO[result.retailer].name,
    timestamp: new Date().toISOString(),
    coverage: result.coverage,
    validation: result.report,
    issues: result.issues,
    errors: result.errors,
    attempts: result.attempts,
    durationMs: result.durationMs,
    categoryAnalysis,
    categoryCoverageRate,
    anomalyFlags,
  }
}

function formatReportSection(report: SupervisionReport): string {
  const lines: string[] = []
  const separator = '─'.repeat(68)
  const headerSep = '═'.repeat(68)
  const label = `${report.retailerName} (${report.retailer})`

  lines.push(`┌${headerSep}┐`)
  lines.push(`│  RAPPORT DE SUPERVISION — ${label.padEnd(42)}│`)
  lines.push(`└${headerSep}┘`)
  lines.push('')
  lines.push(`  Timestamp        : ${report.timestamp}`)
  lines.push(`  Tentatives       : ${report.attempts}`)
  lines.push(`  Durée            : ${formatDuration(report.durationMs)}`)
  lines.push('')

  lines.push(`┌${separator}┐`)
  lines.push(`│  COUVERTURE SCRAPER${' '.repeat(50)}│`)
  lines.push(`└${separator}┘`)
  lines.push('')
  lines.push(`  Pages / listes découvertes : ${report.coverage.discoveredListings}`)
  lines.push(`  Pages / listes traitées    : ${report.coverage.completedListings}`)
  lines.push(`  Taux de collecte          : ${report.coverage.collectionRate}%`)
  lines.push(`  Collecte complète         : ${report.coverage.isComplete ? 'OUI' : 'NON'}`)
  lines.push('')

  lines.push(`┌${separator}┐`)
  lines.push(`│  VALIDATION PRODUITS${' '.repeat(47)}│`)
  lines.push(`└${separator}┘`)
  lines.push('')
  lines.push(`  Offres brutes      : ${report.validation.rawCount}`)
  lines.push(`  Offres validées    : ${report.validation.validatedCount}`)
  lines.push(`  Offres rejetées    : ${report.validation.rejectedCount}`)
  lines.push('')

  const rejectionEntries = Object.entries(report.validation.rejectedReasons).filter(([, count]) => count > 0)
  if (rejectionEntries.length > 0) {
    lines.push(`  Détail des rejets :`)
    for (const [reason, count] of rejectionEntries) {
      lines.push(`    - ${reason.padEnd(30)} : ${count}`)
    }
    lines.push('')
  }

  lines.push(`┌${separator}┐`)
  lines.push(`│  COUVERTURE CATÉGORIELLE${' '.repeat(42)}│`)
  lines.push(`└${separator}┘`)
  lines.push('')
  lines.push(`  Catégories attendues : ${EXPECTED_CATEGORIES[report.retailer].length}`)
  lines.push(`  Catégories couvertes : ${report.categoryAnalysis.filter((c) => c.found > 0).length}`)
  lines.push(`  Taux de couverture   : ${report.categoryCoverageRate}%`)
  lines.push('')

  lines.push(`  Détail par catégorie :`)
  for (const entry of report.categoryAnalysis) {
    const indicator = entry.status === 'ok' ? '✓' : entry.status === 'missing_expected' ? '✗' : '–'
    const expectedLabel = entry.expected ? '(att.)' : '(inatt.)'
    const countStr = String(entry.found).padStart(5)
    lines.push(`    ${indicator} ${entry.label.padEnd(16)} ${countStr} produits ${expectedLabel}`)
  }
  lines.push('')

  lines.push(`┌${separator}┐`)
  lines.push(`│  QUALITÉ CATÉGORISATION${' '.repeat(42)}│`)
  lines.push(`└${separator}┘`)
  lines.push('')
  lines.push(`  Confiance haute   : ${report.validation.categoryConfidenceCounts.high}`)
  lines.push(`  Confiance moyenne  : ${report.validation.categoryConfidenceCounts.medium}`)
  lines.push(`  Confiance basse    : ${report.validation.categoryConfidenceCounts.low}`)
  lines.push(`  Fallback           : ${report.validation.categoryConfidenceCounts.fallback}`)
  lines.push('')
  lines.push(`  Source native      : ${report.validation.categorySourceCounts.native_mapping}`)
  lines.push(`  Source URL         : ${report.validation.categorySourceCounts.source_path}`)
  lines.push(`  Source tags        : ${report.validation.categorySourceCounts.tags}`)
  lines.push(`  Source texte       : ${report.validation.categorySourceCounts.text}`)
  lines.push(`  Source fallback    : ${report.validation.categorySourceCounts.fallback}`)
  lines.push('')

  if (report.issues.length > 0) {
    lines.push(`┌${separator}┐`)
    lines.push(`│  ISSUES SCRAPER${' '.repeat(50)}│`)
    lines.push(`└${separator}┘`)
    lines.push('')
    for (const issue of report.issues) {
      const severity = issue.severity || 'error'
      const icon = severity === 'warning' ? '⚠' : '✖'
      lines.push(`  ${icon} [${severity}] ${issue.code} : ${issue.message}`)
      if (issue.url) lines.push(`     URL: ${issue.url}`)
      if (issue.category) lines.push(`     Catégorie: ${CATEGORY_LABELS[issue.category] || issue.category}`)
      if (issue.page) lines.push(`     Page: ${issue.page}`)
    }
    lines.push('')
  }

  if (report.errors.length > 0) {
    lines.push(`┌${separator}┐`)
    lines.push(`│  ERREURS D'EXÉCUTION${' '.repeat(45)}│`)
    lines.push(`└${separator}┘`)
    lines.push('')
    for (const error of report.errors) {
      lines.push(`  ✖ ${error}`)
    }
    lines.push('')
  }

  if (report.validation.categoryFallbackExamples.length > 0) {
    lines.push(`┌${separator}┐`)
    lines.push(`│  EXEMPLES DE FALLBACK CATÉGORIEL${' '.repeat(32)}│`)
    lines.push(`└${separator}┘`)
    lines.push('')
    for (const example of report.validation.categoryFallbackExamples) {
      lines.push(`  - ${example.name}`)
      if (example.sourceCategoryPath) lines.push(`    Chemin: ${example.sourceCategoryPath}`)
      if (example.matchedSignals.length > 0) lines.push(`    Signaux: ${example.matchedSignals.join(', ')}`)
    }
    lines.push('')
  }

  lines.push(`┌${separator}┐`)
  lines.push(`│  ANOMALIES ET SIGNALEMENTS${' '.repeat(40)}│`)
  lines.push(`└${separator}┘`)
  lines.push('')

  if (report.anomalyFlags.length === 0) {
    lines.push(`  ✅ Aucune anomalie détectée`)
  } else {
    for (const flag of report.anomalyFlags) {
      const icon = flag.severity === 'critical' ? '🔴 CRITICAL' : flag.severity === 'warning' ? '🟡 WARNING' : '🔵 INFO'
      lines.push(`  ${icon} [${flag.code}]`)
      lines.push(`     ${flag.message}`)
    }
  }
  lines.push('')
  lines.push(`└${'─'.repeat(68)}┘`)
  lines.push('')
  lines.push('')

  return lines.join('\n')
}

function formatSummaryLine(report: SupervisionReport): string {
  const criticalCount = report.anomalyFlags.filter((f) => f.severity === 'critical').length
  const warningCount = report.anomalyFlags.filter((f) => f.severity === 'warning').length
  const status = criticalCount > 0 ? 'ÉCHEC' : warningCount > 0 ? 'ATTENTION' : 'OK'

  return (
    `${report.retailerName.padEnd(16)} ` +
    `validés=${String(report.validation.validatedCount).padStart(5)} ` +
    `rejetés=${String(report.validation.rejectedCount).padStart(3)} ` +
    `collecte=${String(report.coverage.collectionRate).padStart(3)}% ` +
    `catégories=${report.categoryCoverageRate}% ` +
    `anomalies=${criticalCount}C/${warningCount}W ` +
    `durée=${formatDuration(report.durationMs)} ` +
    `→ ${status}`
  )
}

function makeJsonReport(reports: SupervisionReport[]) {
  return {
    timestamp: new Date().toISOString(),
    totalRetailers: reports.length,
    summary: {
      totalValidated: reports.reduce((s, r) => s + r.validation.validatedCount, 0),
      totalRejected: reports.reduce((s, r) => s + r.validation.rejectedCount, 0),
      totalRaw: reports.reduce((s, r) => s + r.validation.rawCount, 0),
      totalDiscovered: reports.reduce((s, r) => s + r.coverage.discoveredListings, 0),
      totalCompleted: reports.reduce((s, r) => s + r.coverage.completedListings, 0),
      retailersWithCriticalIssues: reports.filter((r) => r.anomalyFlags.some((f) => f.severity === 'critical')).map((r) => r.retailer),
      retailersWithWarnings: reports.filter((r) => r.anomalyFlags.some((f) => f.severity === 'warning')).map((r) => r.retailer),
      retailersOk: reports.filter((r) => r.anomalyFlags.length === 0).map((r) => r.retailer),
    },
    retailers: reports.map((r) => ({
      retailer: r.retailer,
      name: r.retailerName,
      coverage: r.coverage,
      validation: {
        rawCount: r.validation.rawCount,
        validatedCount: r.validation.validatedCount,
        rejectedCount: r.validation.rejectedCount,
        rejectedReasons: r.validation.rejectedReasons,
        categoryCounts: r.validation.categoryCounts,
      },
      categoryCoverageRate: r.categoryCoverageRate,
      anomalies: r.anomalyFlags,
      issues: r.issues.map((i) => ({ code: i.code, message: i.message, severity: i.severity })),
      errors: r.errors,
      attempts: r.attempts,
      durationMs: r.durationMs,
    })),
  }
}

async function superviseRetailers(targetRetailers?: Retailer[]) {
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════════════╗')
  console.log('║         RAPPORT DE SUPERVISION — COUVERTURE SCRAPERS              ║')
  console.log('╚════════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Démarrage : ${new Date().toISOString()}`)
  console.log(`Enseignes : ${(targetRetailers || RETAILERS).join(', ')}`)
  console.log('')

  const retailersToScrape = targetRetailers || [...RETAILERS]
  const scrapeResults = await scrapeRetailers({
    retailers: retailersToScrape,
    includeBrowserScrapers: true,
    maxAttempts: 2,
  })

  const reports: SupervisionReport[] = scrapeResults.map(buildReport)
  const fullTextReport: string[] = []

  console.log('')
  console.log('═'.repeat(68))
  console.log('RÉSULTATS PAR ENSEIGNE')
  console.log('═'.repeat(68))
  console.log('')

  for (const report of reports) {
    const section = formatReportSection(report)
    fullTextReport.push(section)
    console.log(formatSummaryLine(report))
  }

  const totalCritical = reports.reduce((s, r) => s + r.anomalyFlags.filter((f) => f.severity === 'critical').length, 0)
  const totalWarnings = reports.reduce((s, r) => s + r.anomalyFlags.filter((f) => f.severity === 'warning').length, 0)
  const totalInfo = reports.reduce((s, r) => s + r.anomalyFlags.filter((f) => f.severity === 'info').length, 0)
  const retailersWithIssues = reports.filter((r) => r.anomalyFlags.length > 0).map((r) => r.retailer)

  console.log('')
  console.log('═'.repeat(68))
  console.log('RÉSUMÉ GLOBAL')
  console.log('═'.repeat(68))
  console.log('')
  console.log(`  Enseignes supervisées   : ${reports.length}`)
  console.log(`  Total produits bruts    : ${reports.reduce((s, r) => s + r.validation.rawCount, 0)}`)
  console.log(`  Total produits validés  : ${reports.reduce((s, r) => s + r.validation.validatedCount, 0)}`)
  console.log(`  Total produits rejetés  : ${reports.reduce((s, r) => s + r.validation.rejectedCount, 0)}`)
  console.log(`  Anomalies critiques     : ${totalCritical}`)
  console.log(`  Avertissements          : ${totalWarnings}`)
  console.log(`  Informations            : ${totalInfo}`)
  console.log('')
  if (retailersWithIssues.length > 0) {
    console.log(`  Enseignes avec anomalies : ${retailersWithIssues.join(', ')}`)
  } else {
    console.log('  ✅ Toutes les enseignes sont conformes — aucune anomalie détectée')
  }
  console.log('')

  const jsonReport = makeJsonReport(reports)
  const textContent = fullTextReport.join('\n')

  writeFileSync(
    path.resolve(process.cwd(), 'supervision-results.json'),
    JSON.stringify(jsonReport, null, 2),
  )
  writeFileSync(
    path.resolve(process.cwd(), 'supervision-report.txt'),
    textContent,
  )
  appendFileSync(
    path.resolve(process.cwd(), 'supervision-history.log'),
    `${new Date().toISOString()} - validés=${jsonReport.summary.totalValidated} rejetés=${jsonReport.summary.totalRejected} critiques=${totalCritical} warnings=${totalWarnings} enseignes_avec_anomalies=${retailersWithIssues.join(',') || 'aucune'}\n`,
  )

  console.log('Rapports sauvegardés :')
  console.log('  - supervision-report.txt (rapport texte détaillé)')
  console.log('  - supervision-results.json (données structurées)')
  console.log('  - supervision-history.log (historique)')
  console.log('')

  const hasCriticalAnomaly = reports.some((r) => r.anomalyFlags.some((f) => f.severity === 'critical'))
  if (hasCriticalAnomaly) {
    console.error('❌ SUPERVISION ÉCHOUÉE — Des anomalies critiques ont été détectées')
    process.exitCode = 1
  } else {
    console.log('✅ SUPERVISION TERMINÉE')
  }
}

const targetRetailer = process.argv[2] as Retailer | undefined
const retailers = targetRetailer
  ? (RETAILERS.includes(targetRetailer as Retailer) ? [targetRetailer as Retailer] : undefined)
  : undefined

if (targetRetailer && !retailers) {
  console.error(`Enseigne "${targetRetailer}" non reconnue. Enseignes disponibles : ${RETAILERS.join(', ')}`)
  process.exitCode = 1
} else {
  superviseRetailers(retailers).catch((error) => {
    console.error('Supervision failed:', error)
    process.exitCode = 1
  })
}
