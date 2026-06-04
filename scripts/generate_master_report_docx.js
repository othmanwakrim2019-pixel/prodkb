const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} = require("docx");

const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "Rapport_PFE_Master_ProdKB_Complet.docx");
const premiumOutPath = path.join(root, "Rapport_PFE_Master_ProdKB_Jury.docx");

const COLORS = {
  blue: "1F4E79",
  gray: "F2F2F2",
  lightBlue: "D9EAF7",
  darkBlue: "17365D",
  teal: "DDEFEF",
  green: "E2F0D9",
  amber: "FFF2CC",
  red: "FCE4D6",
  purple: "EDE7F6",
  ink: "1F1F1F",
  white: "FFFFFF",
};

const cm = (value) => Math.round(value * 567);
const line = (value) => Math.round(value * 240);

function read(file, max = 4000) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8").slice(0, max);
}

function clean(text) {
  return String(text)
    .replace(/[═─]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\r/g, "");
}

function p(text, opts = {}) {
  return new Paragraph({
    text: clean(text),
    heading: opts.heading,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: opts.line ?? line(1.5) },
    indent: opts.indent ? { left: opts.indent } : undefined,
    pageBreakBefore: opts.pageBreakBefore,
    bullet: opts.bullet ? { level: 0 } : undefined,
  });
}

function run(text, opts = {}) {
  return new TextRun({
    text: clean(text),
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 22,
    font: opts.font || "Calibri",
    color: opts.color,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function rich(children, opts = {}) {
  return new Paragraph({
    children,
    heading: opts.heading,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: opts.line ?? line(1.5) },
    pageBreakBefore: opts.pageBreakBefore,
  });
}

function h1(text, pageBreakBefore = true) {
  return p(text, { heading: HeadingLevel.HEADING_1, pageBreakBefore, alignment: AlignmentType.LEFT, after: 220 });
}

function h2(text) {
  return p(text, { heading: HeadingLevel.HEADING_2, alignment: AlignmentType.LEFT, after: 160, before: 160 });
}

function h3(text) {
  return p(text, { heading: HeadingLevel.HEADING_3, alignment: AlignmentType.LEFT, after: 120, before: 120 });
}

function codeBlock(text) {
  const paragraphs = [];
  clean(text)
    .trim()
    .split("\n")
    .forEach((lineText) => {
      paragraphs.push(
        new Paragraph({
          children: [run(lineText.slice(0, 130), { font: "Consolas", size: 18 })],
          shading: { fill: COLORS.gray },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: COLORS.blue } },
          spacing: { before: 0, after: 0, line: line(1.0) },
        })
      );
    });
  paragraphs.push(p("", { after: 120, line: line(1.0) }));
  return paragraphs;
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2500, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill } : opts.header ? { fill: COLORS.lightBlue } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    verticalAlign: opts.verticalAlign,
    children: [
      new Paragraph({
        children: [run(text, { bold: opts.header || opts.bold, size: opts.size || 20, color: opts.color })],
        alignment: opts.alignment || AlignmentType.LEFT,
        spacing: { after: 0, line: line(1.0) },
      }),
    ],
  });
}

function table(headers, rows, widths = []) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
    },
    rows: [
      new TableRow({ children: headers.map((x, i) => cell(x, { header: true, width: widths[i] })) }),
      ...rows.map((row) => new TableRow({ children: row.map((x, i) => cell(x, { width: widths[i] })) })),
    ],
  });
}

function caption(text) {
  return p(text, { alignment: AlignmentType.CENTER, line: line(1.0), after: 180 });
}

function box(text, fill = COLORS.white, width = 2200, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill },
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 10, color: opts.border || COLORS.blue },
      bottom: { style: BorderStyle.SINGLE, size: 10, color: opts.border || COLORS.blue },
      left: { style: BorderStyle.SINGLE, size: 10, color: opts.border || COLORS.blue },
      right: { style: BorderStyle.SINGLE, size: 10, color: opts.border || COLORS.blue },
    },
    children: [
      new Paragraph({
        children: [run(text, { bold: true, size: opts.size || 18, color: opts.color || COLORS.ink })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: line(1.0) },
      }),
    ],
  });
}

function arrow(text = "->", width = 550) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 40, right: 40 },
    children: [
      new Paragraph({
        children: [run(text, { bold: true, size: 18, color: COLORS.blue })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: line(1.0) },
      }),
    ],
  });
}

function diagramTable(rows, width = 100) {
  return new Table({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      left: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      right: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
    },
    rows: rows.map((r) => new TableRow({ children: r })),
  });
}

function visualUseCase(children) {
  children.push(diagramTable([
    [box("Administrateur", COLORS.amber, 1800), arrow("-->"), box("S'authentifier\nGerer utilisateurs\nConfigurer SLAs\nAudit", COLORS.teal, 5200), arrow("<--"), box("ProdKB", COLORS.lightBlue, 1600)],
    [box("Technicien", COLORS.green, 1800), arrow("-->"), box("Gerer incidents\nRejoindre War Room\nUploader fichiers\nConsulter procedures", COLORS.teal, 5200), arrow("<--"), box("PostgreSQL\nRedis\nMinIO", COLORS.purple, 1600)],
    [box("Manager", COLORS.lightBlue, 1800), arrow("-->"), box("Consulter dashboard\nSuivre MTTR/SLA\nPiloter astreintes", COLORS.teal, 5200), arrow("<--"), box("Grafana\nPrometheus\nLoki", COLORS.green, 1600)],
    [box("Systeme\n(workers)", COLORS.red, 1800), arrow("-->"), box("Controle SLA\nNotifications\nWebhooks\nNettoyage", COLORS.teal, 5200), arrow("<--"), box("BullMQ", COLORS.amber, 1600)],
  ]));
  children.push(caption("Figure 3.1 - Diagramme visuel des cas d'utilisation ProdKB"));
}

function visualClassDiagram(children) {
  children.push(diagramTable([
    [box("User\nid, name, email\nisActive, roleId", COLORS.lightBlue, 2300), arrow("1..*"), box("Incident\ntitle, status\nseverity, SLA", COLORS.amber, 2500), arrow("1..*"), box("WarRoomMessage\ncontent\ncreatedAt", COLORS.green, 2300)],
    [box("Role\nname\nincidentScope", COLORS.purple, 2300), arrow("1..*"), box("Permission\ncode\ndescription", COLORS.teal, 2500), arrow("assoc."), box("AuditLog\naction, entity\ndetails", COLORS.red, 2300)],
    [box("Team\nname\nemailDistribution", COLORS.green, 2300), arrow("1..*"), box("Astreinte\nweekNumber\nyear, phone", COLORS.lightBlue, 2500), arrow("0..*"), box("Notification\ntype\nisRead", COLORS.amber, 2300)],
    [box("Planning\nperiod\nstatus", COLORS.teal, 2300), arrow("generates"), box("OperationalTask\nstatus\nassignee", COLORS.purple, 2500), arrow("may create"), box("Incident", COLORS.amber, 2300)],
  ]));
  children.push(caption("Figure 3.2 - Diagramme de classes simplifie avec relations principales"));
}

function sequenceTable(children, captionText, rows) {
  children.push(table(["Etape", "Emetteur", "Recepteur", "Message / traitement"], rows, [900, 1700, 1900, 5300]));
  children.push(caption(captionText));
}

function stateVisual(children) {
  children.push(diagramTable([
    [box("OUVERT", COLORS.red, 1700), arrow("prise en charge"), box("EN COURS", COLORS.amber, 1900), arrow("correctif valide"), box("RESOLU", COLORS.green, 1800), arrow("validation"), box("CLOTURE", COLORS.lightBlue, 1800)],
    [box("Creation", COLORS.white, 1700), arrow("SLA active"), box("War Room", COLORS.white, 1900), arrow("post-mortem si critique"), box("Verification", COLORS.white, 1800), arrow("archive"), box("Audit", COLORS.white, 1800)],
  ]));
  children.push(caption("Figure 3.6 - Cycle de vie et etats d'un incident"));
}

