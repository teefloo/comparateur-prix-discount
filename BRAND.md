# ComparPrix — Charte Logo

> *Le Bulletin des Prix Discount*

> **Concept retenu : L'Étiquette** — étiquette de prix suspendue, € monumental, loupe en accent.

## Identité

ComparPrix est un journal de chasse aux bonnes affaires : une seule liste, dix enseignes, et toujours le prix le plus juste à portée de main. Le logo doit incarner cette posture de **bulletin de presse** — éditorial, autoritaire, scrutateur — tout en parlant instantanément le langage du **prix discount** : l'étiquette, la loupe, le glyphe €.

## Palette

| Rôle | Token CSS | Hex | Usage |
|------|-----------|-----|-------|
| Encre | `--ink` | `#0F1623` | Texte principal, bordures, filets |
| Marine | `--navy` | `#0F2C52` | Accent (mot `Prix`, € dominant, détails loupe) |
| Marine profonde | `--navy-deep` | `#081C36` | Variante sombre du € |
| Crème | `--cream` | `#FCFDFE` | Fonds, intérieur cartouche |
| Encre douce | `--ink-soft` | `#374150` | Tagline, texte secondaire |
| Encre pâle | `--ink-faint` | `#647382` | Mentions, micro-texte |

**Contraste** : la combinaison `ink` sur `cream` (ratio ~17:1) et `navy` sur `cream` (ratio ~14:1) passent AAA.

## Typographie

Le logo s'appuie sur la pile de polices du site (déjà chargées via `next/font/google`) :

| Rôle | Police | Fallback | Graisse |
|------|--------|----------|---------|
| Wordmark | `Big Shoulders Display` | `Impact`, `Arial Black` | 800 |
| Glyphe € | `Fraunces` | `Georgia`, `Times New Roman` | 700 |
| Tagline / eyebrow | `JetBrains Mono` | `Courier New` | 700, letter-spacing 0.22em |

## Les 3 concepts explorés

### Concept 1 — *L'Inspecteur* (exploré)
Loupe qui scrute un cartouche €. La loupe incarne la traque aux prix, le cartouche incarne le prix lui-même. Concept le plus figuratif.

### Concept 2 — *L'Étiquette* (✅ retenu)
Étiquette de prix suspendue à un cordon, € monumental en serif navy, loupe en accent, stamp `№ 01` en pied de cartouche, ombre brutaliste décalée. **C'est le concept le plus parlant** — il conjugue trois signes universels (étiquette, €, loupe) dans une silhouette mémorable.

### Concept 3 — *Le Monocle* (exploré)
Médaillon éditorial : double cercle, € monumental au centre, mention `COMPAR · PRIX` incurvée. Concept le plus institutionnel.

## Anatomie du logo retenu — L'Étiquette

| Élément | Spec | Rôle |
|---------|------|------|
| Cordon | 2 lignes `stroke-width: 4` convergentes au trou, `stroke-linecap: round` | Suspend l'étiquette, signe retail |
| Trou de perforation | Cercle `r=8`, cream fill, ink stroke `4px` | Punch-out réaliste, point d'ancrage du cordon |
| Cartouche | Path 5 sommets, ink stroke `5px`, shadow offset `4px` down-right | Forme principale, ADN brutaliste |
| Glyphe € | Fraunces 700, taille 124, navy | Point focal, signe monétaire |
| Stamp `№ 01` | Cartouche ink 44×14, texte cream JetBrains Mono 9px | Signature éditoriale, rappel de l'édition |
| Loupe | Cercle `r=20` + double-rule interne `r=14`, handle 7px ink + 2.2px navy | Accent narratif, métaphore de comparaison |
| Wordmark | Big Shoulders 800, taille 76–80, `Compar` en ink / `Prix` en navy | Identité verbale |
| Filet double | `3px` + `1px` séparés de 7px | Séparateur éditorial sous le wordmark |
| Tagline | JetBrains Mono 700, letter-spacing 0.22em, ink-soft | Mention de la revue |

## Layouts fournis

| Layout | viewBox | Usage |
|--------|---------|-------|
| `icon.svg` | 200×200 | Favicon, app icon, badge circulaire, OG image |
| `horizontal.svg` | 520×180 | Header de site, navbar, signature d'email |
| `vertical.svg` | 360×480 | Splash, page À propos, posts carrés (Instagram) |

## Favicon

`/public/brand/favicon.svg` — silhouette d'étiquette + trou + € navy, optimisée pour 16/32 px. Pour générer un `favicon.ico` multi-résolutions :

```bash
# Une seule ligne via sharp-cli
npx -y sharp-cli@latest -i public/brand/favicon.svg -o public/favicon.ico resize 16 32 48
```

## Clear-space

Maintenir un vide autour du logo équivalent à **la hauteur du glyphe €** du cartouche.

```
┌─────────────────────────────┐
│                             │
│    ┌─────────────────┐      │
│    │                 │      │
│    │   [ LOGO ]      │      │
│    │                 │      │
│    └─────────────────┘      │
│                             │
└─────────────────────────────┘
        ↑ hauteur € ↑
```

Aucun autre élément (texte, photo, bordure) ne doit pénétrer cette zone.

## Tailles minimales

| Layout | Digital | Print |
|--------|---------|-------|
| `horizontal.svg` | 160 px de large | 35 mm |
| `vertical.svg` | 96 px de large | 25 mm |
| `icon.svg` | 24 px (favicon) | 8 mm |
| `favicon.svg` | 16 px (browser tab) | — |

## Do / Don't

- **Faire** : utiliser le wordmark avec `Prix` en marine et `Compar` en encre
- **Faire** : conserver le filet double sous le wordmark (3 px + 1 px)
- **Faire** : garder le glyphe € en serif Fraunces, jamais en sans-serif
- **Ne pas** : étirer ou déformer le SVG — toujours utiliser `width`/`height` proportionnels au `viewBox`
- **Ne pas** : changer la couleur du € (toujours navy ou navy-deep)
- **Ne pas** : appliquer des ombres, flous, dégradés autres que ceux déjà présents
- **Ne pas** : combiner les 3 concepts — un seul système par surface
- **Ne pas** : remplacer le glyphe € par un symbole $ ou autre devise

## Intégration web (Next.js)

Le composant `src/components/Logo.tsx` peut être migré pour utiliser le SVG du concept retenu :

```tsx
import Image from 'next/image'

<Image
  src="/brand/concept-1-inspecteur/horizontal.svg"
  alt="ComparPrix — Le Bulletin des Prix Discount"
  width={260}
  height={90}
  priority
/>
```

Pour le `<link rel="icon">` dans `layout.tsx`, remplacer `logo.png` par `/brand/favicon.svg`.

## Fichiers livrés

```
public/brand/
  favicon.svg
  concept-1-inspecteur/
    icon.svg
    horizontal.svg
    vertical.svg
  concept-2-etiquette/
    icon.svg
    horizontal.svg
    vertical.svg
  concept-3-monocle/
    icon.svg
    horizontal.svg
    vertical.svg
```
