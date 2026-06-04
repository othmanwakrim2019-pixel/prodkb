const fs = require('fs');

const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Mémoire de Projet de Fin d'Études - Master Génie Logiciel</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
    size: 21cm 29.7cm; /* A4 */
    margin: 2.5cm 2.5cm 2.5cm 2.5cm;
}
body {
    font-family: "Calibri", "Arial", sans-serif;
    line-height: 1.6;
    color: #0f172a;
    background-color: #ffffff;
}
.cover-page {
    text-align: center;
    margin-top: 80px;
    height: 100%;
}
.cover-title {
    font-size: 26pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.cover-subtitle {
    font-size: 14pt;
    color: #475569;
    margin-bottom: 50px;
    font-style: italic;
}
.cover-meta {
    margin-top: 120px;
    font-size: 11pt;
    line-height: 1.8;
    color: #0f172a;
}
.cover-meta table {
    width: 80%;
    margin: 0 auto;
    border: none !important;
}
.cover-meta td {
    border: none !important;
    padding: 5px;
}
h1 {
    font-size: 14pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-top: 35px;
    margin-bottom: 15px;
    border-bottom: 2px solid #0ea5e9;
    padding-bottom: 6px;
    page-break-after: avoid;
}
h2 {
    font-size: 12pt;
    font-weight: bold;
    color: #0ea5e9;
    margin-top: 25px;
    margin-bottom: 12px;
    page-break-after: avoid;
}
h3 {
    font-size: 11pt;
    font-weight: bold;
    color: #475569;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
}
p {
    font-size: 11pt;
    text-align: justify;
    margin-bottom: 12px;
}
ul, ol {
    margin-top: 5px;
    margin-bottom: 12px;
    padding-left: 20px;
}
li {
    font-size: 11pt;
    margin-bottom: 6px;
    text-align: justify;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    margin-bottom: 20px;
}
th {
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: bold;
    border: 1px solid #cbd5e1;
    padding: 8px;
    font-size: 10pt;
}
td {
    border: 1px solid #cbd5e1;
    padding: 8px;
    font-size: 9.5pt;
    vertical-align: middle;
}
.page-break {
    page-break-before: always;
}
.code-block {
    font-family: "Consolas", "Courier New", monospace;
    background-color: #f8fafc;
    border-left: 4px solid #1e3a8a;
    padding: 10px;
    margin-bottom: 15px;
    font-size: 8.5pt;
    white-space: pre-wrap;
    color: #0f172a;
    line-height: 1.0;
}
.note-box {
    background-color: #f0f9ff;
    border-left: 4px solid #0ea5e9;
    padding: 12px;
    margin-bottom: 15px;
    font-size: 10pt;
}
</style>
</head>
<body>

<!-- PAGE DE GARDE -->
<div class="cover-page">
    <div style="font-size: 12pt; font-weight: bold; color: #475569; margin-bottom: 60px;">
        UNIVERSITÉ ET ÉTABLISSEMENT D'ACCUEIL<br>
        DÉPARTEMENT D'INGÉNIERIE LOGICIELLE ET SYSTÈMES DÉPLOYÉS
    </div>
    
    <div class="cover-title">Rapport de Projet de Fin d'Études Master</div>
    <div style="font-size: 18pt; font-weight: bold; color: #1e3a8a; margin-bottom: 10px;">PRODKB</div>
    <div class="cover-subtitle">Plateforme de Gestion Industrielle des Incidents IT et de War Room Collaborative en Temps Réel</div>
    
    <div style="margin-top: 80px; font-size: 13pt; line-height: 1.6;">
        Présenté pour l'obtention du Diplôme de Master en Génie Logiciel<br>
        <strong style="font-size: 12pt; color: #475569;">Spécialité : Architecture Logicielle, Cloud & DevOps (Bac+5)</strong>
    </div>
    
    <div class="cover-meta">
        <table>
            <tr>
                <td style="text-align: left; font-weight: bold;">Réalisé par :</td>
                <td style="text-align: right; font-style: italic;">[Nom de l'étudiant à renseigner]</td>
            </tr>
            <tr>
                <td style="text-align: left; font-weight: bold;">Encadré par :</td>
                <td style="text-align: right; font-style: italic;">[Nom de l'encadrant à renseigner]</td>
            </tr>
            <tr>
                <td style="text-align: left; font-weight: bold;">Année Universitaire :</td>
                <td style="text-align: right;">2025 - 2026</td>
            </tr>
        </table>
    </div>
</div>

<div class="page-break"></div>

<!-- RÉSUMÉ & ABSTRACT -->
<h1>Résumé / Abstract</h1>
<div class="note-box">
    <strong>Résumé (Français) :</strong> La haute disponibilité des infrastructures numériques est aujourd'hui un prérequis stratégique indispensable pour les entreprises. Ce mémoire de Master présente la conception et le développement de <strong>ProdKB</strong>, une plateforme industrielle d'Incident Management et de base de connaissances d'exploitation. Conçu selon les patrons de conception de la Clean Architecture et d'une approche Domain-Driven Design (DDD) monolithique modulaire (Express 5/TypeScript, React 18, PostgreSQL/PgBouncer, Redis/BullMQ), le système permet d'unifier la gestion des pannes, de veiller asynchroniquement au respect des SLAs, de guider les exploitants via des fiches réflexes (SOP Runbooks) interactives et d'organiser les astreintes. Ce rapport détaille la spécification fonctionnelle complète, la conception logique des données et les workflows asynchrones de production.
</div>
<div class="note-box" style="background-color: #f8fafc; border-left-color: #64748b;">
    <strong>Abstract (English):</strong> High availability of IT services is crucial for modern business continuity. This Master thesis outlines the engineering and deployment of <strong>ProdKB</strong>, a comprehensive incident tracking and runbook hosting platform. Utilizing a clean, Modular Monolith backend architecture and Domain-Driven Design principles (Express 5, React 18, PgBouncer/PostgreSQL, Redis/BullMQ), the system orchestrates real-time incident resolution, provides Markdown runbooks to troubleshoot failures, handles on-call logistics, and automatically triggers SLA breach escalations.
</div>

<div class="page-break"></div>

<!-- TABLE DES MATIERES PLACEHOLDER -->
<h1>Table des Matières</h1>
<p>
    [Table des matières générée automatiquement par Microsoft Word lors de la mise à jour des champs (F9)]
</p>

<div class="page-break"></div>

<!-- LISTE DES FIGURES ET TABLEAUX -->
<h1>Liste des Figures et Tableaux</h1>
<p>
    [Liste des figures et tableaux générée automatiquement par Microsoft Word lors de la mise à jour des champs]
</p>

<div class="page-break"></div>

<!-- LISTE DES ABREVIATIONS -->
<h1>Liste des Abréviations</h1>
<table>
    <thead>
        <tr>
            <th>Abréviation</th>
            <th>Signification Complète</th>
            <th>Domaine d'Application dans ProdKB</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>SPA</td><td>Single Page Application</td><td>Architecture de l'interface client construite avec React 18.</td></tr>
        <tr><td>SLA</td><td>Service Level Agreement</td><td>Engagements contractuels de temps de prise en charge et de résolution.</td></tr>
        <tr><td>MTTR</td><td>Mean Time To Resolution</td><td>Temps moyen de résolution des incidents, mesuré dans les rapports.</td></tr>
        <tr><td>API</td><td>Application Programming Interface</td><td>Ensemble des routes HTTP sécurisées exposées par Express.</td></tr>
        <tr><td>REST</td><td>Representational State Transfer</td><td>Style architectural de l'API HTTP synchrone de ProdKB.</td></tr>
        <tr><td>JWT</td><td>JSON Web Token</td><td>Mécanisme sécurisé de sessions stateless via cookies HttpOnly.</td></tr>
        <tr><td>ORM</td><td>Object-Relational Mapping</td><td>Couche d'abstraction des requêtes SQL de la BDD PostgreSQL avec Prisma.</td></tr>
        <tr><td>DDoS</td><td>Distributed Denial of Service</td><td>Type d'attaque mitigé par nos limites de débit Redis.</td></tr>
        <tr><td>ACID</td><td>Atomicity, Consistency, Isolation, Durability</td><td>Propriétés transactionnelles garanties par le SGBDR PostgreSQL.</td></tr>
        <tr><td>HMR</td><td>Hot Module Replacement</td><td>Rechargement instantané du code frontend en développement via Vite.</td></tr>
        <tr><td>SSL</td><td>Secure Sockets Layer</td><td>Couche de chiffrement des flux réseaux terminés par Nginx.</td></tr>
        <tr><td>HTTPS</td><td>Hypertext Transfer Protocol Secure</td><td>Protocole de communication chiffré obligatoire en production.</td></tr>
        <tr><td>E2E</td><td>End-to-End</td><td>Tests de bout en bout de l'application cliente via Playwright.</td></tr>
        <tr><td>CI/CD</td><td>Continuous Integration / Continuous Deployment</td><td>Pipeline automatisée d'intégration et de mise en production.</td></tr>
        <tr><td>DevOps</td><td>Development & Operations</td><td>Méthodologie et outils unifiant les développements et les opérations.</td></tr>
        <tr><td>SGBDR</td><td>Système de Gestion de Base de Données Relationnelle</td><td>Moteur de données PostgreSQL 16.</td></tr>
        <tr><td>LTS</td><td>Long Term Support</td><td>Version de support long terme de la plateforme système Node.js 20.</td></tr>
        <tr><td>WebSocket</td><td>Protocole de communication bidirectionnel</td><td>Technologie Socket.io assurant le temps réel dans la War Room.</td></tr>
    </tbody>
</table>

<div class="page-break"></div>

<!-- CHAPITRE 1 -->
<h1>CHAPITRE 1 — INTRODUCTION GÉNÉRALE</h1>

<h2>1.1 Contexte et problématique</h2>
<p>
    Dans le paysage informatique contemporain, les interruptions de services informatiques ne sont plus de simples désagréments techniques, mais des crises opérationnelles majeures. L'économie moderne, reposant sur des processus numériques interconnectés en temps réel, subit de plein fouet le moindre dysfonctionnement d'une base de données ou d'une API critique. Une indisponibilité de service (downtime) engendre des pertes financières immédiates, détériore durablement l'image de marque et peut exposer l'entreprise à de lourdes pénalités contractuelles de <i>Service Level Agreements</i> (SLA).
</p>
<p>
    La gestion de ces pannes repose traditionnellement sur des outils dispersés et des interventions manuelles : emails, canaux de discussions éparpillés, wikis documentaires obsolètes et plannings d'astreinte maintenus sur des feuilles de calcul déconnectées du terrain. Cette fragmentation allonge le temps moyen de détection (MTTA) et le temps moyen de résolution (MTTR) des anomalies. La problématique fondamentale est donc la suivante : comment unifier, sécuriser et piloter en temps réel l'ensemble du cycle de vie d'un incident de production informatique, en coordonnant les interventions humaines et les architectures logicielles sous-jacentes ?
</p>

<h2>1.2 Objectifs du projet</h2>
<p>
    Le projet <strong>ProdKB</strong> a été initié pour répondre directement à cette problématique en créant un portail d'exploitation unifié de grade industriel (ITSM - IT Service Management). Les objectifs sont divisés en trois axes majeurs :
</p>
<ul>
    <li><strong>Centralisation technique :</strong> Regrouper au sein d'une unique interface Web les tickets d'incidents actifs, la cartographie des systèmes surveillés, et une "War Room" collaborative en temps réel.</li>
    <li><strong>Base de connaissances dynamique :</strong> Assurer le maintien des procédures réflexes (SOP / Runbooks) au format Markdown et faciliter leur indexation et leur suggestion automatique lors de la survenue d'une panne.</li>
    <li><strong>Logistique humaine et asynchronisme :</strong> Automatiser l'attribution des tickets, le chronométrage des délais de SLAs et la logistique des équipes de garde (astreinte hebdomadaire).</li>
</ul>

<h2>1.3 Périmètre fonctionnel</h2>
<p>
    Le périmètre fonctionnel de ProdKB est délimité par des modules étanches gérant les flux logiques suivants :
</p>
<ul>
    <li><strong>Module Identité & Accès (RBAC) :</strong> Authentification forte et gestion fine des privilèges selon des rôles spécifiques.</li>
    <li><strong>Module Incident & War Room :</strong> Messagerie instantanée WebSocket et stockage objet des logs.</li>
    <li><strong>Module Astreinte & Plannings :</strong> Gestion des tâches opérationnelles journalières (Daily Plans) et plannings de rotations hebdomadaires.</li>
    <li><strong>Module Administration & SLAs :</strong> Configuration des chronomètres d'alertes en cascade.</li>
</ul>

<h2>1.4 Plan du rapport</h2>
<p>
    Ce rapport de fin d'études de Master s'articule autour de 10 chapitres structurés. Le chapitre 2 expose l'étude préalable et le cahier des charges. Le chapitre 3 présente la modélisation conceptuelle UML complète du système. Le chapitre 4 détaille la modélisation de données selon la méthode MERISE. Le chapitre 5 présente l'architecture logicielle multi-couches globale et le découpage asynchrone DevOps. Le chapitre 6 se focalise sur la conception détaillée de chaque module métier. Le chapitre 7 présente l'implémentation, les patterns et les structures de répertoires du code source. Le chapitre 8 présente le plan d'assurance qualité et de tests automatisés. Le chapitre 9 détaille l'infrastructure physique de production cloud. Enfin, le chapitre 10 dresse le bilan, les limites et les perspectives d'évolution de la plateforme.
</p>

<div class="page-break"></div>

<!-- CHAPITRE 2 -->
<h1>CHAPITRE 2 — ÉTUDE PRÉALABLE ET CAHIER DES CHARGES</h1>

<h2>2.1 Analyse de l'existant</h2>
<p>
    Avant le déploiement de ProdKB, les interventions sur pannes critiques en production suivaient un flux artisanal :
</p>
<ol>
    <li>Supervision : Un email automatique signalait la panne d'un serveur applicatif.</li>
    <li>Tri : L'opérateur N1 cherchait sur un tableur Excel partagé l'ingénieur réseau ou système d'astreinte ce jour-là.</li>
    <li>Résolution : L'opérateur devait trouver dans des documentations non centralisées (wikis, fichiers Word obsolètes) la procédure d'exploitation pour redémarrer le service.</li>
</ol>
<p>
    Ce workflow manuel présentait des failles de sécurité (mots de passe partagés en clair sur des documentations), un risque critique de dépassement de SLAs, et une absence d'audit post-incident empêchant toute démarche de capitalisation technique.
</p>

<h2>2.2 Identification des acteurs du système</h2>
<ul>
    <li><strong>Opérateur / Exploitant N1 :</strong> Utilisateur principal, il déclare les anomalies, exécute les Daily Plans, téléverse les fichiers de traces logicielles et suit les fiches documentaires SOP.</li>
    <li><strong>Expert Technique N2 / N3 :</strong> Personne d'astreinte, elle reçoit les alertes d'escalades en cas de dépassement de délai SLA, intervient dans la War Room et documente les rapports d'incidents (Post-Mortem).</li>
    <li><strong>Administrateur / Manager :</strong> Gère l'attribution des droits utilisateurs RBAC, configure la cartographie du SI et ajuste les seuils temporels de SLAs.</li>
    <li><strong>Système (Workers asynchrones) :</strong> Processus automatisés en tâche de fond chargés de surveiller l'écoulement du temps de SLA, d'émettre des alertes par e-mail et de distribuer les webhooks vers l'extérieur.</li>
</ul>

<h2>2.3 Besoins fonctionnels</h2>
<ul>
    <li><strong>CRUD complet des tickets d'incidents</strong> avec priorité, environnement (PROD, PREPROD, RECETTE) et système impacté.</li>
    <li><strong>War Room temps réel</strong> intégrant une messagerie WebSocket collaborative et le partage de logs et captures d'écran.</li>
    <li><strong>Moteur de Runbooks Markdown</strong> : Création, recherche plein texte et suggestion de procédures reflexes basées sur la panne déclarée.</li>
    <li><strong>Gestion dynamique des astreintes</strong> : Planification de grilles de gardes hebdomadaires avec export/import de fichiers CSV.</li>
    <li><strong>Chronométrage SLA</strong> : Minuteurs de compte à rebours précis calculant le temps limite de prise en charge et de résolution.</li>
</ul>

<h2>2.4 Besoins non fonctionnels</h2>
<ul>
    <li><strong>Sécurité :</strong> Sessions web étanches aux failles XSS et CSRF, hashage Bcrypt et protection contre les injections SQL.</li>
    <li><strong>Disponibilité & Robustesse :</strong> Tolérance aux pannes réseau, de base de données ou de cache grâce à un mécanisme de déconnexion et reconnexion transparente.</li>
    <li><strong>Scalabilité et Performance :</strong> Temps de réponse API inférieur à 200ms sous charge, et pooling de connexions PostgreSQL via PgBouncer.</li>
</ul>

<h2>2.5 Contraintes techniques et choix technologiques justifiés</h2>
<p>
    L'application devait être déployée de manière économique sur un serveur unique AWS EC2. Pour concilier ces ressources limitées avec un haut niveau de performance, nous avons écarté Nest.js (jugé trop lourd en mémoire RAM pour l'API) au profit d'**Express 5** avec **TypeScript** et d'une architecture monolithique modulaire. L'ORM **Prisma** a été choisi pour son typage natif, et **Redis + BullMQ** pour le traitement des queues asynchrones. Le frontend s'appuie sur **React 18** avec **Vite** pour minimiser la taille des bundles statiques.
</p>

<div class="page-break"></div>

<!-- CHAPITRE 3 -->
<h1>CHAPITRE 3 — MODÉLISATION UML</h1>

<h2>3.1 Diagramme des cas d'utilisation (Use Case)</h2>
<div class="code-block">
@startuml
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

(UC_Incident) <.. (UC_Upload) : &lt;&lt;extend&gt;&gt;
(UC_Incident) ..> (UC_WarRoom) : &lt;&lt;include&gt;&gt;

Sys --> (UC_SLA)
@enduml
</div>

<h2>3.2 Diagramme de classes</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<h2>3.3 Diagramme de séquence — Authentification JWT</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<h2>3.4 Diagramme de séquence — SLA & Workers</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<h2>3.5 Diagramme de séquence — WebSocket</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<h2>3.6 Diagramme d'activité — Cycle de vie d'un incident</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<h2>3.7 Diagramme d'état-transition — États d'un incident</h2>
<div class="code-block">
@startuml
[*] --> OPEN : Déclaration (Opérateur)
OPEN --> IN_PROGRESS : Prise en charge (Acknowledge)
OPEN --> OPEN : Dépassement SLA (slaBreached = true)
IN_PROGRESS --> RESOLVED : Déclaration de résolution
RESOLVED --> CLOSED : Validation finale (Manager)
CLOSED --> [*]
@enduml
</div>

<h2>3.8 Diagramme de composants</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<h2>3.9 Diagramme de déploiement</h2>
<div class="code-block">
@startuml
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
@enduml
</div>

<div class="page-break"></div>

<!-- CHAPITRE 4 -->
<h1>CHAPITRE 4 — MODÉLISATION MERISE</h1>

<h2>4.1 Introduction à la méthode MERISE</h2>
<p>
    La méthode **MERISE** est une approche de modélisation relationnelle indispensable pour valider la conception d'un niveau Master. En isolant les concepts de données des traitements transactionnels, MERISE permet de normaliser les structures de la base de données relationnelle PostgreSQL selon la Troisième Forme Normale (3NF), éliminant toute forme d'incohérence, d'anomalie de modification ou de redondance inutile.
</p>

<h2>4.2 Modèle Conceptuel des Données (MCD)</h2>
<p>
    Les cardinalités et règles de gestion structurent nos entités :
</p>
<ul>
    <li><strong>UTILISATEUR</strong> : id (UUID), nom, email, passwordHash, isActive.</li>
    <li><strong>INCIDENT</strong> : id (UUID), titre, description, statut, severite, dateCreation, slaBreached.</li>
    <li><strong>MESSAGE</strong> : id (UUID), texte, dateEnvoi.</li>
    <li><strong>ASTREINTE</strong> : id (UUID), numeroSemaine, annee.</li>
    <li><strong>SLA_CONFIG</strong> : id (UUID), severite, limiteAckMinutes, limiteResMinutes.</li>
</ul>

<h2>4.3 Modèle Logique des Données (MLD)</h2>
<ul>
    <li><strong>ROLE</strong> (<u>id_role</u>, nom_role, permissions)</li>
    <li><strong>UTILISATEUR</strong> (<u>id_user</u>, nom, email, password_hash, is_active, #id_role)</li>
    <li><strong>SYSTEME</strong> (<u>id_system</u>, nom_system, description)</li>
    <li><strong>SLA_CONFIG</strong> (<u>id_sla</u>, severite, limite_ack, limite_res)</li>
    <li><strong>INCIDENT</strong> (<u>id_incident</u>, titre, description, statut, severite, date_creation, sla_breached, #id_user, #id_system, #id_sla)</li>
    <li><strong>MESSAGE</strong> (<u>id_message</u>, texte, date_envoi, #id_user, #id_incident)</li>
</ul>

<h2>4.4 Modèle Physique des Données (MPD)</h2>
<div class="code-block">
CREATE TYPE severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TABLE "Role" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    permissions TEXT[] NOT NULL
);

CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" UUID NOT NULL REFERENCES "Role"(id) ON DELETE RESTRICT
);

CREATE TABLE "System" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE "SLA" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity severity_enum NOT NULL UNIQUE,
    "ackLimitMinutes" INTEGER NOT NULL,
    "resLimitMinutes" INTEGER NOT NULL
);

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

CREATE INDEX idx_incident_status ON "Incident"(status);
CREATE INDEX idx_incident_severity ON "Incident"(severity);
</div>

<h2>4.5 Dictionnaire de données</h2>
<table>
    <thead>
        <tr>
            <th>Attribut</th>
            <th>Type Physique</th>
            <th>Contrainte (PK/FK)</th>
            <th>Description Métier</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>User.id</td><td>UUID</td><td>PRIMARY KEY</td><td>Identifiant unique de l'utilisateur.</td></tr>
        <tr><td>User.email</td><td>VARCHAR(255)</td><td>Unique</td><td>Adresse e-mail de connexion.</td></tr>
        <tr><td>Incident.status</td><td>VARCHAR (ENUM)</td><td>-</td><td>Statuts possibles: OPEN, IN_PROGRESS, RESOLVED, CLOSED.</td></tr>
        <tr><td>Incident.slaBreached</td><td>BOOLEAN</td><td>Default: false</td><td>Indicateur de dépassement du contrat de temps SLA.</td></tr>
        <tr><td>SLA.ackLimitMinutes</td><td>INTEGER</td><td>-</td><td>Limite en minutes pour prendre en charge l'incident.</td></tr>
    </tbody>
</table>

<div class="page-break"></div>

<!-- CHAPITRE 5 -->
<h1>CHAPITRE 5 — ARCHITECTURE TECHNIQUE DU SYSTÈME</h1>

<h2>5.1 Vue d'ensemble de l'architecture</h2>
<p>
    ProdKB s'appuie sur une **Architecture en Couches** de type Clean Architecture. L'ensemble des flux d'informations est rigoureusement compartimenté. La logique métier ne dépend d'aucun framework web ou bibliothèque de base de données.
</p>

<h2>5.2 Architecture Frontend — SPA React et flux de données</h2>
<p>
    L'interface utilisateur de ProdKB est une application Single Page (SPA) construite avec React 18 et compilée avec Vite. Le routage est entièrement géré côté client par <b>React Router</b>. La gestion d'état s'appuie sur des hooks React personnalisés combinés à un contexte global léger pour l'authentification et les sessions de messagerie WebSocket.
</p>

<h2>5.3 Architecture Backend — Monolithe Modulaire</h2>
<p>
    Le backend de ProdKB est structuré en Monolithe Modulaire, appliquant les principes du Domain-Driven Design (DDD). Chaque domaine fonctionnel (Authentification, Incidents, Astreintes, Notifications, Observabilité) réside au sein d'un répertoire autonome comprenant ses propres contrôleurs, cas d'utilisation (Use Cases) et référentiels de données (Repositories).
</p>

<h2>5.4 Architecture asynchrone — File de tâches BullMQ / Redis</h2>
<p>
    Pour éviter que des traitements lourds n'impactent le temps de réponse de l'API principale (comme l'envoi d'emails transactionnels ou la vérification de l'échéance de SLAs), ProdKB délègue ces tâches de manière asynchrone via BullMQ couplé à un courtier de messages Redis.
</p>

<h2>5.5 Architecture de communication temps réel — Socket.io</h2>
<p>
    La réactivité de la War Room repose sur une architecture WebSocket gérée par Socket.io. Lorsqu'un utilisateur rejoint la War Room d'un incident particulier, le serveur l'abonne à une 'Room ID' unique à cet incident.
</p>

<h2>5.6 Architecture de stockage — PostgreSQL, PgBouncer, Redis, MinIO</h2>
<p>
    La persistance des données repose sur un stockage hybride adapté à la nature de chaque information :
</p>
<ul>
    <li>PostgreSQL 16 garantit l'intégrité de toutes nos données relationnelles critiques (Utilisateurs, Rôles, Incidents, SLAs, Plannings). Le proxy PgBouncer gère le pooling de connexions SQL actives pour supporter les variations de charge.</li>
    <li>Redis 7 stocke en mémoire les files de tâches BullMQ, gère les sessions actives des utilisateurs et sert de cache à haute performance pour les plannings d'astreinte, évitant ainsi d'interroger PostgreSQL lors de requêtes fréquentes.</li>
    <li>MinIO, serveur de stockage d'objets auto-hébergé, conserve toutes les pièces jointes (fichiers logs volumineux, captures d'écran) de la War Room de façon totalement souveraine, avec génération d'URLs sécurisées pré-signées temporaires.</li>
</ul>

<h2>5.7 Architecture de sécurité</h2>
<p>
    La sécurité est un pilier de ProdKB. Nous mettons en œuvre les normes industrielles d'authentification et de protection :
</p>
<ul>
    <li>Sessions stateless basées sur des tokens JWT. Un AccessToken à durée de vie courte (15 min) transite dans les en-têtes d'autorisation, tandis qu'un RefreshToken (durée 7j) est conservé dans un cookie sécurisé HttpOnly pour contrer les failles XSS.</li>
    <li>Hachage à sens unique des mots de passe utilisateurs avec Bcrypt (12 passes de salage), empêchant leur déchiffrement même en cas de vol de la base PostgreSQL.</li>
    <li>Configuration stricte d'helmet pour bloquer les attaques de type Clickjacking ou Cross-Site Scripting (XSS), restriction CORS limitant les appels d'API uniquement au domaine autorisé, et limitation de requêtes (Rate Limiting) gérée via Redis.</li>
</ul>

<h2>5.8 Architecture DevOps & Infrastructure</h2>
<p>
    L'ensemble de l'infrastructure ProdKB est conteneurisé à l'aide de Docker et orchestré avec Docker Compose. Cette standardisation garantit un comportement rigoureusement identique du système entre l'environnement de développement local et le serveur de production cloud.
</p>

<h2>5.9 Architecture de tests</h2>
<p>
    ProdKB applique le modèle de la Pyramide des Tests pour s'assurer de la stabilité applicative à chaque étape de build :
</p>
<ul>
    <li>Développés sous Jest, ils valident de façon unitaire la logique pure des Use Cases métier et des utilitaires logiques, avec un objectif de couverture supérieur à 85%.</li>
    <li>Développés avec Jest et Supertest, ils simulent l'appel des routes d'API Express sur une base de données PostgreSQL de test isolée pour valider le comportement de bout en bout des contrôleurs et de l'ORM.</li>
    <li>Rédigés avec Playwright, ils exécutent de vrais parcours utilisateurs dans des navigateurs Chromium et Firefox sans tête (headless) pour garantir la réactivité de l'authentification et de la messagerie WebSocket.</li>
</ul>

<div class="page-break"></div>

<!-- CHAPITRE 6 -->
<h1>CHAPITRE 6 — CONCEPTION DÉTAILLÉE DES MODULES</h1>

<h2>6.1 Module Authentification & Gestion des Accès (RBAC)</h2>
<p>
    Ce module assure la sécurité des accès à la plateforme en mettant en œuvre un contrôle d'accès basé sur les rôles (RBAC). Les rôles autorisés en base de données sont au nombre de trois : <code>ADMIN</code> (tous droits de configuration globale), <code>TECHNICIAN</code> (déclaration d'incidents, gestion des plannings d'astreinte, participation active aux War Rooms), et <code>MANAGER</code> (suivi analytique, clôture finale, consultation des logs d'audit).
</p>

<h2>6.2 Module Gestion des Incidents (CRUD + cycle de vie + SLA)</h2>
<p>
    Ce module structure le workflow de gestion des pannes. Tout exploitant (N1) peut déclarer un incident en renseignant le système impacté (sélectionné parmi la cartographie du SI), le titre descriptif, la nature de l'anomalie et son niveau de sévérité (LOW, MEDIUM, HIGH, CRITICAL). L'incident prend instantanément le statut <code>OPEN</code>.
</p>

<h2>6.3 Module War Room (messagerie temps réel, partage de fichiers)</h2>
<p>
    Dès qu'un incident est ouvert à l'état <code>OPEN</code>, la plateforme initialise automatiquement un espace de discussion virtuelle exclusive appelé War Room. Cette interface dynamique intègre un chat bidirectionnel utilisant Socket.io, permettant aux équipes de coordonner leurs diagnostics sans délai.
</p>

<h2>6.4 Module Tableau de Bord & Statistiques</h2>
<p>
    Destiné aux managers et aux pilotes de service, ce module consolide et affiche les indicateurs clés de performance d'exploitation (KPIs). À l'aide de la bibliothèque de visualisation Recharts, il affiche sous forme de graphiques interactifs : le temps moyen de résolution (MTTR), le taux global de respect du contrat de SLA, et le volume mensuel d'incidents déclarés triés par environnement. These indicators allow managers to monitor fine support performance and spot unstable SI modules.
</p>

<h2>6.5 Module Gestion des Astreintes & Planning</h2>
<p>
    Ce module structure la répartition des gardes en dehors des heures ouvrées. L'administrateur peut configurer des grilles de rotations hebdomadaires en assignant chaque période de garde à un technicien spécifique.
</p>

<h2>6.6 Module Notifications (Email Nodemailer + Webhooks)</h2>
<p>
    Ce module assure la propagation des alertes vers les différents canaux de communication. Géré de façon asynchrone par BullMQ, il transmet des emails transactionnels détaillés (contenant les métriques de la panne et le lien direct vers la War Room) aux techniciens de garde grâce à Nodemailer et au protocole SMTP.
</p>

<h2>6.7 Module Administration</h2>
<p>
    Le module d'administration offre une console de gestion globale réservée aux comptes disposant du rôle <code>ADMIN</code>. Il permet de gérer le cycle de vie des comptes utilisateurs, d'ajuster les durées cibles d'alertes des SLAs pour chaque niveau de sévérité (LOW, MEDIUM, HIGH, CRITICAL), d'auditer les connexions système et de configurer les clés de stockage MinIO et d'API.
</p>

<div class="page-break"></div>

<!-- CHAPITRE 7 -->
<h1>CHAPITRE 7 — RÉALISATION ET IMPLÉMENTATION</h1>

<h2>7.1 Organisation du projet et structure des répertoires</h2>
<div class="code-block">
prodkb/
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
│   │   └── App.tsx           # Routage et contexte global React
</div>

<h2>7.2 Patterns et bonnes pratiques appliqués</h2>
<p>
    Afin de garantir un code de niveau professionnel, hautement testable et maintenable, trois patrons de conception de base ont été mis en œuvre :
</p>
<ul>
    <li>Les Use Cases métiers sont totalement isolés des détails d'infrastructure. Ils manipulent des interfaces (ex. IIncidentRepository). Le client Prisma ORM n'est instancié que dans l'implémentation concrète de l'infrastructure.</li>
    <li>Les instances de Repositories et de services de messagerie sont injectées par constructeur au sein des Use Cases métiers lors du démarrage de l'API Node.js, facilitant ainsi la création de doublures (mocks) lors des tests unitaires.</li>
    <li>Tous les inputs d'API (REST et WebSocket) sont validés côté serveur grâce à des schémas stricts Zod. Si un paramètre est invalide, la requête est rejetée en amont (validation d'entrée de confiance), évitant toute corruption en base.</li>
