const pptxgen = require('pptxgenjs');
const fs = require('fs');

// Initialiser la présentation
let pptx = new pptxgen();

// Configuration globale du format (16:9)
pptx.layout = 'LAYOUT_16x9';

// Définir les couleurs de la charte graphique
const COLORS = {
  bgLight: 'F8FAFC',    // Slate 50 (Arrière-plan clair et moderne)
  primary: '1E3A8A',    // Deep Blue / Navy (Titres principaux)
  secondary: '0EA5E9',  // Cyan (Accentuation, boutons)
  accent: 'F43F5E',     // Rose/Red (Alertes, incidents)
  textDark: '0F172A',   // Slate 900 (Texte principal)
  textMuted: '475569',  // Slate 600 (Texte secondaire)
  cardBg: 'FFFFFF',     // Blanc pour les cartes de contenu
  white: 'FFFFFF',
  darkBg: '0F172A'      // Slate 900 pour la page de garde / conclusion
};

// Fonction utilitaire pour configurer le fond
function setSlideBackground(slide, color) {
  slide.background = { color: color };
}

// Fonction utilitaire pour ajouter un en-tête de slide standard
function addSlideHeader(slide, title, category = "ProdKB — Soutenance de Master") {
  // Bandeau supérieur
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 0.8,
    fill: { color: COLORS.primary }
  });
  
  // Titre du slide
  slide.addText(title.toUpperCase(), {
    x: 0.5, y: 0.15, w: 9, h: 0.5,
    fontSize: 20, bold: true, color: COLORS.white,
    fontFace: 'Calibri'
  });
  
  // Catégorie / Fil d'Ariane à droite
  slide.addText(category, {
    x: 9.5, y: 0.25, w: 3.3, h: 0.4,
    fontSize: 11, italic: true, color: COLORS.secondary,
    align: 'right', fontFace: 'Calibri'
  });

  // Ligne de séparation
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0.8, w: '100%', h: 0.05,
    fill: { color: COLORS.secondary }
  });

  // Footer discret
  slide.addText("Master Ingénierie Logicielle | Université", {
    x: 0.5, y: 7.1, w: 6, h: 0.3,
    fontSize: 9, color: COLORS.textMuted,
    fontFace: 'Calibri'
  });

  slide.addText("Page [slideNum]", {
    x: 11.5, y: 7.1, w: 1.3, h: 0.3,
    fontSize: 9, color: COLORS.textMuted,
    align: 'right', fontFace: 'Calibri'
  });
}

// ==========================================
// SLIDE 1 : PAGE DE GARDE (Dark Theme)
// ==========================================
let slide1 = pptx.addSlide();
setSlideBackground(slide1, COLORS.darkBg);

// Forme géométrique décorative (diagonale d'accentuation)
slide1.addShape(pptx.shapes.RIGHT_TRIANGLE, {
  x: 8.5, y: 0, w: 4.8, h: 7.5,
  fill: { color: COLORS.primary },
  flipH: true
});

slide1.addText("PRODKB", {
  x: 0.8, y: 1.5, w: 8, h: 0.9,
  fontSize: 48, bold: true, color: COLORS.secondary,
  fontFace: 'Calibri'
});

slide1.addText("Plateforme Innovante de Gestion des Incidents IT\net de War Room Collaboratif en Temps Réel", {
  x: 0.8, y: 2.5, w: 8, h: 1.0,
  fontSize: 20, color: COLORS.white,
  fontFace: 'Calibri', bold: true
});

slide1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.8, y: 3.7, w: 2.5, h: 0.06,
  fill: { color: COLORS.secondary }
});

slide1.addText("Soutenance de Projet de Fin d'Études — Master Sciences et Technologies\nSpécialité : Ingénierie Logicielle et Systèmes Distribués", {
  x: 0.8, y: 4.0, w: 8, h: 0.8,
  fontSize: 13, italic: true, color: COLORS.bgLight,
  fontFace: 'Calibri'
});

slide1.addText("Présenté par : [Nom de l'Étudiant]\nSous la direction de : [Nom de l'Encadrant]\nAnnée Universitaire : 2025 - 2026", {
  x: 0.8, y: 5.2, w: 6, h: 1.2,
  fontSize: 12, color: COLORS.bgLight,
  fontFace: 'Calibri', lineSpacing: 18
});


// ==========================================
// SLIDE 2 : SOMMAIRE / AGENDA
// ==========================================
let slide2 = pptx.addSlide();
setSlideBackground(slide2, COLORS.bgLight);
addSlideHeader(slide2, "Sommaire Général de la Présentation");

const summaryItems = [
  { num: "01", title: "Introduction & Contexte", desc: "Problématique et objectifs du projet" },
  { num: "02", title: "Cahier des Charges", desc: "Analyse des besoins et contraintes" },
  { num: "03", title: "Modélisation Conceptuelle", desc: "UML, MERISE et architecture de données" },
  { num: "04", title: "Architecture Technique", desc: "DDD, Monolithe modulaire et WebSockets" },
  { num: "05", title: "Déploiement & DevOps", desc: "Hébergement AWS, Docker, Observabilité" },
  { num: "06", title: "Bilan & Perspectives", desc: "Résultats, retours d'expérience et évolutions" }
];

summaryItems.forEach((item, index) => {
  let col = index % 2;
  let row = Math.floor(index / 2);
  let posX = 0.8 + (col * 5.8);
  let posY = 1.6 + (row * 1.7);

  // Box
  slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: posY, w: 5.4, h: 1.3,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1.5 }
  });

  // Badge numéro
  slide2.addText(item.num, {
    x: posX + 0.2, y: posY + 0.2, w: 0.8, h: 0.8,
    fontSize: 24, bold: true, color: COLORS.secondary,
    align: 'center', fontFace: 'Calibri'
  });

  // Titre et Description
  slide2.addText(item.title, {
    x: posX + 1.1, y: posY + 0.2, w: 4.0, h: 0.4,
    fontSize: 15, bold: true, color: COLORS.primary,
    fontFace: 'Calibri'
  });

  slide2.addText(item.desc, {
    x: posX + 1.1, y: posY + 0.6, w: 4.0, h: 0.5,
    fontSize: 11, color: COLORS.textMuted,
    fontFace: 'Calibri'
  });
});


// ==========================================
// SLIDE 3 : INTRODUCTION & CONTEXTE
// ==========================================
let slide3 = pptx.addSlide();
setSlideBackground(slide3, COLORS.bgLight);
addSlideHeader(slide3, "1. Introduction : Contexte & Problématique", "Introduction");

// Bloc Gauche: Contexte
slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.5, w: 5.4, h: 5.2,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1 }
});
slide3.addText("LE CONTEXTE IT ACTUEL", {
  x: 1.0, y: 1.7, w: 5.0, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});
slide3.addText([
  { text: "• Complexité croissante des architectures microservices et cloud.\n", options: { fontSize: 13 } },
  { text: "• Coût prohibitif de l'indisponibilité des services (jusqu'à $5600/minute).\n", options: { fontSize: 13 } },
  { text: "• Besoin crucial d'alignement rapide entre équipes techniques.\n", options: { fontSize: 13 } },
  { text: "• Nécessité de centraliser les métriques d'incident et la communication.", options: { fontSize: 13 } }
], {
  x: 1.0, y: 2.3, w: 5.0, h: 4.0,
  color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 24
});

// Bloc Droit: Problématique
slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.5, w: 5.4, h: 5.2,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.accent, width: 1.5 }
});
slide3.addText("LES LIMITES DES OUTILS ACTUELS", {
  x: 7.0, y: 1.7, w: 5.0, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.accent, fontFace: 'Calibri'
});
slide3.addText([
  { text: "• Cloisonnement des outils : Slack (chat), Jira (tickets), Datadog (monitoring).\n\n", options: { fontSize: 13 } },
  { text: "• Retard de communication : Pas de War Room intégrée nativement aux fiches d'incidents.\n\n", options: { fontSize: 13 } },
  { text: "• Coûts élevés : Licences PagerDuty et Opsgenie prohibitives pour les PME/ETI.\n\n", options: { fontSize: 13 } },
  { text: "• Souveraineté des données : Données d'incidents critiques hébergées chez des tiers.", options: { fontSize: 13 } }
], {
  x: 7.0, y: 2.3, w: 5.0, h: 4.0,
  color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 20
});


