import type { Metadata } from 'next'

import LegalLayout, { LegalCallout } from '@/components/LegalLayout'
import { LEGAL_INFO } from '@/lib/legal'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Conditions Générales d’Utilisation',
  description:
    'CGU de ComparPrix : objet du service, obligations de l’utilisateur, responsabilité et droit applicable.',
  alternates: {
    canonical: '/cgu',
  },
  openGraph: {
    title: 'CGU | ComparPrix',
    description: 'Conditions Générales d’Utilisation du service ComparPrix.',
    url: absoluteUrl('/cgu'),
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
  { id: 'objet', number: '01', title: 'Objet' },
  { id: 'definitions', number: '02', title: 'Définitions' },
  { id: 'acceptation', number: '03', title: 'Acceptation' },
  { id: 'description', number: '04', title: 'Description du service' },
  { id: 'obligations-utilisateur', number: '05', title: 'Obligations de l’utilisateur' },
  { id: 'propriete-intellectuelle', number: '06', title: 'Propriété intellectuelle' },
  { id: 'disponibilite', number: '07', title: 'Disponibilité et évolution' },
  { id: 'responsabilite', number: '08', title: 'Responsabilité' },
  { id: 'données', number: '09', title: 'Données personnelles' },
  { id: 'reclamation', number: '10', title: 'Réclamations' },
  { id: 'modification', number: '11', title: 'Modification des CGU' },
  { id: 'droit applicable', number: '12', title: 'Droit applicable' },
]