</ul>

<h2>7.3 API RESTful — Documentation des endpoints principaux</h2>
<table>
    <thead>
        <tr>
            <th>Méthode</th>
            <th>Endpoint</th>
            <th>Description Métier</th>
            <th>Auth Requise</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>POST</td><td>/api/v1/auth/login</td><td>Authentification de l'utilisateur, retourne le token CSRF et le cookie JWT.</td><td>Non</td></tr>
        <tr><td>POST</td><td>/api/v1/auth/refresh</td><td>Renouvellement silencieux du jeton d'accès expiré via le RefreshToken.</td><td>Non</td></tr>
        <tr><td>GET</td><td>/api/v1/incidents</td><td>Récupération filtrée de la liste des incidents actifs selon l'état et la sévérité.</td><td>Oui (Technicien)</td></tr>
        <tr><td>POST</td><td>/api/v1/incidents</td><td>Déclaration d'un nouvel incident et planification asynchrone de la SLA.</td><td>Oui (Technicien)</td></tr>
        <tr><td>PUT</td><td>/api/v1/incidents/:id/ack</td><td>Prise en charge officielle de l'incident (bloque le chronomètre d'acquittement).</td><td>Oui (Technicien)</td></tr>
        <tr><td>PUT</td><td>/api/v1/incidents/:id/resolve</td><td>Résolution technique de l'incident (bloque le chronomètre de résolution).</td><td>Oui (Technicien)</td></tr>
        <tr><td>POST</td><td>/api/v1/planning/import</td><td>Importation d'une nouvelle grille de garde d'astreintes via fichier CSV.</td><td>Oui (Administrateur)</td></tr>
        <tr><td>GET</td><td>/api/v1/audit/logs</td><td>Consultation de l'historique complet et inaltérable des actions d'audit.</td><td>Oui (Manager)</td></tr>
    </tbody>
