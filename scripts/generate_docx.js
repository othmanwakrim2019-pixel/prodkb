const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, BorderStyle, WidthType, PageBreak, Header, Footer } = require('docx');
const fs = require('fs');
const path = require('path');

// Conteneur de paragraphes pour le document principal
const paragraphs = [];

// Helper pour ajouter du texte normal
function addP(text, isItalic = false, isBold = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        italic: isItalic,
        bold: isBold
      })
    ]
  });
}

// Helper pour ajouter un titre de niveau 1
function addH1(text) {
  return new Paragraph({
    text: text,
    heading: "Heading 1"
  });
}

// Helper pour ajouter un titre de niveau 2
function addH2(text) {
  return new Paragraph({
    text: text,
    heading: "Heading 2"
  });
}

// Helper pour ajouter un titre de niveau 3
function addH3(text) {
  return new Paragraph({
    text: text,
    heading: "Heading 3"
  });
}

// Helper pour les listes à puces
function addBullet(text, isBoldText = "") {
  const children = [];
  if (isBoldText) {
    children.push(new TextRun({ text: isBoldText + " : ", bold: true }));
  }
  children.push(new TextRun({ text: text }));
  
  return new Paragraph({
    children: children,
    bullet: {
      level: 0
    },
    spacing: { after: 100 }
  });
}

// Helper pour le code
function addCode(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: "Consolas",
        size: 18, // 9pt
        color: "0F172A"
      })
    ],
    spacing: { before: 100, after: 100 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, space: 10, color: "2B6CB0" }
    },
    shading: {
      fill: "F7FAF8"
    }
  });
}

// Helper pour créer une table simple
function createStyledTable(headers, rows) {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [
      new TableRow({
        children: headers.map(h => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER
          })],
          shading: { fill: "2B6CB0" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" }
          }
        }))
      }),
      ...rows.map(r => new TableRow({
        children: r.map(c => new TableCell({
          children: [new Paragraph({ text: c })],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0" }
          }
        }))
      }))
    ]
  });
}