// ==========================================
// SLIDE 4 : OBJECTIFS DU PROJET PRODKB
// ==========================================
let slide4 = pptx.addSlide();
setSlideBackground(slide4, COLORS.bgLight);
addSlideHeader(slide4, "2. Objectifs : La Solution ProdKB", "Introduction");

const goals = [
  { title: "War Room collaborative", icon: "💬", desc: "Canal de communication temps réel (WebSockets) dédié par incident pour une résolution ultrarapide." },
  { title: "Moteur de SLA dynamique", icon: "⏱️", desc: "Escalades automatiques via files de tâches asynchrones (BullMQ/Redis) pour garantir les engagements." },
  { title: "Observabilité centralisée", icon: "📊", desc: "Widgets intégrés affichant la santé système (Prometheus, Grafana, Loki) sans changer d'outil." },
  { title: "Souveraineté & Extensibilité", icon: "🛡️", desc: "Déploiement sur infrastructure autonome avec stockage compatible S3 (MinIO) totalement maîtrisé." }
];

goals.forEach((goal, i) => {
  let posX = 0.8 + (i * 2.9);
  slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: 1.8, w: 2.7, h: 4.8,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.secondary, width: 1.5 }
  });

  slide4.addText(goal.icon, {
    x: posX + 0.2, y: 2.1, w: 2.3, h: 0.6,
    fontSize: 28, align: 'center'
  });

  slide4.addText(goal.title, {
    x: posX + 0.1, y: 2.8, w: 2.5, h: 0.8,
    fontSize: 14, bold: true, color: COLORS.primary, align: 'center', fontFace: 'Calibri'
  });

  slide4.addText(goal.desc, {
    x: posX + 0.15, y: 3.7, w: 2.4, h: 2.7,
    fontSize: 11, color: COLORS.textDark, align: 'center', fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 5 : CAHIER DES CHARGES
// ==========================================
let slide5 = pptx.addSlide();
setSlideBackground(slide5, COLORS.bgLight);
addSlideHeader(slide5, "3. Cahier des Charges & Acteurs du Système", "Cahier des Charges");

// Acteurs
slide5.addText("ACTEURS PRINCIPAUX", {
  x: 0.8, y: 1.4, w: 5.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const actors = [
  { name: "Administrateur", role: "Gestion des accès RBAC, configuration globale des SLAs, des webhooks et intégrations." },
  { name: "Technicien", role: "Prise en charge des incidents, participation aux War Rooms, rédaction des post-mortems." },
  { name: "Manager / Pilote", role: "Supervision globale, suivi des métriques clés (MTTR, respect de la SLA) via Dashboards." }
];

actors.forEach((act, idx) => {
  let posY = 1.9 + (idx * 1.0);
  slide5.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: posY, w: 5.4, h: 0.9,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.secondary, width: 1 }
  });
  slide5.addText(act.name, {
    x: 1.0, y: posY + 0.1, w: 5.0, h: 0.3,
    fontSize: 13, bold: true, color: COLORS.primary, fontFace: 'Calibri'
  });
  slide5.addText(act.role, {
    x: 1.0, y: posY + 0.4, w: 5.0, h: 0.4,
    fontSize: 10.5, color: COLORS.textMuted, fontFace: 'Calibri'
  });
});

// Besoins non-fonctionnels
slide5.addText("BESOINS NON-FONCTIONNELS CLÉS", {
  x: 6.8, y: 1.4, w: 5.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const nonFuncs = [
  { label: "Performance", val: "Temps de latence WebSockets < 100ms pour assurer l'instantanéité de la War Room." },
  { label: "Haute Disponibilité", val: "Objectif de 99.9% de disponibilité avec redondance des processus et auto-healing." },
  { label: "Sécurité & Audit", val: "Chiffrement des sessions via JWT avec rotation active, et logs d'audit non-modifiables." },
  { label: "Scalabilité", val: "Architecture asynchrone découplée par des workers autonomes gérés par BullMQ." }
];

nonFuncs.forEach((nf, idx) => {
  let posY = 1.9 + (idx * 1.2);
  slide5.addShape(pptx.shapes.RECTANGLE, {
    x: 6.8, y: posY, w: 5.4, h: 1.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1 }
  });
  slide5.addText(nf.label, {
    x: 7.0, y: posY + 0.1, w: 5.0, h: 0.3,
    fontSize: 13, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
  });
  slide5.addText(nf.val, {
    x: 7.0, y: posY + 0.4, w: 5.0, h: 0.6,
    fontSize: 10.5, color: COLORS.textDark, fontFace: 'Calibri'
  });
});


// ==========================================
// SLIDE 6 : MODÉLISATION UML - CAS D'UTILISATION
// ==========================================
let slide6 = pptx.addSlide();
setSlideBackground(slide6, COLORS.bgLight);
addSlideHeader(slide6, "4. Modélisation UML : Cas d'Utilisation", "Modélisation UML");

slide6.addText("ARCHITECTURE DES CAS D'UTILISATION", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Tableau structuré à la place de l'image pour un rendu ultra-pro
slide6.addTable([
  [
    { text: "Acteur", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Cas d'Utilisation Majeurs", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Règles métier & Dépendances", options: { bold: true, fill: COLORS.primary, color: COLORS.white } }
  ],
  [
    { text: "Technicien", options: { bold: true } },
    { text: "Créer un ticket incident, rejoindre la War Room WebSocket, uploader des logs, marquer un incident résolu." },
    { text: "Accès limité aux incidents de son équipe ou assignés directement." }
  ],
  [
    { text: "Administrateur", options: { bold: true } },
    { text: "Définir les règles de SLA, configurer les alertes emails/webhooks, gérer le planning d'astreinte des équipes." },
    { text: "Possède tous les droits de modification globale du système (RBAC)." }
  ],
  [
    { text: "Manager / Pilote", options: { bold: true } },
    { text: "Consulter le dashboard analytique (KPIs), exporter les rapports d'incidents (CSV/PDF)." },
    { text: "Accès en lecture seule sur la configuration de l'infrastructure." }
  ],
  [
    { text: "Système (BullMQ Workers)", options: { bold: true } },
    { text: "Calculer les expirations de SLA, envoyer les notifications emails en tâche de fond, pousser les webhooks externes." },
    { text: "Exécution asynchrone non-bloquante pour l'interface." }
  ]
], {
  x: 0.8, y: 2.0, w: 11.4, h: 4.8,
  fontSize: 11, fontFace: 'Calibri',
  border: { type: 'solid', color: COLORS.primary, width: 1 }
});


// ==========================================
// SLIDE 7 : DIAGRAMME DE CLASSES UML
// ==========================================
let slide7 = pptx.addSlide();
setSlideBackground(slide7, COLORS.bgLight);
addSlideHeader(slide7, "5. Modélisation : Modèle de Données (UML / MCD)", "Modélisation UML");

slide7.addText("ENTITÉS CRITIQUES DU DOMAINE DE SÉCURITÉ ET DE GESTION", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Colonne 1 : Entités de Base
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.9, w: 3.6, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1.5 }
});
slide7.addText("GESTION INCIDENTS", {
  x: 1.0, y: 2.1, w: 3.2, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});
slide7.addText([
  { text: "• Incident : identifiant, titre, sévérité (CRITICAL, HIGH, MEDIUM, LOW), état (OPEN, INVESTIGATING, RESOLVED, CLOSED).\n\n", options: { fontSize: 11 } },
  { text: "• Message : liaison 1-n avec Incident, contenu textuel, horodatage, utilisateur auteur.\n\n", options: { fontSize: 11 } },
  { text: "• Attachment : lien vers MinIO S3, taille, type mime.", options: { fontSize: 11 } }
], {
  x: 1.0, y: 2.6, w: 3.2, h: 3.9,
  fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri'
});

// Colonne 2 : SLAs & Astreintes
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 4.7, y: 1.9, w: 3.6, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.secondary, width: 1.5 }
});
slide7.addText("ASTREINTES & SLAs", {
  x: 4.9, y: 2.1, w: 3.2, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
});
slide7.addText([
  { text: "• SlaConfig : définition des délais de résolution cibles par niveau de sévérité.\n\n", options: { fontSize: 11 } },
  { text: "• Astreinte : planning hebdomadaire, technicien de garde assigné en cas d'alerte critique.\n\n", options: { fontSize: 11 } },
  { text: "• EscalationLog : historique des passages de niveaux d'alerte.", options: { fontSize: 11 } }
], {
  x: 4.9, y: 2.6, w: 3.2, h: 3.9,
  fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri'
});

