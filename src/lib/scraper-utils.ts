import { createHash } from 'node:crypto'

import {
  CATEGORY_LABELS,
  RETAILER_INFO,
  SUPPORTED_CATEGORIES,
  isRetailer,
  isSupportedCategory,
  type Retailer,
  type SupportedCategory,
} from './catalog'
import type {
  CategoryFallbackExample,
  CategoryResolutionConfidence,
  CategoryResolutionResult,
  CategoryResolutionSource,
  OfferValidationReport,
  RetailerOfferCard,
  ScrapePipelineResult,
  ScrapedOffer,
  ValidatedOffer,
} from './types'

export * from './types'

type KeywordDefinition = string

export interface ResolveScrapedOfferCategoryInput {
  retailer: Retailer
  sourceUrl?: string | null
  sourceCategoryPath?: string | null
  nativeCategory?: string | null
  name?: string | null
  brand?: string | null
  description?: string | null
  availability?: string | null
  tags?: Array<string | null | undefined>
}

const CATEGORY_KEYWORDS: Record<SupportedCategory, KeywordDefinition[]> = {
  hygiene: [
    'desodorisant',
    'deodorant',
    'parfum',
    'eau de toilette',
    'eau de parfum',
    'shampoing',
    'shampooing',
    'gel douche',
    'savon',
    'dentifrice',
    'brosse a dents',
    'maquillage',
    'lingette',
    'mouchoir',
    'coton tige',
    'ongles',
    'barbe',
    'cheveux',
    'massage',
    'gua sha',
    'pilulier',
    'bigoudi',
    'pese personne',
    'tondeuse',
    'serviette hygienique',
    'tampon',
    'protege slip',
    'beaute',
    'hygiene',
  ],
  alimentation: [
    'boisson',
    'soda',
    'eau minerale',
    'jus',
    'sirop',
    'cafe',
    'the',
    'biere',
    'vin',
    'biscuit',
    'gateau',
    'chocolat',
    'bonbon',
    'confiserie',
    'chips',
    'snack',
    'pates',
    'riz',
    'cereale',
    'farine',
    'huile',
    'vinaigre',
    'sauce',
    'epice',
    'lait',
    'yaourt',
    'fromage',
    'viande',
    'poisson',
    'legume',
    'fruit',
    'conserve',
    'surgele',
    'surgelee',
    'aperitif',
    'cola',
    'coca',
    'fanta',
    'pepsi',
    'gouter',
    'jambon',
    'burrata',
    'flammekueche',
    'nuggets',
    'crottin',
    'comte',
    'camembert',
    'chaource',
    'gnocchi',
    'carbonara',
    'bolognaise',
    'alimentation',
  ],
  menage: [
    'lessive',
    'detergent',
    'assouplissant',
    'lave vaisselle',
    'adoucissant',
    'nettoyant',
    'vitre',
    'sol',
    'eponge',
    'balai',
    'serpillere',
    'brosse',
    'papier toilette',
    'essuie tout',
    'sac poubelle',
    'javel',
    'detachant',
    'detachante',
    'detacheur',
    'anti calcaire',
    'deboucheur',
    'bloc wc',
    'blocs wc',
    'wc',
    'entretien',
    'rangement',
    'menage',
  ],
  'maison-deco': [
    'decoration',
    'deco',
    'cadre',
    'vase',
    'bougie',
    'rideau',
    'voilage',
    'coussin',
    'plaid',
    'lampe',
    'miroir',
    'tapis',
    'panier',
    'vannerie',
    'statuette',
    'figurine',
    'horloge',
  ],
  jardin: [
    'jardin',
    'plage',
    'piscine',
    'balcon',
    'terrasse',
    'pot de fleurs',
    'pot de fleur',
    'semence',
    'graines',
    'plante',
    'fleurs',
    'rateau',
    'pelle',
    'beche',
    'arrosoir',
    'tuyau',
    'salon de jardin',
    'chaise longue',
    'parasol',
  ],
  bricolage: [
    'bricolage',
    'outillage',
    'tournevis',
    'cle',
    'marteau',
    'perceuse',
    'vis',
    'clou',
    'boulon',
    'ecrou',
    'adhesif',
    'colle',
    'peinture',
    'cheville',
    'ruban',
    'diy',
    'brico',
  ],
  loisirs: [
    'loisir',
    'loisirs',
    'jeu',
    'jeux',
    'puzzle',
    'cartes',
    'sport',
    'fitness',
    'yoga',
    'velo',
    'bicycle',
    'papeterie',
  ],
  animaux: [
    'animal',
    'animaux',
    'chat',
    'chien',
    'poisson',
    'oiseau',
    'rongeur',
    'niche',
    'litiere',
    'gamelle',
    'crocquettes',
    'patee',
    'collier',
    'laisse',
    'harnais',
    'griffoir',
    'aquarium',
    'animalerie',
  ],
  textile: [
    'textile',
    'vetement',
    'chaussette',
    'sous vetement',
    'culotte',
    't shirt',
    'pull',
    'gilet',
    'pantalon',
    'jupe',
    'robe',
    'manteau',
    'veste',
    'casquette',
    'bonnet',
    'echarpe',
    'gant',
    'lingerie',
    'pyjama',
    'chaussons',
    'linge de maison',
    'drap',
    'couette',
    'oreiller',
  ],
  mode: [
    'mode',
    'hauts',
    'bas',
    'chaussure',
    'sac',
    'bagagerie',
    'valise',
    'trousse',
    'lunettes',
    'etui a lunettes',
    'ceinture',
    'montre',
    'bijoux',
    'bijouterie',
    ' bracelet',
    'collier',
    'boucle oreille',
    'anneau',
    'lili marelle',
    'sergio tacchini',
    'manoukian',
    'lee cooper',
    'la city',
    'la fabrique des garçons',
    'essentiel',
    'enfant mode',
    'mode femme',
    'mode homme',
    'mode enfant',
  ],
  'high-tech': [
    'high tech',
    'high-tech',
    'telephone',
    'smartphone',
    'tablette',
    'ordinateur',
    'portable',
    'chargeur',
    'casque',
    'audio',
    'haut parleur',
    'speaker',
    'bluetooth',
    'usb',
    'cable',
    'prise',
    'adaptateur',
    'multimedia',
    'multimédia',
    'electronique',
    'radio',
    'reveil',
  ],
  bazar: [
    'bazar',
    'ustensile',
    'cuisine',
    'cuisson',
    'vaisselle',
    'casserolle',
    'poele',
    'casserole',
    'marmite',
    'faitout',
    'wok',
    'plat',
    'bol',
    'bocal',
    'assiette',
    'tasse',
    'verre',
    'tasse',
    'couvert',
    'couteau',
    'fourchette',
    'spoon',
    'etable',
    'planche',
    'moule',
    'baking',
    'pichet',
    'carafe',
    'bouteille',
    'conserving',
    'tupperware',
    'container',
    'range',
    'organizer',
    'poubelle',
    'seau',
    'bassine',
    'cuvette',
    'panier',
    'corbeille',
    'mobilier',
    'table',
    'chaise',
    'tabouret',
    'etagere',
    'tiroir',
    'commode',
    'armoire',
    'paque',
    'pique nique',
    'camping',
    'barbecue',
    'plancha',
    'noel',
    'fetes',
    'ceremonie',
    'fête',
  ],
  jouets: [
    'jouet',
    'jouets',
    'playmobil',
    'lego',
    'poupee',
    'peluche',
    'voiture',
    'camion',
    'train',
    'avion',
    'helicoptere',
    'bateau',
    'figurine',
    'super heros',
    'barbie',
    'nerf',
    'ballon',
    'raquette',
    'balle',
    'but',
    'panier basket',
    'skate',
    'trottinette',
    'skateboard',
    'velo enfant',
    'puériculture',
    'bebe',
    'baby',
    'nounours',
    'doudou',
    'puericulture',
  ],
}