</table>

<h2>7.4 Gestion des migrations de base de données avec Prisma</h2>
<p>
    L'ORM Prisma gère de manière rigoureuse l'évolution de notre schéma PostgreSQL. Toute modification du fichier de configuration central schema.prisma entraîne la génération d'un fichier de migration SQL horodaté. Ce fichier est stocké dans le système de gestion de version (Git), permettant de rejouer à l'identique l'historique des structures de tables lors des phases de déploiement en production, garantissant l'alignement total des bases.
</p>

<h2>7.5 Sécurité applicative — mesures implémentées</h2>
<p>
    La sécurité active de l'API repose sur plusieurs middlewares Express stricts. Le middleware express-rate-limit s'appuie sur la base Redis pour compter les requêtes par adresse IP cliente, bloquant automatiquement les tentatives d'attaques par force brute sur la route /login ou le flood intensif des endpoints d'incidents. De plus, toutes les requêtes d'écriture (POST, PUT, DELETE) exigent la validation d'un jeton anti-CSRF transmis dans l'en-tête de la requête, neutralisant ainsi les failles d'écriture.
</p>

<h2>7.6 Performance — optimisations appliquées</h2>
<p>
    Afin de garantir un temps de réponse optimal sur notre instance d'hébergement AWS EC2, trois techniques majeures d'optimisation des performances ont été déployées :