// Colonne 3 : Audit & Authentification
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 8.6, y: 1.9, w: 3.6, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.accent, width: 1.5 }
});
slide7.addText("AUDIT & SÉCURITÉ", {
  x: 8.8, y: 2.1, w: 3.2, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri'
});
slide7.addText([
  { text: "• User : email haché (Bcrypt), nom, rôle (ADMIN, TECHNICIAN, MANAGER), active (booléen).\n\n", options: { fontSize: 11 } },
  { text: "• AuditLog : enregistrement de toutes les actions sensibles (action, IP, horodatage).\n\n", options: { fontSize: 11 } },
  { text: "• RefreshToken : jetons de session persistants cryptés.", options: { fontSize: 11 } }
], {
  x: 8.8, y: 2.6, w: 3.2, h: 3.9,
  fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri'
});


// ==========================================
// SLIDE 8 : UML - DIAGE DE SÉQUENCE AUTH
// ==========================================
let slide8 = pptx.addSlide();
setSlideBackground(slide8, COLORS.bgLight);
addSlideHeader(slide8, "6. Séquence : Authentification JWT Robuste", "Modélisation UML");

slide8.addText("FLUX D'AUTHENTIFICATION DOUBLE JETON (ACCESS + REFRESH)", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Étapes du flux
const stepsAuth = [
  { num: "1", title: "Soumission Credentials", desc: "Le client envoie ses identifiants (email, mdp) sous HTTPS au contrôleur d'authentification." },
  { num: "2", title: "Hachage & Comparaison", desc: "Le serveur interroge la base, récupère le hash Bcrypt et compare. Si OK, génère les jetons." },
  { num: "3", title: "Génération Double JWT", desc: "AccessToken (durée de vie courte : 15 min, en mémoire) + RefreshToken (durée : 7j, en cookie HttpOnly sécurisé)." },
  { num: "4", title: "Mécanisme de Refresh", desc: "À expiration du AccessToken, requête silencieuse en tâche de fond pour obtenir un nouveau token sans déconnecter l'utilisateur." }
];

stepsAuth.forEach((step, idx) => {
  let posY = 1.9 + (idx * 1.25);
  slide8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: posY, w: 11.4, h: 1.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1 }
  });
  
  // Badge
  slide8.addShape(pptx.shapes.OVAL, {
    x: 1.1, y: posY + 0.15, w: 0.8, h: 0.8,
    fill: { color: COLORS.primary }
  });
  slide8.addText(step.num, {
    x: 1.1, y: posY + 0.25, w: 0.8, h: 0.6,
    fontSize: 18, bold: true, color: COLORS.white, align: 'center', fontFace: 'Calibri'
  });

  slide8.addText(step.title.toUpperCase(), {
    x: 2.2, y: posY + 0.15, w: 9.0, h: 0.3,
    fontSize: 13, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
  });
  slide8.addText(step.desc, {
    x: 2.2, y: posY + 0.45, w: 9.5, h: 0.5,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri'
  });
});


// ==========================================
// SLIDE 9 : SÉQUENCE CRÉATION INCIDENT & SLA
// ==========================================
let slide9 = pptx.addSlide();
setSlideBackground(slide9, COLORS.bgLight);
addSlideHeader(slide9, "7. Séquence : Création d'Incident & SLA Engine", "Modélisation UML");

slide9.addText("TRAITEMENT ASYNCHRONE DE LA SLA (BULLMQ / REDIS)", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Flux diagram
const slaSteps = [
  { t: "1. CRÉATION", d: "Technicien / API alerte -> Insertion de l'incident en PostgreSQL avec statut 'OPEN'." },
  { t: "2. PLANIFICATION", d: "Le controlleur pousse un Job SLA dans Redis avec un délai correspondant au niveau critique." },
  { t: "3. SURVEILLANCE", d: "BullMQ worker récupère la tâche à l'échéance et teste si l'incident est toujours ouvert." },
  { t: "4. ESCALADE", d: "Si non résolu, le worker déclenche l'escalade (notification astreinte active + SMS/Email)." }
];

slaSteps.forEach((s, i) => {
  let posX = 0.8 + (i * 2.9);
  
  // Box
  slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: 2.0, w: 2.7, h: 4.6,
    fill: { color: COLORS.cardBg },
    line: { color: i === 3 ? COLORS.accent : COLORS.primary, width: i === 3 ? 2 : 1.2 }
  });

  // Titre box
  slide9.addShape(pptx.shapes.RECTANGLE, {
    x: posX, y: 2.0, w: 2.7, h: 0.6,
    fill: { color: i === 3 ? COLORS.accent : COLORS.primary }
  });
  slide9.addText(s.t, {
    x: posX + 0.1, y: 2.1, w: 2.5, h: 0.4,
    fontSize: 13, bold: true, color: COLORS.white, align: 'center', fontFace: 'Calibri'
  });

  slide9.addText(s.d, {
    x: posX + 0.15, y: 2.9, w: 2.4, h: 3.5,
    fontSize: 11.5, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 20
  });
});


// ==========================================
// SLIDE 10 : SÉQUENCE WAR ROOM TEMPS RÉEL (WebSocket)
// ==========================================
let slide10 = pptx.addSlide();
setSlideBackground(slide10, COLORS.bgLight);
addSlideHeader(slide10, "8. Séquence : Messagerie & War Room Temps Réel", "Modélisation UML");

slide10.addText("MUTIPLEXAGE DES CANAUX WEBSOCKETS (SOCKET.IO)", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Illustration du flux bidirectionnel
slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 2.0, w: 3.5, h: 4.5,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1.5 }
});
slide10.addText("CLIENT REACT\n(Frontend)", {
  x: 1.0, y: 2.3, w: 3.1, h: 0.8,
  fontSize: 18, bold: true, color: COLORS.primary, align: 'center', fontFace: 'Calibri'
});
slide10.addText("• Connexion Socket.io avec handshake JWT sécurisé.\n• Envoi d'événements : 'join-incident-room', 'new-message'.\n• Écoute et mise à jour de l'état UI en temps réel (< 50ms).", {
  x: 1.0, y: 3.3, w: 3.1, h: 3.0,
  fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
});

// Flèches bidirectionnelles au milieu
slide10.addShape(pptx.shapes.RIGHT_ARROW, {
  x: 4.6, y: 3.0, w: 1.2, h: 0.4, fill: { color: COLORS.secondary }
});
slide10.addShape(pptx.shapes.LEFT_ARROW, {
  x: 4.6, y: 4.2, w: 1.2, h: 0.4, fill: { color: COLORS.secondary }
});

slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.1, y: 2.0, w: 6.1, h: 4.5,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1.5 }
});
slide10.addText("SERVEUR NODE.JS / EXPRESS 5\n(Socket.io Server)", {
  x: 6.3, y: 2.3, w: 5.7, h: 0.8,
  fontSize: 18, bold: true, color: COLORS.primary, align: 'center', fontFace: 'Calibri'
});
slide10.addText("• Middleware d'authentification Socket.io (validation du JWT).\n• Dispatch des messages dans la 'Room ID' correspondante via redis-adapter.\n• Persistance en base PostgreSQL 16 (via Prisma ORM).\n• Déclenchement de webhooks externes (BullMQ).", {
  x: 6.3, y: 3.3, w: 5.7, h: 3.0,
  fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
});


// ==========================================
// SLIDE 11 : METHODE MERISE (MCD & MLD)
// ==========================================
let slide11 = pptx.addSlide();
setSlideBackground(slide11, COLORS.bgLight);
addSlideHeader(slide11, "9. Modélisation MERISE : Base de Données", "Modélisation MERISE");

slide11.addText("INTÉGRITÉ RÉFÉRENTIELLE ET NORMALISATION 3NF", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// MCD / MLD explications
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 2.0, w: 5.4, h: 4.5,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1 }
});
slide11.addText("RELATIONS CONCEPTUELLES (MCD)", {
  x: 1.0, y: 2.2, w: 5.0, h: 0.3,
  fontSize: 15, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});
slide11.addText([
  { text: "• UTILISATEUR crée INCIDENT ( cardinalité : 1..N / 1..1 )\n\n", options: { fontSize: 11.5 } },
  { text: "• INCIDENT engendre MESSAGES ( cardinalité : 1..N / 1..1 )\n\n", options: { fontSize: 11.5 } },
  { text: "• INCIDENT contient des FICHIERS ( cardinalité : 0..N / 1..1 )\n\n", options: { fontSize: 11.5 } },
  { text: "• UTILISATEUR assure PLANNING ( cardinalité : 0..N / 1..1 )\n\n", options: { fontSize: 11.5 } },
  { text: "• INCIDENT est régi par SLA_CONFIG ( cardinalité : 1..1 / 0..N )", options: { fontSize: 11.5 } }
], {
  x: 1.0, y: 2.7, w: 5.0, h: 3.5,
  color: COLORS.textDark, fontFace: 'Calibri'
});

slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 2.0, w: 5.4, h: 4.5,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.secondary, width: 1 }
});
slide11.addText("LOGIQUE DE TRANSFORMATION (MLD)", {
  x: 7.0, y: 2.2, w: 5.0, h: 0.3,
  fontSize: 15, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
});
slide11.addText([
  { text: "• Clefs Primaires Auto-incrémentées (UUID v4) pour tous les identifiants uniques.\n\n", options: { fontSize: 11 } },
  { text: "• Clefs Étrangères (FK) avec contraintes d'intégrité strictes :\n   - ON DELETE CASCADE sur messages lors de la suppression de l'incident.\n   - ON DELETE SET NULL sur les assignations d'astreintes.\n\n", options: { fontSize: 11 } },
  { text: "• Contraintes d'unicité (UNIQUE) sur le mail utilisateur.\n\n", options: { fontSize: 11 } },
  { text: "• Indexation PostgreSQL pour accélérer la recherche des incidents par état/sévérité.", options: { fontSize: 11 } }
], {
  x: 7.0, y: 2.7, w: 5.0, h: 3.5,
  color: COLORS.textDark, fontFace: 'Calibri'
});


// ==========================================
// SLIDE 12 : DICTIONNAIRE DE DONNÉES & MPD
// ==========================================
let slide12 = pptx.addSlide();
setSlideBackground(slide12, COLORS.bgLight);
addSlideHeader(slide12, "10. Modèle Physique : Dictionnaire de Données", "Modélisation MERISE");

slide12.addText("STRUCTURE PHYSIQUE DES PRINCIPALES TABLES POSTGRESQL", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Tableau physique
slide12.addTable([
  [
    { text: "Champ SQL", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Type SQL", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Contrainte", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Description Métier", options: { bold: true, fill: COLORS.primary, color: COLORS.white } }
  ],
  [
    { text: "id", options: { bold: true } },
    { text: "UUID (v4)" },
    { text: "PRIMARY KEY" },
    { text: "Identifiant unique universel" }
  ],
  [
    { text: "status", options: { bold: true } },
    { text: "VARCHAR(24)" },
    { text: "NOT NULL, DEFAULT 'OPEN'" },
    { text: "État de l'incident (OPEN, INVESTIGATING, etc.)" }
  ],
  [
    { text: "severity", options: { bold: true } },
    { text: "VARCHAR(12)" },
    { text: "NOT NULL" },
    { text: "Gravité (CRITICAL, HIGH, MEDIUM, LOW)" }
  ],
  [
    { text: "creator_id", options: { bold: true } },
    { text: "UUID" },
    { text: "FOREIGN KEY REFERENCES Users" },
    { text: "Auteur ayant ouvert le ticket" }
  ],
  [
    { text: "sla_deadline", options: { bold: true } },
    { text: "TIMESTAMP" },
    { text: "NULLABLE" },
    { text: "Date limite ciblée avant escalade" }
  ],
  [
    { text: "created_at", options: { bold: true } },
    { text: "TIMESTAMP" },
    { text: "NOT NULL, DEFAULT NOW()" },
    { text: "Date exacte de déclaration de l'incident" }
  ]
], {
  x: 0.8, y: 1.9, w: 11.4, h: 4.8,
  fontSize: 11, fontFace: 'Calibri',
  border: { type: 'solid', color: COLORS.primary, width: 1 }
});


// ==========================================
// SLIDE 13 : ARCHITECTURE TECHNIQUE GLOBALE
// ==========================================
let slide13 = pptx.addSlide();
setSlideBackground(slide13, COLORS.bgLight);
addSlideHeader(slide13, "11. Architecture Globale : Monolithe Modulaire", "Architecture");

slide13.addText("CLEAN ARCHITECTURE & PRÉPARATION DE LA MICROSERVICISATION", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Les 3 modules isolés du backend
const modules = [
  { t: "MODULE COLLABORATION", c: COLORS.primary, d: "Messagerie WebSockets Socket.io.\nMultiplexage des salons par incident.\nGestion des transferts sécurisés MinIO S3." },
  { t: "MODULE SLA ENGINE", c: COLORS.secondary, d: "Gestion des files asynchrones BullMQ.\nRedis persistant pour les plannings.\nSurveillance continue du MTTR." },
  { t: "MODULE OBSERVABILITÉ", c: COLORS.accent, d: "Collecte des métriques Prometheus.\nExportation des logs centralisés Promtail.\nDashboards Grafana embarqués." }
];

modules.forEach((mod, idx) => {
  let posX = 0.8 + (idx * 3.9);
  
  slide13.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: 2.0, w: 3.6, h: 4.6,
    fill: { color: COLORS.cardBg },
    line: { color: mod.c, width: 2 }
  });

  slide13.addText(mod.t, {
    x: posX + 0.1, y: 2.3, w: 3.4, h: 0.5,
    fontSize: 14, bold: true, color: mod.c, align: 'center', fontFace: 'Calibri'
  });

  slide13.addShape(pptx.shapes.RECTANGLE, {
    x: posX + 0.5, y: 3.0, w: 2.6, h: 0.05,
    fill: { color: COLORS.bgLight }
  });

  slide13.addText(mod.d, {
    x: posX + 0.2, y: 3.3, w: 3.2, h: 3.0,
    fontSize: 11.5, color: COLORS.textDark, align: 'center', fontFace: 'Calibri', lineSpacing: 24
  });
});


// ==========================================
// SLIDE 14 : STACK TECHNIQUE - FRONTEND SPA
// ==========================================
let slide14 = pptx.addSlide();
setSlideBackground(slide14, COLORS.bgLight);
addSlideHeader(slide14, "12. Stack Technique : Le Frontend React Modern", "Architecture");

// Technologies
slide14.addText("COMPOSANTS CLÉS DU FRONTEND SPA", {
  x: 0.8, y: 1.4, w: 5.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const frontTechs = [
  { name: "React 18 & Vite", desc: "Performance optimale grâce à Vite (HMR ultra-rapide) et gestion avancée de l'arbre DOM virtuel de React." },
  { name: "TailwindCSS & Component Design", desc: "Design système unifié, responsive, avec un style premium épuré sans ralentir le chargement." },
  { name: "Zod & React Hook Form", desc: "Validation stricte des schémas d'input côté client garantissant la robustesse des données soumises." },
  { name: "Recharts & Dataviz", desc: "Intégration de graphiques dynamiques pour le calcul en temps réel du MTTR et l'historique des SLAs." }
];

frontTechs.forEach((ft, i) => {
  let posY = 1.9 + (i * 1.2);
  slide14.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: posY, w: 5.4, h: 1.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1 }
  });
  slide14.addText(ft.name, {
    x: 1.0, y: posY + 0.1, w: 5.0, h: 0.3,
    fontSize: 12, bold: true, color: COLORS.primary, fontFace: 'Calibri'
  });
  slide14.addText(ft.desc, {
    x: 1.0, y: posY + 0.4, w: 5.0, h: 0.6,
    fontSize: 10, color: COLORS.textDark, fontFace: 'Calibri'
  });
});

