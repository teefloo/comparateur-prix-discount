import type { Metadata } from 'next'

import LegalLayout, { LegalCallout } from '@/components/LegalLayout'
import ReopenCookieBannerButton from '@/components/ReopenCookieBannerButton'
import { LEGAL_INFO } from '@/lib/legal'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description:
    'Politique de cookies de ComparPrix : traceurs utilisés, finalités, durées, gestion du consentement et conformité CNIL.',
  alternates: {
    canonical: '/cookies',
  },
  openGraph: {
    title: 'Politique de cookies | ComparPrix',
    description: 'Traceurs utilisés, finalités, durées et gestion du consentement.',
    url: absoluteUrl('/cookies'),
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'ComparPrix',
      },
    ],
  },
}

const SECTIONS = [
  { id: 'preambule', number: '01', title: 'Préambule' },
  { id: 'definition', number: '02', title: 'Qu’est-ce qu’un cookie ?' },
  { id: 'inventaire', number: '03', title: 'Inventaire des traceurs' },
  { id: 'base-legale', number: '04', title: 'Base légale et consentement' },
  { id: 'gestion', number: '05', title: 'Gérer mes préférences' },
  { id: 'duree', number: '06', title: 'Durée de conservation' },
  { id: 'tiers', number: '07', title: 'Cookies et traceurs tiers' },
  { id: 'evolution', number: '08', title: 'Évolution de la politique' },
]