const SHORT_KEYWORDS = new Set([
  'jeu',
  'riz',
  'the',
  'vin',
  'jus',
  'diy',
])

const AMBIGUOUS_KEYWORD_WEIGHTS = new Map<string, number>([
  ['poisson', 2],
  ['panier', 2],
  ['brosse', 2],
  ['jeu', 2],
  ['jeux', 2],
  ['rangement', 2],
  ['cuisine', 2],
  ['table', 2],
  ['chaise', 2],
  ['portable', 2],
])

const TEXT_CATEGORY_BASE_WEIGHT = 8
const PATH_CATEGORY_BASE_WEIGHT = 18
const TAG_CATEGORY_BASE_WEIGHT = 14
const NATIVE_MAPPING_BASE_WEIGHT = 90

const GENERIC_SOURCE_PATH_HINTS: Array<{ category: SupportedCategory; patterns: string[] }> = [
  { category: 'hygiene', patterns: ['hygiene', 'beaute', 'soin', 'dentaire', 'parapharmacie', 'bebe'] },
  {
    category: 'alimentation',
    patterns: [
      'alimentation',
      'epicerie',
      'boisson',
      'charcuterie',
      'produits laitiers',
      'pain viennoiserie',
      'surgeles',
      'viande poisson',
      'vin alcool',
      'aperitif',
    ],
  },
  { category: 'menage', patterns: ['menage', 'entretien', 'nettoyage', 'lessive', 'papier toilette'] },
  { category: 'maison-deco', patterns: ['deco', 'decoration', 'habitat', 'maison', 'mobilier'] },
  { category: 'jardin', patterns: ['jardin', 'plein air', 'terrasse', 'balcon', 'piscine'] },
  { category: 'bricolage', patterns: ['bricolage', 'outillage', 'brico', 'diy'] },
  { category: 'loisirs', patterns: ['loisirs', 'loisir', 'hobby', 'papeterie', 'sport', 'cadeau'] },
  { category: 'animaux', patterns: ['animalerie', 'animaux', 'animal', 'chien', 'chat'] },
  { category: 'textile', patterns: ['linge de maison', 'textile', 'drap', 'couette', 'oreiller'] },
  { category: 'mode', patterns: ['mode', 'vetement', 'chaussure', 'sac', 'bijou', 'bagagerie'] },
  { category: 'high-tech', patterns: ['multimedia', 'electronique', 'high tech', 'audio', 'telephone'] },
  { category: 'bazar', patterns: ['cuisine', 'ustensile', 'vaisselle', 'camping', 'barbecue'] },
  { category: 'jouets', patterns: ['jouet', 'jouets', 'univers enfant', 'playmobil', 'lego'] },
]