// Choix techniques
slide14.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.9, w: 5.4, h: 4.6,
  fill: { color: COLORS.primary }
});

slide14.addText("POURQUOI UNE ARCHITECTURE SPA ?", {
  x: 7.0, y: 2.2, w: 5.0, h: 0.5,
  fontSize: 16, bold: true, color: COLORS.white, fontFace: 'Calibri'
});

slide14.addText([
  { text: "1. EXPÉRIENCE WAR ROOM FLUIDE\nAucun rechargement de page lors des transitions de chat ou d'affichage de métriques système.\n\n", options: { color: COLORS.white, fontSize: 11 } },
  { text: "2. RENDU TRÈS RAPIDE\nLe navigateur gère le routage et le rendu des vues, soulageant ainsi le serveur applicatif.\n\n", options: { color: COLORS.white, fontSize: 11 } },
  { text: "3. COMPILATION TYPE SAFE (TYPESCRIPT)\nDétection précoce des bugs lors du build grâce au typage fort de bout en bout.", options: { color: COLORS.white, fontSize: 11 } }
], {
  x: 7.0, y: 2.9, w: 5.0, h: 3.3,
  fontFace: 'Calibri'
});


// ==========================================
// SLIDE 15 : STACK TECHNIQUE - BACKEND Node.js & BullMQ
// ==========================================
let slide15 = pptx.addSlide();
setSlideBackground(slide15, COLORS.bgLight);
addSlideHeader(slide15, "13. Stack Technique : Le Backend Robuste & Asynchrone", "Architecture");

// Node/Express
slide15.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.8, w: 5.4, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1.5 }
});

slide15.addText("MONOLITHE EXPRESS 5 & PRISMA", {
  x: 1.1, y: 2.1, w: 4.8, h: 0.4,
  fontSize: 15, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

slide15.addText([
  { text: "• Node.js 20 LTS : Performances de premier ordre avec le moteur V8.\n\n", options: { fontSize: 11.5 } },
  { text: "• Express 5 : Gestion optimale des middlewares asynchrones et des promesses.\n\n", options: { fontSize: 11.5 } },
  { text: "• Prisma ORM : Générateur de clients TypeScript typés à 100%, gestion fluide des migrations SQL complexes.\n\n", options: { fontSize: 11.5 } },
  { text: "• Middlewares sécurité : Winston (logger), Helmet (en-têtes HTTP) et express-rate-limit.", options: { fontSize: 11.5 } }
], {
  x: 1.1, y: 2.6, w: 4.8, h: 3.8,
  color: COLORS.textDark, fontFace: 'Calibri'
});

// BullMQ
slide15.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.8, w: 5.4, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.secondary, width: 1.5 }
});

slide15.addText("MOTEUR ASYNCHRONE BULLMQ / REDIS", {
  x: 7.0, y: 2.1, w: 4.8, h: 0.4,
  fontSize: 15, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
});

slide15.addText([
  { text: "• Découplage Applicatif : Les tâches lourdes ou planifiées sont envoyées dans Redis.\n\n", options: { fontSize: 11.5 } },
  { text: "• Workers Autonomes :\n  - sla-worker : Surveillance et exécution des alertes.\n  - email-worker : Envoi d'emails transactionnels.\n  - webhook-worker : Requêtes POST sortantes.\n\n", options: { fontSize: 11.5 } },
  { text: "• Robustesse : Gestion automatique des tentatives en cas d'erreur (retries), tolérance aux pannes.", options: { fontSize: 11.5 } }
], {
  x: 7.0, y: 2.6, w: 4.8, h: 3.8,
  color: COLORS.textDark, fontFace: 'Calibri'
});


// ==========================================
// SLIDE 16 : BASE DE DONNÉES & STOCKAGE
// ==========================================
let slide16 = pptx.addSlide();
setSlideBackground(slide16, COLORS.bgLight);
addSlideHeader(slide16, "14. Stockage : PostgreSQL, Redis & MinIO (S3)", "Architecture");

const storages = [
  {
    name: "POSTGRESQL 16 & PGBOUNCER",
    c: COLORS.primary,
    d: "• Base de données relationnelle principale (ACID).\n• PgBouncer gère le pool de connexions (pooling) pour supporter les pointes d'activité (scalabilité).\n• Contraintes d'intégrité référentielle strictes."
  },
  {
    name: "REDIS 7 CACHE & MESSAGES",
    c: COLORS.secondary,
    d: "• Stockage clé-valeur ultra-rapide en mémoire.\n• File d'attente pour BullMQ.\n• Cache applicatif (plannings d'astreintes) pour soulager la base relationnelle.\n• Redis adapter pour le clustering Socket.io."
  },
  {
    name: "MINIO STOCKAGE COMPATIBLE S3",
    c: COLORS.accent,
    d: "• Système de stockage d'objets auto-hébergé.\n• Reste compatible API AWS S3 (facilité de migration cloud).\n• Stockage sécurisé des pièces jointes de la War Room.\n• Génération d'URLs pré-signées sécurisées."
  }
];

storages.forEach((st, i) => {
  let posX = 0.8 + (i * 3.9);
  slide16.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: 1.8, w: 3.6, h: 4.8,
    fill: { color: COLORS.cardBg },
    line: { color: st.c, width: 2 }
  });

  slide16.addText(st.name, {
    x: posX + 0.1, y: 2.1, w: 3.4, h: 0.5,
    fontSize: 13, bold: true, color: st.c, align: 'center', fontFace: 'Calibri'
  });

  slide16.addText(st.d, {
    x: posX + 0.2, y: 2.8, w: 3.2, h: 3.6,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 20
  });
});


// ==========================================
// SLIDE 17 : SÉCURITÉ APPLICATIVE
// ==========================================
let slide17 = pptx.addSlide();
setSlideBackground(slide17, COLORS.bgLight);
addSlideHeader(slide17, "15. Sécurité Applicative : Normes Industrielles", "Architecture");