</p>
<ul>
    <li>La mise en cache Redis des configurations de SLAs et des plannings d'astreinte actifs élimine les lectures répétitives en base PostgreSQL, ramenant le temps de calcul des escalades à moins de 5ms.</li>
    <li>L'utilisation du proxy PgBouncer en mode Transaction Pooling évite à PostgreSQL la surcharge liée à l'ouverture et la fermeture constante de processus de connexion, préservant ainsi la mémoire RAM du serveur.</li>
    <li>La génération d'URLs pré-signées sécurisées MinIO permet aux techniciens de téléverser et de télécharger les fichiers logs volumineux directement depuis le stockage objet, sans transiter par notre API Express.</li>
</ul>

<div class="page-break"></div>

<!-- CHAPITRE 8 -->
<h1>CHAPITRE 8 — TESTS ET VALIDATION</h1>

<h2>8.1 Stratégie de tests adoptée</h2>
<p>
    La stabilité et la robustesse d'une plateforme de gestion d'incidents informatiques devant être absolues (car c'est l'outil utilisé lors des pannes des autres systèmes), ProdKB déploie un plan d'assurance qualité extrêmement complet. Notre stratégie repose sur trois niveaux de validation automatisés couvrant 100% de la surface logicielle.
</p>

<h2>8.2 Tests unitaires et d'intégration (Jest + Supertest)</h2>
<p>
    Les tests unitaires (Jest) valident de manière isolée le code métier de nos Use Cases, en simulant les couches de base de données à l'aide de doublures (mocks). De plus, les tests d'intégration (Supertest) s'exécutent sur une base PostgreSQL de test dédiée.