const RETAILER_NATIVE_CATEGORY_HINTS: Record<Retailer, Array<{ category: SupportedCategory; patterns: string[] }>> = {
  action: [
    { category: 'alimentation', patterns: ['boissons alimentation'] },
    { category: 'hygiene', patterns: ['hygiene beaute'] },
    { category: 'menage', patterns: ['articles menagers'] },
    { category: 'maison-deco', patterns: ['habitat'] },
    { category: 'bricolage', patterns: ['bricolage'] },
    { category: 'jouets', patterns: ['jouets'] },
    { category: 'loisirs', patterns: ['papeterie bureau', 'hobby'] },
    { category: 'animaux', patterns: ['animaux domestiques'] },
    { category: 'jardin', patterns: ['jardin'] },
    { category: 'mode', patterns: ['mode'] },
    { category: 'high-tech', patterns: ['multimedia'] },
    { category: 'bazar', patterns: ['cuisine'] },
  ],
  bm: [
    { category: 'maison-deco', patterns: ['maison deco', 'mobilier', 'decoration'] },
    { category: 'loisirs', patterns: ['loisirs fetes cadeaux', 'idee cadeau'] },
    { category: 'alimentation', patterns: ['alimentation boisson'] },
    { category: 'jardin', patterns: ['jardin plein air'] },
    { category: 'bricolage', patterns: ['brico auto'] },
    { category: 'animaux', patterns: ['animalerie'] },
    { category: 'menage', patterns: ['rangement entretien'] },
    { category: 'textile', patterns: ['textile de maison'] },
    { category: 'high-tech', patterns: ['multimedia electronique'] },
    { category: 'jouets', patterns: ['jeu jouet'] },
    { category: 'hygiene', patterns: ['hygiene soin'] },
  ],
  centrakor: [
    { category: 'hygiene', patterns: ['bain et beaute'] },
    { category: 'alimentation', patterns: ['alimentation', 'epicerie', 'boisson'] },
    { category: 'menage', patterns: ['rangement', 'entretien', 'menage'] },
    { category: 'maison-deco', patterns: ['deco', 'decoration', 'maison'] },
    { category: 'jardin', patterns: ['jardin', 'plein air', 'saison ete'] },
    { category: 'bricolage', patterns: ['bricolage', 'outillage'] },
    { category: 'loisirs', patterns: ['loisir', 'papeterie'] },
    { category: 'animaux', patterns: ['animalerie'] },
    { category: 'textile', patterns: ['linge de maison', 'textile'] },
    { category: 'mode', patterns: ['mode', 'chaussure', 'sac', 'bijou'] },
    { category: 'high-tech', patterns: ['multimedia', 'electronique', 'telephone'] },
    { category: 'bazar', patterns: ['cuisine', 'ustensile', 'camping'] },
    { category: 'jouets', patterns: ['jouet', 'jouets', 'playmobil', 'lego'] },
  ],
  stokomani: [
    { category: 'hygiene', patterns: ['hygiene', 'beaute', 'soin', 'bebe'] },
    { category: 'alimentation', patterns: ['alimentation', 'epicerie', 'boisson', 'aperitif'] },
    { category: 'menage', patterns: ['menage', 'entretien', 'nettoyage'] },
    { category: 'maison-deco', patterns: ['deco', 'decoration', 'maison', 'mobilier'] },
    { category: 'jardin', patterns: ['jardin', 'plein air', 'terrasse'] },
    { category: 'bricolage', patterns: ['bricolage', 'outillage'] },
    { category: 'loisirs', patterns: ['loisir', 'sport', 'papeterie', 'cadeau'] },
    { category: 'animaux', patterns: ['animalerie', 'chien', 'chat'] },
    { category: 'textile', patterns: ['linge de maison', 'textile'] },
    { category: 'mode', patterns: ['mode', 'vetement', 'chaussure', 'bijou'] },
    { category: 'high-tech', patterns: ['multimedia', 'electronique', 'audio', 'telephone'] },
    { category: 'bazar', patterns: ['cuisine', 'ustensile', 'vaisselle', 'camping'] },
    { category: 'jouets', patterns: ['jouet', 'jouets', 'playmobil', 'lego'] },
  ],
  aldi: [
    {
      category: 'alimentation',
      patterns: [
        'viande poisson',
        'produits laitiers',
        'charcuterie',
        'epicerie salee',
        'epicerie sucree',
        'pain viennoiserie',
        'surgeles',
        'boissons',
        'biere vin alcool',
        'recompenses',
        'marque aldi vs grandes marques',
      ],
    },
    { category: 'hygiene', patterns: ['hygiene beaute bebe'] },
    { category: 'menage', patterns: ['entretien'] },
    { category: 'animaux', patterns: ['animalerie'] },
    { category: 'bazar', patterns: ['maison loisirs dupes pepites', 'nouveau look'] },
  ],
  gifi: [
    { category: 'hygiene', patterns: ['salle de bain beaute et bien etre', 'beaute', 'bien etre', 'dentaire', 'maquillage'] },
    {
      category: 'alimentation',
      patterns: ['bonbon boisson et alimentaire', 'alimentaire', 'epicerie', 'boisson', 'gourmandise'],
    },
    {
      category: 'menage',
      patterns: ['rangement et entretien', 'nettoyage et entretien', 'entretien du linge', 'droguerie'],
    },
    {
      category: 'maison-deco',
      patterns: ['meuble et deco', 'decoration', 'objet deco', 'luminaire', 'linge de maison', 'rideau', 'voilage'],
    },
    {
      category: 'jardin',
      patterns: ['exterieur et animalerie', 'mobilier exterieur', 'jardin', 'piscine', 'plage'],
    },
    {
      category: 'bricolage',
      patterns: ['bricolage', 'outils bricolage', 'quincaillerie', 'peinture', 'colle et adhesif'],
    },
    {
      category: 'loisirs',
      patterns: ['loisirs', 'jeux et jouets', 'jeux de societe', 'papeterie', 'fete et cadeaux'],
    },
    {
      category: 'animaux',
      patterns: ['animalerie', 'chien', 'chat', 'oiseau', 'rongeur', 'poisson'],
    },
    {
      category: 'textile',
      patterns: ['linge de lit', 'linge de toilette', 'linge de maison', 'textile'],
    },
    {
      category: 'mode',
      patterns: ['bagagerie et vetements', 'vetements chaussures et accessoires', 'bijoux fantaisie'],
    },
    {
      category: 'high-tech',
      patterns: ['multimedia et divertissement', 'image et son', 'informatique', 'gadget', 'objet connecte'],
    },
    {
      category: 'bazar',
      patterns: ['table et cuisine', 'vaisselle', 'conservation alimentaire', 'cuisson', 'preparation culinaire'],
    },
    { category: 'jouets', patterns: ['jouets', 'jeux et jouets', 'puericulture', 'eveil'] },
  ],
  lafoirfouille: [
    { category: 'hygiene', patterns: ['beaute', 'bien etre', 'mobilite', 'salle de bain', 'dentaire', 'maquillage'] },
    { category: 'alimentation', patterns: ['aperitif', 'alimentaire', 'boisson', 'confiserie', 'bonbon'] },
    { category: 'menage', patterns: ['rangement et entretien', 'rangement entretien', 'entretien', 'nettoyage', 'buanderie'] },
    { category: 'maison-deco', patterns: ['decoration', 'deco', 'mobilier', 'luminaire', 'objets decoration'] },
    { category: 'jardin', patterns: ['plein air', 'jardin', 'piscine', 'barbecue', 'amenagement du jardin'] },
    { category: 'bricolage', patterns: ['bricolage', 'outillage', 'auto', 'bricolage et jardin'] },
    { category: 'loisirs', patterns: ['loisir et jeux', 'loisirs jeux', 'festif', 'fetes receptions', 'papeterie', 'sport'] },
    { category: 'animaux', patterns: ['animalerie', 'chiens', 'chats', 'oiseaux', 'animaux'] },
    { category: 'textile', patterns: ['linge de maison', 'linge de lit', 'linge de bain', 'textile de maison', 'rideaux'] },
    { category: 'mode', patterns: ['beaute et mode', 'mode', 'vetement', 'chaussure', 'bagagerie'] },
    { category: 'high-tech', patterns: ['high tech', 'hifi video', 'hifi et video', 'telephonie', 'accessoires telephone'] },
    { category: 'bazar', patterns: ['cuisine', 'vaisselle', 'art de la table', 'conservation cuisine', 'petit electromenager'] },
    { category: 'jouets', patterns: ['jouets', 'jeux enfant', 'jeux exterieurs', 'jeux de societe', 'peluche'] },
  ],
  maxibazar: [
    { category: 'hygiene', patterns: ['bien etre et beaute', 'beaute', 'bien etre', 'dentaire', 'salle de bain'] },
    { category: 'menage', patterns: ['utilitaire de la maison', 'utilitaire', 'rangement', 'dressings', 'salle de bain'] },
    { category: 'maison-deco', patterns: ['mobilier interieur', 'amenagement interieur', 'decoration', 'meubles', 'salon', 'chambre', 'tapis', 'noel'] },
    { category: 'jardin', patterns: ['amenagement exterieur', 'mobilier de jardin', 'outdoor', 'assises pour exterieur', 'terrasse', 'jardin'] },
    { category: 'bricolage', patterns: ['fixation', 'accessoires electriques', 'bricolage', 'outillage', 'outils'] },
    { category: 'loisirs', patterns: ['produits loisirs', 'activites en plein air', 'loisirs'] },
    { category: 'animaux', patterns: ['animaux', 'chien', 'chat', 'oiseau'] },
    { category: 'textile', patterns: ['linge de maison', 'tapis', 'rideaux', 'drap', 'couette'] },
    { category: 'mode', patterns: ['voyage et mode', 'mode', 'bagagerie', 'voyage'] },
    { category: 'high-tech', patterns: ['bluetooth', 'audio', 'radio', 'reveil', 'telephone', 'multimedia', 'electronique'] },
    { category: 'bazar', patterns: ['tout pour la cuisine', 'art de la table', 'utilitaire de la maison', 'cuisine', 'bazar', 'rangements'] },
    { category: 'jouets', patterns: ['univers enfant', 'enfants', 'puericulture', 'activites en plein air', 'enfant'] },
  ],
  lidl: [
    { category: 'alimentation', patterns: ['alimentation boissons', 'fruits et legumes', 'pains viennoiseries', 'oeufs et produits secs', 'fromages produits laitiers', 'viandes et charcuteries', 'poissons et crustaces', 'cafe the cacao', 'confitures pates a tartiner', 'huiles conserves', 'sauces epices', 'plats prepares', 'produits surgeles', 'epicerie et sucreries', 'vins et spiritueux', 'boissons'] },
    { category: 'hygiene', patterns: ['hygiene et beaute', 'beaute soins du corps', 'sante et bien etre'] },
    { category: 'menage', patterns: ['cuisine menage', 'rangement et organisation', 'appareils de nettoyage', 'lavage repassage', 'couloir espace de stockage'] },
    { category: 'maison-deco', patterns: ['maison amenagement', 'decoration', 'chambre a coucher', 'salle de bain', 'salon', 'bureau', 'cuisine salle a manger', 'luminaire eclairage', 'linge de maison', 'chauffage climatisation'] },
    { category: 'jardin', patterns: ['jardin terrasse', 'fleurs plantes accessoires'] },
    { category: 'bricolage', patterns: ['bricolage jardinage', 'outils sans fil', 'outils electriques', 'outils de jardinage', 'atelier quincaillerie', 'construire renover', 'voiture moto', 'abris jardin toit'] },
    { category: 'loisirs', patterns: ['sports loisirs', 'vetements de sport', 'camping plein air', 'fitness', 'velo', 'sports nautiques', 'course a pied', 'loisirs sports d equipe', 'sports d hiver'] },
    { category: 'animaux', patterns: ['animaux'] },
    { category: 'textile', patterns: ['linge de maison'] },
    { category: 'mode', patterns: ['mode pour femme', 'mode pour homme', 'chaussures accessoires', 'vetements pour enfants 9 15 ans', 'valises accessoires de voyage'] },
    { category: 'high-tech', patterns: ['multimedia'] },
    { category: 'bazar', patterns: ['cuisine patisserie', 'l art de la table la vaisselle', 'barbecue accessoires', 'cuisine salle a manger', 'cuisine menage'] },
    { category: 'jouets', patterns: ['jouets', 'education loisirs creatifs', 'equipement pour bebes et enfants', 'jeux de construction', 'jeux de societe', 'poupees', 'peluches'] },
  ],
  noz: [
    { category: 'alimentation', patterns: ['alimentaire', 'alimentaire boissons'] },
    { category: 'mode', patterns: ['mode'] },
  ],
}