slide17.addText("CONCEPTION DE LA SÉCURITÉ PAR CONCEPTION (SECURITY BY DESIGN)", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const secItems = [
  { title: "Double Jeton JWT", desc: "AccessToken de 15 minutes en mémoire RAM + RefreshToken de 7 jours chiffré dans un cookie sécurisé (HttpOnly, Secure, SameSite=Strict) pour neutraliser les failles XSS." },
  { title: "Bcrypt & Hachage", desc: "Hachage robuste et irréversible (sel à 12 passes) des mots de passe en base de données, empêchant toute lecture en clair en cas de fuite de la base." },
  { title: "Helmet & En-têtes HTTP", desc: "Middleware configurant 15 en-têtes HTTP de sécurité pour atténuer les vulnérabilités de type Clickjacking, Cross-Site Scripting (XSS) et MIME-sniffing." },
  { title: "CORS & Rate-Limiting", desc: "Politique d'accès cross-origin restrictive couplée à un limiteur de requêtes Redis bloquant les attaques bruteforce et le flood de l'API." }
];

secItems.forEach((sec, idx) => {
  let col = idx % 2;
  let row = Math.floor(idx / 2);
  let posX = 0.8 + (col * 5.8);
  let posY = 1.9 + (row * 2.3);

  slide17.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: posY, w: 5.4, h: 2.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.accent, width: 1 }
  });

  slide17.addText(sec.title.toUpperCase(), {
    x: posX + 0.2, y: posY + 0.15, w: 5.0, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri'
  });

  slide17.addText(sec.desc, {
    x: posX + 0.2, y: posY + 0.55, w: 5.0, h: 1.4,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 18 : DEVOPS & CONTENEURISATION
// ==========================================
let slide18 = pptx.addSlide();
setSlideBackground(slide18, COLORS.bgLight);
addSlideHeader(slide18, "16. DevOps : Docker & Containerisation", "DevOps & Déploiement");

slide18.addText("ISO-FONCTIONNALITÉ DU DÉVELOPPEMENT JUSQU'À LA PRODUCTION", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Tableau descriptif du Docker Compose
slide18.addTable([
  [
    { text: "Service", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Conteneur Image", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Réseaux d'Isolation (Docker Network)", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Rôle de l'Infrastructure", options: { bold: true, fill: COLORS.primary, color: COLORS.white } }
  ],
  [
    { text: "frontend", options: { bold: true } },
    { text: "node:20-alpine (Multi-stage build / Nginx Dist)" },
    { text: "frontend-net" },
    { text: "Hébergement de l'application Single Page Application React." }
  ],
  [
    { text: "api", options: { bold: true } },
    { text: "node:20-alpine" },
    { text: "frontend-net, backend-net, database-net" },
    { text: "Monolithe Express central servant les requêtes REST de l'API." }
  ],
  [
    { text: "workers", options: { bold: true } },
    { text: "node:20-alpine" },
    { text: "backend-net, database-net" },
    { text: "Processus d'arrière-plan traitant les files asynchrones BullMQ." }
  ],
  [
    { text: "postgres / pgbouncer", options: { bold: true } },
    { text: "postgres:16-alpine / edoburu/pgbouncer" },
    { text: "database-net" },
    { text: "Stockage relationnel persistant + pooler de connexion." }
  ],
  [
    { text: "minio", options: { bold: true } },
    { text: "minio/minio" },
    { text: "backend-net, database-net" },
    { text: "Stockage d'objets local simulant S3 pour les pièces jointes." }
  ]
], {
  x: 0.8, y: 2.0, w: 11.4, h: 4.8,
  fontSize: 10.5, fontFace: 'Calibri',
  border: { type: 'solid', color: COLORS.primary, width: 1 }
});


// ==========================================
// SLIDE 19 : INFRASTRUCTURE DE PRODUCTION AWS & NGINX
// ==========================================
let slide19 = pptx.addSlide();
setSlideBackground(slide19, COLORS.bgLight);
addSlideHeader(slide19, "17. Production : AWS EC2 & Reverse Proxy Nginx", "DevOps & Déploiement");

slide19.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.8, w: 5.4, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1.5 }
});

slide19.addText("HÉBERGEMENT AWS EC2", {
  x: 1.1, y: 2.1, w: 4.8, h: 0.4,
  fontSize: 15, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

slide19.addText([
  { text: "• Instance EC2 : Ubuntu Server 22.04 LTS.\n\n", options: { fontSize: 11.5 } },
  { text: "• Sécurité réseau : Groupes de sécurité restreignant les flux (uniquement ports 80, 443 pour le trafic public et 22 pour le SSH d'administration).\n\n", options: { fontSize: 11.5 } },
  { text: "• Volumes de stockage : SSD EBS avec sauvegardes planifiées automatiques de l'état des conteneurs.\n\n", options: { fontSize: 11.5 } },
  { text: "• Résilience globale : Redémarrage automatique des conteneurs via Docker (restart: always).", options: { fontSize: 11.5 } }
], {
  x: 1.1, y: 2.6, w: 4.8, h: 3.8,
  color: COLORS.textDark, fontFace: 'Calibri'
});

slide19.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.8, w: 5.4, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.secondary, width: 1.5 }
});

slide19.addText("CONFIGURATION NGINX & SSL", {
  x: 7.0, y: 2.1, w: 4.8, h: 0.4,
  fontSize: 15, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
});

slide19.addText([
  { text: "• Reverse Proxy Centralisé : Nginx redirige le trafic internet vers les conteneurs internes appropriés (frontend ou api).\n\n", options: { fontSize: 11.5 } },
  { text: "• Chiffrement HTTPS : Certification SSL/TLS émise par Let's Encrypt.\n\n", options: { fontSize: 11.5 } },
  { text: "• Certbot automatisé : Cron job configuré pour le renouvellement mensuel transparent des certificats SSL.\n\n", options: { fontSize: 11.5 } },
  { text: "• Performances Nginx : Activation de gzip pour la compression des actifs statiques et buffers optimisés.", options: { fontSize: 11.5 } }
], {
  x: 7.0, y: 2.6, w: 4.8, h: 3.8,
  color: COLORS.textDark, fontFace: 'Calibri'
});


// ==========================================
// SLIDE 20 : OBSERVABILITÉ COMPLÈTE
// ==========================================
let slide20 = pptx.addSlide();
setSlideBackground(slide20, COLORS.bgLight);
addSlideHeader(slide20, "18. Observabilité : Prometheus, Loki & Grafana", "DevOps & Déploiement");

slide20.addText("LA SOUVERAINETÉ DE LA SURVEILLANCE SYSTÈME", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const monitoringCols = [
  {
    title: "METRIQUES SYSTEME (Prometheus)",
    desc: "• Collecte en continu les ressources CPU, RAM et le statut des conteneurs.\n• Récupère les métriques internes de Node.js via des sondes personnalisées.\n• Alerting en temps réel configurable."
  },
  {
    title: "JOURNALISATION CENTRALISÉE (Loki)",
    desc: "• Loki agrège les flux de logs envoyés par les agents Promtail installés sur chaque conteneur.\n• Recherche rapide et requêtes avec syntaxe LogQL.\n• Évite d'avoir à se connecter en SSH aux serveurs."
  },
  {
    title: "TABLEAUX DE BORD (Grafana)",
    desc: "• Visualisation intuitive et consolidée des logs et des métriques.\n• Dashboard technique embarqué dans le panel administrateur de ProdKB.\n• Simplification extrême de l'analyse post-mortem."
  }
];

monitoringCols.forEach((col, idx) => {
  let posX = 0.8 + (idx * 3.9);
  slide20.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: 1.8, w: 3.6, h: 4.8,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1.5 }
  });

  slide20.addText(col.title, {
    x: posX + 0.1, y: 2.1, w: 3.4, h: 0.5,
    fontSize: 13, bold: true, color: COLORS.primary, align: 'center', fontFace: 'Calibri'
  });

  slide20.addText(col.desc, {
    x: posX + 0.2, y: 2.8, w: 3.2, h: 3.6,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 20
  });
});


// ==========================================
// SLIDE 21 : STRATÉGIE DE TESTS & QUALITÉ
// ==========================================
let slide21 = pptx.addSlide();
setSlideBackground(slide21, COLORS.bgLight);
addSlideHeader(slide21, "19. Qualité : Stratégie de Tests Complète", "Qualité & Tests");