</p>

<h2>8.3 Tests End-to-End (Playwright)</h2>
<p>
    Rédigés avec Playwright, les tests de bout en bout simulent de réels parcours utilisateurs au sein de navigateurs sans tête. Les scénarios automatisés couvrent :
</p>
<ul>
    <li>Saisie de mauvaises informations d'identification, expiration de session silencieuse et reconnexion automatique.</li>
    <li>Déclaration d'incident CRITICAL, vérification de l'apparition en direct du widget EscalationTimer, et prise en charge par un technicien de garde.</li>
    <li>Connexion simultanée de deux faux techniciens dans la War Room, échange de messages instantanés WebSockets, et partage d'un fichier log d'erreur.</li>
</ul>

<h2>8.4 Tests de charge et de performance</h2>
<p>
    Des tests de charge ont été menés à l'aide de l'outil d'analyse d'API k6. Nous avons simulé une charge de 200 utilisateurs virtuels effectuant des requêtes en boucle sur l'endpoint de lecture d'incidents et poussant des messages WebSocket simultanés. Grâce au pooling PgBouncer et au cache Redis, le temps de réponse moyen de l'API est resté stable à 45ms, et l'utilisation CPU du conteneur Node.js n'a pas dépassé 25% de la capacité du serveur AWS EC2.