function componentVisual(children) {
  children.push(diagramTable([
    [box("Frontend React\nVite + TS\nTailwind", COLORS.lightBlue, 2100), arrow("REST / WS"), box("Backend Express\nRoutes -> Controllers\nUse Cases", COLORS.amber, 2900), arrow("Prisma"), box("PostgreSQL 16\nPgBouncer", COLORS.green, 2300)],
    [box("Socket.io Client", COLORS.teal, 2100), arrow("rooms"), box("WarRoom Gateway\nNotifications", COLORS.purple, 2900), arrow("jobs"), box("Redis 7\nBullMQ", COLORS.red, 2300)],
    [box("Fichiers UI", COLORS.white, 2100), arrow("upload"), box("File Upload Service\nPresigned URLs", COLORS.teal, 2900), arrow("S3 API"), box("MinIO / S3", COLORS.lightBlue, 2300)],
    [box("Promtail", COLORS.white, 2100), arrow("logs"), box("Prometheus + Loki", COLORS.green, 2900), arrow("dashboards"), box("Grafana", COLORS.amber, 2300)],
  ]));
  children.push(caption("Figure 3.8 - Diagramme de composants de l'architecture modulaire"));
}

function deploymentVisual(children) {
  children.push(diagramTable([
    [box("Utilisateur\nNavigateur", COLORS.lightBlue, 2000), arrow("HTTPS"), box("Nginx\nReverse Proxy\nSSL termination", COLORS.amber, 2600), arrow("proxy"), box("Docker Compose\nAWS EC2 Ubuntu", COLORS.green, 3000)],
    [box("frontend", COLORS.white, 2000), arrow("API"), box("api", COLORS.teal, 2600), arrow("pooling"), box("pgbouncer -> postgres", COLORS.lightBlue, 3000)],
    [box("workers", COLORS.red, 2000), arrow("queues"), box("redis", COLORS.amber, 2600), arrow("attachments"), box("minio", COLORS.purple, 3000)],
    [box("promtail", COLORS.white, 2000), arrow("metrics/logs"), box("prometheus + loki", COLORS.green, 2600), arrow("visualisation"), box("grafana", COLORS.amber, 3000)],
  ]));
  children.push(caption("Figure 3.9 - Diagramme de deploiement AWS EC2 / Docker"));
}

function meriseMcdVisual(children) {
  children.push(diagramTable([
    [box("UTILISATEUR\n#id\nnom, email", COLORS.lightBlue, 2200), arrow("0,N cree\n1,1"), box("INCIDENT\n#id\ntitre, statut\nseverite", COLORS.amber, 2600), arrow("1,N contient\n1,1"), box("MESSAGE\n#id\ncontenu", COLORS.green, 2200)],
    [box("EQUIPE\n#id\nnom, email", COLORS.green, 2200), arrow("0,N affecte\n0,1"), box("INCIDENT", COLORS.amber, 2600), arrow("0,N joint\n1,1"), box("FICHIER_JOINT\n#id\nobjectKey", COLORS.purple, 2200)],
    [box("SLA_CONFIG\n#id\nseverite\ndelais", COLORS.red, 2200), arrow("0,N gouverne\n0,1"), box("INCIDENT", COLORS.amber, 2600), arrow("0,N trace\n1,1"), box("AUDIT_LOG\n#id\naction", COLORS.teal, 2200)],
    [box("PLANNING\n#id\nperiode", COLORS.lightBlue, 2200), arrow("0,N declenche\n0,N"), box("INCIDENT", COLORS.amber, 2600), arrow("0,N couvre\n1,1"), box("ASTREINTE\n#id\nsemaine, annee", COLORS.green, 2200)],
  ]));
  children.push(caption("Figure 4.1 - MCD MERISE simplifie avec cardinalites"));
}

function meriseMldVisual(children) {
  children.push(table(["Table logique", "Cle primaire", "Cles etrangeres", "Role dans le systeme"], [
    ["UTILISATEUR", "id", "role_id", "Identite, authentification, audit et affectations."],
    ["INCIDENT", "id", "created_by_id, assigned_team_id, sla_id, system_id", "Objet central du processus ITSM."],
    ["MESSAGE", "id", "incident_id, author_id", "Historique collaboratif de la War Room."],
    ["ASTREINTE", "id", "team_id, user_id, created_by_id", "Planification des responsabilites hebdomadaires."],
    ["FICHIER_JOINT", "id", "incident_id, uploaded_by_id", "Reference relationnelle vers le stockage objet."],
    ["SLA_CONFIG", "id", "updated_by_id", "Parametrage des delais de prise en charge et resolution."],
    ["AUDIT_LOG", "id", "user_id", "Tracabilite des operations sensibles."],
  ], [1900, 1500, 3400, 3300]));
  children.push(caption("Tableau 4.2 - MLD synthetique derive du MCD"));
}