type CategorySignal = {
  category: SupportedCategory
  source: Exclude<CategoryResolutionSource, 'fallback'>
  weight: number
  signal: string
}

function createEmptyCategoryConfidenceCounts(): Record<CategoryResolutionConfidence, number> {
  return {
    high: 0,
    medium: 0,
    low: 0,
    fallback: 0,
  }
}

function createEmptyCategorySourceCounts(): Record<CategoryResolutionSource, number> {
  return {
    native_mapping: 0,
    source_path: 0,
    tags: 0,
    text: 0,
    fallback: 0,
  }
}

function keywordWeight(keyword: string, baseWeight: number) {
  const normalizedKeyword = normalizeSearchQuery(keyword)
  const explicitWeight = AMBIGUOUS_KEYWORD_WEIGHTS.get(normalizedKeyword)
  if (explicitWeight) {
    return explicitWeight
  }

  return keyword.includes(' ') ? baseWeight + 4 : baseWeight
}

function createCategorySignalBuckets() {
  return SUPPORTED_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = []
      return acc
    },
    {} as Record<SupportedCategory, CategorySignal[]>,
  )
}

function addSignal(
  buckets: Record<SupportedCategory, CategorySignal[]>,
  category: SupportedCategory,
  source: Exclude<CategoryResolutionSource, 'fallback'>,
  weight: number,
  signal: string,
) {
  if (!signal || weight <= 0) {
    return
  }

  buckets[category].push({
    category,
    source,
    weight,
    signal,
  })
}