slide21.addText("PYRAMIDE DES TESTS APPLIQUÉE À LA PLATEFORME", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const testPyramid = [
  { t: "1. TESTS UNITAIRES (Jest)", d: "Validation des Use Cases isolés du backend (validation d'identité, calcul de la SLA) et des fonctions purement logiques du frontend. Couverture > 85%." },
  { t: "2. TESTS D'INTÉGRATION (Supertest)", d: "Tests des endpoints HTTP Express en mode isolé. Simule les requêtes clients et vérifie la conformité des payloads retournés et les codes de statut HTTP." },
  { t: "3. TESTS END-TO-END (Playwright)", d: "Simulation complète des parcours utilisateurs dans un vrai navigateur (connexion -> déclaration incident -> collaboration WebSocket en War Room)." }
];

testPyramid.forEach((tp, i) => {
  let posY = 1.9 + (i * 1.65);
  slide21.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: posY, w: 11.4, h: 1.5,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1 }
  });

  slide21.addText(tp.t, {
    x: 1.1, y: posY + 0.15, w: 10.8, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
  });

  slide21.addText(tp.d, {
    x: 1.1, y: posY + 0.55, w: 10.8, h: 0.8,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 22 : LE MODULE WAR ROOM & COLLABORATION
// ==========================================
let slide22 = pptx.addSlide();
setSlideBackground(slide22, COLORS.bgLight);
addSlideHeader(slide22, "20. Modules : Le Module War Room en Détail", "Conception des Modules");

slide22.addText("ESPACE EN TEMPS RÉEL EXCLUSIF À CHAQUE CRUTION D'INCIDENT", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Colonne 1 : Description fonctionnelle
slide22.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.9, w: 5.4, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primary, width: 1.5 }
});
slide22.addText("FONCTIONNALITÉS NATIVES DE LA WAR ROOM", {
  x: 1.0, y: 2.1, w: 5.0, h: 0.4,
  fontSize: 15, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});
slide22.addText([
  { text: "• Chat textuel fluide : Échange instantané de retours techniques et d'étapes de diagnostic entre techniciens de garde.\n\n", options: { fontSize: 11 } },
  { text: "• Partage de fichiers volumineux : Upload sécurisé des logs système complexes et captures d'écran directement hébergés sur le MinIO S3 interne.\n\n", options: { fontSize: 11 } },
  { text: "• Journal d'audit d'incident : Log automatique de toutes les actions clés du cycle de vie directement visualisables.", options: { fontSize: 11 } }
], {
  x: 1.0, y: 2.7, w: 5.0, h: 3.8,
  color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 20
});

// Colonne 2 : Interface / Widgets embarqués
slide22.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.9, w: 5.4, h: 4.8,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.secondary, width: 1.5 }
});
slide22.addText("WIDGETS COMPAGNON ÉLÉMENTS DE VUE", {
  x: 7.0, y: 2.1, w: 5.0, h: 0.4,
  fontSize: 15, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
});
slide22.addText([
  { text: "• EscalationTimer : Affiche en direct le temps restant (compte à rebours) avant le prochain déclenchement d'une escalade SLA.\n\n", options: { fontSize: 11 } },
  { text: "• SystemHealthWidget : Widget embarqué interrogeant notre Prometheus pour remonter directement les graphiques de charge CPU/RAM du serveur en panne.\n\n", options: { fontSize: 11 } },
  { text: "• Activité de l'équipe : Indicateurs de présence en direct des acteurs connectés dans la War Room.", options: { fontSize: 11 } }
], {
  x: 7.0, y: 2.7, w: 5.0, h: 3.8,
  color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 20
});


// ==========================================
// SLIDE 23 : CONCEPTION DU MODULE SLA & ASTREINTE
// ==========================================
let slide23 = pptx.addSlide();
setSlideBackground(slide23, COLORS.bgLight);
addSlideHeader(slide23, "21. Modules : SLA Engine & Planning d'Astreinte", "Conception des Modules");