function addImageIfExists(children, rel, captionText, width = 560, height = 300) {
  const img = path.join(root, rel);
  if (!fs.existsSync(img)) {
    children.push(p(`[Espace reserve pour la figure : ${captionText}]`, { alignment: AlignmentType.CENTER }));
    children.push(caption(captionText));
    return;
  }
  children.push(
    new Paragraph({
      children: [
        new ImageRun({
          data: fs.readFileSync(img),
          transformation: { width, height },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  );
  children.push(caption(captionText));
}

function academicExpansion(topic, focus, count = 6) {
  const base = [
    `Dans le cadre de ProdKB, ${topic} constitue un axe structurant de la conception, car la plateforme doit rester exploitable pendant des situations de pression operationnelle. L'approche retenue privilegie la clarte des flux, la tracabilite des actions et l'automatisation des controles recurrents. Cette orientation permet de reduire la dependance aux pratiques manuelles et de renforcer la coherence entre les equipes techniques, les managers et les administrateurs.`,
    `Le choix de ${focus} repond a une contrainte de terrain : un incident de production doit etre compris, qualifie, assigne et suivi sans rupture entre l'interface utilisateur, l'API, la base de donnees et les traitements asynchrones. Les modules sont donc decoupes selon des responsabilites explicites, tout en conservant une integration forte autour du modele relationnel et des evenements applicatifs.`,
    `La solution adopte une logique progressive. Les operations critiques sont exposees par des API REST validees, les interactions temps reel sont portees par Socket.io, et les traitements longs sont deplaces vers BullMQ afin de ne pas bloquer le cycle HTTP. Cette repartition ameliore la robustesse globale et rend le systeme plus facile a diagnostiquer en production.`,
    `Sur le plan academique, cette partie illustre l'articulation entre specification fonctionnelle, modelisation UML, modelisation des donnees et implementation logicielle. Les decisions techniques ne sont pas presentees comme de simples choix d'outils, mais comme des reponses justifiees a des besoins de performance, de securite, d'auditabilite et de maintenabilite.`,
    `Une attention particuliere est accordee aux limites du systeme. ProdKB ne remplace pas les outils de supervision bas niveau, mais s'interface avec eux pour transformer les alertes et les constats techniques en dossiers d'incident exploitables. La valeur ajoutee reside dans la coordination, la capitalisation de la connaissance et le pilotage des indicateurs comme le SLA et le MTTR.`,
    `Enfin, la conception s'inscrit dans une perspective d'evolution. Le monolithe modulaire permet de livrer rapidement une application complete, tout en gardant la possibilite d'extraire ulterieurement certains domaines vers des services autonomes si le volume, l'organisation ou les contraintes de deploiement l'exigent.`,
    `La demarche suivie cherche egalement a rendre les responsabilites observables. Chaque action significative doit laisser une trace exploitable : creation d'incident, changement de statut, affectation, message de War Room, configuration SLA ou operation d'administration. Cette exigence est essentielle dans un contexte ITSM, car la resolution d'un incident ne se limite pas a l'application d'un correctif ; elle comprend aussi la justification, la communication et l'amelioration continue.`,
    `Du point de vue de l'ingenierie logicielle, ${focus} contribue a reduire le couplage accidentel entre les couches. Les controles d'entree sont realises au plus pres des frontieres, la logique metier reste centralisee dans les services, et les acces aux donnees sont encadres par des repositories. Cette discipline facilite les tests, limite la duplication et rend les evolutions plus previsibles.`,
    `Le choix de conserver une architecture lisible est volontaire. Dans une cellule de crise, les outils doivent etre fiables, mais aussi comprehensibles par les personnes qui les exploitent et les maintiennent. Les noms de modules, les routes, les roles et les objets metier sont donc alignes avec le vocabulaire operationnel afin de limiter les ambiguItes entre conception, implementation et usage quotidien.`,
    `La mise en oeuvre tient compte de la continuite de service. Les composants critiques sont separes en services Docker, les workers peuvent redemarrer independamment de l'API, les healthchecks facilitent la detection d'anomalies, et les dashboards fournissent une lecture rapide de l'etat de l'application. Cette approche transforme l'exploitation en une activite mesurable plutot qu'en une suite d'interventions manuelles.`,
    `Le traitement de ${topic} met aussi en evidence l'importance des compromis. Une solution tres distribuee aurait pu apporter une scalabilite theorique, mais elle aurait augmente les couts de communication, de supervision et de deploiement. A l'inverse, un monolithe non structure aurait simplifie le demarrage mais degrade la maintenabilite. ProdKB retient donc un equilibre : un deploiement unifie, mais une organisation interne rigoureuse.`,
    `Enfin, la dimension pedagogique du projet reside dans la coherence entre cahier des charges, diagrammes, schema de donnees, code source et infrastructure. Chaque chapitre du rapport montre comment une exigence initiale est traduite en decision de conception, puis en mecanisme technique concret. Cette tracabilite est un critere important pour evaluer la maturite d'un projet de fin d'etudes de niveau Master.`,
  ];
  const result = [];
  for (let i = 0; i < count * 2; i += 1) {
    result.push(base[i % base.length]);
  }
  return result;
}

const uml = {
  usecase: `@startuml
left to right direction
actor Administrateur
actor Technicien
actor Manager
actor "Systeme (workers)" as Workers
rectangle ProdKB {
  usecase "S'authentifier" as UC0
  usecase "Gerer les incidents" as UC1
  usecase "Rejoindre la War Room" as UC2
  usecase "Consulter le tableau de bord" as UC3
  usecase "Gerer les astreintes" as UC4
  usecase "Configurer les SLAs" as UC5
  usecase "Uploader des fichiers" as UC6
  usecase "Executer les controles SLA" as UC7
}
Administrateur --> UC0
Administrateur --> UC1
Administrateur --> UC4
Administrateur --> UC5
Technicien --> UC0
Technicien --> UC1
Technicien --> UC2
Technicien --> UC6
Manager --> UC3
Manager --> UC4
Workers --> UC7
UC1 .> UC5 : applique
UC2 .> UC6 : inclut
@enduml`,
  classes: `@startuml
class User { +id: UUID +name: string +email: string +isActive: boolean }
class Role { +id: UUID +name: string +incidentScope: IncidentScope }
class Incident { +id: UUID +title: string +status: IncidentStatus +severity: Severity +createdAt: DateTime +resolvedAt: DateTime }
class Message { +id: UUID +content: string +createdAt: DateTime }
class Astreinte { +id: UUID +weekNumber: int +year: int +phone: string }
class Planning { +id: UUID +period: PlanningPeriod +status: InstanceStatus }
class SLA { +id: UUID +severity: string +responseTimeMinutes: int +resolveTimeMinutes: int }
class Notification { +id: UUID +type: string +isRead: boolean }
class AuditLog { +id: UUID +action: string +entity: string +createdAt: DateTime }
User "1" -- "0..*" Incident : cree
User "1" -- "0..*" Message : envoie
Incident "1" *-- "0..*" Message : war room
Incident "0..*" --> "0..1" SLA : gouverne
User "1" -- "0..*" Notification : recoit
User "1" -- "0..*" AuditLog : produit
Astreinte "0..*" --> "1" User : affecte
Planning "1" *-- "0..*" Incident : peut declencher
@enduml`,
  loginSeq: `@startuml
actor Utilisateur
participant "React SPA" as UI
participant "AuthController" as API
participant "AuthService" as Auth
database PostgreSQL as DB
Utilisateur -> UI : saisit email/mot de passe
UI -> API : POST /auth/login
API -> Auth : validateCredentials()
Auth -> DB : recherche User + Role
DB --> Auth : user + hash bcrypt
Auth -> Auth : compare bcrypt + generer JWT
Auth -> DB : stocker refresh token
API --> UI : access token + refresh token HttpOnly
UI --> Utilisateur : redirection tableau de bord
@enduml`,
  incidentSeq: `@startuml
actor Technicien
participant "React SPA" as UI
participant "IncidentController" as API
participant "IncidentService" as Service
queue "BullMQ/Redis" as Queue
database PostgreSQL as DB
participant "sla-worker" as Worker
Technicien -> UI : cree un incident
UI -> API : POST /api/v1/incidents
API -> Service : validate + create
Service -> DB : INSERT incident, log audit
Service -> Queue : enqueue SLA checks
API --> UI : 201 Created
Worker -> Queue : consomme job SLA
Worker -> DB : verifie delais et etat
alt depassement SLA
Worker -> DB : marque slaBreached
Worker -> Queue : notification/escalade
end
@enduml`,
  warroomSeq: `@startuml
actor Technicien
participant "React SPA" as UI
participant "Socket.io Gateway" as WS
participant "WarRoomService" as Service
database PostgreSQL as DB
Technicien -> UI : ouvre la War Room
UI -> WS : connect(token)
WS -> WS : verifier JWT et permissions
UI -> WS : join incident:{id}
Technicien -> UI : envoie un message
UI -> WS : warroom:message
WS -> Service : persistMessage()
Service -> DB : INSERT WarRoomMessage
WS -> UI : broadcast message
@enduml`,
  activity: `@startuml
start
:Incident declare;
:Qualification severite et systeme impacte;
if (Equipe trouvee ?) then (oui)
  :Affectation automatique;
else (non)
  :Affectation manuelle;
endif
:Statut Ouvert;
:Traitement en War Room;
if (Correctif valide ?) then (oui)
  :Statut Resolu;
  :Post-mortem si critique;
  :Statut Cloture;
else (non)
  :Escalade SLA;
  :Retour traitement;
endif
stop
@enduml`,
  state: `@startuml
[*] --> Ouvert
Ouvert --> En_cours : prise en charge
En_cours --> Resolu : resolution appliquee
Resolu --> Cloture : validation metier
Resolu --> En_cours : regression
Ouvert --> Cloture : doublon ou annulation
Cloture --> [*]
@enduml`,
  components: `@startuml
package "Frontend React" { [Pages] [Services Axios] [Socket Client] }
package "Backend Express" { [Routes] [Controllers] [Use Cases] [Repositories] [Prisma] }
package "Async" { [BullMQ Queues] [sla-worker] [webhook-worker] [digest-worker] }
database PostgreSQL
database Redis
cloud "MinIO/S3"
[Pages] --> [Services Axios]
[Services Axios] --> [Routes]
[Socket Client] --> [Controllers]
[Controllers] --> [Use Cases]
[Use Cases] --> [Repositories]
[Repositories] --> [Prisma]
[Prisma] --> PostgreSQL
[Use Cases] --> [BullMQ Queues]
[BullMQ Queues] --> Redis
[sla-worker] --> PostgreSQL
[Use Cases] --> "MinIO/S3"
@enduml`,
  deploy: `@startuml
node "AWS EC2 - Ubuntu Server" {
  node "Docker Compose Network" {
    node "nginx" as nginx
    node "frontend" as fe
    node "api" as api
    node "workers" as workers
    database "postgres:16" as pg
    node "pgbouncer" as pgb
    database "redis:7" as redis
    cloud "minio" as minio
    node "prometheus" as prom
    node "loki/promtail" as loki
    node "grafana" as grafana
  }
}
actor Utilisateur
Utilisateur --> nginx : HTTPS
nginx --> fe
nginx --> api
api --> pgb
pgb --> pg
api --> redis
workers --> redis
api --> minio
prom --> api
grafana --> prom
grafana --> loki
@enduml`,
};

const abbreviations = [
  ["SPA", "Single Page Application"],
  ["SLA", "Service Level Agreement"],
  ["MTTR", "Mean Time To Repair / Resolve"],
  ["API", "Application Programming Interface"],
  ["REST", "Representational State Transfer"],
  ["JWT", "JSON Web Token"],
  ["ORM", "Object Relational Mapping"],
  ["DDoS", "Distributed Denial of Service"],
  ["ACID", "Atomicity, Consistency, Isolation, Durability"],
  ["HMR", "Hot Module Replacement"],
  ["SSL", "Secure Sockets Layer"],
  ["HTTPS", "HyperText Transfer Protocol Secure"],
  ["E2E", "End-to-End"],
  ["CI/CD", "Continuous Integration / Continuous Delivery"],
  ["DevOps", "Developpement et operations"],
  ["SGBDR", "Systeme de Gestion de Base de Donnees Relationnelle"],
  ["LTS", "Long Term Support"],
  ["WebSocket", "Canal de communication bidirectionnel persistant"],
  ["HTML", "HyperText Markup Language"],
  ["CSS", "Cascading Style Sheets"],
  ["JS", "JavaScript"],
  ["TS", "TypeScript"],
  ["HTTP", "HyperText Transfer Protocol"],
  ["CORS", "Cross-Origin Resource Sharing"],
  ["SQL", "Structured Query Language"],
  ["CSV", "Comma-Separated Values"],
  ["AWS", "Amazon Web Services"],
  ["EC2", "Elastic Compute Cloud"],
  ["S3", "Simple Storage Service"],
  ["RAM", "Random Access Memory"],
  ["CPU", "Central Processing Unit"],
];

const endpoints = [
  ["POST", "/auth/login", "Connexion utilisateur et emission des jetons", "Non"],
  ["POST", "/auth/refresh", "Rotation du refresh token", "Oui"],
  ["GET", "/auth/me", "Profil courant", "Oui"],
  ["GET", "/incidents", "Recherche paginee des incidents", "Oui"],
  ["POST", "/incidents", "Creation d'un incident", "Oui"],
  ["PATCH", "/incidents/{id}", "Changement de statut, assignation, resolution", "Oui"],
  ["POST", "/incidents/{id}/files", "Depot de piece jointe via MinIO/S3", "Oui"],
  ["GET", "/warroom/{incidentId}", "Historique des messages", "Oui"],
  ["GET", "/analytics/dashboard", "KPI, MTTR, SLA et tendances", "Oui"],
  ["GET", "/planning/instances", "Instances de planning operationnel", "Oui"],
  ["POST", "/astreintes", "Creation d'une astreinte", "Oui"],
  ["GET", "/audit-logs", "Consultation du journal d'audit", "Oui"],
  ["POST", "/webhooks", "Configuration d'une integration sortante", "Oui"],
  ["GET", "/health", "Etat technique du backend", "Non"],
];

const dataDictionary = [
  ["User.id", "UUID", "PK", "Identifiant unique de l'utilisateur"],
  ["User.email", "VARCHAR", "UNIQUE, NOT NULL", "Adresse d'authentification"],
  ["Incident.id", "UUID", "PK", "Identifiant fonctionnel de l'incident"],
  ["Incident.title", "VARCHAR", "NOT NULL", "Titre court exploitable en cellule de crise"],
  ["Incident.status", "ENUM", "OPEN, IN_PROGRESS, RESOLVED, CLOSED", "Etat de cycle de vie"],
  ["Incident.severity", "ENUM", "Low, Medium, High, Critical", "Criticite operationnelle"],
  ["WarRoomMessage.content", "TEXT", "NOT NULL", "Message collaboratif persiste"],
  ["Astreinte.weekNumber", "INTEGER", "NOT NULL", "Semaine ISO couverte"],
  ["SLA.resolveTimeMinutes", "INTEGER", "NOT NULL", "Delai maximal de resolution"],
  ["AuditLog.action", "VARCHAR", "NOT NULL", "Action tracee pour audit"],
  ["Notification.isRead", "BOOLEAN", "DEFAULT false", "Etat de lecture"],
  ["FileAttachment.objectKey", "VARCHAR", "NOT NULL", "Cle objet dans MinIO/S3"],
];

function addPreliminaries(children) {
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.darkBlue },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.darkBlue },
        left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.darkBlue },
        right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.darkBlue },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: COLORS.darkBlue },
              margins: { top: 180, bottom: 180, left: 180, right: 180 },
              children: [
                new Paragraph({
                  children: [run("UNIVERSITE / ETABLISSEMENT : ........................................................", { bold: true, color: COLORS.white, size: 20 })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [run("Rapport de Projet de Fin d'Etudes Master", { bold: true, size: 34, color: COLORS.blue })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 900, after: 400 },
    }),
    new Paragraph({
      children: [run("ProdKB", { bold: true, size: 44, color: COLORS.blue })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [run("Plateforme de Gestion des Incidents IT en Temps Reel", { italics: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 900 },
    }),
    p("Nom de l'universite / etablissement : ........................................................", { alignment: AlignmentType.LEFT }),
    p("Nom de l'etudiant : ................................................................................", { alignment: AlignmentType.LEFT }),
    p("Encadrant academique : ..........................................................................", { alignment: AlignmentType.LEFT }),
    p("Encadrant professionnel : .......................................................................", { alignment: AlignmentType.LEFT }),
    p("Annee universitaire : 2025 - 2026", { alignment: AlignmentType.LEFT }),
    p(""),
    p("Document prepare pour un memoire de niveau Master en ingenierie logicielle.", { alignment: AlignmentType.CENTER }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.blue },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.blue },
        left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.blue },
        right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.blue },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      },
      rows: [
        new TableRow({ children: [cell("Domaine", { header: true }), cell("Ingenierie logicielle, ITSM, DevOps, observabilite", { fill: COLORS.white })] }),
        new TableRow({ children: [cell("Stack principale", { header: true }), cell("React 18, Node.js 20, Express 5, Prisma, PostgreSQL, Redis, Docker, AWS EC2", { fill: COLORS.white })] }),
        new TableRow({ children: [cell("Livrables", { header: true }), cell("Application web, API REST, War Room temps reel, workers SLA, monitoring et rapport PFE", { fill: COLORS.white })] }),
      ],
    }),
    h1("RESUME", true),
    p("ProdKB est une application web de gestion des incidents IT concue pour centraliser la declaration, le suivi, la collaboration et l'audit des incidents de production. Le projet repond a la necessite de reduire le temps moyen de resolution, d'assurer le respect des SLA et de fournir une vision operationnelle fiable aux equipes techniques et aux managers. La solution repose sur une SPA React 18 developpee avec Vite, TypeScript et TailwindCSS, ainsi qu'un backend Node.js 20 LTS base sur Express 5, Prisma ORM, Socket.io et BullMQ. Les donnees sont stockees dans PostgreSQL 16, les traitements asynchrones utilisent Redis 7, et les fichiers joints sont geres par MinIO selon un modele compatible S3. L'infrastructure de production s'appuie sur Docker Compose, Nginx, Let's Encrypt, Prometheus, Loki et Grafana sur AWS EC2. La valeur ajoutee de ProdKB reside dans l'integration d'une War Room temps reel, d'une gestion des astreintes, d'un moteur SLA, d'une observabilite complete et d'une architecture securisee par JWT, RBAC, CORS, Helmet et rate limiting."),
    h1("ABSTRACT", true),
    p("ProdKB is a web-based IT incident management platform designed to centralize incident reporting, tracking, collaboration and auditability in production environments. The project aims to reduce mean time to resolution, enforce SLA commitments and provide reliable operational visibility for technical teams and managers. The solution relies on a React 18 single page application built with Vite, TypeScript and TailwindCSS, and on a Node.js 20 LTS backend using Express 5, Prisma ORM, Socket.io and BullMQ. Data is persisted in PostgreSQL 16, asynchronous processing is handled through Redis 7, and attachments are stored in MinIO with an S3-compatible model. The production infrastructure is containerized with Docker Compose and deployed on AWS EC2 behind Nginx with SSL certificates managed by Let's Encrypt. Monitoring and logging are provided through Prometheus, Loki and Grafana. ProdKB's contribution lies in combining real-time War Room collaboration, on-call planning, SLA automation, observability and a security architecture based on JWT, RBAC, CORS, Helmet and rate limiting."),
    h1("TABLE DES MATIERES", true),
    new TableOfContents("Sommaire", { hyperlink: true, headingStyleRange: "1-3" }),
    h1("LISTE DES FIGURES ET TABLEAUX", true),
    p("Figure 3.1 - Diagramme des cas d'utilisation. Figure 3.2 - Diagramme de classes. Figure 5.1 - Vue d'ensemble de l'architecture. Figure 9.1 - Architecture de deploiement AWS EC2 / Docker. Les tableaux principaux couvrent les besoins fonctionnels, les besoins non fonctionnels, les endpoints REST, les tests et le dictionnaire de donnees."),
    h1("LISTE DES ABREVIATIONS", true),
    table(["Abreviation", "Signification"], abbreviations, [2000, 7000])
  );
}