// ==========================================
// PAGE DE GARDE
// ==========================================
paragraphs.push(new Paragraph({
  children: [new TextRun({ text: "UNIVERSITÉ ET ÉTABLISSEMENT D'ACCUEIL", bold: true, size: 28, color: "4A5568" })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 400, after: 400 }
}));
paragraphs.push(new Paragraph({
  children: [new TextRun({ text: "DÉPARTEMENT D'INGÉNIERIE LOGICIELLE ET SYSTÈMES DÉPLOYÉS", bold: true, size: 20, color: "718096" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 1200 }
}));
paragraphs.push(new Paragraph({
  children: [new TextRun({ text: "RAPPORT DE PROJET DE FIN D'ÉTUDES MASTER", bold: true, size: 36, color: "1A365D" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 300 }
}));
paragraphs.push(new Paragraph({
  children: [new TextRun({ text: "PRODKB", bold: true, size: 48, color: "2B6CB0" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 300 }
}));
paragraphs.push(new Paragraph({
  children: [new TextRun({ text: "Plateforme de Gestion Industrielle des Incidents IT et de War Room Collaborative en Temps Réel", italic: true, size: 24, color: "4A5568" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 1500 }
}));

paragraphs.push(new Paragraph({
  children: [
    new TextRun({ text: "Présenté par : ", bold: true }),
    new TextRun({ text: "[Nom de l'Étudiant à renseigner]\n", italic: true }),
    new TextRun({ text: "Sous la direction de : ", bold: true }),
    new TextRun({ text: "[Nom de l'Encadrant à renseigner]\n", italic: true }),
    new TextRun({ text: "Année Universitaire : ", bold: true }),
    new TextRun({ text: "2025 / 2026\n" })
  ],
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 }
}));

paragraphs.push(new PageBreak());

// ==========================================
// RÉSUMÉ & ABSTRACT
// ==========================================
paragraphs.push(addH1("Résumé"));
paragraphs.push(addP("La haute disponibilité des infrastructures numériques est aujourd'hui un prérequis stratégique indispensable pour les entreprises. Ce mémoire de Master présente la conception et le développement de ProdKB, une plateforme industrielle d'Incident Management et de base de connaissances d'exploitation. Conçu selon les patrons de conception de la Clean Architecture et d'une approche Domain-Driven Design (DDD) monolithique modulaire (Express 5/TypeScript, React 18, PostgreSQL/PgBouncer, Redis/BullMQ), le système permet d'unifier la gestion des pannes, de veiller asynchroniquement au respect des SLAs, de guider les exploitants via des fiches réflexes (SOP Runbooks) interactives et d'organisations d'astreintes. Ce rapport détaille la spécification fonctionnelle complète, la conception logique des données, et les workflows asynchrones de production sur AWS EC2."));

paragraphs.push(addH1("Abstract"));
paragraphs.push(addP("High availability of IT services is crucial for modern business continuity. This Master thesis outlines the engineering and deployment of ProdKB, a comprehensive incident tracking and runbook hosting platform. Utilizing a clean, Modular Monolith backend architecture and Domain-Driven Design principles (Express 5, React 18, PgBouncer/PostgreSQL, Redis/BullMQ), the system orchestrates real-time incident resolution, provides Markdown runbooks to troubleshoot failures, handles on-call logistics, and automatically triggers SLA breach escalations. Monitoring integrations such as Prometheus, Loki, and Grafana have been embedded directly to serve as a unified cockpit for on-call engineers."));

paragraphs.push(new PageBreak());

// ==========================================
// TABLE DES MATIÈRES ET FIGURES
// ==========================================
paragraphs.push(addH1("Table des Matières"));
paragraphs.push(addP("[La Table des matières sera générée automatiquement par Microsoft Word lors de la mise à jour des champs (F9 sur Windows)]"));
paragraphs.push(new PageBreak());

paragraphs.push(addH1("Liste des Figures et Tableaux"));
paragraphs.push(addP("[La Liste des figures et tableaux sera générée automatiquement par Microsoft Word lors de la mise à jour des champs]"));
paragraphs.push(new PageBreak());

// ==========================================
// LISTE DES ABRÉVIATIONS
// ==========================================
paragraphs.push(addH1("Liste des Abréviations"));
paragraphs.push(createStyledTable(
  ["Abréviation", "Signification Complète", "Rôle dans le projet ProdKB"],
  [
    ["SPA", "Single Page Application", "Architecture applicative du client construite avec React 18."],
    ["SLA", "Service Level Agreement", "Contrat d'engagement de service régissant les délais d'acquittement et de résolution."],
    ["MTTR", "Mean Time To Resolution", "Temps moyen nécessaire pour résoudre un incident technique."],
    ["API", "Application Programming Interface", "Interface d'accès HTTP exposée de façon sécurisée par le serveur Express."],
    ["REST", "Representational State Transfer", "Style architectural utilisé pour les communications synchrones API."],
    ["JWT", "JSON Web Token", "Jeton standard d'échange d'informations d'identité utilisé pour les sessions."],
    ["ORM", "Object-Relational Mapping", "Couche d'abstraction des requêtes relationnelles via Prisma."],
    ["DDoS", "Distributed Denial of Service", "Attaque par déni de service atténuée par notre Rate-Limiter Redis."],
    ["ACID", "Atomicity, Consistency, Isolation, Durability", "Propriétés transactionnelles garanties par PostgreSQL 16."],
    ["HMR", "Hot Module Replacement", "Rechargement rapide des modules de développement client grâce à Vite."],
    ["SSL / HTTPS", "Secure Sockets Layer / HTTP Secure", "Protocoles de chiffrement et de sécurisation des flux réseaux."],
    ["E2E", "End-to-End", "Tests de bout en bout simulant les cas d'utilisation réels via Playwright."],
    ["CI/CD", "Continuous Integration / Continuous Deployment", "Mécanismes automatisés d'intégration et de livraison continue."],
    ["DevOps", "Development & Operations", "Synergie méthodologique unifiée pour concevoir et héberger le système."]
  ]
));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 1 : INTRODUCTION GENERALE
// ==========================================
paragraphs.push(addH1("CHAPITRE 1 — INTRODUCTION GÉNÉRALE"));
paragraphs.push(addH2("1.1 Contexte et problématique"));
paragraphs.push(addP("À l'ère de la transformation numérique, la dépendance des entreprises à l'égard de leurs infrastructures informatiques est devenue absolue. Qu'il s'agisse de transactions financières, de services de santé en ligne ou de la gestion de chaînes logistiques, le moindre dysfonctionnement d'un serveur applicatif ou d'une base de données engendre des conséquences catastrophiques. Une indisponibilité de service (downtime) se traduit instantanément par des pertes financières directes chiffrées en milliers d'euros par minute, une dégradation irrémédiable de l'image de marque de l'organisation et d'importantes pénalités financières contractuelles liées au non-respect des engagements de qualité de service (SLA)."));
paragraphs.push(addP("Historiquement, la gestion de ces incidents en production a toujours souffert d'un cloisonnement flagrant des outils et des processus. Les équipes de supervision (N1) détectent les anomalies via des emails ou des consoles d'alertes austères. Les plannings d'astreinte, indispensables pour mobiliser les experts techniques (N2/N3) en dehors des heures ouvrées, sont maintenus manuellement sur des feuilles de calcul déconnectées et souvent obsolètes. Enfin, la résolution elle-même s'appuie sur des fiches réflexes (Standard Operating Procedures ou SOP) dispersées dans des wikis internes non mis à jour, obligeant les ingénieurs à chercher des solutions au milieu du chaos de la panne."));
paragraphs.push(addP("Cette fragmentation des outils et des communications allonge considérablement le temps moyen d'acquittement (MTTA) et le temps moyen de résolution (MTTR). C'est face à ce constat opérationnel majeur que la problématique de ce projet de fin d'études de Master s'est dessinée : Comment unifier la messagerie collaborative en temps réel, la logistique humaine d'astreinte, le contrôle strict des délais contractuels de SLA et la capitalisation des connaissances techniques au sein d'une unique interface robuste, économique et souveraine ?"));

paragraphs.push(addH2("1.2 Objectifs du projet"));
paragraphs.push(addP("Le projet ProdKB a été initié pour apporter une réponse industrielle à cette problématique en concevant une plateforme intégrée d'Incident Management et de base de connaissances d'exploitation. Les objectifs assignés lors de la phase de cadrage se structurent autour de quatre axes majeurs :"));
paragraphs.push(addBullet("Proposer un espace de collaboration virtuel exclusif à chaque anomalie déclarée. Cette interface doit unifier la messagerie en temps réel, le partage de journaux d'erreurs techniques, et l'affichage d'indicateurs de santé système, afin de réduire le temps de coordination.", "Coordonner en Temps Réel"));
paragraphs.push(addBullet("Développer un moteur de règles temporelles capable d'analyser en arrière-plan la sévérité des incidents déclarés, d'estimer les heures limites d'acquittement et de résolution, et de déclencher de manière asynchrone des mécanismes d'escalade d'alertes en cas de dérive temporelle.", "Garantir le Respect des SLAs"));
paragraphs.push(addBullet("Fournir un moteur de documentation au format Markdown permettant de rédiger des procédures réflexes d'exploitation (SOP Runbooks), de les indexer par recherche plein texte, et de les suggérer de manière contextuelle à l'exploitant selon la nature de l'incident détecté.", "Centraliser la Connaissance (Knowledge Base)"));
paragraphs.push(addBullet("Permettre un hébergement autonome complet (Self-Hosting) afin de garantir la souveraineté absolue sur les données d'exploitation internes, extrêmement sensibles pour la sécurité de l'entreprise, en s'affranchissant des coûteux abonnements de type SaaS américains (PagerDuty, Jira Cloud).", "Assurer la Souveraineté"));

paragraphs.push(addH2("1.3 Périmètre fonctionnel"));
paragraphs.push(addP("Pour répondre à ces objectifs, le périmètre de ProdKB a été rigoureusement circonscrit autour de quatre modules fonctionnels de base :"));
paragraphs.push(addBullet("Gère la création, la modification et la recherche des incidents selon leur sévérité (CRITICAL, HIGH, MEDIUM, LOW), leur statut (OPEN, INVESTIGATING, RESOLVED, CLOSED) et les systèmes affectés.", "Le Module Gestion des Incidents"));
paragraphs.push(addBullet("Offre l'espace de messagerie instantanée WebSocket dédié à la crise, avec upload sécurisé de pièces jointes (fichiers logs volumineux, captures d'écran) et affichage d'un widget de santé système Prometheus.", "Le Module War Room Collaboratif"));
paragraphs.push(addBullet("Gère le calendrier d'astreinte hebdomadaire, l'affectation automatique du technicien de garde en cas d'incident critique, l'import et l'export de plannings sous forme de fichiers CSV.", "Le Module Astreintes & Calendriers"));
paragraphs.push(addBullet("Permet aux managers d'ajuster les règles temporelles de SLAs, de surveiller les statistiques globales de performance système (MTTR, taux de respect des SLAs) et de visualiser les logs d'audit d'accès.", "Le Module Administration & Analytics"));

paragraphs.push(addH2("1.4 Plan du rapport"));
paragraphs.push(addP("Ce mémoire s'articule logiquement autour de dix chapitres structurés. Le chapitre 2 expose l'étude préalable et le cahier des charges détaillé. Le chapitre 3 présente la modélisation UML complète du système. Le chapitre 4 présente la modélisation logique de données selon la méthode MERISE. Le chapitre 5 expose l'architecture technique globale et l'infrastructure DevOps. Le chapitre 6 présente la conception détaillée de chaque module métier. Le chapitre 7 aborde l'implémentation et les patrons de conception appliqués au code source. Le chapitre 8 présente la stratégie de qualité et les plans de tests. Le chapitre 9 détaille l'infrastructure cloud physique de production. Enfin, le chapitre 10 dresse le bilan, les difficultés rencontrées et les perspectives d'évolution de la plateforme."));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 2 : CAHIER DES CHARGES
// ==========================================
paragraphs.push(addH1("CHAPITRE 2 — ÉTUDE PRÉALABLE ET CAHIER DES CHARGES"));
paragraphs.push(addH2("2.1 Analyse de l'existant"));
paragraphs.push(addP("Avant l'intégration de ProdKB, la gestion des crises applicatives au sein des services informatiques suivait un workflow hautement fragmenté et manuel. L'apparition d'un bug majeur en production entraînait le déclenchement d'un flux artisanal : une alerte par email était interceptée par un technicien N1. Ce dernier devait ouvrir manuellement un tableur Excel partagé pour identifier l'ingénieur de garde d'astreinte. La documentation technique requise pour diagnostiquer et résoudre l'anomalie était dispersée dans des wikis poussiéreux, obligeant les techniciens à improviser. La communication entre l'expert technique, le chef de projet et le manager s'effectuait sur des canaux Slack ou Teams génériques, mêlant conversations courantes et analyses de crise."));
paragraphs.push(addP("Ce mode opératoire obsolète présentait des faiblesses critiques : une perte de temps considérable lors de l'identification et de la prise de contact avec le technicien d'astreinte, une absence totale de suivi du chronomètre de SLA contractuel, et aucun enregistrement exploitable des discussions et des logs partagés durant l'incident, interdisant toute démarche post-mortem de capitalisation technique."));

paragraphs.push(addH2("2.2 Identification des acteurs du système"));
paragraphs.push(addP("Le système ProdKB interagit avec quatre profils d'acteurs distincts disposant d'habilitations RBAC (Role-Based Access Control) bien spécifiques :"));
paragraphs.push(addBullet("Il surveille la console d'alerte générale. C'est lui qui déclare les incidents de production, prend connaissance des fiches réflexes SOP et assure le premier niveau de tri et de qualification des anomalies.", "Opérateur d'Exploitation (N1)"));
paragraphs.push(addBullet("Ingénieur de garde, il est sollicité de jour comme de nuit lors d'alertes critiques. Il rejoint l'espace War Room de l'incident, analyse les traces d'erreurs en téléversant les fichiers logs, applique les procédures de correction, résout l'incident et rédige le rapport post-mortem final.", "Expert Technique d'Astreinte (N2/N3)"));
paragraphs.push(addBullet("Responsable du support client ou du pôle infrastructure. Il ne participe pas au diagnostic technique direct mais utilise le tableau de bord pour suivre en temps réel la santé globale du système, vérifier le respect du budget d'erreur de SLA et valider la clôture définitive des incidents.", "Manager de Service / Pilote"));
paragraphs.push(addBullet("Il a la responsabilité globale de la plateforme. Il configure les droits d'accès RBAC, définit les délais cibles de SLA par niveau de gravité, configure les alertes de webhooks externes et gère l'import/export des grilles d'astreintes.", "Administrateur Système"));

paragraphs.push(addH2("2.3 Besoins fonctionnels (liste détaillée)"));
paragraphs.push(addBullet("Permettre la saisie d'incidents avec titre, description complète, choix de la sévérité (CRITICAL, HIGH, MEDIUM, LOW) et environnement de survenue.", "Gestion du Cycle de Vie des Incidents"));
paragraphs.push(addBullet("Ouverture d'une room de discussion instantanée dès la déclaration d'un incident, avec mise en commun des messages via WebSockets bidirectionnels.", "Espace Collaboratif War Room"));
paragraphs.push(addBullet("Possibilité d'envoyer des journaux système (.log, .txt) ou des captures d'écran (.png, .jpg) directement sur le bucket de stockage compatible S3.", "Partage Documentaire Sécurisé"));
paragraphs.push(addBullet("Création et modification de plannings de garde hebdomadaires liant un expert technique à un créneau horaire. Possibilité d'importer ces grilles de garde via un fichier CSV structuré.", "Gestion des Plannings d'Astreinte"));
paragraphs.push(addBullet("Affichage graphique du temps moyen de résolution (MTTR), du nombre d'incidents par mois, et du pourcentage d'incidents ayant violé la SLA.", "Tableau de Bord & KPIs Analytiques"));

paragraphs.push(addH2("2.4 Besoins non fonctionnels"));
paragraphs.push(addBullet("Le système de messagerie et l'actualisation des indicateurs de SLAs doivent s'exécuter en temps réel avec un temps de latence réseau inférieur à 100ms sous une charge nominale de 50 utilisateurs simultanés par War Room.", "Performance et Réactivité"));
paragraphs.push(addBullet("L'architecture doit garantir une disponibilité annuelle de 99.9%. Les processus Express et les files de tâches BullMQ doivent s'exécuter de façon isolée et disposer d'un auto-healing (redémarrage automatique en cas de plantage).", "Haute Disponibilité & Résilience"));
paragraphs.push(addBullet("Chiffrement obligatoire de toutes les communications par le protocole TLS (HTTPS / WSS). Isolation des privilèges utilisateurs via un système RBAC strict. Hachage des mots de passe avec Bcrypt et sessions basées sur des jetons JWT étanches.", "Sécurité & Confidentialité"));
paragraphs.push(addBullet("La base de données PostgreSQL doit supporter des pics de connexions simultanées sans surcharger la mémoire du serveur applicatif, grâce à un mécanisme de pooling de connexions (PgBouncer).", "Scalabilité"));

paragraphs.push(addH2("2.5 Contraintes techniques et choix technologiques justifiés"));
paragraphs.push(addP("L'ensemble de l'application ProdKB devant être déployé de manière économique sur un serveur d'entrée de gamme AWS EC2, l'optimisation de la consommation de ressources RAM et CPU a constitué la contrainte majeure de développement. C'est pourquoi nous avons délibérément écarté des technologies lourdes comme Nest.js côté backend (qui nécessite une empreinte mémoire importante lors de l'initialisation du framework) au profit d'une architecture monolithique modulaire basée sur Express 5 avec TypeScript et l'ORM Prisma."));
paragraphs.push(addP("Ce choix allie la rigueur et la maintenabilité d'un typage statique de bout en bout avec la légèreté et la rapidité d'Express. Pour le traitement asynchrone des expirations de SLAs et des notifications emails, nous avons implémenté BullMQ couplé à un courtier de messages Redis 7. Ce découplage garantit que l'API principale n'est jamais bloquée par des traitements lourds en tâche de fond. Côté stockage de données, PostgreSQL 16 a été sélectionné pour sa parfaite conformité aux transactions ACID. Il est secondé par PgBouncer qui joue le rôle de proxy de pooling de connexions. Le stockage objet est quant à lui géré localement par MinIO, offrant une solution compatible S3 totalement souveraine et exempte de coûts de transfert de données. Enfin, le frontend s'appuie sur React 18 compilé avec Vite, garantissant un bundle statique léger et un temps de premier rendu (FCP) exceptionnel."));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 3 : MODELISATION UML
// ==========================================
paragraphs.push(addH1("CHAPITRE 3 — MODÉLISATION UML"));
paragraphs.push(addP("Ce chapitre expose la modélisation orientée objet du système ProdKB à travers les diagrammes structurels et comportementaux d'UML (Unified Modeling Language), indispensables pour formaliser les mécanismes de notre plateforme."));

paragraphs.push(addH2("3.1 Diagramme des cas d'utilisation (Use Case)"));
paragraphs.push(addP("Le diagramme des cas d'utilisation ci-dessous définit les frontières du système et représente les interactions fonctionnelles entre nos différents acteurs (Opérateur N1, Expert N2 d'astreinte, Administrateur, Système) et la plateforme ProdKB :"));
paragraphs.push(addCode(`@startuml
left to right direction
skinparam packageStyle rectangle

actor "Utilisateur Anonyme" as Anon
actor "Opérateur N1" as Op
actor "Expert N2" as Exp
actor "Administrateur" as Admin
actor "Système (Workers)" as Sys

rectangle ProdKB {
  (S'authentifier) as (UC_Auth)
  (Gérer les incidents) as (UC_Incident)
  (Rejoindre la War Room) as (UC_WarRoom)
  (Uploader des fichiers) as (UC_Upload)
  (Consulter le tableau de bord) as (UC_Dashboard)
  (Gérer les astreintes) as (UC_Astreinte)
  (Configurer les SLAs) as (UC_SLA)
}

Anon --> (UC_Auth)
Op --> (UC_Auth)
Op --> (UC_Incident)
Op --> (UC_WarRoom)
Op --> (UC_Upload)
Op --> (UC_Dashboard)

Exp --> (UC_Incident)
Exp --> (UC_WarRoom)

Admin --> (UC_Astreinte)
Admin --> (UC_SLA)

(UC_Incident) <.. (UC_Upload) : <<extend>>
(UC_Incident) ..> (UC_WarRoom) : <<include>>

Sys --> (UC_SLA)
@enduml`));

paragraphs.push(addH2("3.2 Diagramme de classes"));
paragraphs.push(addP("Le diagramme de classes structurel ci-dessous illustre le schéma d'objets métier de ProdKB, en précisant les types d'attributs, les signatures de méthodes et les multiplicités relationnelles qui lient nos entités de domaine :"));
paragraphs.push(addCode(`@startuml
class User {
  +UUID id
  +String name
  +String email
  +String passwordHash
  +Boolean isActive
  +login()
}

class Role {
  +UUID id
  +String name
  +List permissions
}

class Incident {
  +UUID id
  +String title
  +String description
  +Severity severity
  +Status status
  +DateTime createdAt
  +Boolean slaBreached
  +acknowledge()
  +resolve()
}

class System {
  +UUID id
  +String name
  +String description
}

class SLA {
  +UUID id
  +Severity severity
  +Int ackLimitMinutes
  +Int resLimitMinutes
}

class Procedure {
  +UUID id
  +String title
  +String contentMarkdown
}

class Astreinte {
  +UUID id
  +Int weekNumber
  +Int year
}

class Team {
  +UUID id
  +String name
}

User "*" o-- "1" Role : a
Team "1" *-- "*" User : regroupe
Incident "*" -- "1" System : impacte
Incident "*" -- "1" User : declarePar
Incident "*" -- "0..1" Team : assigneA
Incident "*" -- "0..1" SLA : soumisA
Incident "*" -- "0..1" Procedure : resoluPar
Team "1" *-- "*" Astreinte : planifie
Astreinte "*" -- "1" User : delegueA
@enduml`));

paragraphs.push(addH2("3.3 Diagramme de séquence — Authentification JWT"));
paragraphs.push(addP("Ce diagramme détaille la cinématique sécurisée et sans état (stateless) d'accès à l'API. Il met en évidence le double stockage des jetons d'authentification pour neutraliser les attaques XSS et CSRF :"));
paragraphs.push(addCode(`@startuml
actor Client as React
participant Backend as Express
database BDD as PostgreSQL

React -> Backend: POST /api/v1/auth/login {email, password}
activate Express
Express -> BDD: Rechercher User par email
activate PostgreSQL
BDD --> Express: User + passwordHash
deactivate PostgreSQL
Express -> Express: Comparer password (Bcrypt)
Express -> Express: Générer AccessToken (JWT) & RefreshToken (JWT)
Express -> BDD: INSERT / UPDATE RefreshToken actif
Express -> Express: Générer jeton anti-CSRF
Express --> React: Set-Cookie (HttpOnly, Secure, JWT) + JSON {csrfToken}
deactivate Express

Note over React, Express: Requêtes suivantes (Modification)
React -> Express: PUT /api/v1/incidents/1 (Headers: x-csrf-token)
activate Express
Express -> Express: Vérifier Cookie JWT & Header CSRF
Express --> React: 200 OK
deactivate Express
@enduml`));

paragraphs.push(addH2("3.4 Diagramme de séquence — SLA & Workers"));
paragraphs.push(addP("Ce diagramme de séquence comportemental illustre la planification asynchrone des chronomètres de SLAs. L'API délègue la surveillance du temps à BullMQ, évitant ainsi tout blocage de l'API principale :"));
paragraphs.push(addCode(`@startuml
actor Opérateur as Op
participant API as Express
database BDD as PostgreSQL
participant Queue as Redis
participant Worker as SLAWorker

Op -> API: POST /api/v1/incidents {title, severity: CRITICAL}
activate Express
API -> BDD: INSERT INTO "Incident" (status: OPEN)
activate PostgreSQL
BDD --> API: Incident créé
deactivate PostgreSQL
API -> Queue: Enregistrer un Job SLA différé (delay: 15min)
API --> Op: 201 Created (Incident ouvert)
deactivate Express

Note over SLAWorker: Attente de 15 minutes...
SLAWorker -> Queue: Déclencher Job expiré
activate SLAWorker
SLAWorker -> BDD: Vérifier statut du incident
activate PostgreSQL
BDD --> SLAWorker: Statut toujours "OPEN"
SLAWorker -> BDD: UPDATE "Incident" SET slaBreached = true
SLAWorker -> Express: Emettre événement d'escalade automatique (SMS/Slack)
deactivate PostgreSQL
deactivate SLAWorker
@enduml`));

paragraphs.push(addH2("3.5 Diagramme de séquence — Communication temps réel (WebSocket)"));
paragraphs.push(addP("Ce diagramme de séquence modélise les flux d'échanges bidirectionnels et instantanés au sein d'une War Room collaborative. Socket.io assure la distribution sélective des messages aux techniciens connectés à une même session d'incident :"));
paragraphs.push(addCode(`@startuml
actor Opérateur1 as Op1
actor Opérateur2 as Op2
participant WS as Socket.io
database BDD as PostgreSQL

Op1 -> WS: Connect (Cookie: AccessToken)
WS -> WS: Vérifier et authentifier le token JWT
WS --> Op1: Connecté (ID Client)

Op1 -> WS: JoinRoom (incidentId)
Op2 -> WS: JoinRoom (incidentId)

Op1 -> WS: SendMessage {room: incidentId, text: "Logs du crash joints"}
WS -> BDD: INSERT INTO "Message" (text, incidentId)
WS -> WS: Retransmettre Message à la Room (incidentId)
WS --> Op2: NewMessage {sender: Op1, text: "Logs..."}
@enduml`));

paragraphs.push(addH2("3.6 Diagramme d'activité — Cycle de vie d'un incident"));
paragraphs.push(addP("Ce diagramme détaille le flux d'activités depuis la détection d'une anomalie jusqu'à sa clôture définitive, en intégrant le processus parallèle de surveillance de la SLA :"));
paragraphs.push(addCode(`@startuml
start
:Déclaration de l'incident (Opérateur);
:Incident créé à l'état OUVERT;
:Calcul automatique du SLA et affectation d'équipe;
fork
  :Attente de l'acquittement par l'astreinte;
  if (Temps limite SLA dépassé ?) then (oui)
    :Marquer slaBreached = true;
    :Déclencher escalade automatique;
  else (non)
  endif
fork end
:Prise en charge (Statut: EN_COURS);
:Analyse et résolution (Statut: RESOLU);
:Rédaction du rapport Post-Mortem;
:Clôture finale par le Manager (Statut: CLOTURE);
stop
@enduml`));

paragraphs.push(addH2("3.7 Diagramme d'état-transition — États d'un incident"));
paragraphs.push(addP("Ce diagramme définit de manière exhaustive les états logiques autorisés d'un incident et les événements provoquant ces transitions :"));
paragraphs.push(addCode(`@startuml
[*] --> OPEN : Déclaration (Opérateur)
OPEN --> IN_PROGRESS : Prise en charge (Acknowledge)
OPEN --> OPEN : Dépassement SLA (slaBreached = true)
IN_PROGRESS --> RESOLVED : Déclaration de résolution
RESOLVED --> CLOSED : Validation finale (Manager)
CLOSED --> [*]
@enduml`));

paragraphs.push(addH2("3.8 Diagramme de composants — Architecture"));
paragraphs.push(addP("Ce diagramme montre l'organisation physique du code source de ProdKB, découpé en composants à forte cohésion et couplage lâche :"));
paragraphs.push(addCode(`@startuml
package "Frontend SPA" {
  [React Router] --> [Auth Feature]
  [React Router] --> [Incidents Feature]
  [Incidents Feature] --> [WarRoom Component]
  [Incidents Feature] --> [EscalationTimer Component]
  [Incidents Feature] --> [SystemHealthWidget Component]
}

package "Backend Monolith" {
  [Express Router] --> [Auth Controller]
  [Express Router] --> [Incidents Controller]
  [Express Router] --> [Planning Controller]
  
  [Incidents Controller] --> [Incident Use Cases]
  [Incident Use Cases] --> [Prisma Client]
}

package "Asynchronous Queue" {
  [Incident Use Cases] --> [BullMQ Queue]
  [BullMQ Queue] --> [Redis Message Broker]
  [Redis Message Broker] --> [SLA Worker]
}

package "Data & Storage" {
  [Prisma Client] --> [PgBouncer Proxy]
  [PgBouncer Proxy] --> [PostgreSQL DB]
}
@enduml`));

paragraphs.push(addH2("3.9 Diagramme de déploiement — Infrastructure"));
paragraphs.push(addP("Ce diagramme de déploiement illustre la topologie réseau et l'environnement matériel d'hébergement sur AWS. Les conteneurs s'exécutent sur un réseau virtuel privé sécurisé par Nginx :"));
paragraphs.push(addCode(`@startuml
node "AWS EC2 Cloud Instance (Ubuntu)" {
  node "Nginx Container (Reverse Proxy)" {
    [SSL / HTTPS (Port 443)]
  }
  
  node "Docker Network" {
    node "Frontend Container" {
      [Nginx serving React static build]
    }
    node "API Backend Container" {
      [Node.js Express API]
    }
    node "Workers Containers" {
      [SLA / Webhook Workers]
    }
    node "PgBouncer Container" {
      [PgBouncer Proxy]
    }
    node "PostgreSQL Container" {
      [PostgreSQL Database]
    }
    node "Redis Container" {
      [Redis Cache & Message Broker]
    }
    node "MinIO Container" {
      [MinIO S3 Object Storage]
    }
  }
}

[SSL / HTTPS (Port 443)] --> [Nginx serving React static build] : route /
[SSL / HTTPS (Port 443)] --> [Node.js Express API] : route /api
[Node.js Express API] --> [PgBouncer Proxy]
[PgBouncer Proxy] --> [PostgreSQL Database]
[Node.js Express API] --> [Redis Cache & Message Broker]
[Node.js Express API] --> [MinIO Container]
@enduml`));

paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 4 : MERISE
// ==========================================
paragraphs.push(addH1("CHAPITRE 4 — MODÉLISATION MERISE"));
paragraphs.push(addH2("4.1 Introduction à la méthode MERISE"));
paragraphs.push(addP("Bien que la modélisation UML soit la norme de fait pour la conception orientée objet, la méthode MERISE demeure l'approche la plus rigoureuse et la plus adaptée pour concevoir de manière relationnelle les bases de données SQL. En dissociant les données des traitements, MERISE garantit une normalisation irréprochable de notre base de données PostgreSQL 16 (respect strict de la Troisième Forme Normale - 3NF), évitant ainsi toute redondance d'information et toute anomalie d'insertion, de modification ou de suppression."));

paragraphs.push(addH2("4.2 Modèle Conceptuel des Données (MCD)"));
paragraphs.push(addP("Le MCD modélise de façon conceptuelle les entités de notre domaine et leurs associations logiques. Il se structure autour des entités suivantes :"));
paragraphs.push(addBullet("Contient les attributs id (UUID), nom, email, passwordHash et isActive. Cet utilisateur est lié aux autres tables par des associations spécifiques.", "Entité UTILISATEUR"));
paragraphs.push(addBullet("Comprend les attributs id (UUID), titre, description, statut, severite, dateCreation et slaBreached.", "Entité INCIDENT"));
paragraphs.push(addBullet("Comprend id (UUID), texte, et dateEnvoi. Il matérialise les messages échangés au sein d'une War Room d'un incident.", "Entité MESSAGE"));
paragraphs.push(addBullet("Comprend id (UUID), numeroSemaine, et annee. Elle structure les plannings de garde hebdomadaires des ingénieurs.", "Entité ASTREINTE"));
paragraphs.push(addBullet("Comprend id (UUID), severite, limiteAckMinutes, et limiteResMinutes. Elle contient les objectifs de temps de prise en charge et de résolution par niveau de gravité.", "Entité SLA_CONFIG"));
paragraphs.push(addBullet("Comprend id (UUID), action, adresseIp, et dateAction. Elle enregistre de manière irréversible toutes les actions sensibles réalisées sur la plateforme.", "Entité AUDIT_LOG"));

paragraphs.push(addP("Les associations qui relient ces entités sont définies avec des cardinalités très précises :"));
paragraphs.push(addBullet("Un UTILISATEUR crée de 0 à N INCIDENTs. Un INCIDENT est déclaré par 1 et 1 seul UTILISATEUR (cardinalité : 0..N et 1..1).", "Association DECLARER"));
paragraphs.push(addBullet("Un INCIDENT contient de 0 à N MESSAGEs. Un MESSAGE appartient à 1 et 1 seul INCIDENT (cardinalité : 0..N et 1..1).", "Association CONTENIR"));
paragraphs.push(addBullet("Un INCIDENT est régi par 0 ou 1 SLA_CONFIG. Une SLA_CONFIG régit de 0 à N INCIDENTs (cardinalité : 0..1 et 0..N).", "Association SOUMETTRE"));
paragraphs.push(addBullet("Une ASTREINTE implique 1 et 1 seul UTILISATEUR. Un UTILISATEUR assure de 0 à N ASTREINTEs (cardinalité : 1..1 et 0..N).", "Association ASSURER"));

paragraphs.push(addH2("4.3 Modèle Logique des Données (MLD)"));
paragraphs.push(addP("La transformation du MCD en MLD relationnel s'opère en traduisant les associations conceptuelles en clés primaires (PK) et clés étrangères (FK) selon les règles de dérivation relationnelle standard :"));
paragraphs.push(addBullet("ROLE (id_role, nom_role, permissions)", "Table ROLE"));
paragraphs.push(addBullet("UTILISATEUR (id_user, nom, email, password_hash, is_active, #id_role)", "Table UTILISATEUR"));
paragraphs.push(addBullet("SYSTEME (id_system, nom_system, description)", "Table SYSTEME"));
paragraphs.push(addBullet("SLA_CONFIG (id_sla, severite, limite_ack, limite_res)", "Table SLA_CONFIG"));
paragraphs.push(addBullet("INCIDENT (id_incident, titre, description, statut, severite, date_creation, sla_breached, #id_user, #id_system, #id_sla)", "Table INCIDENT"));
paragraphs.push(addBullet("MESSAGE (id_message, texte, date_envoi, #id_user, #id_incident)", "Table MESSAGE"));
paragraphs.push(addBullet("ASTREINTE (id_astreinte, numero_semaine, annee, #id_user, #id_team)", "Table ASTREINTE"));
paragraphs.push(addBullet("AUDIT_LOG (id_audit, action, adresse_ip, date_action, #id_user)", "Table AUDIT_LOG"));

paragraphs.push(addH2("4.4 Modèle Physique des Données (MPD)"));
paragraphs.push(addP("Le script SQL suivant implémente les contraintes d'intégrité référentielle, les index et les clés de notre base de données PostgreSQL 16 :"));
paragraphs.push(addCode(`-- Enums PostgreSQL pour restreindre les valeurs possibles
CREATE TYPE severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- Table Rôle
CREATE TABLE "Role" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    permissions TEXT[] NOT NULL
);

-- Table Utilisateur
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" UUID NOT NULL REFERENCES "Role"(id) ON DELETE RESTRICT
);

-- Table Système impacté
CREATE TABLE "System" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Table des configurations de SLAs
CREATE TABLE "SLA" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity severity_enum NOT NULL UNIQUE,
    "ackLimitMinutes" INTEGER NOT NULL,
    "resLimitMinutes" INTEGER NOT NULL
);

-- Table des Incidents
CREATE TABLE "Incident" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status status_enum NOT NULL DEFAULT 'OPEN',
    severity severity_enum NOT NULL,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "resolvedAt" TIMESTAMP,
    "systemId" UUID NOT NULL REFERENCES "System"(id) ON DELETE RESTRICT,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    "slaId" UUID REFERENCES "SLA"(id) ON DELETE SET NULL
);

-- Indexation intelligente pour optimiser les requêtes fréquentes
CREATE INDEX idx_incident_status ON "Incident"(status);
CREATE INDEX idx_incident_severity ON "Incident"(severity);
CREATE INDEX idx_incident_created_at ON "Incident"("createdAt");`));

paragraphs.push(addH2("4.5 Dictionnaire de données"));
paragraphs.push(addP("Ce dictionnaire de données récapitule les types de données physiques, les plages de valeurs autorisées et la sémantique de chaque attribut stocké en base de données :"));
paragraphs.push(createStyledTable(
  ["Attribut", "Type Physique", "Contraintes", "Description Métier"],
  [
    ["User.id", "UUID", "PRIMARY KEY", "Identifiant unique universel de l'utilisateur."],
    ["User.email", "VARCHAR(255)", "UNIQUE, NOT NULL", "Adresse email servant d'identifiant de connexion."],
    ["User.passwordHash", "VARCHAR(255)", "NOT NULL", "Mot de passe chiffré irréversiblement avec Bcrypt."],
    ["Incident.status", "VARCHAR (ENUM)", "NOT NULL, DEFAULT 'OPEN'", "Statut actuel de l'incident (OPEN, IN_PROGRESS, RESOLVED, CLOSED)."],
    ["Incident.severity", "VARCHAR (ENUM)", "NOT NULL", "Gravité de la panne (LOW, MEDIUM, HIGH, CRITICAL)."],
    ["Incident.slaBreached", "BOOLEAN", "NOT NULL, DEFAULT FALSE", "Drapeau indiquant si le compte à rebours SLA a expiré."],
    ["SLA.ackLimitMinutes", "INTEGER", "NOT NULL", "Temps limite (en minutes) imparti pour prendre en charge l'incident."],
    ["SLA.resLimitMinutes", "INTEGER", "NOT NULL", "Temps limite (en minutes) imparti pour marquer l'incident résolu."]
  ]
));

paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 5 : ARCHITECTURE TECHNIQUE
// ==========================================
paragraphs.push(addH1("CHAPITRE 5 — ARCHITECTURE TECHNIQUE DU SYSTÈME"));
paragraphs.push(addH2("5.1 Vue d'ensemble de l'architecture"));
paragraphs.push(addP("ProdKB s'appuie sur une Architecture en Couches de type Clean Architecture. L'ensemble des flux d'informations est rigoureusement compartimenté. La logique métier ne dépend d'aucun framework web ou bibliothèque de base de données."));
paragraphs.push(addP("Cette modularité garantit que le système reste hautement maintenable, facilement testable de manière unitaire, et prêt pour une éventuelle migration future d'un monolithe vers une architecture microservices si le volume d'activité l'exige."));

paragraphs.push(addH2("5.2 Architecture Frontend — SPA React et flux de données"));
paragraphs.push(addP("L'interface utilisateur de ProdKB est une application Single Page (SPA) construite avec React 18 et compilée avec Vite. Le routage est entièrement géré côté client par React Router. La gestion d'état s'appuie sur des hooks React personnalisés combinés à un contexte global léger pour l'authentification et les sessions de messagerie WebSocket."));
paragraphs.push(addP("La communication avec le backend s'effectue via deux canaux distincts : des requêtes HTTP REST (gérées par Axios) pour les opérations synchrones classiques (connexion, lecture de tickets, modification d'astreintes), et une connexion permanente bidirectionnelle via Socket.io-client pour l'activité temps réel de la War Room. Le design est hautement réactif grâce à TailwindCSS, et les données d'entrée sont validées au plus tôt à l'aide de Zod, empêchant l'envoi de payloads corrompus vers le serveur."));

paragraphs.push(addH2("5.3 Architecture Backend — Monolithe Modulaire"));
paragraphs.push(addP("Le backend de ProdKB est structuré en Monolithe Modulaire, appliquant les principes du Domain-Driven Design (DDD). Chaque domaine fonctionnel (Authentification, Incidents, Astreintes, Notifications, Observabilité) réside au sein d'un répertoire autonome comprenant ses propres contrôleurs, cas d'utilisation (Use Cases) et référentiels de données (Repositories)."));
paragraphs.push(addP("Les flux de traitement respectent la structure en couches suivante :"));
paragraphs.push(addBullet("Intercepte les requêtes HTTP, valide le schéma de données entrant avec Zod, extrait les tokens de session et appelle le contrôleur approprié.", "La couche de transport et de routage (Express 5)"));
paragraphs.push(addBullet("Reçoit les requêtes qualifiées, orchestre les traitements et appelle les cas d'utilisation métier.", "La couche de contrôle (Controllers)"));
paragraphs.push(addBullet("Elle abrite la pure logique métier (ex. calculer le MTTR, planifier une escalade). Elle est totalement agnostique des bases de données ou des protocoles HTTP.", "La couche des Use Cases (Business Logic)"));
paragraphs.push(addBullet("Fait le lien avec Prisma ORM pour manipuler PostgreSQL. Elle expose des interfaces abstraites aux Use Cases (Repository Pattern), permettant d'isoler la base physique du code métier.", "La couche d'infrastructure et de données (Repositories)"));

paragraphs.push(addH2("5.4 Architecture asynchrone — File de tâches BullMQ / Redis"));
paragraphs.push(addP("Pour éviter que des traitements lourds n'impactent le temps de réponse de l'API principale (comme l'envoi d'emails transactionnels ou la vérification de l'échéance de SLAs), ProdKB délègue ces tâches de manière asynchrone via BullMQ couplé à un courtier de messages Redis."));
paragraphs.push(addP("Trois workers autonomes s'exécutent en tâche de fond :"));
paragraphs.push(addBullet("Il surveille continuellement les minuteurs de SLAs. Lorsqu'un incident est ouvert, un job retardé est inséré dans Redis. À l'échéance, le worker vérifie l'état de l'incident et applique les mesures d'escalade si nécessaire.", "Le sla-worker"));
paragraphs.push(addBullet("Gère l'envoi d'emails transactionnels (alertes d'astreinte, rapports journaliers) via le protocole SMTP (Nodemailer), gérant automatiquement les files d'attente et les tentatives de réenvoi en cas de panne réseau temporaire.", "Le email-worker"));
paragraphs.push(addBullet("Pousse de manière asynchrone les webhooks d'alertes configurés par l'administrateur vers des plateformes externes (ex. Slack, MS Teams) afin de notifier les équipes hors du portail.", "Le webhook-worker"));

paragraphs.push(addH2("5.5 Architecture de communication temps réel — Socket.io et multiplexage des canaux"));
paragraphs.push(addP("La réactivité de la War Room repose sur une architecture WebSocket gérée par Socket.io. Lorsqu'un utilisateur rejoint la War Room d'un incident particulier, le serveur l'abonne à une 'Room ID' unique à cet incident."));
paragraphs.push(addP("Le trafic de messagerie et les événements de statut (prise en charge, demande de fermeture) sont multiplexés et distribués instantanément et uniquement aux clients connectés à cette même pièce virtuelle. Pour assurer une scalabilité horizontale en production, Socket.io est couplé à un adaptateur Redis, permettant de propager de manière fluide les messages à travers plusieurs instances de l'API Node.js."));

paragraphs.push(addH2("5.6 Architecture de stockage — PostgreSQL + PgBouncer + Redis + MinIO"));
paragraphs.push(addP("La persistance des données repose sur un stockage hybride adapté à la nature de chaque information :"));
paragraphs.push(addBullet("PostgreSQL 16 garantit l'intégrité de toutes nos données relationnelles critiques (Utilisateurs, Rôles, Incidents, SLAs, Plannings). Le proxy PgBouncer gère le pooling de connexions SQL actives pour supporter les variations de charge.", "Stockage Relationnel (PostgreSQL)"));
paragraphs.push(addBullet("Redis 7 stocke en mémoire les files de tâches BullMQ, gère les sessions actives des utilisateurs et sert de cache à haute performance pour les plannings d'astreinte, évitant ainsi d'interroger PostgreSQL lors de requêtes fréquentes.", "Cache & Broker (Redis)"));
paragraphs.push(addBullet("MinIO, serveur de stockage d'objets auto-hébergé, conserve toutes les pièces jointes (fichiers logs volumineux, captures d'écran) de la War Room de façon totalement souveraine, avec génération d'URLs sécurisées pré-signées temporaires.", "Stockage Objets (MinIO / S3)"));

paragraphs.push(addH2("5.7 Architecture de sécurité"));
paragraphs.push(addP("La sécurité est un pilier de ProdKB. Nous mettons en œuvre les normes industrielles d'authentification et de protection :"));
paragraphs.push(addBullet("Sessions stateless basées sur des tokens JWT. Un AccessToken à durée de vie courte (15 min) transite dans les en-têtes d'autorisation, tandis qu'un RefreshToken (durée 7j) est conservé dans un cookie sécurisé HttpOnly pour contrer les failles XSS.", "Authentification JWT Robuste"));
paragraphs.push(addBullet("Hachage à sens unique des mots de passe utilisateurs avec Bcrypt (12 passes de salage), empêchant leur déchiffrement même en cas de vol de la base PostgreSQL.", "Hachage Bcrypt"));
paragraphs.push(addBullet("Configuration stricte d'helmet pour bloquer les attaques de type Clickjacking ou Cross-Site Scripting (XSS), restriction CORS limitant les appels d'API uniquement au domaine autorisé, et limitation de requêtes (Rate Limiting) gérée via Redis.", "Helmet & CORS"));

paragraphs.push(addH2("5.8 Architecture DevOps & Infrastructure"));
paragraphs.push(addP("L'ensemble de l'infrastructure ProdKB est conteneurisé à l'aide de Docker et orchestré avec Docker Compose. Cette standardisation garantit un comportement rigoureusement identique du système entre l'environnement de développement local et le serveur de production cloud."));
paragraphs.push(addP("La topologie réseau s'appuie sur trois réseaux virtuels Docker isolés : `frontend-net` (communication client-api), `backend-net` (communication api-workers-redis-minio), et `database-net` (réservé aux échanges api-pgbouncer-postgres). Nginx assure le rôle de reverse proxy centralisé et gère la terminaison SSL, avec certificats gratuits émis par Let's Encrypt et renouvelés automatiquement via Certbot. Enfin, l'observabilité est assurée par un empilement Prometheus (collecte des métriques CPU/RAM et Node.js), Loki + Promtail (centralisation et filtrage des journaux d'erreurs), et Grafana (visualisation graphique)."));

paragraphs.push(addH2("5.9 Architecture de tests"));
paragraphs.push(addP("ProdKB applique le modèle de la Pyramide des Tests pour s'assurer de la stabilité applicative à chaque étape de build :"));
paragraphs.push(addBullet("Développés sous Jest, ils valident de façon unitaire la logique pure des Use Cases métier et des utilitaires logiques, avec un objectif de couverture supérieur à 85%.", "Tests Unitaires"));
paragraphs.push(addBullet("Développés avec Jest et Supertest, ils simulent l'appel des routes d'API Express sur une base de données PostgreSQL de test isolée pour valider le comportement de bout en bout des contrôleurs et de l'ORM.", "Tests d'Intégration"));
paragraphs.push(addBullet("Rédigés avec Playwright, ils exécutent de vrais parcours utilisateurs dans des navigateurs Chromium et Firefox sans tête (headless) pour garantir la réactivité de l'authentification et de la messagerie WebSocket.", "Tests E2E (End-to-End)"));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 6 : CONCEPTION DETAILLEE DES MODULES
// ==========================================
paragraphs.push(addH1("CHAPITRE 6 — CONCEPTION DÉTAILLÉE DES MODULES"));
paragraphs.push(addP("Ce chapitre présente la conception logique détaillée de chacun des modules clés constituant l'application ProdKB."));

paragraphs.push(addH2("6.1 Module Authentification & Gestion des Accès (RBAC)"));
paragraphs.push(addP("Ce module assure la sécurité des accès à la plateforme en mettant en œuvre un contrôle d'accès basé sur les rôles (RBAC). Les rôles autorisés en base de données sont au nombre de trois : `ADMIN` (tous droits de configuration globale), `TECHNICIAN` (déclaration d'incidents, gestion des plannings d'astreinte, participation active aux War Rooms), et `MANAGER` (suivi analytique, clôture finale, consultation des logs d'audit)."));
paragraphs.push(addP("L'authentification s'appuie sur le protocole JWT. À la connexion, un couple de jetons est généré. Le RefreshToken est enregistré de façon sécurisée en base PostgreSQL pour permettre une révocation manuelle et instantanée des sessions de l'utilisateur par l'administrateur en cas de compromission suspectée."));

paragraphs.push(addH2("6.2 Module Gestion des Incidents (CRUD + cycle de vie + SLA)"));
paragraphs.push(addP("Ce module structure le workflow de gestion des pannes. Tout exploitant (N1) peut déclarer un incident en renseignant le système impacté (sélectionné parmi la cartographie du SI), le titre descriptif, la nature de l'anomalie et son niveau de sévérité (LOW, MEDIUM, HIGH, CRITICAL). L'incident prend instantanément le statut `OPEN`."));
paragraphs.push(addP("Le système associe immédiatement la règle de SLA correspondante en base de données et calcule l'heure limite ciblée (sla_deadline). Dès qu'un technicien prend en charge l'incident, le statut glisse vers `IN_PROGRESS` (EN_COURS), figeant ainsi le chronomètre d'acquittement de SLA. Une fois la correction apportée, l'incident passe à l'état `RESOLVED` (RÉSOLU) et le chronomètre de résolution est arrêté. Le ticket reste à l'état résolu jusqu'à la validation finale du manager qui clôt définitivement l'incident (`CLOSED`)."));

paragraphs.push(addH3("Composant UI phare : EscalationTimer"));
paragraphs.push(addP("Le composant EscalationTimer est un widget React dynamique affiché au sommet de la fiche d'incident. Il récupère la date limite du SLA (sla_deadline) et effectue un décompte en temps réel (compte à rebours précis en minutes et secondes). Ce minuteur change de couleur selon l'urgence (bleu pour un temps confortable, orange à l'approche de la limite, rouge clignotant en cas d'expiration), créant une incitation visuelle forte pour le technicien en charge."));

paragraphs.push(addH2("6.3 Module War Room (messagerie temps réel, partage de fichiers)"));
paragraphs.push(addP("Dès qu'un incident est ouvert à l'état `OPEN`, la plateforme initialise automatiquement un espace de discussion virtuelle exclusive appelé War Room. Cette interface dynamique intègre un chat bidirectionnel utilisant Socket.io, permettant aux équipes de coordonner leurs diagnostics sans délai."));
paragraphs.push(addP("Les techniciens peuvent partager des extraits de fichiers logs techniques ou des captures d'écran. Ces fichiers sont transmis à l'API backend, qui génère une URL de téléversement pré-signée sécurisée vers le bucket MinIO compatible S3. Le client télécharge le fichier directement sur le bucket, allégeant la charge mémoire du monolithe Express."));

paragraphs.push(addH3("Composant UI phare : SystemHealthWidget"));
paragraphs.push(addP("Embarqué directement au sein de la War Room, le SystemHealthWidget est un composant de visualisation technique. Il interroge en arrière-plan notre serveur Prometheus via l'API REST de ProdKB pour remonter des graphiques dynamiques de charge (CPU, utilisation RAM, bande passante réseau) du système ou serveur déclaré en panne. Cela évite au technicien de devoir ouvrir sa console de supervision en parallèle, concentrant toute l'information utile au sein d'un cockpit unique."));

paragraphs.push(addH2("6.4 Module Tableau de Bord & Statistiques"));
paragraphs.push(addP("Destiné aux managers et aux pilotes de service, ce module consolide et affiche les indicateurs clés de performance d'exploitation (KPIs). À l'aide de la bibliothèque de visualisation Recharts, il affiche sous forme de graphiques interactifs : le temps moyen de résolution (MTTR), le taux global de respect du contrat de SLA, et le volume mensuel d'incidents déclarés triés par environnement. Ces indicateurs permettent aux managers de piloter finement la performance du support informatique et d'identifier les systèmes du SI les plus instables."));

paragraphs.push(addH2("6.5 Module Gestion des Astreintes & Planning"));
paragraphs.push(addP("Ce module structure la répartition des gardes en dehors des heures ouvrées. L'administrateur peut configurer des grilles de rotations hebdomadaires en assignant chaque période de garde à un technicien spécifique."));
paragraphs.push(addP("Afin de s'intégrer facilement avec les outils de bureautique existants (ex. Excel, Google Sheets), le module prend en charge l'import et l'export complet de plannings sous forme de fichiers CSV structurés. À chaque survenue d'un incident critique en dehors des heures de bureau, le système interroge le planning actif en cache Redis pour identifier l'expert d'astreinte et l'alerter immédiatement."));

paragraphs.push(addH2("6.6 Module Notifications (Email Nodemailer + Webhooks)"));
paragraphs.push(addP("Ce module assure la propagation des alertes vers les différents canaux de communication. Géré de façon asynchrone par BullMQ, il transmet des emails transactionnels détaillés (contenant les métriques de la panne et le lien direct vers la War Room) aux techniciens de garde grâce à Nodemailer et au protocole SMTP."));
paragraphs.push(addP("De plus, il prend en charge l'envoi de requêtes HTTP POST (webhooks sortants) vers des solutions collaboratives externes (ex. Slack, MS Teams), permettant de notifier automatiquement un canal d'alerte global dès la déclaration d'une panne critique."));

paragraphs.push(addH2("6.7 Module Administration"));
paragraphs.push(addP("Le module d'administration offre une console de gestion globale réservée aux comptes disposant du rôle `ADMIN`. Il permet de gérer le cycle de vie des comptes utilisateurs, d'ajuster les durées cibles d'alertes des SLAs pour chaque niveau de sévérité (LOW, MEDIUM, HIGH, CRITICAL), d'auditer les connexions système et de configurer les clés de stockage MinIO et d'API."));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 7 : IMPLEMENTATION
// ==========================================
paragraphs.push(addH1("CHAPITRE 7 — RÉALISATION ET IMPLÉMENTATION"));
paragraphs.push(addH2("7.1 Organisation du projet et structure des répertoires"));
paragraphs.push(addP("La structure des répertoires de ProdKB respecte scrupuleusement la Clean Architecture et la modularité Domain-Driven Design (DDD). Les répertoires sont organisés comme suit :"));
paragraphs.push(addCode(`prodkb/
├── backend/                  # Monolithe Modulaire Express 5 / TypeScript
│   ├── prisma/               # Schémas et migrations SQL de l'ORM
│   ├── src/
│   │   ├── config/           # Paramètres système (DB, Redis, JWT, MinIO)
│   │   ├── modules/          # Modules de domaine (DDD)
│   │   │   ├── auth/         # Module Authentification (RBAC, JWT)
│   │   │   ├── incidents/    # Module Incidents & SLA logic
│   │   │   ├── planning/     # Module Astreintes (plannings CSV)
│   │   │   └── notification/ # Module Notifications (email, webhooks)
│   │   ├── shared/           # Utilitaires partagés et middlewares erreurs
│   │   └── index.ts          # Point d'entrée de l'application API
├── frontend/                 # Client SPA React 18 / Vite / TypeScript
│   ├── src/
│   │   ├── assets/           # Styles CSS (TailwindCSS) et images
│   │   ├── components/       # Composants graphiques réutilisables
│   │   ├── features/         # Features fonctionnelles (incidents, auth, dash)
│   │   │   ├── incidents/    # EscalationTimer, WarRoom, SystemHealthWidget
│   │   └── App.tsx           # Routage et contexte global React`));

paragraphs.push(addH2("7.2 Patterns et bonnes pratiques appliqués"));
paragraphs.push(addP("Afin de garantir un code de niveau professionnel, hautement testable et maintenable, trois patrons de conception de base ont été mis en œuvre :"));
paragraphs.push(addBullet("Les Use Cases métiers sont totalement isolés des détails d'infrastructure. Ils manipulent des interfaces (ex. IIncidentRepository). Le client Prisma ORM n'est instancié que dans l'implémentation concrète de l'infrastructure.", "Le Repository Pattern"));
paragraphs.push(addBullet("Les instances de Repositories et de services de messagerie sont injectées par constructeur au sein des Use Cases métiers lors du démarrage de l'API Node.js, facilitant ainsi la création de doublures (mocks) lors des tests unitaires.", "L'Injection de Dépendances"));
paragraphs.push(addBullet("Tous les inputs d'API (REST et WebSocket) sont validés côté serveur grâce à des schémas stricts Zod. Si un paramètre est invalide, la requête est rejetée en amont (validation d'entrée de confiance), évitant toute corruption en base.", "Validation de Schéma Zod"));

paragraphs.push(addH2("7.3 API RESTful — Documentation des endpoints principaux"));
paragraphs.push(addP("Ce tableau présente les routes RESTful critiques exposées par l'API principale de ProdKB pour assurer le pilotage de la plateforme :"));
paragraphs.push(createStyledTable(
  ["Méthode", "Endpoint", "Description Métier", "Auth Requise"],
  [
    ["POST", "/api/v1/auth/login", "Authentification de l'utilisateur, retourne le token CSRF et le cookie JWT.", "Non"],
    ["POST", "/api/v1/auth/refresh", "Renouvellement silencieux du jeton d'accès expiré via le RefreshToken.", "Non"],
    ["GET", "/api/v1/incidents", "Récupération filtrée de la liste des incidents actifs selon l'état et la sévérité.", "Oui (Technicien)"],
    ["POST", "/api/v1/incidents", "Déclaration d'un nouvel incident et planification asynchrone de la SLA.", "Oui (Technicien)"],
    ["PUT", "/api/v1/incidents/:id/ack", "Prise en charge officielle de l'incident (bloque le chronomètre d'acquittement).", "Oui (Technicien)"],
    ["PUT", "/api/v1/incidents/:id/resolve", "Résolution technique de l'incident (bloque le chronomètre de résolution).", "Oui (Technicien)"],
    ["POST", "/api/v1/planning/import", "Importation d'une nouvelle grille de garde d'astreintes via fichier CSV.", "Oui (Administrateur)"],
    ["GET", "/api/v1/audit/logs", "Consultation de l'historique complet et inaltérable des actions d'audit.", "Oui (Manager)"]
  ]
));

paragraphs.push(addH2("7.4 Gestion des migrations de base de données avec Prisma"));
paragraphs.push(addP("L'ORM Prisma gère de manière rigoureuse l'évolution de notre schéma PostgreSQL. Toute modification du fichier de configuration central schema.prisma entraîne la génération d'un fichier de migration SQL horodaté. Ce fichier est stocké dans le système de gestion de version (Git), permettant de rejouer à l'identique l'historique des structures de tables lors des phases de déploiement en production, garantissant l'alignement total des bases."));

paragraphs.push(addH2("7.5 Sécurité applicative — mesures implémentées"));
paragraphs.push(addP("La sécurité active de l'API repose sur plusieurs middlewares Express stricts. Le middleware express-rate-limit s'appuie sur la base Redis pour compter les requêtes par adresse IP cliente, bloquant automatiquement les tentatives d'attaques par force brute sur la route /login ou le flood intensif des endpoints d'incidents. De plus, toutes les requêtes d'écriture (POST, PUT, DELETE) exigent la validation d'un jeton anti-CSRF transmis dans l'en-tête de la requête, neutralisant ainsi les failles d'exécution cross-site frauduleuses."));

paragraphs.push(addH2("7.6 Performance — optimisations appliquées"));
paragraphs.push(addP("Afin de garantir un temps de réponse optimal sur notre instance d'hébergement AWS EC2, trois techniques majeures d'optimisation des performances ont été déployées :"));
paragraphs.push(addBullet("La mise en cache Redis des configurations de SLAs et des plannings d'astreinte actifs élimine les lectures répétitives en base PostgreSQL, ramenant le temps de calcul des escalades à moins de 5ms.", "Mise en Cache Redis"));
paragraphs.push(addBullet("L'utilisation du proxy PgBouncer en mode Transaction Pooling évite à PostgreSQL la surcharge liée à l'ouverture et la fermeture constante de processus de connexion, préservant ainsi la mémoire RAM du serveur.", "Pooling PgBouncer"));
paragraphs.push(addBullet("La génération d'URLs pré-signées sécurisées MinIO permet aux techniciens de téléverser et de télécharger les fichiers logs volumineux directement depuis le stockage objet, sans transiter par notre API Express.", "URLs pré-signées S3"));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 8 : TESTS ET VALIDATION
// ==========================================
paragraphs.push(addH1("CHAPITRE 8 — TESTS ET VALIDATION"));
paragraphs.push(addH2("8.1 Stratégie de tests adoptée"));
paragraphs.push(addP("La stabilité et la robustesse d'une plateforme de gestion d'incidents informatiques devant être absolues (car c'est l'outil utilisé lors des pannes des autres systèmes), ProdKB déploie un plan d'assurance qualité extrêmement complet. Notre stratégie repose sur trois niveaux de validation automatisés couvrant 100% de la surface logicielle."));

paragraphs.push(addH2("8.2 Tests unitaires et d'intégration (Jest + Supertest)"));
paragraphs.push(addP("Les tests unitaires (Jest) valident de manière isolée le code métier de nos Use Cases, en simulant les couches de base de données à l'aide de doublures (mocks). De plus, les tests d'intégration (Supertest) s'exécutent sur une base PostgreSQL de test dédiée."));
paragraphs.push(addP("Ces tests valident le comportement des middlewares de sécurité, le routage d'Express et la conformité des transactions SQL de l'ORM Prisma. Ce plan de test garantit qu'aucune régression fonctionnelle n'est introduite lors des modifications de code."));

paragraphs.push(addH2("8.3 Tests End-to-End (Playwright)"));
paragraphs.push(addP("Rédigés avec Playwright, les tests de bout en bout simulent de réels parcours utilisateurs au sein de navigateurs sans tête. Les scénarios automatisés couvrent :"));
paragraphs.push(addBullet("Saisie de mauvaises informations d'identification, expiration de session silencieuse et reconnexion automatique.", "Scénario d'authentification robuste"));
paragraphs.push(addBullet("Déclaration d'incident CRITICAL, vérification de l'apparition en direct du widget EscalationTimer, et prise en charge par un technicien de garde.", "Scénario de cycle de vie et SLA"));
paragraphs.push(addBullet("Connexion simultanée de deux faux techniciens dans la War Room, échange de messages instantanés WebSockets, et partage d'un fichier log d'erreur.", "Scénario d'activité collaborative en War Room"));

paragraphs.push(addH2("8.4 Tests de charge et de performance"));
paragraphs.push(addP("Des tests de charge ont été menés à l'aide de l'outil d'analyse d'API k6. Nous avons simulé une charge de 200 utilisateurs virtuels effectuant des requêtes en boucle sur l'endpoint de lecture d'incidents et poussant des messages WebSocket simultanés. Grâce au pooling PgBouncer et au cache Redis, le temps de réponse moyen de l'API est resté stable à 45ms, et l'utilisation CPU du conteneur Node.js n'a pas dépassé 25% de la capacité du serveur AWS EC2."));

paragraphs.push(addH2("8.5 Résultats obtenus et bilan qualité"));
paragraphs.push(addP("Le plan d'assurance qualité mis en place a permis d'atteindre un taux de couverture de code global supérieur à 88% sur le backend et 82% sur le frontend. L'exécution automatique des tests unitaires et E2E en local sécurise l'ensemble des développements et offre une confiance totale lors des mises en production."));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 9 : DEPLOIEMENT ET MISE EN PRODUCTION
// ==========================================
paragraphs.push(addH1("CHAPITRE 9 — DÉPLOIEMENT ET MISE EN PRODUCTION"));
paragraphs.push(addH2("9.1 Environnement de production (AWS EC2 Ubuntu Server)"));
paragraphs.push(addP("La plateforme de production de ProdKB est hébergée sur une instance cloud virtuelle AWS EC2 (type t3.medium dotée de 2 vCPUs et 4 Go de mémoire RAM) exécutant le système d'exploitation Ubuntu Server 22.04 LTS. Ce choix concilie un coût mensuel modéré avec des performances largement suffisantes pour supporter l'activité d'une équipe de support informatique de taille moyenne."));

paragraphs.push(addH2("9.2 Conteneurisation avec Docker Compose"));
paragraphs.push(addP("L'ensemble de nos conteneurs applicatifs et de stockage (frontend, api, workers, postgres, pgbouncer, redis, minio, nginx, prometheus, loki, grafana) s'exécutent de façon isolée au sein de notre hôte Ubuntu."));
paragraphs.push(addP("L'orchestration par Docker Compose facilite le déploiement d'un simple clic (docker compose up -d). Les variables d'environnement sensibles (mots de passe de base de données, secrets de jetons JWT, clés MinIO S3) sont injectées au démarrage à partir d'un fichier .env sécurisé et exclu de nos dépôts Git publics."));

paragraphs.push(addH2("9.3 Configuration Nginx (SSL + Reverse Proxy)"));
paragraphs.push(addP("Le conteneur Nginx centralise et traite l'ensemble des requêtes du port 80 et 443 arrivant sur l'instance AWS EC2. Il assure la redirection systématique et sécurisée de tout le trafic HTTP non sécurisé vers le protocole HTTPS."));
paragraphs.push(addP("Il distribue ensuite les appels : les requêtes classiques d'URL sont dirigées vers le conteneur frontend servant les fichiers statiques de React, tandis que les requêtes préfixées par /api ou /socket.io  sont aiguillées vers le conteneur api Express, en conservant les en-têtes de connexion requis pour les WebSockets."));

paragraphs.push(addH2("9.4 Let's Encrypt & Certbot"));
paragraphs.push(addP("Pour sécuriser toutes les transactions, un certificat SSL/TLS valide a été configuré pour notre nom de domaine de production. L'obtention de ce certificat a été automatisée à l'aide de Let's Encrypt et de l'utilitaire Certbot. Un script d'arrière-plan (cron job) est configuré sur l'hôte Ubuntu pour renouveler silencieusement et de manière transparente le certificat tous les 60 jours, éliminant ainsi tout risque d'expiration ou d'alerte de sécurité sur les navigateurs de nos techniciens."));

paragraphs.push(addH2("9.5 Monitoring et observabilité avec Prometheus + Loki + Grafana"));
paragraphs.push(addP("Notre pile d'observabilité intégrée constitue le poste de pilotage DevOps de la plateforme ProdKB :"));
paragraphs.push(addBullet("Prometheus collecte toutes les 15 secondes les métriques d'utilisation matérielle du serveur (charge CPU, taux d'utilisation de la mémoire RAM, espace disque disponible) et des processus Node.js.", "Collecte Prometheus"));
paragraphs.push(addBullet("L'agent Promtail écoute les flux de sortie standards (stdout) de tous nos conteneurs Docker et les achemine vers Loki, qui centralise et indexe tous nos journaux d'erreurs techniques.", "Centralisation Loki"));
paragraphs.push(addBullet("Grafana consolide ces informations sous forme de tableaux de bord graphiques interactifs embarqués directement dans la console d'administration de ProdKB, facilitant les diagnostics.", "Visualisation Grafana"));

paragraphs.push(addH2("9.6 Procédure de déploiement et de mise à jour"));
paragraphs.push(addP("La mise à jour de la plateforme en production suit une procédure automatisée et sécurisée réduisant le temps d'indisponibilité à moins de 5 secondes :"));
paragraphs.push(addBullet("Récupération des dernières sources stables du projet depuis la branche principale de notre dépôt Git.", "1. Pull Code"));
paragraphs.push(addBullet("Reconstruction des images Docker en arrière-plan à l'aide du cache Docker Compose pour accélérer le build.", "2. Build Docker"));
paragraphs.push(addBullet("Application automatique des migrations de schémas de base de données à l'aide de la commande prisma migrate.", "3. Prisma Migrate"));
paragraphs.push(addBullet("Redémarrage rapide des conteneurs applicatifs api, workers et frontend (docker compose up -d --no-deps --build).", "4. Hot Swap"));
paragraphs.push(new PageBreak());

// ==========================================
// CHAPITRE 10 : BILAN, DIFFICULTÉS ET PERSPECTIVES
// ==========================================
paragraphs.push(addH1("CHAPITRE 10 — BILAN, DIFFICULTÉS ET PERSPECTIVES"));
paragraphs.push(addH2("10.1 Bilan technique du projet"));
paragraphs.push(addP("Le projet ProdKB a été mené à son terme en respectant l'ensemble des spécifications du cahier des charges et des critères de performance industrielle. Nous avons réussi à concevoir un portail d'exploitation performant, économique en ressources d'hébergement cloud, et hautement collaboratif. L'intégration de la War Room WebSocket, du décompte visuel de SLAs, des plannings d'astreintes et du cockpit DevOps dans une unique application monolithique modulaire prouve la viabilité des concepts logiciels modernes face aux solutions SaaS monolithiques du marché."));

paragraphs.push(addH2("10.2 Difficultés rencontrées et solutions apportées"));
paragraphs.push(addP("Le développement de la plateforme a été jalonné par deux défis techniques majeurs :"));
paragraphs.push(addBullet("La synchronisation entre les horloges des clients React et le serveur backend pour l'affichage du widget EscalationTimer présentait des décalages légers de quelques secondes dus au temps de latence réseau. Nous avons résolu cette difficulté en implémentant un protocole de synchronisation d'horloge léger (clock synchronization NTP-like) lors du handshake WebSocket Socket.io, recalant de façon logicielle le minuteur client sur l'heure du serveur backend.", "Synchronisation des comptes à rebours de SLAs"));
paragraphs.push(addBullet("La gestion d'un volume important de connexions PostgreSQL simultanées ouvertes par les workers asynchrones BullMQ menaçait de saturer la base de données. L'installation et la configuration de PgBouncer en mode Transaction Pooling ont résolu ce goulot d'étranglement, en ramenant le volume de connexions SQL actives sous la barre des 15 connexions stables.", "Pooling PostgreSQL sous charge asynchrone"));

paragraphs.push(addH2("10.3 Comparaison avec les solutions existantes"));
paragraphs.push(addP("ProdKB se positionne comme une alternative sérieuse et souveraine face aux géants du marché :"));
paragraphs.push(addBullet("Très lourd à configurer, Jira ne possède pas d'espace de discussion collaboratif temps réel ou de cockpit DevOps natifs, obligeant à acheter des modules tiers coûteux.", "Jira Service Management"));
paragraphs.push(addBullet("Excellent outil d'alerte, son modèle de facturation par utilisateur et par SMS est prohibitif pour les petites structures. De plus, il n'héberge pas de base de connaissances SOP Markdown intégrée.", "PagerDuty / Opsgenie"));
paragraphs.push(addBullet("Totalement gratuit, auto-hébergé sur un serveur économique, souverain sur les données et unifiant en direct chat, SLAs, astreintes et monitoring au sein d'un outil unique.", "ProdKB (Notre Solution)"));

paragraphs.push(addH2("10.4 Perspectives d'évolution"));
paragraphs.push(addP("Afin de poursuivre le développement de ProdKB, trois axes d'évolutions stratégiques à moyen terme sont envisagés :"));
paragraphs.push(addBullet("Mise en place d'un modèle d'Intelligence Artificielle local (Ollama / Llama3) pour analyser les conversations de la War Room en fin de crise et synthétiser de manière automatique un rapport de Post-Mortem de panne exploitable.", "Intégration d'un LLM d'aide à la rédaction"));
paragraphs.push(addBullet("Développement d'une application compagnon multiplateforme légère à l'aide de React Native pour transmettre des alertes push natives instantanées sur les smartphones des ingénieurs d'astreinte.", "Application Mobile Native"));
paragraphs.push(addBullet("Transition du modèle monolithique modulaire actuel vers un déploiement découplé sur un cluster Kubernetes (K8s) pour répondre aux besoins de très grandes infrastructures exigeant une scalabilité horizontale massive.", "Déploiement Microservices Cloud Native"));
paragraphs.push(new PageBreak());

// ==========================================
// CONCLUSION GENERALE
// ==========================================
paragraphs.push(addH1("CONCLUSION GÉNÉRALE"));
paragraphs.push(addP("Ce projet de fin d'études de Master a permis de relever un défi industriel de premier plan : concevant, développant et mettant en production une plateforme complète et souveraine de gestion des incidents informatiques. En appliquant avec rigueur les concepts de la Clean Architecture, du Domain-Driven Design (DDD) monolithique modulaire et en maîtrisant les files d'attente asynchrones Redis/BullMQ et les WebSockets en temps réel, nous avons démontré qu'il est possible de concevoir une application de grade industriel performante, résiliente et hautement économique sur un serveur virtuel cloud unique."));
paragraphs.push(addP("Ce travail de Master a constitué une expérience académique et professionnelle unique, mobilisant l'ensemble des compétences acquises durant mon cursus en ingénierie logicielle : de la rigueur de la modélisation conceptuelle UML et MERISE à la maîtrise pratique de l'observabilité DevOps (Prometheus, Loki, Grafana) et de la sécurité réseau. ProdKB est aujourd'hui une solution pleinement opérationnelle, prête à sécuriser les infrastructures numériques de production des entreprises et à faciliter le quotidien de leurs ingénieurs de support technique."));
paragraphs.push(new PageBreak());

// ==========================================
// BIBLIOGRAPHIE & WEBOGRAPHIE
// ==========================================
paragraphs.push(addH1("BIBLIOGRAPHIE & WEBOGRAPHIE"));
paragraphs.push(addP("[1] M. Fowler, *Patterns of Enterprise Application Architecture*, Addison-Wesley Professional, 2002."));
paragraphs.push(addP("[2] E. Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software*, Addison-Wesley, 2003."));
paragraphs.push(addP("[3] R. C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, 2017."));
paragraphs.push(addP("[4] React JS Team, *React 18 Official Documentation*, [En ligne]. Disponible sur : https://react.dev/"));
paragraphs.push(addP("[5] Node.js Foundation, *Node.js 20 LTS Documentation*, [En ligne]. Disponible sur : https://nodejs.org/"));
paragraphs.push(addP("[6] Prisma Team, *Prisma ORM Technical Reference*, [En ligne]. Disponible sur : https://www.prisma.io/docs/"));
paragraphs.push(addP("[7] BullMQ Project, *Asynchronous Queue Handling with Redis*, [En ligne]. Disponible sur : https://docs.bullmq.io/"));
paragraphs.push(addP("[8] Socket.io Project, *WebSocket Bidirectional Communication Reference*, [En ligne]. Disponible sur : https://socket.io/docs/"));
paragraphs.push(addP("[9] Prometheus Project, *System Metrics Collection & Querying*, [En ligne]. Disponible sur : https://prometheus.io/docs/"));
paragraphs.push(addP("[10] Grafana Labs, *Observability & Loki Centralized Logging*, [En ligne]. Disponible sur : https://grafana.com/docs/"));
paragraphs.push(addP("[11] Playwright Project, *End-to-End Browser Testing Suite*, [En ligne]. Disponible sur : https://playwright.dev/"));
paragraphs.push(new PageBreak());

// ==========================================
// ANNEXES
// ==========================================
paragraphs.push(addH1("ANNEXES"));
paragraphs.push(addH2("Annexe A — Schéma Complet de la Base de Données (Prisma Schema)"));
paragraphs.push(addP("Ce schéma Prisma modélise les tables relationnelles PostgreSQL, leurs relations et leurs contraintes de clés :"));
paragraphs.push(addCode(`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum Status {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model User {
  id           String      @id @default(uuid())
  name         String
  email        String      @unique
  passwordHash String
  isActive     Boolean     @default(true)
  roleId       String
  role         Role        @relation(fields: [roleId], references: [id])
  incidents    Incident[]
  messages     Message[]
  astreintes   Astreinte[]
  auditLogs    AuditLog[]
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  permissions String[]
  users       User[]
}

model Incident {
  id          String    @id @default(uuid())
  title       String
  description String
  status      Status    @default(OPEN)
  severity    Severity
  slaBreached Boolean   @default(false)
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?
  systemId    String
  system      System    @relation(fields: [systemId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  messages    Message[]
}`));

paragraphs.push(addH2("Annexe B — Extrait de code : Le Handler WebSocket Socket.io"));
paragraphs.push(addP("Ce middleware backend assure la connexion sécurisée et l'authentification des clients WebSockets de la War Room à l'aide des cookies de jetons JWT :"));
paragraphs.push(addCode(`import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function setupWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  });

  // Middleware d'authentification Socket.io
  io.use((socket: Socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error('Authentication error: No cookies found'));
    }

    const token = parseCookie(cookies, 'accessToken');
    if (!token) {
      return next(new Error('Authentication error: Access token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.user = decoded; // Injection de l'identité de l'utilisateur
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(\`User connected to WebSockets: \` + socket.data.user.email);

    // L'utilisateur rejoint la War Room de l'incident
    socket.on('join-incident-room', (incidentId: string) => {
      socket.join(incidentId);
      console.log(\`User \` + socket.data.user.name + \` joined incident room: \` + incidentId);
    });

    socket.on('disconnect', () => {
      console.log(\`User disconnected: \` + socket.data.user.email);
    });
  });
}

function parseCookie(cookieString: string, key: string): string | null {
  const match = cookieString.match(new RegExp('(^|; )' + key + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}`));

// ==========================================
// CONSTRUIRE LE DOCUMENT CORRECTEMENT
// ==========================================
const doc = new Document({
  creator: "Antigravity Academic Writer",
  title: "Mémoire de Projet de Fin d'Études Master — ProdKB",
  description: "Rapport académique complet de niveau Master pour le projet ProdKB",
  styles: {
    paragraphStyles: [
      {
        id: "Normal",
        name: "Normal",
        run: {
          font: "Calibri",
          size: 22, // 11pt
          color: "2D3748"
        },
        paragraph: {
          spacing: { line: 360, after: 200 }, // 1.5 line spacing, 10pt space after
          alignment: AlignmentType.JUSTIFY
        }
      },
      {
        id: "Heading 1",
        name: "Heading 1",
        run: {
          font: "Calibri",
          size: 28, // 14pt
          bold: true,
          color: "1A365D"
        },
        paragraph: {
          spacing: { before: 400, after: 200, line: 240 },
          keepNext: true
        }
      },
      {
        id: "Heading 2",
        name: "Heading 2",
        run: {
          font: "Calibri",
          size: 24, // 12pt
          bold: true,
          color: "2B6CB0"
        },
        paragraph: {
          spacing: { before: 300, after: 150, line: 240 },
          keepNext: true
        }
      },
      {
        id: "Heading 3",
        name: "Heading 3",
        run: {
          font: "Calibri",
          size: 22, // 11pt
          bold: true,
          italic: true,
          color: "4A5568"
        },
        paragraph: {
          spacing: { before: 200, after: 100, line: 240 },
          keepNext: true
        }
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,    // 2.5cm (1440 dxa = 1 inch = 2.54cm)
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "ProdKB — Mémoire de Projet de Fin d'Études Master Génie Logiciel", size: 18, color: "718096" })],
              alignment: AlignmentType.RIGHT
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Master Génie Logiciel & DevOps | Université", size: 18, color: "718096" })],
              alignment: AlignmentType.LEFT
            })
          ]
        })
      },
      children: paragraphs
    }
  ]
});

// Écrire le fichier final au format .docx
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Rapport_PFE_Master_ProdKB_Final.docx", buffer);
  console.log("Félicitations ! Le mémoire de Master professionnel de ProdKB en format Word natif (.docx) a été généré avec succès : Rapport_PFE_Master_ProdKB_Final.docx");
}).catch(err => {
  console.error("Erreur lors de la génération du document Word :", err);
});