export default function CguPage() {
  return (
    <LegalLayout
      pageSlug="cgu"
      eyebrow="CGU"
      title="Conditions d’utilisation."
      intro={
        <>
          Les présentes Conditions Générales d’Utilisation (ci-après « CGU ») encadrent l’accès et
          l’utilisation du service ComparPrix. Elles définissent les droits et obligations de
          l’éditeur et de l’utilisateur. Toute visite ou utilisation du service implique
          l’acceptation sans réserve des présentes CGU.
        </>
      }
      lastUpdated={LEGAL_INFO.lastUpdated}
      effectiveDate={LEGAL_INFO.effectiveDate}
      sections={SECTIONS}
    >
      <LegalCallout variant="info" title="Service gratuit, sans compte">
        ComparPrix est un service gratuit, ouvert à tous, sans création de compte. Il n’existe
        aucune relation contractuelle durable entre vous et l’éditeur au-delà de l’acceptation
        ponctuelle des présentes CGU lors de chaque utilisation.
      </LegalCallout>

      <h2 id="objet" data-number="01">
        Objet
      </h2>
      <p>
        Les présentes CGU ont pour objet de définir les conditions dans lesquelles l’utilisateur
        accède et utilise le service ComparPrix, ainsi que les droits, obligations et limites
        applicables à chacune des parties.
      </p>

      <h2 id="definitions" data-number="02">
        Définitions
      </h2>
      <ul>
        <li>
          <strong>Service</strong> : le site ComparPrix, accessible à l’adresse{' '}
          <a href={LEGAL_INFO.serviceUrl}>{LEGAL_INFO.serviceUrl}</a>, ainsi que l’ensemble de ses
          pages, fonctionnalités et API publiques.
        </li>
        <li>
          <strong>Éditeur</strong> : la personne morale ou physique éditant le service, telle
          qu’identifiée à la page <a href="/mentions-legales">Mentions légales</a>.
        </li>
        <li>
          <strong>Utilisateur</strong> : toute personne physique naviguant sur le service ou
          interrogeant l’une de ses fonctionnalités.
        </li>
        <li>
          <strong>Données publiques</strong> : informations de prix, descriptions de produits et
          URLs publiées par les enseignes discount référencées.
        </li>
      </ul>

      <h2 id="acceptation" data-number="03">
        Acceptation
      </h2>
      <p>
        L’utilisation du service vaut acceptation pleine et entière des présentes CGU. Si vous
        n’acceptez pas tout ou partie de ces conditions, vous êtes invité à ne pas utiliser le
        service.
      </p>

      <h2 id="description" data-number="04">
        Description du service
      </h2>
      <p>
        ComparPrix est un comparateur de prix discount français. Le service agrège, chaque
        semaine, des prix relevés sur les sites de dix enseignes discount (Action, Stokomani,
        B&amp;M, Centrakor, Aldi, GiFi, La Foir&apos;Fouille, Lidl, Maxi Bazar, Noz) afin de
        permettre à l’utilisateur de :
      </p>
      <ul>
        <li>Rechercher un produit par mot-clé ou par catégorie ;</li>
        <li>Comparer les prix pratiqués par les enseignes sur un même produit ;</li>
        <li>Identifier les bons plans et produits en promotion ;</li>
        <li>Accéder au site de l’enseigne pour finaliser un achat.</li>
      </ul>
      <p>
        Le service est fourni à titre <strong>informatif et gratuit</strong>. Il ne vend aucun
        produit, ne perçoit aucune commission d’affiliation et n’agit pas en qualité
        d’intermédiaire commercial.
      </p>

      <h2 id="obligations-utilisateur" data-number="05">
        Obligations de l’utilisateur
      </h2>
      <p>L’utilisateur s’engage à :</p>
      <ul>
        <li>
          Utiliser le service de manière loyale, dans le respect des lois en vigueur et des droits
          des tiers ;
        </li>
        <li>
          Ne pas tenter de porter atteinte au service (attaque, scraping massif, contournement des
          mesures de sécurité, introduction de code malveillant) ;
        </li>
        <li>
          Ne pas extraire ou réutiliser massivement le contenu du service à des fins
          commerciales sans autorisation écrite préalable ;
        </li>
        <li>
          Vérifier le prix final sur le site de l’enseigne avant tout achat, le service n’étant
          qu’une aide à la décision.
        </li>
      </ul>

      <h2 id="propriete-intellectuelle" data-number="06">
        Propriété intellectuelle
      </h2>
      <p>
        L’ensemble des éléments du service (textes, codes, charte graphique, logo, organisation
        des données, base de données) est protégé par le droit d’auteur et le droit des
        producteurs de bases de données.
      </p>
      <p>
        Toute reproduction ou représentation, totale ou partielle, à d’autres fins que
        l’utilisation strictement personnelle et informative, est interdite sans autorisation
        écrite préalable de l’éditeur.
      </p>
      <p>
        Les marques, logos, dénominations et visuels des enseignes référencées restent la
        propriété exclusive de leurs titulaires. Le service les utilise à des fins
        d’information et de comparaison loyale, dans le respect des usages commerciaux.
      </p>

      <h2 id="disponibilite" data-number="07">
        Disponibilité et évolution
      </h2>
      <p>
        L’éditeur s’efforce d’assurer la disponibilité du service 24h/24 et 7j/7, mais ne peut
        garantir une accessibilité permanente, notamment en cas de maintenance, de mise à jour,
        d’incident technique ou d’événement extérieur.
      </p>
      <p>
        Le service est susceptible d’évoluer : ajout ou retrait d’enseignes, refonte de
        l’interface, ajout de fonctionnalités, etc. L’éditeur informera les utilisateurs des
        évolutions substantielles.
      </p>

      <h2 id="responsabilite" data-number="08">
        Responsabilité
      </h2>
      <p>
        Les prix affichés sur ComparPrix sont relevés à partir des sites des enseignes. Malgré
        le soin apporté à la collecte, des écarts peuvent exister (prix obsolète, erreur de
        saisie, rupture de stock, prix régional). <strong>ComparPrix ne peut être tenu
        responsable d’une décision d’achat fondée sur un prix inexact.</strong>
      </p>
      <p>
        L’utilisateur est invité à vérifier le prix sur le site de l’enseigne avant tout
        passage en caisse. L’éditeur ne saurait en aucun cas être tenu responsable de dommages
        indirects (perte de chance, manque à gagner, atteinte à l’image) résultant de
        l’utilisation ou de l’impossibilité d’utiliser le service.
      </p>

      <h2 id="données" data-number="09">
        Données personnelles
      </h2>
      <p>
        Le traitement des données personnelles éventuellement collectées par le service est
        détaillé dans la{' '}
        <a href="/politique-confidentialite">Politique de confidentialité</a>, à laquelle les
        présentes CGU renvoient expressément.
      </p>

      <h2 id="reclamation" data-number="10">
        Réclamations
      </h2>
      <p>
        Toute réclamation relative au service doit être adressée à{' '}
        <a href={`mailto:${LEGAL_INFO.publisher.contactEmail}`}>
          {LEGAL_INFO.publisher.contactEmail}
        </a>
        , en précisant l’objet, la date du constat et, le cas échéant, l’URL concernée. Léditeur
        s’efforcera de répondre dans un délai raisonnable.
      </p>
      <p>
        Conformément à l’article L.612-1 du Code de la consommation, l’utilisateur est informé
        qu’il peut recourir gratuitement au service de médiation de la consommation suivant :{' '}
        <em>[médiateur à compléter si applicable]</em>. En cas d’échec de la médiation, l’utilisateur
        peut également déposer une plainte en ligne auprès de la Commission européenne via la
        plateforme RLL.
      </p>

      <h2 id="modification" data-number="11">
        Modification des CGU
      </h2>
      <p>
        Léditeur se réserve la possibilité de modifier les présentes CGU à tout moment. En cas
        de modification substantielle, les utilisateurs en seront informés par un message
        visible sur la page d’accueil pendant au moins 30 jours. La date de dernière mise à jour
        figure en haut de cette page.
      </p>

      <h2 id="droit applicable" data-number="12">
        Droit applicable
      </h2>
      <p>
        Les présentes CGU sont régies par le droit français. Tout litige relatif à leur
        interprétation ou à leur exécution sera, à défaut de règlement amiable, soumis à la
        compétence des tribunaux français.
      </p>
    </LegalLayout>
  )
}