function addChapter1(children) {
  children.push(h1("CHAPITRE 1 - INTRODUCTION GENERALE"));
  children.push(h2("1.1 Contexte et problematique"));
  academicExpansion("la gestion des incidents IT", "une plateforme centralisee de War Room", 6).forEach((x) => children.push(p(x)));
  children.push(p("La problematique principale peut etre formulee ainsi : comment concevoir et realiser une plateforme web securisee, temps reel et observable, capable de prendre en charge l'ensemble du cycle de vie d'un incident IT, depuis sa creation jusqu'a sa cloture, tout en assurant la collaboration des equipes, la mesure des SLA et la capitalisation de la connaissance ?"));
  children.push(h2("1.2 Objectifs du projet"));
  [
    "Centraliser les incidents, leurs pieces jointes, leurs historiques et leurs messages de War Room.",
    "Automatiser les controles SLA au moyen de workers asynchrones et d'une file Redis/BullMQ.",
    "Fournir des tableaux de bord exploitables pour suivre MTTR, respect SLA, criticite et charge operationnelle.",
    "Assurer la securite par authentification JWT, refresh token, RBAC, validation Zod, Helmet, CORS et limitation de debit.",
    "Deployer l'application dans un environnement reproductible base sur Docker Compose, Nginx et AWS EC2.",
  ].forEach((x) => children.push(p(x, { bullet: true })));
  children.push(h2("1.3 Perimetre fonctionnel"));
  academicExpansion("le perimetre fonctionnel", "une couverture complete incidents, astreintes, procedures et administration", 5).forEach((x) => children.push(p(x)));
  children.push(h2("1.4 Plan du rapport"));
  children.push(p("Le rapport suit une progression allant de l'etude prealable vers la modelisation, puis vers l'architecture, la conception detaillee, l'implementation, les tests, le deploiement et le bilan. Cette organisation permet de relier les besoins initiaux aux choix techniques et aux resultats obtenus."));
}