function scoreKeywordMatches(
  buckets: Record<SupportedCategory, CategorySignal[]>,
  category: SupportedCategory,
  source: Exclude<CategoryResolutionSource, 'fallback'>,
  text: string,
  baseWeight: number,
) {
  if (!text) {
    return
  }

  for (const keyword of CATEGORY_KEYWORDS[category]) {
    const normalizedKeyword = normalizeSearchQuery(keyword)
    if (!normalizedKeyword || !containsKeyword(text, normalizedKeyword)) {
      continue
    }

    addSignal(buckets, category, source, keywordWeight(normalizedKeyword, baseWeight), normalizedKeyword)
  }
}

function scoreCategoryHints(
  buckets: Record<SupportedCategory, CategorySignal[]>,
  source: Exclude<CategoryResolutionSource, 'fallback'>,
  haystack: string,
  definitions: Array<{ category: SupportedCategory; patterns: string[] }>,
  weight: number,
) {
  if (!haystack) {
    return
  }

  for (const definition of definitions) {
    for (const pattern of definition.patterns) {
      const normalizedPattern = normalizeSearchQuery(pattern)
      if (!normalizedPattern || !haystack.includes(normalizedPattern)) {
        continue
      }

      addSignal(buckets, definition.category, source, weight, normalizedPattern)
    }
  }
}

function rankCategorySignals(buckets: Record<SupportedCategory, CategorySignal[]>) {
  return SUPPORTED_CATEGORIES.map((category) => {
    const signals = buckets[category].sort((left, right) => right.weight - left.weight || left.signal.localeCompare(right.signal))
    const score = signals.reduce((sum, signal) => sum + signal.weight, 0)

    return {
      category,
      score,
      signals,
    }
  }).sort((left, right) => right.score - left.score || right.signals.length - left.signals.length)
}

function buildMatchedSignals(signals: CategorySignal[]) {
  const uniqueSignals = new Set<string>()

  for (const signal of signals) {
    uniqueSignals.add(`${signal.source}:${signal.signal}`)
    if (uniqueSignals.size >= 6) {
      break
    }
  }

  return Array.from(uniqueSignals)
}

function inferResolutionConfidence(topScore: number, secondScore: number, topSignal?: CategorySignal): CategoryResolutionConfidence {
  if (!topSignal || topScore <= 0) {
    return 'fallback'
  }

  if (topSignal.source === 'native_mapping' || topScore >= 110 || topScore - secondScore >= 60) {
    return 'high'
  }

  if (topScore >= 40 || topScore - secondScore >= 20) {
    return 'medium'
  }

  return 'low'
}

function buildGenericCategoryBuckets(
  textValues: Array<string | null | undefined>,
  sourceCategoryPath?: string | null,
) {
  const buckets = createCategorySignalBuckets()
  const normalizedSourcePath = normalizeSearchQuery(sourceCategoryPath || '')
  const normalizedText = normalizeSearchQuery(textValues.filter(Boolean).join(' '))

  scoreCategoryHints(buckets, 'source_path', normalizedSourcePath, GENERIC_SOURCE_PATH_HINTS, PATH_CATEGORY_BASE_WEIGHT)

  for (const category of SUPPORTED_CATEGORIES) {
    scoreKeywordMatches(buckets, category, 'source_path', normalizedSourcePath, PATH_CATEGORY_BASE_WEIGHT)
    scoreKeywordMatches(buckets, category, 'text', normalizedText, TEXT_CATEGORY_BASE_WEIGHT)
  }

  return buckets
}

function hashToId(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${((Number.parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16)}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-')
}

function incrementReason(map: Record<string, number>, reason: string) {
  map[reason] = (map[reason] || 0) + 1
}

function buildEmptyCategoryCounts(): Record<SupportedCategory, number> {
  return SUPPORTED_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = 0
      return acc
    },
    {} as Record<SupportedCategory, number>,
  )
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false

  if (keyword.includes(' ') || keyword.includes('-')) {
    return text.includes(keyword)
  }

  if (keyword.length <= 4 || SHORT_KEYWORDS.has(keyword)) {
    const regex = new RegExp(`(^|\\s)${keyword}s?($|\\s)`, 'i')
    return regex.test(text)
  }

  return text.includes(keyword)
}

function cleanNullableText(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined

  const cleaned = value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || undefined
}

function normalizeQuantityUnit(value: number, unit: string): { baseValue: number; label: string } | null {
  if (!Number.isFinite(value) || value <= 0) return null

  const normalizedUnit = normalizeSearchQuery(unit)

  if (normalizedUnit === 'ml') return { baseValue: value / 1000, label: '/l' }
  if (normalizedUnit === 'cl') return { baseValue: value / 100, label: '/l' }
  if (normalizedUnit === 'l' || normalizedUnit === 'litre' || normalizedUnit === 'litres') {
    return { baseValue: value, label: '/l' }
  }
  if (normalizedUnit === 'g') return { baseValue: value / 1000, label: '/kg' }
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogramme' || normalizedUnit === 'kilogrammes') {
    return { baseValue: value, label: '/kg' }
  }
  if (
    normalizedUnit === 'pc' ||
    normalizedUnit === 'pcs' ||
    normalizedUnit === 'piece' ||
    normalizedUnit === 'pieces' ||
    normalizedUnit === 'unite' ||
    normalizedUnit === 'unites'
  ) {
    return { baseValue: value, label: '/pcs' }
  }

  return null
}

function parseQuantityToBaseUnit(quantity: string | null | undefined) {
  const normalized = cleanNullableText(quantity)?.replace(/,/g, '.').toLowerCase() || ''
  if (!normalized) return null

  const packMatch = normalized.match(/\b(\d+)\s*[x*]\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl)\b/)
  if (packMatch) {
    const count = Number.parseFloat(packMatch[1])
    const value = Number.parseFloat(packMatch[2])
    const parsed = normalizeQuantityUnit(count * value, packMatch[3])
    if (parsed) {
      return parsed
    }
  }

  const standardMatch = normalized.match(
    /\b(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl|pc|pcs|piece|pieces|unite|unites)\b/,
  )
  if (standardMatch) {
    return normalizeQuantityUnit(Number.parseFloat(standardMatch[1]), standardMatch[2])
  }

  const lotMatch =
    normalized.match(/\b(?:lot de|x)\s*(\d+)\b/) || normalized.match(/\b(\d+)\s*(?:pcs?|pieces?|pc)\b/)
  if (lotMatch) {
    return normalizeQuantityUnit(Number.parseFloat(lotMatch[1]), 'pcs')
  }

  return null
}