export default function CookiesPage() {
  return (
    <LegalLayout
      pageSlug="cookies"
      eyebrow="Cookies"
      title="Cookies & traceurs."
      intro={
        <>
          ComparPrix limite volontairement le recours aux cookies et autres traceurs. La présente
          page détaille, en toute transparence, ce qui est stocké sur votre appareil, la raison
          de chaque traceur et la manière dont vous pouvez reprendre la main à tout moment, en
          conformité avec les recommandations de la CNIL.
        </>
      }
      lastUpdated={LEGAL_INFO.lastUpdated}
      effectiveDate={LEGAL_INFO.effectiveDate}
      sections={SECTIONS}
    >
      <LegalCallout variant="info" title="En pratique">
        Le service ne dépose <strong>aucun cookie tiers</strong>, n&apos;utilise{' '}
        <strong>aucun outil d’analytics</strong> (Google Analytics, Matomo, Plausible, etc.) et
        n’affiche <strong>aucune publicité</strong>. Le seul stockage utilisé est le{' '}
        <code>localStorage</code> du navigateur, limité au strict nécessaire.
      </LegalCallout>

      <h2 id="preambule" data-number="01">
        Préambule
      </h2>
      <p>
        La présente politique s’applique au site{' '}
        <a href={LEGAL_INFO.serviceUrl}>{LEGAL_INFO.serviceUrl}</a>. Elle décrit les traceurs
        susceptibles d’être déposés ou lus sur votre terminal (ordinateur, smartphone, tablette)
        lors de votre visite, leur finalité, leur durée de vie et les moyens de les contrôler.
      </p>
      <p>
        Pour toute question relative aux cookies, vous pouvez écrire à{' '}
        <a href={`mailto:${LEGAL_INFO.publisher.privacyEmail}`}>
          {LEGAL_INFO.publisher.privacyEmail}
        </a>
        .
      </p>

      <h2 id="definition" data-number="02">
        Qu’est-ce qu’un cookie ?
      </h2>
      <p>
        Un <strong>cookie</strong> est un petit fichier texte déposé par un site web sur votre
        terminal, lu par le même site (ou par un tiers) lors de vos visites ultérieures. Le
        <code> localStorage</code> est une fonctionnalité équivalente, gérée par votre navigateur
        ; elle sert généralement à mémoriser des préférences. Au sens de la CNIL, ces deux
        mécanismes relèvent du même régime : un traceur.
      </p>

      <h2 id="inventaire" data-number="03">
        Inventaire des traceurs
      </h2>
      <p>ComparPrix utilise uniquement deux traceurs, tous deux strictement fonctionnels :</p>

      <h3>3.1 · Préférence de thème (clair / sombre)</h3>
      <dl className="legal-grid">
        <div>
          <dt>Type</dt>
          <dd>
            <code>localStorage</code> — clé <code>theme</code>
          </dd>
        </div>
        <div>
          <dt>Finalité</dt>
          <dd>
            Mémoriser le thème choisi (clair ou sombre) pour le ré-appliquer lors des visites
            suivantes.
          </dd>
        </div>
        <div>
          <dt>Base légale</dt>
          <dd>
            Intérêt légitime à offrir une expérience cohérente (CNIL, délibération n° 2020-091).
          </dd>
        </div>
        <div>
          <dt>Durée</dt>
          <dd>12 mois maximum, ou jusqu’à suppression manuelle par l’utilisateur.</dd>
        </div>
        <div>
          <dt>Destinataire</dt>
          <dd>Vous-même (aucune transmission à un serveur).</dd>
        </div>
      </dl>

      <h3>3.2 · Mémorisation du bandeau d’information</h3>
      <dl className="legal-grid">
        <div>
          <dt>Type</dt>
          <dd>
            <code>localStorage</code> — clé <code>comparprix.cookie-consent</code>
          </dd>
        </div>
        <div>
          <dt>Finalité</dt>
          <dd>
            Conserver le fait que vous avez pris connaissance de la présente politique, afin de
            ne pas afficher le bandeau de manière répétitive.
          </dd>
        </div>
        <div>
          <dt>Base légale</dt>
          <dd>Intérêt légitime (limitation de l’intrusion visuelle).</dd>
        </div>
        <div>
          <dt>Durée</dt>
          <dd>12 mois, ou jusqu’à suppression manuelle par l’utilisateur.</dd>
        </div>
        <div>
          <dt>Destinataire</dt>
          <dd>Vous-même (aucune transmission à un serveur).</dd>
        </div>
      </dl>

      <h2 id="base-legale" data-number="04">
        Base légale et consentement
      </h2>
      <p>
        Conformément aux recommandations de la CNIL, les traceurs strictement nécessaires au
        fonctionnement du service ou à l’expression d’une préférence explicite de l’utilisateur
        (cas du choix du thème) <strong>peuvent être déposés sans consentement préalable</strong>.
      </p>
      <p>
        ComparPrix n’utilisant aucun traceur publicitaire, aucun cookie de mesure d’audience
        tiers ni aucun cookie de réseau social, aucun bandeau « opt-in » au sens de l’article 82
        de la loi Informatique et Libertés n’est requis.
      </p>
      <p>
        Un petit bandeau d’information reste néanmoins affiché lors de la première visite pour
        vous informer de l’utilisation du <code>localStorage</code> et vous permettre de rouvrir
        la présente politique à tout moment.
      </p>

      <h2 id="gestion" data-number="05">
        Gérer mes préférences
      </h2>
      <p>Plusieurs moyens s’offrent à vous pour reprendre la main :</p>
      <ul>
        <li>
          Réouvrir le bandeau d’information :{' '}
          <ReopenCookieBannerButton className="mt-0.5" />
        </li>
        <li>
          Supprimer le contenu de votre <code>localStorage</code> via les outils de votre
          navigateur (par exemple : DevTools → Application → Local Storage → Clear).
        </li>
        <li>
          Utiliser le mode navigation privée : aucun traceur n’est alors conservé entre les
          sessions.
        </li>
        <li>
          Configurer votre navigateur pour bloquer l’écriture du <code>localStorage</code> par
          les sites tiers (par défaut, ComparPrix ne dépose rien en cross-site).
        </li>
      </ul>

      <h3>Liens utiles par navigateur</h3>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>

      <h2 id="duree" data-number="06">
        Durée de conservation
      </h2>
      <p>
        Le détail figure dans l’inventaire (section 3). À titre indicatif, la durée maximale
        retenue pour les deux traceurs utilisés est de <strong>12 mois</strong>, conformément
        aux recommandations de la CNIL.
      </p>

      <h2 id="tiers" data-number="07">
        Cookies et traceurs tiers
      </h2>
      <p>
        ComparPrix ne dépose pas de cookie tiers et n’intègre pas de SDK tiers. La seule
        exposition indirecte concerne les liens sortants vers les sites des enseignes
        référencées : ces derniers peuvent déposer leurs propres traceurs une fois que vous
        quittez ComparPrix. Nous vous invitons à consulter leurs propres politiques.
      </p>

      <h2 id="evolution" data-number="08">
        Évolution de la politique
      </h2>
      <p>
        La présente politique peut être mise à jour, notamment en cas d’évolution du service ou
        de la réglementation. La date de dernière mise à jour figure en haut de cette page. En
        cas d’introduction d’un nouveau traceur non strictement fonctionnel, un mécanisme de
        consentement opt-in conforme aux recommandations de la CNIL sera mis en place.
      </p>
    </LegalLayout>
  )
}