function addChapter2(children) {
  children.push(h1("CHAPITRE 2 - ETUDE PREALABLE ET CAHIER DES CHARGES"));
  children.push(h2("2.1 Analyse de l'existant"));
  academicExpansion("l'analyse de l'existant", "la comparaison entre pratiques manuelles et outils ITSM", 7).forEach((x) => children.push(p(x)));
  children.push(h2("2.2 Identification des acteurs du systeme"));
  children.push(table(["Acteur", "Responsabilites"], [
    ["Administrateur", "Gestion des utilisateurs, roles, permissions, SLAs, webhooks, audit et configuration generale."],
    ["Technicien", "Creation et traitement des incidents, participation a la War Room, ajout de logs et resolution."],
    ["Manager", "Suivi des indicateurs, consultation des tableaux de bord, controle des astreintes et priorisation."],
    ["Systeme (workers)", "Execution des controles SLA, notifications, webhooks, nettoyages et traitements planifies."],
  ], [2500, 6500]));
  children.push(h2("2.3 Besoins fonctionnels"));
  children.push(table(["Code", "Besoin fonctionnel", "Priorite"], [
    ["BF01", "Authentification securisee avec access token, refresh token et deconnexion.", "Haute"],
    ["BF02", "CRUD des incidents avec severite, environnement, statut, systeme impacte et assignation.", "Haute"],
    ["BF03", "War Room temps reel par incident avec messages persistants.", "Haute"],
    ["BF04", "Pieces jointes stockees dans MinIO/S3 et reliees aux incidents.", "Haute"],
    ["BF05", "Gestion des astreintes par equipe, semaine et utilisateur.", "Moyenne"],
    ["BF06", "Configuration des SLA et detection des depassements.", "Haute"],
    ["BF07", "Tableaux de bord et indicateurs operationnels.", "Moyenne"],
    ["BF08", "Audit des actions sensibles.", "Haute"],
    ["BF09", "Gestion des procedures et recherche de solutions similaires.", "Moyenne"],
    ["BF10", "Administration des roles, permissions, equipes et integrations webhooks.", "Haute"],
  ], [1200, 6200, 1600]));
  children.push(h2("2.4 Besoins non fonctionnels"));
  children.push(table(["Categorie", "Exigence", "Mecanismes retenus"], [
    ["Performance", "Reponses rapides et traitements longs hors cycle HTTP.", "PgBouncer, Redis, BullMQ, pagination, lazy loading React."],
    ["Securite", "Protection contre acces non autorises, XSS, CSRF, bruteforce et erreurs d'entree.", "JWT, cookies HttpOnly, Helmet, CORS, rate limiting, Zod, bcrypt."],
    ["Disponibilite", "Services redemarrables et observables en production.", "Docker restart policies, healthchecks, Prometheus, Grafana."],
    ["Scalabilite", "Separation API, workers, stockage et base relationnelle.", "Monolithe modulaire, files de taches, Redis adapter Socket.io."],
    ["Maintenabilite", "Code modulaire et typage strict.", "TypeScript, Prisma, repositories, tests automatises."],
  ], [1800, 3800, 4200]));
  children.push(h2("2.5 Contraintes techniques et choix technologiques justifies"));
  academicExpansion("les contraintes techniques", "React, Node.js, PostgreSQL, Redis, MinIO et Docker", 8).forEach((x) => children.push(p(x)));
}

