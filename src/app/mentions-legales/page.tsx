import type { Metadata } from 'next'

import LegalLayout, { LegalCallout } from '@/components/LegalLayout'
import { LEGAL_INFO } from '@/lib/legal'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Identité de l’éditeur, hébergeur et contact du service ComparPrix.',
  alternates: {
    canonical: '/mentions-legales',
  },
  openGraph: {
    title: 'Mentions légales | ComparPrix',
    description: 'Identité de l’éditeur, hébergeur et contact du service ComparPrix.',
    url: absoluteUrl('/mentions-legales'),
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
  { id: 'editeur', number: '01', title: 'Éditeur du site' },
  { id: 'directeur-publication', number: '02', title: 'Directeur de la publication' },
  { id: 'hebergeur', number: '03', title: 'Hébergeur' },
  { id: 'contact', number: '04', title: 'Nous contacter' },
  { id: 'propriete-intellectuelle', number: '05', title: 'Propriété intellectuelle' },
  { id: 'responsabilite', number: '06', title: 'Responsabilité' },
  { id: 'liens-externes', number: '07', title: 'Liens externes' },
  { id: 'droit-applicable', number: '08', title: 'Droit applicable et juridiction' },
]

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      pageSlug="mentions-legales"
      eyebrow="Mentions légales"
      title="Mentions légales."
      intro={
        <>
          Les présentes mentions légales sont édictées dans le cadre de l’article 6-III de la loi
          n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN). Elles
          définissent l’identité de l’éditeur, de l’hébergeur et les conditions d’accès au service
          ComparPrix.
        </>
      }
      lastUpdated={LEGAL_INFO.lastUpdated}
      effectiveDate={LEGAL_INFO.effectiveDate}
      sections={SECTIONS}
    >
      <LegalCallout
        variant="info"
        title="Éditeur à titre personnel"
      >
        ComparPrix est édité à titre personnel par un particulier. En conséquence, il n’y a pas
        de forme juridique, de capital social, d’immatriculation au RCS ou de numéro de TVA à
        mentionner. Pour toute correspondance, utilisez l’adresse e-mail ci-dessous.
      </LegalCallout>

      <h2 id="editeur" data-number="01">
        Éditeur du site
      </h2>
      <p>
        Le service ComparPrix, accessible à l’adresse{' '}
        <a href={LEGAL_INFO.serviceUrl}>{LEGAL_INFO.serviceUrl}</a>, est édité à titre personnel
        par :
      </p>
      <dl className="legal-grid">
        <div>
          <dt>Éditeur</dt>
          <dd>{LEGAL_INFO.publisher.name}</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>{LEGAL_INFO.publisher.status}</dd>
        </div>
        <div>
          <dt>Pays</dt>
          <dd>{LEGAL_INFO.publisher.headquarters}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>
            <a href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}>
              {LEGAL_INFO.publisher.contactEmail}
            </a>
          </dd>
        </div>
      </dl>

      <h2 id="directeur-publication" data-number="02">
        Directeur de la publication
      </h2>
      <p>
        Le directeur de la publication est {LEGAL_INFO.publisher.director}, responsable éditorial du
        contenu mis en ligne sur ComparPrix. Pour toute demande relative au contenu publié, vous
        pouvez écrire à{' '}
        <a href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}>
          {LEGAL_INFO.publisher.contactEmail}
        </a>
        .
      </p>

      <h2 id="hebergeur" data-number="03">
        Hébergeur
      </h2>
      <p>Le service est hébergé par :</p>
      <dl className="legal-grid">
        <div>
          <dt>Société</dt>
          <dd>
            <a href={LEGAL_INFO.host.website} target="_blank" rel="noopener noreferrer">
              {LEGAL_INFO.host.name}
            </a>
          </dd>
        </div>
        <div>
          <dt>Adresse</dt>
          <dd>{LEGAL_INFO.host.address}</dd>
        </div>
      </dl>

      <h2 id="contact" data-number="04">
        Nous contacter
      </h2>
      <p>Pour toute question relative au service, vous pouvez nous écrire :</p>
      <ul>
        <li>
          Question générale, partenariat, presse :{' '}
          <a href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}>
            {LEGAL_INFO.publisher.contactEmail}
          </a>
        </li>
        <li>
          Données personnelles, exercice des droits RGPD :{' '}
          <a href={`mailto:${LEGAL_INFO.publisher.privacyEmail}`}>
            {LEGAL_INFO.publisher.privacyEmail}
          </a>
        </li>
      </ul>
      <p>
        Nous nous efforçons de répondre aux demandes dans un délai d’un mois à compter de leur
        réception, conformément à l’article 12-3 du RGPD.
      </p>

      <h2 id="propriete-intellectuelle" data-number="05">
        Propriété intellectuelle
      </h2>
      <p>
        L’ensemble des éléments composant le service ComparPrix (textes, codes, graphismes, logo,
        structure, base de données) est protégé par le droit d’auteur et le droit des bases de
        données. Toute reproduction, représentation ou adaptation, totale ou partielle, sans
        autorisation écrite préalable, est interdite.
      </p>
      <p>
        Les marques, logos et noms commerciaux des enseignes citées (Action, Stokomani, B&amp;M,
        Centrakor, Aldi, GiFi, La Foir&apos;Fouille, Lidl, Maxi Bazar, Noz) appartiennent à leurs
        propriétaires respectifs. Elles sont utilisées à des fins purement informatives et
        comparatives, sans but commercial et sans endosser un quelconque partenariat.
      </p>
      <p>
        Le code source du service est publié sous licence open source et accessible depuis le{' '}
        <a href={LEGAL_INFO.repositoryUrl} target="_blank" rel="noopener noreferrer">
          dépôt GitHub public
        </a>
        .
      </p>

      <h2 id="responsabilite" data-number="06">
        Responsabilité
      </h2>
      <p>
        ComparPrix centralise, à titre informatif, des prix relevés hebdomadairement sur les sites
        des enseignes discount référencées. Malgré le soin apporté aux opérations de collecte, des
        erreurs (prix affiché obsolète, faute de frappe, rupture de stock) peuvent subsister.
      </p>
      <p>
        <strong>Aucun prix affiché sur ComparPrix ne constitue une offre contractuelle.</strong> Le
        prix applicable est celui affiché en magasin ou sur le site de l’enseigne au moment de
        l’achat. L’utilisateur est invité à vérifier le prix avant tout passage en caisse.
      </p>
      <p>
        L’éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant de
        l’utilisation du service, notamment en cas d’indisponibilité, d’erreur de prix ou
        d’altération de données causée par un tiers.
      </p>

      <h2 id="liens-externes" data-number="07">
        Liens externes
      </h2>
      <p>
        Le service peut renvoyer vers des sites tiers (enseignes, dépôt GitHub). L’éditeur
        n’exerce aucun contrôle sur le contenu de ces sites et décline toute responsabilité quant
        aux informations qui y sont diffusées. L’activation d’un lien externe se fait sous la
        seule responsabilité de l’utilisateur.
      </p>

      <h2 id="droit-applicable" data-number="08">
        Droit applicable et juridiction
      </h2>
      <p>
        Les présentes mentions légales sont régies par le droit français. En cas de litige et
        après tentative de recherche d’une solution amiable, les tribunaux français seront seuls
        compétents pour connaître de ce litige.
      </p>
      <p>
        Pour toute question relative à ces mentions légales, vous pouvez écrire à{' '}
        <a href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}>
          {LEGAL_INFO.publisher.contactEmail}
        </a>
        .
      </p>
    </LegalLayout>
  )
}