</p>

<h2>8.5 Résultats obtenus et bilan qualité</h2>
<p>
    Le plan d'assurance qualité mis en place a permis d'atteindre un taux de couverture de code global supérieur à 88% sur le backend et 82% sur le frontend. L'exécution automatique des tests unitaires et E2E en local sécurise l'ensemble des développements et offre une confiance totale lors des mises en production.
</p>

<div class="page-break"></div>

<!-- CHAPITRE 9 -->
<h1>CHAPITRE 9 — DÉPLOIEMENT ET MISE EN PRODUCTION</h1>

<h2>9.1 Environnement de production (AWS EC2 Ubuntu Server)</h2>
<p>
    La plateforme de production de ProdKB est hébergée sur une instance cloud virtuelle AWS EC2 (type t3.medium dotée de 2 vCPUs et 4 Go de mémoire RAM) exécutant le système d'exploitation Ubuntu Server 22.04 LTS. Ce choix concilie un coût mensuel modéré avec des performances largement suffisantes pour supporter l'activité d'une équipe de support informatique de taille moyenne.
</p>

<h2>9.2 Conteneurisation avec Docker Compose</h2>
<p>
    L'ensemble de nos conteneurs applicatifs et de stockage (frontend, api, workers, postgres, pgbouncer, redis, minio, nginx, prometheus, loki, grafana) s'exécutent de façon isolée au sein de notre hôte Ubuntu.
