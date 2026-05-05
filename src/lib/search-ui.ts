export type SearchSource = 'database' | 'real-time' | 'demo-fallback' | null

export function getSearchSourceLabel(source: Exclude<SearchSource, null>) {
  switch (source) {
    case 'database':
      return 'Base de données'
    case 'real-time':
      return 'Scraping live'
    case 'demo-fallback':
      return 'Mode dégradé'
  }
}