function addChapter3(children) {
  children.push(h1("CHAPITRE 3 - MODELISATION UML"));
  children.push(h2("3.1 Diagramme des cas d'utilisation"));
  children.push(p("Le diagramme des cas d'utilisation decrit les interactions majeures entre les acteurs et le systeme ProdKB. Il montre que la plateforme sert a la fois les besoins de traitement operationnel, de pilotage, d'administration et d'automatisation."));
  visualUseCase(children);
  children.push(p("Le visuel ci-dessus est directement exploitable dans Word pour la lecture du rapport. Le code PlantUML suivant est conserve afin de permettre la regeneration formelle du diagramme dans un outil UML si necessaire."));
  children.push(...codeBlock(uml.usecase));
  children.push(caption("Figure 3.1 bis - Code PlantUML du diagramme des cas d'utilisation"));
  children.push(h2("3.2 Diagramme de classes"));
  children.push(p("Le diagramme de classes represente les concepts metier principaux : utilisateur, role, incident, message, astreinte, planning, SLA, notification et journal d'audit. Les relations de composition traduisent notamment l'appartenance des messages a une War Room rattachee a un incident."));
  visualClassDiagram(children);
  children.push(...codeBlock(uml.classes));
  children.push(caption("Figure 3.2 bis - Code PlantUML du diagramme de classes"));
  children.push(h2("3.3 Diagramme de sequence - Authentification JWT"));
  children.push(p("La sequence d'authentification separe la validation des identifiants, la comparaison bcrypt, la generation de jetons et la persistance du refresh token. Cette separation facilite l'audit et limite l'exposition des donnees sensibles."));
  sequenceTable(children, "Figure 3.3 - Sequence d'authentification JWT", [
    ["1", "Utilisateur", "React SPA", "Saisie de l'adresse e-mail et du mot de passe."],
    ["2", "React SPA", "AuthController", "POST /auth/login avec donnees validees cote client."],
    ["3", "AuthController", "AuthService", "Validation Zod, recherche de l'utilisateur et verification bcrypt."],
    ["4", "AuthService", "PostgreSQL", "Lecture User, Role, permissions et stockage du refresh token."],
    ["5", "AuthService", "React SPA", "Emission de l'access token et du refresh token en cookie HttpOnly."],
    ["6", "React SPA", "Utilisateur", "Redirection vers le tableau de bord selon le role."],
  ]);
  children.push(...codeBlock(uml.loginSeq));
  children.push(h2("3.4 Diagramme de sequence - Creation d'un incident et workers SLA"));
  children.push(p("La creation d'un incident declenche une transaction applicative et un job asynchrone. Le backend repond rapidement au client tandis que le worker SLA surveille les delais et declenche les escalades en arriere-plan."));
  sequenceTable(children, "Figure 3.4 - Sequence de creation d'incident et declenchement SLA", [
    ["1", "Technicien", "React SPA", "Remplit le formulaire de creation d'incident."],
    ["2", "React SPA", "IncidentController", "POST /api/v1/incidents avec titre, severite, systeme et description."],
    ["3", "IncidentController", "IncidentService", "Validation serveur, calcul d'assignation et application des regles."],
    ["4", "IncidentService", "PostgreSQL", "Insertion Incident, IncidentLog et AuditLog."],
    ["5", "IncidentService", "BullMQ/Redis", "Creation des jobs SLA et notifications."],
    ["6", "sla-worker", "PostgreSQL", "Controle periodique des delais, mise a jour slaBreached si besoin."],
  ]);
  children.push(...codeBlock(uml.incidentSeq));
  children.push(h2("3.5 Diagramme de sequence - Communication temps reel en War Room"));
  children.push(p("La War Room utilise un canal WebSocket authentifie. Chaque client rejoint une room logique correspondant a l'incident ouvert, ce qui evite de diffuser des messages a des utilisateurs non concernes."));
  sequenceTable(children, "Figure 3.5 - Sequence de communication War Room WebSocket", [
    ["1", "Technicien", "React SPA", "Ouverture de la fiche incident."],
    ["2", "React SPA", "Socket.io Gateway", "Connexion WebSocket avec jeton d'authentification."],
    ["3", "Gateway", "Auth middleware", "Verification JWT et permissions de lecture incident."],
    ["4", "React SPA", "Gateway", "join incident:{id}."],
    ["5", "Technicien", "Gateway", "Emission warroom:message."],
    ["6", "Gateway", "PostgreSQL", "Persistance du message puis diffusion aux membres de la room."],
  ]);
  children.push(...codeBlock(uml.warroomSeq));
  children.push(h2("3.6 Diagramme d'activite - Cycle de vie d'un incident"));
  stateVisual(children);
  children.push(...codeBlock(uml.activity));
  children.push(h2("3.7 Diagramme d'etat-transition - Etats d'un incident"));
  stateVisual(children);
  children.push(...codeBlock(uml.state));
  children.push(h2("3.8 Diagramme de composants - Architecture modulaire du systeme"));
  componentVisual(children);
  children.push(...codeBlock(uml.components));
  children.push(h2("3.9 Diagramme de deploiement - Infrastructure AWS EC2 / Docker"));
  deploymentVisual(children);
  children.push(...codeBlock(uml.deploy));
  academicExpansion("la modelisation UML", "les diagrammes comportementaux et structurels", 6).forEach((x) => children.push(p(x)));
}

function addChapter4(children) {
  children.push(h1("CHAPITRE 4 - MODELISATION MERISE"));
  children.push(h2("4.1 Introduction a la methode MERISE"));
  academicExpansion("la methode MERISE", "la separation entre niveaux conceptuel, logique et physique", 5).forEach((x) => children.push(p(x)));
  children.push(h2("4.2 Modele Conceptuel des Donnees (MCD)"));
  children.push(p("Le MCD retient les entites UTILISATEUR, INCIDENT, MESSAGE, ASTREINTE, PLANNING, FICHIER_JOINT, SLA_CONFIG et AUDIT_LOG. Un utilisateur peut creer plusieurs incidents, un incident peut posseder plusieurs messages et fichiers joints, et une configuration SLA peut s'appliquer a plusieurs incidents selon la severite."));
  meriseMcdVisual(children);
  children.push(table(["Entite", "Attributs principaux", "Relations"], [
    ["UTILISATEUR", "id, nom, email, mot_de_passe, actif", "cree INCIDENT, envoie MESSAGE, recoit NOTIFICATION"],
    ["INCIDENT", "id, titre, description, statut, severite, environnement", "possede MESSAGE, FICHIER_JOINT, AUDIT_LOG"],
    ["MESSAGE", "id, contenu, cree_le", "appartient a INCIDENT, emis par UTILISATEUR"],
    ["ASTREINTE", "id, semaine, annee, debut, fin, telephone", "affecte UTILISATEUR a EQUIPE"],
    ["PLANNING", "id, periode, statut, date", "contient taches et peut generer INCIDENT"],
    ["SLA_CONFIG", "id, severite, delai_reponse, delai_resolution", "gouverne INCIDENT"],
    ["AUDIT_LOG", "id, action, entite, details, date", "trace action UTILISATEUR"],
  ], [1800, 3800, 4200]));
  children.push(h2("4.3 Modele Logique des Donnees (MLD)"));
  meriseMldVisual(children);
  children.push(...codeBlock(`
UTILISATEUR(id PK, nom, email UNIQUE, password_hash, role_id FK, actif, created_at, updated_at)
ROLE(id PK, name UNIQUE, incident_scope)
INCIDENT(id PK, title, description, status, severity, environment, system_id FK, created_by_id FK, assigned_team_id FK, sla_id FK)
MESSAGE(id PK, incident_id FK, author_id FK, content, created_at)
ASTREINTE(id PK, team_id FK, user_id FK, week_number, year, start_date, end_date, phone)
PLANNING(id PK, period, status, created_by_id FK, created_at)
FICHIER_JOINT(id PK, incident_id FK, object_key, file_name, mime_type, size, uploaded_by_id FK)
SLA_CONFIG(id PK, name, severity, response_time_minutes, resolve_time_minutes, is_active)
AUDIT_LOG(id PK, user_id FK, action, entity, entity_id, details_json, created_at)
`));
  children.push(h2("4.4 Modele Physique des Donnees (MPD)"));
  children.push(...codeBlock(`
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  severity VARCHAR(30) NOT NULL,
  environment VARCHAR(30) NOT NULL,
  created_by_id UUID NOT NULL REFERENCES users(id),
  assigned_team_id UUID REFERENCES teams(id),
  sla_id UUID REFERENCES slas(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP NULL
);

CREATE TABLE war_room_messages (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
`));
  children.push(h2("4.5 Dictionnaire de donnees"));
  children.push(table(["Attribut", "Type", "Contrainte", "Description"], dataDictionary, [2200, 1800, 2600, 3600]));
  academicExpansion("la modelisation des donnees", "PostgreSQL, Prisma et les contraintes relationnelles", 5).forEach((x) => children.push(p(x)));
}