export function normalizeRetailerSelection(value: string | string[] | null | undefined): Retailer[] {
  const rawValues = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return rawValues.map((entry) => entry.trim()).filter((entry): entry is Retailer => isRetailer(entry))
}

export function cleanDisplayText(value: string | null | undefined): string {
  return cleanNullableText(value) || ''
}

export function normalizeSearchQuery(query: string): string {
  return String(query || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const STOKOMANI_NAME_PREFIX_RE = /^(?:stockomani|stokomani)\s*[-:]?\s+/i

export function normalizeRetailerProductName(retailer: Retailer, value: string | null | undefined): string {
  const cleaned = cleanDisplayText(value)
  if (!cleaned) {
    return ''
  }

  if (retailer === 'stokomani') {
    const stripped = cleaned.replace(STOKOMANI_NAME_PREFIX_RE, '').trim()
    return stripped || cleaned
  }

  return cleaned
}

export function normalizeRetailerBrand(
  retailer: Retailer,
  value: string | null | undefined,
): string | undefined {
  const cleaned = cleanNullableText(value)
  if (!cleaned) {
    return undefined
  }

  if (retailer === 'stokomani') {
    const normalized = normalizeSearchQuery(cleaned)
    if (normalized === 'stokomani' || normalized === 'stockomani') {
      return undefined
    }
  }

  return cleaned
}

export function toValidPrice(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    return Math.round(value * 100) / 100
  }

  if (typeof value !== 'string') return null

  const normalized = value
    .replace(/\u00a0/g, ' ')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.')
    .trim()

  if (!normalized) return null

  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return Math.round(parsed * 100) / 100
}

export function extractPrice(priceStr: string): number | null {
  const match = cleanDisplayText(priceStr).replace(',', '.').match(/(\d+[.,]?\d{0,2})/)
  return match ? toValidPrice(match[1]) : null
}

export function inferCategoryFromText(...values: Array<string | null | undefined>): SupportedCategory | null {
  const ranked = rankCategorySignals(buildGenericCategoryBuckets(values))
  return ranked[0]?.score ? ranked[0].category : null
}

export function resolveOfferCategory(options: {
  explicitCategory?: string | null
  sourceCategoryPath?: string | null
  textValues?: Array<string | null | undefined>
}): SupportedCategory | null {
  if (isSupportedCategory(options.explicitCategory)) {
    return options.explicitCategory
  }

  const ranked = rankCategorySignals(buildGenericCategoryBuckets(options.textValues || [], options.sourceCategoryPath))
  return ranked[0]?.score ? ranked[0].category : null
}

function buildNozPreciseNativeContext(...values: Array<string | null | undefined>) {
  const normalized = normalizeSearchQuery(values.filter(Boolean).join(' '))
  const contexts: string[] = []

  if (normalized.includes('alimentaire')) {
    contexts.push('alimentaire')
  }

  if (normalized.includes('mode')) {
    contexts.push('mode')
  }

  return contexts.join(' ')
}

function resolveNozFallbackCategory(...values: Array<string | null | undefined>): SupportedCategory | null {
  const normalized = normalizeSearchQuery(values.filter(Boolean).join(' '))

  if (!normalized) return null
  if (normalized.includes('alimentaire') || normalized.includes('surgele')) return 'alimentation'
  if (normalized.includes('mode')) return 'mode'
  if (normalized.includes('hygiene') || normalized.includes('beaute')) return 'hygiene'
  if (normalized.includes('bazar')) return 'bazar'

  return null
}

export function resolveScrapedOfferCategory(input: ResolveScrapedOfferCategoryInput): CategoryResolutionResult {
  const buckets = createCategorySignalBuckets()
  const normalizedSourceUrl = normalizeSearchQuery(input.sourceUrl || '')
  let normalizedSourcePath = normalizeSearchQuery(input.sourceCategoryPath || '')
  let normalizedNativeCategory = normalizeSearchQuery(input.nativeCategory || '')
  const normalizedTags = normalizeSearchQuery((input.tags || []).filter(Boolean).join(' '))
  const normalizedText = normalizeSearchQuery(
    [input.name, input.brand, input.description, input.availability].filter(Boolean).join(' '),
  )

  if (input.retailer === 'noz') {
    const nozNativeContext = buildNozPreciseNativeContext(normalizedSourcePath, normalizedNativeCategory)
    normalizedSourcePath = nozNativeContext
    normalizedNativeCategory = nozNativeContext
  }

  const nativeHaystack = [normalizedSourceUrl, normalizedSourcePath, normalizedNativeCategory].filter(Boolean).join(' ')
  const sourceContext = [normalizedSourcePath, normalizedNativeCategory, normalizedSourceUrl].filter(Boolean).join(' ')
  scoreCategoryHints(
    buckets,
    'native_mapping',
    nativeHaystack,
    RETAILER_NATIVE_CATEGORY_HINTS[input.retailer],
    NATIVE_MAPPING_BASE_WEIGHT,
  )
  scoreCategoryHints(buckets, 'source_path', sourceContext, GENERIC_SOURCE_PATH_HINTS, PATH_CATEGORY_BASE_WEIGHT)

  for (const category of SUPPORTED_CATEGORIES) {
    scoreKeywordMatches(buckets, category, 'source_path', sourceContext, PATH_CATEGORY_BASE_WEIGHT)
    scoreKeywordMatches(buckets, category, 'tags', normalizedTags, TAG_CATEGORY_BASE_WEIGHT)
    scoreKeywordMatches(buckets, category, 'text', normalizedText, TEXT_CATEGORY_BASE_WEIGHT)
  }

  const ranked = rankCategorySignals(buckets)
  const top = ranked[0]
  const runnerUp = ranked[1]

  if (!top || top.score <= 0) {
    const nozFallbackCategory =
      input.retailer === 'noz' ? resolveNozFallbackCategory(input.sourceCategoryPath, input.nativeCategory) : null

    return {
      category: nozFallbackCategory || 'bazar',
      confidence: 'fallback',
      source: 'fallback',
      matchedSignals: nozFallbackCategory ? ['fallback:noz_source_category'] : [],
      fallbackUsed: true,
    }
  }

  const topSignal = top.signals[0]

  return {
    category: top.category,
    confidence: inferResolutionConfidence(top.score, runnerUp?.score || 0, topSignal),
    source: topSignal?.source || 'text',
    matchedSignals: buildMatchedSignals(top.signals),
    fallbackUsed: false,
  }
}

export function extractQuantity(value: string): string | null {
  const normalized = cleanDisplayText(value)
  if (!normalized) return null

  const packMatch = normalized.match(/\b(\d+)\s*[xX*]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)\b/i)
  if (packMatch) {
    const quantity = `${packMatch[1]}x${packMatch[2].replace(',', '.')}${packMatch[3].toLowerCase()}`
    return quantity
  }

  const singleMatch = normalized.match(
    /\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|pc|pcs|piece|pieces|unite|unites)\b/i,
  )
  if (singleMatch) {
    return `${singleMatch[1].replace(',', '.')}${singleMatch[2].toLowerCase()}`
  }

  const lotMatch =
    normalized.match(/\b(?:lot de|x)\s*(\d+)\b/i) || normalized.match(/\b(\d+)\s*(?:pcs?|pieces?|pc)\b/i)
  if (lotMatch) {
    return `${lotMatch[1]}pcs`
  }

  return null
}

