import type { Metadata } from 'next'

import LegalLayout, { LegalCallout } from '@/components/LegalLayout'
import { LEGAL_INFO } from '@/lib/legal'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité de ComparPrix : données collectées, base légale, droits RGPD, durées de conservation et contact.',
  alternates: {
    canonical: '/politique-confidentialite',
  },
  openGraph: {
    title: 'Politique de confidentialité | ComparPrix',
    description:
      'Données collectées, base légale, droits RGPD, durées de conservation et contact.',
    url: absoluteUrl('/politique-confidentialite'),
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
  { id: 'responsable-traitement', number: '02', title: 'Responsable du traitement' },
  { id: 'donnees-collectees', number: '03', title: 'Données collectées' },
  { id: 'finalites', number: '04', title: 'Finalités et bases légales' },
  { id: 'destinataires', number: '05', title: 'Destinataires et sous-traitants' },
  { id: 'transferts', number: '06', title: 'Transferts hors UE' },
  { id: 'durees', number: '07', title: 'Durées de conservation' },
  { id: 'droits', number: '08', title: 'Vos droits' },
  { id: 'securite', number: '09', title: 'Sécurité' },
  { id: 'mise-a-jour', number: '10', title: 'Mise à jour de la politique' },
]

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalLayout
      pageSlug="politique-confidentialite"
      eyebrow="Confidentialité"
      title="Vie privée & RGPD."
      intro={
        <>
          ComparPrix s’engage à protéger la vie privée des personnes qui consultent et utilisent
          le service. La présente politique décrit, en toute transparence, les données
          éventuellement traitées, les finalités, les durées de conservation et les droits dont
          vous disposez, en application du Règlement (UE) 2016/679 (« RGPD ») et de la loi
          Informatique et Libertés.
        </>
      }
      lastUpdated={LEGAL_INFO.lastUpdated}
      effectiveDate={LEGAL_INFO.effectiveDate}
      sections={SECTIONS}
    >
      <LegalCallout variant="info" title="L’esprit du service">
        ComparPrix ne propose ni compte utilisateur, ni newsletter, ni ciblage publicitaire. Le
        service ne dépose pas de cookie tiers et n’exploite pas d’outil d’analytics tiers. La
        quasi-totalité des informations traitées le sont pour faire fonctionner le site et
        améliorer sa qualité, jamais à des fins commerciales.
      </LegalCallout>

      <h2 id="preambule" data-number="01">
        Préambule
      </h2>
      <p>
        La présente politique s’applique au site{' '}
        <a href={LEGAL_INFO.serviceUrl}>{LEGAL_INFO.serviceUrl}</a> ainsi qu’à toute page ou
        fonctionnalité y étant rattachée. Elle ne s’applique pas aux sites tiers vers lesquels le
        service peut renvoyer (sites des enseignes, dépôt GitHub) : nous vous invitons à consulter
        leurs propres politiques.
      </p>

      <h2 id="responsable-traitement" data-number="02">
        Responsable du traitement
      </h2>
      <p>Le responsable du traitement est :</p>
      <dl className="legal-grid">
        <div>
          <dt>Responsable</dt>
          <dd>{LEGAL_INFO.publisher.name}</dd>
        </div>
        <div>
          <dt>Adresse</dt>
          <dd>{LEGAL_INFO.publisher.headquarters}</dd>
        </div>
        <div>
          <dt>Délégué à la protection des données</dt>
          <dd>
            {LEGAL_INFO.publisher.privacyEmail} — la désignation d’un DPO n’est pas obligatoire à
            ce jour, ce contact tient lieu de référent données à contacter pour l’exercice de vos
            droits.
          </dd>
        </div>
      </dl>

      <h2 id="donnees-collectees" data-number="03">
        Données collectées
      </h2>
      <p>ComparPrix traite trois catégories de données, toutes strictement nécessaires :</p>

      <h3>3.1 · Données que vous fournissez</h3>
      <ul>
        <li>
          <strong>Adresse e-mail</strong> : uniquement si vous nous écrivez à{' '}
          <a href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}>
            {LEGAL_INFO.publisher.contactEmail}
          </a>{' '}
          ou à l’adresse privacy. Le contenu du message est conservé le temps de son traitement.
        </li>
      </ul>

      <h3>3.2 · Données collectées automatiquement</h3>
      <ul>
        <li>
          <strong>Adresse IP, horodatage, page consultée, agent utilisateur</strong> : ces
          informations sont enregistrées dans les logs d’accès de l’hébergeur (Vercel) à des fins
          de sécurité, de diagnostic et de mesure d’audience agrégée. Elles ne sont jamais
          recoupées avec un identifiant personnel.
        </li>
        <li>
          <strong>Termes saisis dans le moteur de recherche</strong> : transmis via les paramètres
          d’URL au backend du service pour retourner les résultats. Aucune requête n’est conservée
          à des fins commerciales ; un échantillonnage anonyme peut être agrégé à des fins
          statistiques internes.
        </li>
      </ul>

      <h3>3.3 · Données stockées en local (localStorage)</h3>
      <ul>
        <li>
          <strong>Préférence de thème</strong> (clair ou sombre) : stockée sur votre appareil pour
          mémoriser votre choix ; jamais transmise à un serveur.
        </li>
        <li>
          <strong>Préférence d acknowledgement du bandeau cookies</strong> : stockée sur votre
          appareil pour ne pas afficher le bandeau de manière répétitive.
        </li>
      </ul>

      <h3>3.4 · Données issues de tiers</h3>
      <p>
        Aucune donnée n’est achetée ni reçue de brokers, de partenaires ou de réseaux sociaux.
        Les seules données tierces sont les <strong>prix publics relevés sur les sites des
        enseignes</strong>, qui ne constituent pas des données à caractère personnel.
      </p>

      <h2 id="finalites" data-number="04">
        Finalités et bases légales
      </h2>
      <dl className="legal-grid">
        <div>
          <dt>Faire fonctionner le service</dt>
          <dd>
            <strong>Base légale :</strong> exécution du service demandé (article 6-1-b RGPD). Il
            s’agit d’afficher les prix, de permettre la recherche, de garantir la sécurité du
            site.
          </dd>
        </div>
        <div>
          <dt>Répondre à vos demandes</dt>
          <dd>
            <strong>Base légale :</strong> mesures précontractuelles ou contractuelles (article
            6-1-b RGPD) lorsque vous nous écrivez pour un partenariat, un signalement ou une
            demande d’exercice de droits.
          </dd>
        </div>
        <div>
          <dt>Sécurité, prévention de la fraude</dt>
          <dd>
            <strong>Base légale :</strong> intérêt légitime (article 6-1-f RGPD) à garantir
            l’intégrité, la disponibilité et la confidentialité du service.
          </dd>
        </div>
        <div>
          <dt>Conservation des logs d’accès</dt>
          <dd>
            <strong>Base légale :</strong> obligation légale (article 6-1-c RGPD) au titre de la
            LCEN et des recommandations de la CNIL.
          </dd>
        </div>
        <div>
          <dt>Amélioration du service</dt>
          <dd>
            <strong>Base légale :</strong> intérêt légitime (article 6-1-f RGPD) à comprendre
            quelles fonctionnalités sont utilisées, à des fins strictement statistiques et
            agrégées.
          </dd>
        </div>
      </dl>

      <h2 id="destinataires" data-number="05">
        Destinataires et sous-traitants
      </h2>
      <p>
        Vos données ne sont jamais cédées, vendues ou louées. Elles sont accessibles, dans la
        stricte limite de leurs missions, aux destinataires suivants :
      </p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (hébergement, edge network, logs) —{' '}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            politique de confidentialité
          </a>
          .
        </li>
        <li>
          <strong>Vercel Postgres</strong> (base de données produits / prix) — aucune donnée
          personnelle n’y est stockée ; seules les données publiques de catalogues y sont
          hébergées.
        </li>
        <li>
          <strong>Personnel habilité de l’éditeur</strong>, tenu à une obligation de
          confidentialité.
        </li>
        <li>
          <strong>Autorités judiciaires</strong>, sur demande légalement fondée (réquisition,
          ordonnance).
        </li>
      </ul>

      <h2 id="transferts" data-number="06">
        Transferts hors UE
      </h2>
      <p>
        L’hébergeur Vercel Inc. est situé aux États-Unis. Les transferts éventuels de données
        vers les États-Unis sont encadrés par les <em>Data Privacy Framework</em> (DPF) UE–US et,
        le cas échéant, par les clauses contractuelles types (CCT) de la Commission européenne
        complétées de mesures techniques et organisationnelles appropriées.
      </p>
      <p>
        Pour plus d’information sur les garanties mises en œuvre, vous pouvez écrire à{' '}
        <a href={`mailto:${LEGAL_INFO.publisher.privacyEmail}`}>
          {LEGAL_INFO.publisher.privacyEmail}
        </a>
        .
      </p>

      <h2 id="durees" data-number="07">
        Durées de conservation
      </h2>
      <dl className="legal-grid">
        <div>
          <dt>Logs d’accès (Vercel)</dt>
          <dd>12 mois glissants, conformément aux recommandations CNIL.</dd>
        </div>
        <div>
          <dt>Courriels reçus</dt>
          <dd>3 ans à compter du dernier échange, à des fins de suivi.</dd>
        </div>
        <div>
          <dt>Données de catalogue (prix, produits)</dt>
          <dd>
            Les produits retirés du catalogue d’une enseigne sont purgés de la base dans les
            30 jours suivant leur dernière apparition.
          </dd>
        </div>
        <div>
          <dt>Préférences locales</dt>
          <dd>
            Conservées tant que vous ne videz pas le stockage de votre navigateur ; aucun envoi
            serveur.
          </dd>
        </div>
      </dl>

      <h2 id="droits" data-number="08">
        Vos droits
      </h2>
      <p>
        Conformément au RGPD et à la loi Informatique et Libertés, vous disposez, s’agissant des
        données vous concernant, des droits suivants :
      </p>
      <ul>
        <li>
          <strong>Droit d’accès</strong> (article 15) : savoir si des données vous concernant sont
          traitées et en obtenir copie.
        </li>
        <li>
          <strong>Droit de rectification</strong> (article 16) : corriger des données
          inexactes.
        </li>
        <li>
          <strong>Droit d’effacement</strong> (article 17) : demander la suppression de vos
          données, dans la limite des obligations légales de conservation.
        </li>
        <li>
          <strong>Droit à la limitation</strong> (article 18) : geler temporairement le
          traitement de vos données.
        </li>
        <li>
          <strong>Droit à la portabilité</strong> (article 20) : recevoir vos données dans un
          format ouvert et lisible par machine (applicable uniquement aux données que vous nous
          avez transmises).
        </li>
        <li>
          <strong>Droit d’opposition</strong> (article 21) : vous opposer à un traitement fondé
          sur l’intérêt légitime, pour des raisons tenant à votre situation particulière.
        </li>
        <li>
          <strong>Droit de retirer votre consentement</strong> (article 7-3), lorsqu’une opération
          repose sur celui-ci.
        </li>
        <li>
          <strong>Droit d’introduire une réclamation</strong> auprès de la CNIL (Commission
          Nationale de l’Informatique et des Libertés) via{' '}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
            www.cnil.fr/fr/plaintes
          </a>
          .
        </li>
      </ul>

      <h3>Comment exercer ces droits&nbsp;?</h3>
      <p>
        Toute demande doit être adressée à{' '}
        <a href={`mailto:${LEGAL_INFO.publisher.privacyEmail}`}>
          {LEGAL_INFO.publisher.privacyEmail}
        </a>
        , en précisant l’objet de votre demande et en joignant un justificatif d’identité si
        nécessaire. Une réponse vous sera apportée dans un délai d’un mois à compter de la
        réception de la demande complète, conformément à l’article 12-3 du RGPD.
      </p>

      <h2 id="securite" data-number="09">
        Sécurité
      </h2>
      <p>
        ComparPrix met en œuvre les mesures techniques et organisationnelles appropriées pour
        protéger les données contre tout accès non autorisé, altération, perte ou divulgation :
        chiffrement HTTPS (TLS) systématique, hébergement sur infrastructure sécurisée (Vercel),
        accès restreint aux personnes habilitées, sauvegardes régulières, journalisation des
        accès.
      </p>
      <p>
        Malgré ces mesures, aucun système n’est parfaitement sûr. En cas d’incident de sécurité
        affectant vos données, nous nous engageons à vous en informer dans les meilleurs délais et
        à notifier la CNIL dans les 72 heures, conformément à l’article 33 du RGPD.
      </p>

      <h2 id="mise-a-jour" data-number="10">
        Mise à jour de la politique
      </h2>
      <p>
        La présente politique peut être mise à jour pour refléter les évolutions du service, de
        la réglementation ou des bonnes pratiques. En cas de changement substantiel (nouveau
        traitement, modification d’un sous-traitant, transfert vers un pays tiers), les
        utilisateurs seront informés par un message visible sur la page d’accueil pendant au
        moins 30 jours.
      </p>
      <p>
        La date de dernière mise à jour est indiquée en haut de cette page. Nous vous invitons à
        la consulter régulièrement.
      </p>
    </LegalLayout>
  )
}