slide23.addText("DÉCLENCHEMENT INTELLIGENT DE L'ALERTE EN CASCADE", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Les 3 états du workflow
const slaStepsDetailed = [
  { title: "1. CONFIGURATION DYNAMIQUE", desc: "L'administrateur définit des objectifs de résolution précis (ex. 15min pour du CRITICAL, 2h pour du HIGH). Les configs sont mises en cache Redis." },
  { title: "2. ASTREINTE & CALENDRIER", desc: "Le planning hebdomadaire lie chaque plage horaire à un technicien référent. En cas d'incident non pris en charge, le système identifie le technicien de garde." },
  { title: "3. ESCALADE AUTOMATIQUE", desc: "À expiration du timer SLA sans statut 'RESOLVED', le worker BullMQ remonte l'incident au niveau supérieur et notifie immédiatement le manager par webhook." }
];

slaStepsDetailed.forEach((s, idx) => {
  let posY = 1.9 + (idx * 1.65);
  slide23.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: posY, w: 11.4, h: 1.5,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1 }
  });

  slide23.addText(s.title, {
    x: 1.1, y: posY + 0.15, w: 10.8, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.primary, fontFace: 'Calibri'
  });

  slide23.addText(s.desc, {
    x: 1.1, y: posY + 0.55, w: 10.8, h: 0.8,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 24 : RÉALISATION ET IMPLÉMENTATION PATTERNS
// ==========================================
let slide24 = pptx.addSlide();
setSlideBackground(slide24, COLORS.bgLight);
addSlideHeader(slide24, "22. Réalisation : Clean Architecture & DDD", "Implémentation");

slide24.addText("CONCEPTION DE LOGICIELS DE QUALITÉ PROFESSIONNELLE", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const patterns = [
  { t: "Separation of Concerns", d: "Structure rigoureuse en couches isolées :\nRoutes ➔ Controllers ➔ Use Cases ➔ Repositories ➔ Prisma Client.\nChaque couche n'a connaissance que de la couche immédiatement inférieure." },
  { t: "Repository Pattern", d: "Abstraction complète de la base de données. Si nous décidons de passer de PostgreSQL à MongoDB à l'avenir, seule la couche Repository sera modifiée, les Use Cases restant intacts." },
  { t: "Dependency Injection", d: "Injection des instances de repositories et de services de messagerie dans les Use Cases lors de l'initialisation de l'application, facilitant le mocking pour les tests." },
  { t: "Centralized Error Handling", d: "Middleware global express capturant toutes les exceptions applicatives pour renvoyer des réponses JSON homogènes, évitant les crashs serveur (crash-resilient)." }
];

patterns.forEach((pat, idx) => {
  let col = idx % 2;
  let row = Math.floor(idx / 2);
  let posX = 0.8 + (col * 5.8);
  let posY = 1.9 + (row * 2.3);

  slide24.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: posY, w: 5.4, h: 2.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.secondary, width: 1 }
  });

  slide24.addText(pat.title || pat.t, {
    x: posX + 0.2, y: posY + 0.15, w: 5.0, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.primary, fontFace: 'Calibri'
  });

  slide24.addText(pat.desc || pat.d, {
    x: posX + 0.2, y: posY + 0.55, w: 5.0, h: 1.4,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 25 : PERFORMANCES & CACHE APPLICATIF
// ==========================================
let slide25 = pptx.addSlide();
setSlideBackground(slide25, COLORS.bgLight);
addSlideHeader(slide25, "23. Performances : Stratégie de Cache & Pooling", "Implémentation");

slide25.addText("LES CLÉS POUR ATTEINDRE UNE EXCELLENTE FLUIDITÉ SYSTÈME", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const perfItems = [
  { title: "Cache Redis pour les configurations", desc: "Les requêtes sur les configurations de SLAs et les affectations de plannings d'astreinte sont servies directement depuis la mémoire Redis, éliminant les allers-retours coûteux vers PostgreSQL." },
  { title: "Pooling PostgreSQL (PgBouncer)", desc: "Gestion intelligente des connexions à la base SQL. PgBouncer évite la surcharge d'ouverture/fermeture de sockets et maintient un pool de connexions actives réutilisables." },
  { title: "URLs pré-signées MinIO", desc: "Pour les pièces jointes de la War Room, l'API backend génère une URL temporaire signée cryptographiquement vers le stockage MinIO. Le client télécharge le fichier directement en peer-to-peer sans transiter par le serveur Node.js." },
  { title: "React Lazy Loading & Splitting", desc: "Chargement à la demande des modules lourds (comme les graphiques d'observabilité Recharts ou le panneau d'administration) pour un temps de premier affichage (FCP) inférieur à 0.8s." }
];

perfItems.forEach((perf, idx) => {
  let col = idx % 2;
  let row = Math.floor(idx / 2);
  let posX = 0.8 + (col * 5.8);
  let posY = 1.9 + (row * 2.3);

  slide25.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: posY, w: 5.4, h: 2.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1 }
  });

  slide25.addText(perf.title, {
    x: posX + 0.2, y: posY + 0.15, w: 5.0, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.secondary, fontFace: 'Calibri'
  });

  slide25.addText(perf.desc, {
    x: posX + 0.2, y: posY + 0.55, w: 5.0, h: 1.4,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 26 : BILAN ET COMPARAISON DU PROJET
// ==========================================
let slide26 = pptx.addSlide();
setSlideBackground(slide26, COLORS.bgLight);
addSlideHeader(slide26, "24. Bilan : Comparatif avec les Outils Existants", "Bilan & Perspectives");

slide26.addText("PRODKB FACE AUX GÉANTS DU MARCHÉ (JIRA, PAGERDUTY)", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

// Tableau comparatif
slide26.addTable([
  [
    { text: "Critères clés", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "Jira Service Management", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "PagerDuty / Opsgenie", options: { bold: true, fill: COLORS.primary, color: COLORS.white } },
    { text: "ProdKB (Notre Solution)", options: { bold: true, fill: COLORS.secondary, color: COLORS.white } }
  ],
  [
    { text: "War Room Collaborative", options: { bold: true } },
    { text: "Non (Nécessite des extensions payantes)" },
    { text: "Non intégrée (Redirige vers Zoom/Slack)" },
    { text: "Oui (Native, WebSockets Socket.io)", options: { bold: true, color: COLORS.secondary } }
  ],
  [
    { text: "Observabilité intégrée", options: { bold: true } },
    { text: "Non (Pas de widgets métriques natifs)" },
    { text: "Non (Redirige vers Datadog/NewRelic)" },
    { text: "Oui (Widgets Prometheus/Loki natifs)", options: { bold: true, color: COLORS.secondary } }
  ],
  [
    { text: "Souveraineté des Données", options: { bold: true } },
    { text: "Faible (SaaS uniquement / Cloud US)" },
    { text: "Faible (SaaS hébergé chez le fournisseur)" },
    { text: "Totale (Auto-hébergé via MinIO/S3)", options: { bold: true, color: COLORS.secondary } }
  ],
  [
    { text: "Coût d'exploitation", options: { bold: true } },
    { text: "Élevé (Licence par utilisateur/mois)" },
    { text: "Très élevé (Facturation par SMS et par agent)" },
    { text: "Nul (Open Source / Hébergement EC2 fixe)", options: { bold: true, color: COLORS.secondary } }
  ]
], {
  x: 0.8, y: 1.9, w: 11.4, h: 4.8,
  fontSize: 11, fontFace: 'Calibri',
  border: { type: 'solid', color: COLORS.primary, width: 1 }
});


// ==========================================
// SLIDE 27 : PERSPECTIVES D'ÉVOLUTION
// ==========================================
let slide27 = pptx.addSlide();
setSlideBackground(slide27, COLORS.bgLight);
addSlideHeader(slide27, "25. Perspectives : Les Évolutions Futures", "Bilan & Perspectives");

slide27.addText("FEUILLE DE ROUTE STRATÉGIQUE DU COMPOSANT PRODKB", {
  x: 0.8, y: 1.4, w: 11.4, h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary, fontFace: 'Calibri'
});

const futureEvols = [
  { title: "INTELLIGENCE ARTIFICIELLE & POST-MORTEMS", desc: "Intégration d'un LLM local (Ollama/Llama3) pour analyser les discussions de la War Room et générer automatiquement des brouillons de post-mortems d'incidents exploitables." },
  { title: "INTEGRATION CI/CD COMPLETE AVEC GITHUB ACTIONS", desc: "Mise en place d'un pipeline d'intégration et de déploiement continu automatisé pour exécuter notre suite Jest/Playwright et déployer sans interruption sur l'EC2." },
  { title: "APPLICATION MOBILE COMPAGNON NATIVE", desc: "Développement d'une application mobile légère avec React Native exploitant les notifications push natives pour alerter les techniciens d'astreinte n'importe où." },
  { title: "MICROSERVICES & SCALABILITÉ HORIZONTALE", desc: "Transition du monolithe modulaire actuel vers une architecture microservices kubernetes pour les entreprises de très grande envergure avec haute tolérance aux pannes." }
];

futureEvols.forEach((evol, idx) => {
  let col = idx % 2;
  let row = Math.floor(idx / 2);
  let posX = 0.8 + (col * 5.8);
  let posY = 1.9 + (row * 2.3);

  slide27.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: posX, y: posY, w: 5.4, h: 2.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1.5 }
  });

  slide27.addText(evol.title, {
    x: posX + 0.2, y: posY + 0.15, w: 5.0, h: 0.35,
    fontSize: 12, bold: true, color: COLORS.primary, fontFace: 'Calibri'
  });

  slide27.addText(evol.desc, {
    x: posX + 0.2, y: posY + 0.55, w: 5.0, h: 1.4,
    fontSize: 11, color: COLORS.textDark, fontFace: 'Calibri', lineSpacing: 18
  });
});


// ==========================================
// SLIDE 28 : CONCLUSION & RECOMPENSENETS (Dark Theme)
// ==========================================
let slide28 = pptx.addSlide();
setSlideBackground(slide28, COLORS.darkBg);

// Forme géométrique décorative
slide28.addShape(pptx.shapes.RIGHT_TRIANGLE, {
  x: 0, y: 0, w: 4.8, h: 7.5,
  fill: { color: COLORS.primary }
});

slide28.addText("CONCLUSION GÉNÉRALE", {
  x: 5.0, y: 1.8, w: 7.0, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.secondary,
  fontFace: 'Calibri'
});

slide28.addText("Merci pour votre aimable attention.\nJe suis à présent à votre entière disposition pour répondre à toutes vos questions.", {
  x: 5.0, y: 2.6, w: 7.0, h: 1.5,
  fontSize: 18, color: COLORS.white,
  fontFace: 'Calibri', lineSpacing: 28
});

slide28.addShape(pptx.shapes.RECTANGLE, {
  x: 5.0, y: 4.3, w: 3.5, h: 0.05,
  fill: { color: COLORS.secondary }
});

slide28.addText("PRODKB : Plateforme de Gestion de Crise IT en Temps Réel\nSoutenance de Fin d'Études — Master Sciences et Technologies", {
  x: 5.0, y: 4.6, w: 7.0, h: 1.0,
  fontSize: 12, italic: true, color: COLORS.bgLight,
  fontFace: 'Calibri', lineSpacing: 18
});

// Enregistrer la présentation
pptx.writeFile({ fileName: 'Soutenance_PFE_Master_ProdKB.pptx' })
  .then(fileName => {
    console.log(`Félicitations ! Le diaporama PowerPoint académique de la soutenance de Master a été généré avec succès : ${fileName}`);
  })
  .catch(err => {
    console.error("Erreur lors de la génération du PowerPoint :", err);
  });