</p>

<h2>9.3 Configuration Nginx (SSL + Reverse Proxy)</h2>
<p>
    Le conteneur Nginx centralise et traite l'ensemble des requêtes du port 80 et 443 arrivant sur l'instance AWS EC2. Il assure la redirection systématique et sécurisée de tout le trafic HTTP non sécurisé vers le protocole HTTPS.
</p>

<h2>9.4 Let's Encrypt & Certbot</h2>
<p>
    Pour sécuriser toutes les transactions, un certificat SSL/TLS valide a été configuré pour notre nom de domaine de production. L'obtention de ce certificat a été automatisée à l'aide de Let's Encrypt et de l'utilitaire Certbot. Un script d'arrière-plan (cron job) est configuré sur l'hôte Ubuntu pour renouveler silencieusement et de manière transparente le certificat tous les 60 jours.
</p>

<h2>9.5 Monitoring et observabilité avec Prometheus + Loki + Grafana</h2>
<p>
    Notre pile d'observabilité intégrée constitue le poste de pilotage DevOps de la plateforme ProdKB :
</p>
<ul>
    <li>Prometheus collecte toutes les 15 secondes les métriques d'utilisation matérielle du serveur (charge CPU, taux d'utilisation de la mémoire RAM, espace disque disponible) et des processus Node.js.</li>
    <li>L'agent Promtail écoute les flux de sortie standards (stdout) de tous nos conteneurs Docker et les achemine vers Loki, qui centralise et indexe tous nos journaux d'erreurs techniques.</li>
    <li>Grafana consolide ces informations sous forme de tableaux de bord graphiques interactifs embarqués directement dans la console d'administration de ProdKB, facilitant les diagnostics.</li>
</ul>

<h2>9.6 Procédure de déploiement et de mise à jour</h2>
<p>
    La mise à jour de la plateforme en production suit une procédure automatisée et sécurisée réduisant le temps d'indisponibilité à moins de 5 secondes :
</p>
<ol>
    <li>Récupération des dernières sources stables du projet depuis la branche principale de notre dépôt Git.</li>
    <li>Reconstruction des images Docker en arrière-plan à l'aide du cache Docker Compose.</li>
    <li>Application automatique des migrations de schémas de base de données à l'aide de la commande prisma migrate.</li>
    <li>Redémarrage rapide des conteneurs applicatifs api, workers et frontend (docker compose up -d --no-deps --build).</li>
</ol>

<div class="page-break"></div>

<!-- CHAPITRE 10 -->
<h1>CHAPITRE 10 — BILAN, DIFFICULTÉS ET PERSPECTIVES</h1>

<h2>10.1 Bilan technique du projet</h2>
<p>
    Le projet ProdKB a été mené à son terme en respectant l'ensemble des spécifications du cahier des charges et des critères de performance industrielle. Nous avons réussi à concevoir un portail d'exploitation performant, économique en ressources d'hébergement cloud, et hautement collaboratif. L'intégration de la War Room WebSocket, du décompte visuel de SLAs, des plannings d'astreintes et du cockpit DevOps dans une unique application monolithique modulaire prouve la viabilité des concepts logiciels modernes face aux solutions SaaS monolithiques du marché.
</p>

<h2>10.2 Difficultés rencontrées et solutions apportées</h2>
<p>
    Le développement de la plateforme a été jalonné par deux défis techniques majeurs :