export function calculatePricePerUnit(price: number, quantity: string | null | undefined) {
  const parsedPrice = toValidPrice(price)
  if (parsedPrice === null) {
    return { value: null, label: '' }
  }

  const parsedQuantity = parseQuantityToBaseUnit(quantity)
  if (!parsedQuantity || parsedQuantity.baseValue <= 0) {
    return { value: null, label: '' }
  }

  const value = Math.round((parsedPrice / parsedQuantity.baseValue) * 100) / 100
  return {
    value,
    label: parsedQuantity.label,
  }
}

export function formatUnitPriceText(value: number, label: string): string {
  return `${value.toFixed(2).replace('.', ',')}€${label}`
}

export function parseUnitPriceText(value: string | null | undefined) {
  const normalized = cleanDisplayText(value)
  if (!normalized) {
    return { value: null, label: '' }
  }

  const match = normalized.match(/(\d+[.,]?\d*)\s*€?\s*\/\s*([a-zA-Z]+)/)
  if (!match) {
    return { value: null, label: '' }
  }

  const parsedValue = toValidPrice(match[1])
  if (parsedValue === null) {
    return { value: null, label: '' }
  }

  const unit = normalizeSearchQuery(match[2])
  const label = unit === 'piece' || unit === 'pieces' || unit === 'pc' || unit === 'pcs' ? '/pcs' : `/${unit}`
  return {
    value: parsedValue,
    label,
  }
}

export function ensureUnitPriceText(
  unitPrice: string | null | undefined,
  price: number,
  quantity: string | null | undefined,
): string | undefined {
  const parsed = parseUnitPriceText(unitPrice)
  if (parsed.value !== null) {
    return formatUnitPriceText(parsed.value, parsed.label)
  }

  const calculated = calculatePricePerUnit(price, quantity)
  if (calculated.value === null) {
    return undefined
  }

  return formatUnitPriceText(calculated.value, calculated.label)
}

export function toAbsoluteUrl(value: string | null | undefined, baseUrl?: string): string {
  const raw = cleanDisplayText(value)
  if (!raw) return ''

  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).toString()
    }

    if (baseUrl) {
      return new URL(raw, baseUrl).toString()
    }
  } catch (_error) {
    return ''
  }

  return ''
}

export function isAbsoluteHttpUrl(value: string | null | undefined): boolean {
  const url = cleanDisplayText(value)
  return /^https?:\/\//i.test(url)
}

export function matchesRetailerDomain(retailer: Retailer, value: string | null | undefined): boolean {
  if (!isAbsoluteHttpUrl(value)) return false

  try {
    const hostname = new URL(String(value)).hostname.toLowerCase()
    return RETAILER_INFO[retailer].domains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
  } catch (_error) {
    return false
  }
}

export function deriveSourceProductIdFromUrl(value: string): string {
  try {
    const url = new URL(value)
    const pathname = url.pathname.replace(/\/+$/, '')
    if (!pathname) return ''

    const actionMatch = pathname.match(/\/p\/(\d+)/)
    if (actionMatch) return actionMatch[1]

    const segments = pathname.split('/').filter(Boolean)
    return segments.join(':')
  } catch (_error) {
    return ''
  }
}

export function buildStableSourceProductId(
  retailer: Retailer,
  sourceProductId: string | null | undefined,
  sourceUrl: string,
): string {
  const cleanedSourceId = cleanDisplayText(sourceProductId)
  if (cleanedSourceId) {
    return cleanedSourceId
  }

  const derived = deriveSourceProductIdFromUrl(sourceUrl)
  if (derived) {
    return `${retailer}:${derived}`
  }

  return createHash('sha256').update(sourceUrl).digest('hex').slice(0, 24)
}

export function buildOfferId(retailer: Retailer, sourceProductId: string, sourceUrl: string): string {
  return hashToId(`${retailer}:${sourceProductId}:${sourceUrl}`)
}

export function filterOffersByQuery<T extends { name: string; brand?: string; description?: string; category?: string }>(
  offers: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return offers

  return offers.filter((offer) => {
    const haystack = normalizeSearchQuery(
      [offer.name, offer.brand, offer.description, offer.category].filter(Boolean).join(' '),
    )
    return haystack.includes(normalizedQuery)
  })
}