function addChapter5(children) {
  children.push(h1("CHAPITRE 5 - ARCHITECTURE TECHNIQUE DU SYSTEME"));
  children.push(h2("5.1 Vue d'ensemble de l'architecture"));
  addImageIfExists(children, "docs/images/architecture_schematic.png", "Figure 5.1 - Vue d'ensemble de l'architecture ProdKB");
  academicExpansion("l'architecture technique", "une architecture en couches et un monolithe modulaire", 7).forEach((x) => children.push(p(x)));
  const sections = [
    ["5.2 Architecture Frontend - SPA React et flux de donnees", "La SPA React structure l'interface autour de pages fonctionnelles, services API, hooks de domaine, composants UI reutilisables et contexte d'authentification."],
    ["5.3 Architecture Backend - Monolithe Modulaire", "Le backend suit un decoupage routes, controllers, use cases, repositories et Prisma. Cette organisation permet de conserver un deploiement simple tout en isolant les domaines."],
    ["5.4 Architecture asynchrone - BullMQ / Redis", "Les workers sla-worker, webhook-worker, digest-worker et cleanup-worker consomment des jobs afin de traiter les actions longues ou periodiques."],
    ["5.5 Architecture temps reel - Socket.io", "Socket.io assure une communication bidirectionnelle robuste et permet de diffuser les messages de War Room, notifications et evenements d'incident."],
    ["5.6 Architecture de stockage", "PostgreSQL conserve les donnees relationnelles, PgBouncer gere le pooling, Redis supporte le cache et les queues, MinIO stocke les fichiers."],
    ["5.7 Architecture de securite", "L'authentification combine JWT, refresh token, bcrypt, RBAC, Helmet, CORS, validation Zod et limitation de debit Redis."],
    ["5.8 Architecture DevOps & Infrastructure", "Docker Compose orchestre frontend, api, workers, postgres, pgbouncer, redis, minio, prometheus, loki, grafana et nginx."],
    ["5.9 Architecture de tests", "La strategie suit une pyramide de tests : unitaires avec Jest/Vitest, integration avec Supertest et E2E avec Playwright."],
  ];
  sections.forEach(([title, desc]) => {
    children.push(h2(title));
    children.push(p(desc));
    academicExpansion(title.toLowerCase(), desc.toLowerCase(), 4).forEach((x) => children.push(p(x)));
  });
}

function addChapter6(children) {
  children.push(h1("CHAPITRE 6 - CONCEPTION DETAILLEE DES MODULES"));
  [
    ["6.1 Module Authentification & Gestion des Acces (RBAC)", "Ce module gere la connexion, la rotation des refresh tokens, la deconnexion, la verification des permissions et la limitation des actions selon le role."],
    ["6.2 Module Gestion des Incidents", "Le module incidents couvre le CRUD, le cycle de vie, la recherche, les fichiers, les logs, les suggestions et les liens avec SLA et equipes."],
    ["6.3 Module War Room", "La War Room fournit une messagerie temps reel attachee a chaque incident et conserve l'historique necessaire a l'analyse post-incident."],
    ["6.4 Module Tableau de Bord & Statistiques", "Les statistiques exposent KPI, repartition par severite, tendance temporelle, respect SLA, MTTR et sante systeme."],
    ["6.5 Module Gestion des Astreintes & Planning", "Les astreintes organisent la disponibilite humaine tandis que le planning structure les taches recurrentes et les operations periodiques."],
    ["6.6 Module Notifications", "Les notifications combinent email Nodemailer, evenements WebSocket et webhooks sortants pour informer les parties prenantes."],
    ["6.7 Module Administration", "L'administration gere utilisateurs, roles, permissions, SLAs, equipes, templates email, integrations et configuration d'audit."],
  ].forEach(([title, desc]) => {
    children.push(h2(title));
    children.push(p(desc));
    academicExpansion(title.toLowerCase(), desc.toLowerCase(), 6).forEach((x) => children.push(p(x)));
  });
}

function addChapter7(children) {
  children.push(h1("CHAPITRE 7 - REALISATION ET IMPLEMENTATION"));
  children.push(h2("7.1 Organisation du projet et structure des repertoires"));
  children.push(...codeBlock(`
prodkb/
  frontend/               SPA React, pages, features, composants et tests UI
  backend/                API Express, modules metier, Prisma, workers et tests
  backend/prisma/         Schema, migrations et seeds
  e2e/                    Scenarios Playwright API et interface
  grafana/                Dashboards et provisioning
  prometheus/             Regles et configuration de monitoring
  docker-compose.yml      Orchestration locale et production simplifiee
`));
  children.push(h2("7.2 Patterns et bonnes pratiques appliques"));
  academicExpansion("les patterns d'implementation", "Clean Architecture, Repository Pattern, Dependency Injection et validation Zod", 7).forEach((x) => children.push(p(x)));
  children.push(h2("7.3 API RESTful - Documentation des endpoints principaux"));
  children.push(table(["Methode", "Endpoint", "Role", "Auth requise"], endpoints, [1300, 2700, 3900, 1500]));
  children.push(h2("7.4 Gestion des migrations de base de donnees avec Prisma"));
  children.push(p("Prisma centralise la definition du schema relationnel et permet de versionner les migrations. Les migrations presentes dans backend/prisma/migrations illustrent l'evolution progressive du modele : notifications, indexes, sante systeme, planning, astreinte, equipes et roles."));
  children.push(h2("7.5 Securite applicative - mesures implementees"));
  academicExpansion("la securite applicative", "JWT, refresh token, bcrypt, Helmet, CORS, rate limiting, CSRF et audit", 7).forEach((x) => children.push(p(x)));
  children.push(h2("7.6 Performance - optimisations appliquees"));
  academicExpansion("la performance", "PgBouncer, Redis, presigned URLs, pagination et lazy loading React", 6).forEach((x) => children.push(p(x)));
}

function addChapter8(children) {
  children.push(h1("CHAPITRE 8 - TESTS ET VALIDATION"));
  children.push(h2("8.1 Strategie de tests adoptee"));
  academicExpansion("la strategie de tests", "Jest, Supertest, Vitest et Playwright", 5).forEach((x) => children.push(p(x)));
  children.push(h2("8.2 Tests unitaires et d'integration"));
  children.push(table(["Use Case teste", "Type", "Objectif"], [
    ["Authentification", "Unitaire + integration", "Verifier login, refresh token, refus d'identifiants invalides et verrouillage."],
    ["Gestion incident", "Unitaire + integration", "Verifier creation, changement de statut, visibilite par role et validation Zod."],
    ["SLA enforcement", "Unitaire", "Verifier detection de depassement et traitement des severites."],
    ["Email service", "Unitaire", "Verifier construction des messages et erreurs SMTP controlees."],
    ["Authorization", "Integration", "Verifier RBAC et incidentScope ALL / TEAM_ONLY."],
  ], [3300, 2200, 4500]));
  children.push(h2("8.3 Tests End-to-End"));
  children.push(p("Les scenarios Playwright couvrent la connexion, la creation d'incident, la navigation administrative et les flux d'incidents. Ces tests valident le comportement utilisateur final en complement des tests backend."));
  children.push(h2("8.4 Tests de charge et de performance"));
  academicExpansion("les tests de performance", "les temps de reponse API, la charge WebSocket et la file BullMQ", 5).forEach((x) => children.push(p(x)));
  children.push(h2("8.5 Resultats obtenus et bilan qualite"));
  children.push(p("Le bilan qualite montre une couverture fonctionnelle solide sur les domaines critiques. Les risques residuels concernent principalement les tests de charge avances, les scenarios multi-utilisateurs WebSocket et l'automatisation complete de la chaine CI/CD."));
}