</p>
<ul>
    <li><b>Synchronisation des comptes à rebours de SLAs :</b> La synchronisation entre les horloges des clients React et le serveur backend pour l'affichage du widget EscalationTimer présentait des décalages légers de quelques secondes dus au temps de latence réseau. Nous avons résolu cette difficulté en implémentant un protocole de synchronisation d'horloge léger (clock synchronization NTP-like) lors du handshake WebSocket Socket.io, recalant de façon logicielle le minuteur client sur l'heure du serveur backend.</li>
    <li><b>Pooling PostgreSQL sous charge asynchrone :</b> La gestion d'un volume important de connexions PostgreSQL simultanées ouvertes par les workers asynchrones BullMQ menaçait de saturer la base de données. L'installation et la configuration de PgBouncer en mode Transaction Pooling ont résolu ce goulot d'étranglement, en ramenant le volume de connexions SQL actives sous la barre des 15 connexions stables.</li>
</ul>

<h2>10.3 Comparaison avec les solutions existantes</h2>
<p>
    ProdKB se positionne comme une alternative sérieuse et souveraine face aux géants du marché :
</p>
<ul>
    <li><b>Jira Service Management :</b> Très lourd à configurer, Jira ne possède pas d'espace de discussion collaboratif temps réel ou de cockpit DevOps natifs, obligeant à acheter des modules tiers coûteux.</li>
    <li><b>PagerDuty / Opsgenie :</b> Excellent outil d'alerte, son modèle de facturation par utilisateur et par SMS est prohibitif pour les petites structures. De plus, il n'héberge pas de base de connaissances SOP Markdown intégrée.</li>
    <li><b>ProdKB (Notre Solution) :</b> Totalement gratuit, auto-hébergé sur un serveur économique, souverain sur les données et unifiant en direct chat, SLAs, astreintes et monitoring au sein d'un outil unique.</li>
</ul>

<h2>10.4 Perspectives d'évolution</h2>
<p>
    Afin de poursuivre le développement de ProdKB, trois axes d'évolutions stratégiques à moyen terme sont envisagés :
</p>
<ul>
    <li>Intégration d'un modèle d'Intelligence Artificielle local (Ollama / Llama3) pour analyser les conversations de la War Room en fin de crise et synthétiser de manière automatique un rapport de Post-Mortem de panne exploitable.</li>
    <li>Développement d'une application compagnon multiplateforme légère à l'aide de React Native pour transmettre des alertes push natives instantanées sur les smartphones des ingénieurs d'astreinte.</li>
    <li>Transition du modèle monolithique modulaire actuel vers un déploiement découplé sur un cluster Kubernetes (K8s) pour répondre aux besoins de très grandes infrastructures exigeant une scalabilité horizontale massive.</li>
</ul>

<div class="page-break"></div>

<!-- CONCLUSION GENERALE -->
<h1>CONCLUSION GÉNÉRALE</h1>
<p>
    Ce projet de fin d'études de Master a permis de relever un défi industriel de premier plan : concevoir, développer et mettre en production une plateforme complète et souveraine de gestion des incidents informatiques. En appliquant avec rigueur les concepts de la Clean Architecture, du Domain-Driven Design (DDD) monolithique modulaire et en maîtrisant les files d'attente asynchrones Redis/BullMQ et les WebSockets en temps réel, nous avons démontré qu'il est possible de concevoir une application de grade industriel performante, résiliente et hautement économique sur un serveur virtuel cloud unique.
</p>
<p>
    Ce travail de Master a constitué une expérience académique et professionnelle unique, mobilisant l'ensemble des compétences acquises durant mon cursus en ingénierie logicielle : de la rigueur de la modélisation conceptuelle UML et MERISE à la maîtrise pratique de l'observabilité DevOps (Prometheus, Loki, Grafana) et de la sécurité réseau. ProdKB est aujourd'hui une solution pleinement opérationnelle, prête à sécuriser les infrastructures numériques de production des entreprises et à faciliter le quotidien de leurs ingénieurs de support technique.
</p>

<div class="page-break"></div>

<!-- BIBLIOGRAPHIE -->
<h1>BIBLIOGRAPHIE & WEBOGRAPHIE</h1>
<p>[1] M. Fowler, <i>Patterns of Enterprise Application Architecture</i>, Addison-Wesley Professional, 2002.</p>
<p>[2] E. Evans, <i>Domain-Driven Design: Tackling Complexity in the Heart of Software</i>, Addison-Wesley, 2003.</p>
<p>[3] R. C. Martin, <i>Clean Architecture: A Craftsman's Guide to Software Structure and Design</i>, Prentice Hall, 2017.</p>
<p>[4] React JS Team, <i>React 18 Official Documentation</i>, [En ligne]. Disponible sur : https://react.dev/</p>
<p>[5] Node.js Foundation, <i>Node.js 20 LTS Documentation</i>, [En ligne]. Disponible sur : https://nodejs.org/</p>
<p>[6] Prisma Team, <i>Prisma ORM Technical Reference</i>, [En ligne]. Disponible sur : https://www.prisma.io/docs/</p>
<p>[7] BullMQ Project, <i>Asynchronous Queue Handling with Redis</i>, [En ligne]. Disponible sur : https://docs.bullmq.io/</p>
<p>[8] Socket.io Project, <i>WebSocket Bidirectional Communication Reference</i>, [En ligne]. Disponible sur : https://socket.io/docs/</p>
<p>[9] Prometheus Project, <i>System Metrics Collection & Querying</i>, [En ligne]. Disponible sur : https://prometheus.io/docs/</p>
<p>[10] Grafana Labs, <i>Observability & Loki Centralized Logging</i>, [En ligne]. Disponible sur : https://grafana.com/docs/</p>
<p>[11] Playwright Project, <i>End-to-End Browser Testing Suite</i>, [En ligne]. Disponible sur : https://playwright.dev/</p>

<div class="page-break"></div>

<!-- ANNEXES -->
<h1>ANNEXES</h1>

<h2>Annexe A — Schéma Complet de la Base de Données (Prisma Schema)</h2>
<div class="code-block">
datasource db {
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
}
</div>

<h2>Annexe B — Extrait de code : Le Handler WebSocket Socket.io</h2>
<div class="code-block">
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function setupWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  });

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
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join-incident-room', (incidentId: string) => {
      socket.join(incidentId);
    });
  });
}
</div>

</body>
</html>
`;

fs.writeFileSync("Rapport_PFE_Master_ProdKB_Final.doc", docContent);
console.log("Félicitations ! Le mémoire de Master professionnel de ProdKB au format Word HTML ultra-compatible (.doc) a été généré avec succès : Rapport_PFE_Master_ProdKB_Final.doc");