export function toRetailerOfferCard(input: {
  id: string
  retailer: Retailer
  name: string
  category: SupportedCategory
  brand?: string | null
  price: number
  image?: string | null
  description?: string | null
  availability?: string | null
  quantity?: string | null
  unitPrice?: string | null
  originalPrice?: number | null
  isOnPromotion?: boolean | null
  discount?: number | null
  lastUpdated?: string | null
  sourceUrl?: string | null
  url?: string | null
}): RetailerOfferCard {
  const parsedUnitPrice = parseUnitPriceText(input.unitPrice)

  return {
    id: input.id,
    productId: input.id,
    retailer: input.retailer,
    name: normalizeRetailerProductName(input.retailer, input.name),
    category: input.category,
    brand: normalizeRetailerBrand(input.retailer, input.brand),
    price: toValidPrice(input.price) || 0,
    url: toAbsoluteUrl(input.url || input.sourceUrl) || '',
    image: toAbsoluteUrl(input.image, input.url || input.sourceUrl || undefined),
    description: cleanNullableText(input.description),
    availability: cleanNullableText(input.availability),
    quantity: cleanNullableText(input.quantity),
    unitPrice: parsedUnitPrice.value === null ? undefined : parsedUnitPrice.value,
    unitPriceLabel: parsedUnitPrice.value === null ? undefined : parsedUnitPrice.label,
    originalPrice: toValidPrice(input.originalPrice) ?? undefined,
    isOnPromotion: input.isOnPromotion ? true : undefined,
    discount:
      typeof input.discount === 'number' && Number.isFinite(input.discount) ? Math.round(input.discount) : undefined,
    lastUpdated: input.lastUpdated || null,
  }
}

export function sortRetailerOfferCards(offers: RetailerOfferCard[]): RetailerOfferCard[] {
  return [...offers].sort((left, right) => {
    const leftComparable = left.unitPrice ?? left.price
    const rightComparable = right.unitPrice ?? right.price

    if (leftComparable !== rightComparable) {
      return leftComparable - rightComparable
    }

    return left.price - right.price
  })
}

export function validateOffersForRetailer(retailer: Retailer, rawOffers: ScrapedOffer[]): ScrapePipelineResult {
  const rejectionReasons: Record<string, number> = {}
  const categoryCounts = buildEmptyCategoryCounts()
  const categoryConfidenceCounts = createEmptyCategoryConfidenceCounts()
  const categorySourceCounts = createEmptyCategorySourceCounts()
  const categoryFallbackExamples: CategoryFallbackExample[] = []
  const validatedOffers: ValidatedOffer[] = []
  const seenIds = new Set<string>()
  let categoryResolvedCount = 0
  let categoryFallbackCount = 0

  for (const rawOffer of rawOffers) {
    const name = normalizeRetailerProductName(retailer, rawOffer.name)
    if (!name) {
      incrementReason(rejectionReasons, 'missing_name')
      continue
    }

    const brand = normalizeRetailerBrand(retailer, rawOffer.brand)

    const sourceUrl = toAbsoluteUrl(rawOffer.sourceUrl)
    if (!sourceUrl) {
      incrementReason(rejectionReasons, 'invalid_source_url')
      continue
    }

    if (!matchesRetailerDomain(retailer, sourceUrl)) {
      incrementReason(rejectionReasons, 'wrong_domain')
      continue
    }

    const price = toValidPrice(rawOffer.price)
    if (price === null) {
      incrementReason(rejectionReasons, 'invalid_price')
      continue
    }

    const categoryResolution =
      rawOffer.categoryResolution ||
      resolveScrapedOfferCategory({
        retailer,
        sourceUrl,
        sourceCategoryPath: rawOffer.sourceCategoryPath,
        name,
        brand,
        description: rawOffer.description,
        availability: rawOffer.availability,
      })

    const category = categoryResolution.category
    if (!isSupportedCategory(category)) {
      incrementReason(rejectionReasons, 'unsupported_category')
      continue
    }

    const sourceProductId = buildStableSourceProductId(retailer, rawOffer.sourceProductId, sourceUrl)
    if (!sourceProductId) {
      incrementReason(rejectionReasons, 'missing_source_identity')
      continue
    }

    const id = buildOfferId(retailer, sourceProductId, sourceUrl)
    if (seenIds.has(id)) {
      incrementReason(rejectionReasons, 'duplicate_offer')
      continue
    }

    seenIds.add(id)

    const quantity =
      cleanNullableText(rawOffer.quantity) ||
      cleanNullableText(extractQuantity(name)) ||
      cleanNullableText(extractQuantity(rawOffer.description || ''))

    const unitPrice = ensureUnitPriceText(rawOffer.unitPrice, price, quantity)
    const originalPrice = toValidPrice(rawOffer.originalPrice)
    const computedDiscount =
      originalPrice !== null && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined

    const validatedOffer: ValidatedOffer = {
      id,
      retailer,
      sourceProductId,
      sourceUrl,
      sourceCategoryPath: cleanNullableText(rawOffer.sourceCategoryPath),
      category,
      categoryResolution,
      name,
      brand,
      price,
      image: toAbsoluteUrl(rawOffer.image, sourceUrl),
      description: cleanNullableText(rawOffer.description),
      availability: cleanNullableText(rawOffer.availability),
      quantity,
      unitPrice,
      originalPrice: originalPrice ?? undefined,
      isOnPromotion: rawOffer.isOnPromotion || computedDiscount !== undefined ? true : undefined,
      discount:
        typeof rawOffer.discount === 'number' && Number.isFinite(rawOffer.discount)
          ? Math.round(rawOffer.discount)
          : computedDiscount,
    }

    validatedOffers.push(validatedOffer)
    categoryCounts[category] += 1
    categoryResolvedCount += 1
    categoryConfidenceCounts[categoryResolution.confidence] += 1
    categorySourceCounts[categoryResolution.source] += 1

    if (categoryResolution.fallbackUsed) {
      categoryFallbackCount += 1
      if (categoryFallbackExamples.length < 10) {
        categoryFallbackExamples.push({
          name,
          sourceUrl,
          sourceCategoryPath: cleanNullableText(rawOffer.sourceCategoryPath),
          matchedSignals: [...categoryResolution.matchedSignals],
        })
      }
    }
  }

  const report: OfferValidationReport = {
    retailer,
    rawCount: rawOffers.length,
    validatedCount: validatedOffers.length,
    rejectedCount: rawOffers.length - validatedOffers.length,
    rejectedReasons: rejectionReasons,
    categoryCounts,
    categoryResolvedCount,
    categoryFallbackCount,
    categoryConfidenceCounts,
    categorySourceCounts,
    categoryFallbackExamples,
  }

  return {
    offers: validatedOffers,
    report,
  }
}

export function summarizeCategoryCounts(offers: Array<{ category: SupportedCategory }>) {
  return offers.reduce(
    (acc, offer) => {
      acc[offer.category] += 1
      return acc
    },
    buildEmptyCategoryCounts(),
  )
}

export function categoryDisplayName(category: SupportedCategory): string {
  return CATEGORY_LABELS[category]
}