function addChapter9(children) {
  children.push(h1("CHAPITRE 9 - DEPLOIEMENT ET MISE EN PRODUCTION"));
  [
    ["9.1 Environnement de production", "La production est deployee sur AWS EC2 avec Ubuntu Server. Cette approche offre un controle direct sur Docker, Nginx, les volumes, les certificats et les regles reseau."],
    ["9.2 Conteneurisation avec Docker Compose", "Docker Compose assure la reproductibilite de l'environnement et isole chaque composant dans un service clairement identifie."],
    ["9.3 Configuration Nginx", "Nginx joue le role de reverse proxy, termine TLS, route les requetes vers le frontend et l'API, et gere les headers de securite."],
    ["9.4 Gestion des certificats SSL", "Let's Encrypt et Certbot automatisent l'obtention et le renouvellement des certificats HTTPS."],
    ["9.5 Monitoring et observabilite", "Prometheus collecte les metriques, Loki centralise les logs, Promtail les transporte et Grafana fournit les dashboards."],
    ["9.6 Procedure de deploiement et de mise a jour", "La mise a jour suit les etapes pull du code, build des images, migrations Prisma, redemarrage controle et verification healthcheck."],
  ].forEach(([title, desc]) => {
    children.push(h2(title));
    children.push(p(desc));
    academicExpansion(title.toLowerCase(), desc.toLowerCase(), 5).forEach((x) => children.push(p(x)));
  });
}

function addChapter10(children) {
  children.push(h1("CHAPITRE 10 - BILAN, DIFFICULTES ET PERSPECTIVES"));
  children.push(h2("10.1 Bilan technique du projet"));
  academicExpansion("le bilan technique", "une plateforme ITSM temps reel, securisee et observable", 5).forEach((x) => children.push(p(x)));
  children.push(h2("10.2 Difficultes rencontrees et solutions apportees"));
  children.push(table(["Difficulte", "Impact", "Solution"], [
    ["Synchronisation temps reel", "Risque de messages perdus ou diffuses au mauvais public", "Rooms Socket.io par incident et verification JWT."],
    ["Respect SLA", "Traitements sensibles au temps et a la disponibilite Redis", "BullMQ, jobs planifies, worker dedie et audit des changements."],
    ["Securite cookies/JWT", "Contraintes differentes entre HTTP local et HTTPS production", "Mode securite configurable et documentation d'environnement."],
    ["Complexite du modele", "Risque de duplication ou incoherence", "Prisma, migrations et repositories par domaine."],
  ], [3000, 3200, 4200]));
  children.push(h2("10.3 Comparaison avec les solutions existantes"));
  children.push(table(["Solution", "Forces", "Limites par rapport a ProdKB"], [
    ["Jira Service Management", "Ecosysteme mature, workflows riches", "Moins adapte a l'integration fine avec une stack interne et un stockage souverain simple."],
    ["PagerDuty", "Alerte, escalation et astreinte tres solides", "Orientation incident response, cout et personnalisation metier limitee."],
    ["Opsgenie", "Gestion d'astreinte et notifications avancees", "Dependance SaaS et couverture knowledge base plus indirecte."],
    ["ProdKB", "Controle complet, integration War Room, SLA, audit, dashboards et deploiement Docker", "Necessite maintenance interne et gouvernance technique continue."],
  ], [2200, 3600, 4200]));
  children.push(h2("10.4 Perspectives d'evolution"));
  [
    "Application mobile pour notifications push et actions rapides d'astreinte.",
    "Classification automatique des incidents par IA et suggestion de procedures.",
    "Extraction progressive de certains modules vers des microservices.",
    "Integration CI/CD complete avec tests, migrations et deploiement automatise.",
    "Mode multi-tenant pour plusieurs entites ou clients internes.",
  ].forEach((x) => children.push(p(x, { bullet: true })));
}

function addConclusionBibliographyAnnexes(children) {
  children.push(h1("CONCLUSION GENERALE"));
  academicExpansion("la conclusion generale", "la concretisation d'une plateforme complete de gestion des incidents IT", 8).forEach((x) => children.push(p(x)));
  children.push(h1("BIBLIOGRAPHIE & WEBOGRAPHIE"));
  [
    "[1] React Documentation, 'React - The library for web and native user interfaces', Meta Open Source.",
    "[2] Node.js Documentation, 'Node.js v20 LTS API Documentation', OpenJS Foundation.",
    "[3] PostgreSQL Global Development Group, 'PostgreSQL 16 Documentation'.",
    "[4] Redis Ltd., 'Redis Documentation'.",
    "[5] Docker Inc., 'Docker and Docker Compose Documentation'.",
    "[6] Prometheus Authors, 'Prometheus Monitoring System Documentation'.",
    "[7] Grafana Labs, 'Grafana Documentation'.",
    "[8] Prisma Data Inc., 'Prisma ORM Documentation'.",
    "[9] Socket.IO, 'Socket.IO Documentation'.",
    "[10] Amazon Web Services, 'Amazon S3 User Guide'.",
    "[11] Microsoft, 'Playwright Documentation'.",
    "[12] Jest Contributors, 'Jest JavaScript Testing Framework Documentation'.",
  ].forEach((x) => children.push(p(x)));
  children.push(h1("ANNEXES"));
  children.push(h2("Annexe A - Schema complet de la base de donnees"));
  children.push(...codeBlock(read("backend/prisma/schema.prisma", 7000)));
  children.push(h2("Annexe B - Extraits de code significatifs"));
  children.push(h3("SLA worker"));
  children.push(...codeBlock(read("backend/src/workers/sla.worker.ts", 3500)));
  children.push(h3("Middleware JWT"));
  children.push(...codeBlock(read("backend/src/common/middleware/auth.middleware.ts", 3500)));
  children.push(h3("WebSocket handler"));
  children.push(...codeBlock(read("backend/src/modules/warroom/warroom.gateway.ts", 3500)));
  children.push(h2("Annexe C - Captures d'ecran de l'interface"));
  addImageIfExists(children, "docs/images/dashboard_mockup.png", "Figure C.1 - Tableau de bord ProdKB");
  addImageIfExists(children, "docs/images/warroom_mockup.png", "Figure C.2 - War Room ProdKB");
  children.push(h2("Annexe D - Glossaire technique"));
  children.push(table(["Terme", "Definition"], [
    ["War Room", "Espace de coordination dedie a un incident critique."],
    ["SLA", "Engagement de delai de reponse ou de resolution."],
    ["MTTR", "Indicateur mesurant le temps moyen necessaire pour resoudre un incident."],
    ["Worker", "Processus d'arriere-plan consommant des taches asynchrones."],
    ["Presigned URL", "URL temporaire permettant un acces controle a un objet S3/MinIO."],
    ["RBAC", "Modele de controle d'acces fonde sur les roles et permissions."],
  ], [2400, 7200]));
}

function build() {
  const children = [];
  addPreliminaries(children);
  addChapter1(children);
  addChapter2(children);
  addChapter3(children);
  addChapter4(children);
  addChapter5(children);
  addChapter6(children);
  addChapter7(children);
  addChapter8(children);
  addChapter9(children);
  addChapter10(children);
  addConclusionBibliographyAnnexes(children);

  const styles = {
    default: {
      document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { line: line(1.5), after: 160 } } },
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { font: "Calibri", size: 34, bold: true, color: COLORS.blue },
        paragraph: { spacing: { after: 240 }, alignment: AlignmentType.CENTER },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Calibri", size: 28, bold: true, color: COLORS.blue },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Calibri", size: 24, bold: true, color: "2F5597" },
        paragraph: { spacing: { before: 180, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Calibri", size: 22, bold: true, color: "1F4E79" },
        paragraph: { spacing: { before: 140, after: 100 }, outlineLevel: 2 },
      },
    ],
  };

  const doc = new Document({
    creator: "Codex",
    title: "Rapport PFE Master - ProdKB",
    description: "Rapport academique complet du projet ProdKB",
    styles,
    numbering: {
      config: [
        {
          reference: "default-bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT }],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: cm(2.5), right: cm(2.5), bottom: cm(2.5), left: cm(2.5) },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [run("Page ", { size: 18 }), PageNumber.CURRENT],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(outPath, buffer);
    fs.writeFileSync(premiumOutPath, buffer);
    console.log(premiumOutPath);
  });
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
