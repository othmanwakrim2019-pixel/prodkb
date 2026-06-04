const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'docs', 'images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Helper for standard SVG wrapper
const wrapSVG = (width, height, content, bg = '#F9FAFB') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#4B5563" />
    </marker>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.1"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${bg}" rx="8" />
  ${content}
</svg>
`;

// 1. INCIDENT LIFECYCLE
const generateIncidentLifecycle = () => {
  const content = `
  <!-- Initial State -->
  <circle cx="50" cy="150" r="10" fill="#111827" />
  <path d="M 60 150 L 95 150" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />

  <!-- States -->
  <!-- 1. Open -->
  <g filter="url(#shadow)">
    <rect x="100" y="110" width="120" height="80" rx="10" fill="#FFFBEB" stroke="#F59E0B" stroke-width="2" />
    <text x="160" y="145" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#B45309" text-anchor="middle">Open</text>
    <text x="160" y="165" font-family="Arial, sans-serif" font-size="11" fill="#D97706" text-anchor="middle">Ouvert</text>
  </g>

  <!-- Connection 1 -> 2 -->
  <path d="M 220 150 L 265 150" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />
  <text x="242" y="135" font-family="Arial, sans-serif" font-size="10" fill="#4B5563" text-anchor="middle">Assignation</text>

  <!-- 2. Acknowledged -->
  <g filter="url(#shadow)">
    <rect x="270" y="110" width="130" height="80" rx="10" fill="#F0F9FF" stroke="#0284C7" stroke-width="2" />
    <text x="335" y="145" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#0369A1" text-anchor="middle">Acknowledged</text>
    <text x="335" y="165" font-family="Arial, sans-serif" font-size="11" fill="#0284C7" text-anchor="middle">Pris en compte</text>
  </g>

  <!-- Connection 2 -> 3 -->
  <path d="M 400 150 L 445 150" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />
  <text x="422" y="135" font-family="Arial, sans-serif" font-size="10" fill="#4B5563" text-anchor="middle">Prise en charge</text>

  <!-- 3. In Progress -->
  <g filter="url(#shadow)">
    <rect x="450" y="110" width="130" height="80" rx="10" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="515" y="145" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#6D28D9" text-anchor="middle">In Progress</text>
    <text x="515" y="165" font-family="Arial, sans-serif" font-size="11" fill="#7C3AED" text-anchor="middle">En cours</text>
  </g>

  <!-- Connection 3 -> 4 -->
  <path d="M 580 150 L 625 150" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />
  <text x="602" y="135" font-family="Arial, sans-serif" font-size="10" fill="#4B5563" text-anchor="middle">Résolution</text>

  <!-- 4. Resolved -->
  <g filter="url(#shadow)">
    <rect x="630" y="110" width="120" height="80" rx="10" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="690" y="145" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#047857" text-anchor="middle">Resolved</text>
    <text x="690" y="165" font-family="Arial, sans-serif" font-size="11" fill="#059669" text-anchor="middle">Résolu</text>
  </g>

  <!-- Connection 4 -> 5 -->
  <path d="M 750 150 L 795 150" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />
  <text x="772" y="130" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Clôture</text>
  <text x="772" y="142" font-family="Arial, sans-serif" font-size="8" fill="#6B7280" text-anchor="middle">(72h auto)</text>

  <!-- 5. Closed -->
  <g filter="url(#shadow)">
    <rect x="800" y="110" width="120" height="80" rx="10" fill="#F3F4F6" stroke="#4B5563" stroke-width="2" />
    <text x="860" y="145" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#374151" text-anchor="middle">Closed</text>
    <text x="860" y="165" font-family="Arial, sans-serif" font-size="11" fill="#4B5563" text-anchor="middle">Clôturé</text>
  </g>

  <!-- Connection 5 -> End -->
  <path d="M 920 150 L 950 150" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />

  <!-- End State -->
  <circle cx="965" cy="150" r="10" fill="none" stroke="#111827" stroke-width="2" />
  <circle cx="965" cy="150" r="6" fill="#111827" />

  <!-- Return Connection (Resolved -> In Progress) -->
  <path d="M 690 110 Q 602 40 515 110" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow-red)" />
  <text x="602" y="55" font-family="Arial, sans-serif" font-size="10" fill="#EF4444" font-weight="bold" text-anchor="middle">Réouverture si non résolu</text>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'incident_lifecycle.svg'), wrapSVG(1000, 300, content), 'utf-8');
};

// 2. ITSM COMPARATIVE RADAR CHART (Drawn as a clear, clean comparison grid/spider)
const generateRadarChart = () => {
  const width = 800;
  const height = 500;
  const content = `
  <rect width="800" height="500" fill="#0B0F19" rx="8" />
  
  <text x="400" y="40" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#FFFFFF" text-anchor="middle">Comparaison Fonctionnelle des Solutions ITSM</text>
  
  <!-- Outer boundary and axis -->
  <circle cx="400" cy="270" r="180" fill="none" stroke="#334155" stroke-dasharray="4" stroke-width="1" />
  <circle cx="400" cy="270" r="144" fill="none" stroke="#1E293B" stroke-width="1" />
  <circle cx="400" cy="270" r="108" fill="none" stroke="#1E293B" stroke-width="1" />
  <circle cx="400" cy="270" r="72" fill="none" stroke="#1E293B" stroke-width="1" />
  <circle cx="400" cy="270" r="36" fill="none" stroke="#1E293B" stroke-width="1" />
  
  <!-- Axis Labels (8 criteria) -->
  <!-- 1. Incidents -->
  <line x1="400" y1="270" x2="400" y2="90" stroke="#475569" stroke-width="1" />
  <text x="400" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="middle">Gestion Incidents</text>
  
  <!-- 2. SLA Engine -->
  <line x1="400" y1="270" x2="527" y2="143" stroke="#475569" stroke-width="1" />
  <text x="537" y="138" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="start">Moteur SLA</text>
  
  <!-- 3. War Room -->
  <line x1="400" y1="270" x2="580" y2="270" stroke="#475569" stroke-width="1" />
  <text x="590" y="274" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="start">War Room</text>
  
  <!-- 4. KB -->
  <line x1="400" y1="270" x2="527" y2="397" stroke="#475569" stroke-width="1" />
  <text x="537" y="410" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="start">Base de Connaissances</text>
  
  <!-- 5. Batch Planning -->
  <line x1="400" y1="270" x2="400" y2="450" stroke="#475569" stroke-width="1" />
  <text x="400" y="465" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="middle">Planning Batchs</text>
  
  <!-- 6. Astreintes -->
  <line x1="400" y1="270" x2="273" y2="397" stroke="#475569" stroke-width="1" />
  <text x="263" y="410" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="end">Gestion Astreintes</text>
  
  <!-- 7. Observability -->
  <line x1="400" y1="270" x2="220" y2="270" stroke="#475569" stroke-width="1" />
  <text x="210" y="274" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="end">Observabilité</text>
  
  <!-- 8. Performance/Cost -->
  <line x1="400" y1="270" x2="273" y2="143" stroke="#475569" stroke-width="1" />
  <text x="263" y="138" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#94A3B8" text-anchor="end">Performance/Coût</text>

  <!-- Plotting Data: ProdKB (Maximum everywhere, 5/5) -->
  <polygon points="400,90 527,143 580,270 527,397 400,450 273,397 220,270 273,143" 
           fill="none" stroke="#22C55E" stroke-width="3" />
  <polygon points="400,90 527,143 580,270 527,397 400,450 273,397 220,270 273,143" 
           fill="#22C55E" fill-opacity="0.25" />
           
  <!-- Plotting Data: ServiceNow (Good incidents/SLA/KB, bad cost) -->
  <polygon points="400,90 527,143 508,270 527,397 436,306 273,397 310,270 425,243" 
           fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="2" />

  <!-- Plotting Data: PagerDuty (On-call focus) -->
  <polygon points="490,202 463,222 508,270 410,280 410,280 273,397 310,270 336,206" 
           fill="none" stroke="#F97316" stroke-width="1.5" />

  <!-- Legend -->
  <g transform="translate(100, 480)">
    <rect x="0" y="-12" width="12" height="12" fill="#22C55E" />
    <text x="20" y="0" font-family="Arial, sans-serif" font-size="11" fill="#FFFFFF">ProdKB</text>
    
    <rect x="180" y="-12" width="12" height="12" fill="#3B82F6" />
    <text x="200" y="0" font-family="Arial, sans-serif" font-size="11" fill="#FFFFFF">ServiceNow</text>
    
    <rect x="360" y="-12" width="12" height="12" fill="#F97316" />
    <text x="380" y="0" font-family="Arial, sans-serif" font-size="11" fill="#FFFFFF">PagerDuty</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'itsm_solutions_radar.svg'), content, 'utf-8');
};

// 3. GLOBAL USE CASE DIAGRAM
const generateGlobalUseCase = () => {
  const content = `
  <!-- Actors -->
  <!-- Viewer -->
  <g transform="translate(80, 80)">
    <circle cx="0" cy="-20" r="10" fill="none" stroke="#10B981" stroke-width="2"/>
    <line x1="0" y1="-10" x2="0" y2="15" stroke="#10B981" stroke-width="2"/>
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#10B981" stroke-width="2"/>
    <line x1="0" y1="15" x2="-12" y2="35" stroke="#10B981" stroke-width="2"/>
    <line x1="0" y1="15" x2="12" y2="35" stroke="#10B981" stroke-width="2"/>
    <text x="0" y="55" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#10B981" text-anchor="middle">Observateur</text>
    <text x="0" y="68" font-family="Arial, sans-serif" font-size="9" fill="#047857" text-anchor="middle">(VIEWER)</text>
  </g>

  <!-- Operator -->
  <g transform="translate(80, 220)">
    <circle cx="0" cy="-20" r="10" fill="none" stroke="#3B82F6" stroke-width="2"/>
    <line x1="0" y1="-10" x2="0" y2="15" stroke="#3B82F6" stroke-width="2"/>
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#3B82F6" stroke-width="2"/>
    <line x1="0" y1="15" x2="-12" y2="35" stroke="#3B82F6" stroke-width="2"/>
    <line x1="0" y1="15" x2="12" y2="35" stroke="#3B82F6" stroke-width="2"/>
    <text x="0" y="55" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#3B82F6" text-anchor="middle">Opérateur</text>
    <text x="0" y="68" font-family="Arial, sans-serif" font-size="9" fill="#1D4ED8" text-anchor="middle">(OPERATOR)</text>
  </g>

  <!-- Inheritances -->
  <path d="M 80 185 L 80 145" stroke="#9CA3AF" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Subject boundary -->
  <rect x="220" y="20" width="540" height="360" fill="#FFFFFF" stroke="#374151" stroke-width="2" rx="4" />
  <text x="240" y="45" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#374151">ProdKB Platform</text>

  <!-- Use Cases -->
  <!-- UC1 -->
  <g transform="translate(300, 70)">
    <ellipse cx="140" cy="25" rx="120" ry="20" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
    <text x="140" y="30" font-family="Arial, sans-serif" font-size="11" fill="#047857" text-anchor="middle">Consulter Dashboard & KPIs</text>
  </g>
  <line x1="140" y1="80" x2="310" y2="85" stroke="#9CA3AF" stroke-width="1" />

  <!-- UC2 -->
  <g transform="translate(300, 130)">
    <ellipse cx="140" cy="25" rx="120" ry="20" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
    <text x="140" y="30" font-family="Arial, sans-serif" font-size="11" fill="#047857" text-anchor="middle">Consulter Liste Incidents</text>
  </g>
  <line x1="140" y1="90" x2="310" y2="145" stroke="#9CA3AF" stroke-width="1" />

  <!-- UC3 -->
  <g transform="translate(300, 200)">
    <ellipse cx="140" cy="25" rx="120" ry="20" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
    <text x="140" y="30" font-family="Arial, sans-serif" font-size="11" fill="#1D4ED8" text-anchor="middle">Créer & Modifier un Incident</text>
  </g>
  <line x1="140" y1="230" x2="310" y2="215" stroke="#9CA3AF" stroke-width="1" />

  <!-- UC4 -->
  <g transform="translate(300, 260)">
    <ellipse cx="140" cy="25" rx="120" ry="20" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
    <text x="140" y="30" font-family="Arial, sans-serif" font-size="11" fill="#1D4ED8" text-anchor="middle">Participer à la War Room</text>
  </g>
  <line x1="140" y1="240" x2="310" y2="275" stroke="#9CA3AF" stroke-width="1" />

  <!-- UC5 -->
  <g transform="translate(300, 320)">
    <ellipse cx="140" cy="25" rx="120" ry="20" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
    <text x="140" y="30" font-family="Arial, sans-serif" font-size="11" fill="#1D4ED8" text-anchor="middle">Suivre le Planning & Batchs</text>
  </g>
  <line x1="140" y1="250" x2="310" y2="335" stroke="#9CA3AF" stroke-width="1" />
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'global_use_case_diagram.svg'), wrapSVG(800, 400, content), 'utf-8');
};

// 4. INCIDENTS MODULE USE CASE
const generateIncidentsUseCase = () => {
  const content = `
  <!-- Actor -->
  <g transform="translate(80, 200)">
    <circle cx="0" cy="-20" r="10" fill="none" stroke="#3B82F6" stroke-width="2"/>
    <line x1="0" y1="-10" x2="0" y2="15" stroke="#3B82F6" stroke-width="2"/>
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#3B82F6" stroke-width="2"/>
    <line x1="0" y1="15" x2="-12" y2="35" stroke="#3B82F6" stroke-width="2"/>
    <line x1="0" y1="15" x2="12" y2="35" stroke="#3B82F6" stroke-width="2"/>
    <text x="0" y="55" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#3B82F6" text-anchor="middle">Opérateur</text>
  </g>

  <!-- Boundary -->
  <rect x="200" y="20" width="560" height="360" fill="#FFFFFF" stroke="#374151" stroke-width="2" rx="4" />
  <text x="220" y="45" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#374151">Module Gestion des Incidents</text>

  <!-- Use Cases -->
  <!-- UC1 -->
  <g transform="translate(250, 70)">
    <ellipse cx="90" cy="20" rx="80" ry="18" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
    <text x="90" y="24" font-family="Arial, sans-serif" font-size="11" fill="#1D4ED8" text-anchor="middle">Créer Incident</text>
  </g>
  <line x1="140" y1="180" x2="270" y2="95" stroke="#9CA3AF" stroke-width="1" />

  <!-- UC2 -->
  <g transform="translate(250, 200)">
    <ellipse cx="90" cy="20" rx="80" ry="18" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
    <text x="90" y="24" font-family="Arial, sans-serif" font-size="11" fill="#1D4ED8" text-anchor="middle">Modifier Incident</text>
  </g>
  <line x1="140" y1="205" x2="270" y2="215" stroke="#9CA3AF" stroke-width="1" />

  <!-- Extends pointing to Modifier -->
  <!-- UC3: Attacher Log -->
  <g transform="translate(540, 110)">
    <ellipse cx="90" cy="20" rx="80" ry="18" fill="#F3F4F6" stroke="#4B5563" stroke-width="1.5" />
    <text x="90" y="24" font-family="Arial, sans-serif" font-size="11" fill="#374151" text-anchor="middle">Attacher Log</text>
  </g>
  <path d="M 540 135 L 410 205" stroke="#4B5563" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <text x="475" y="160" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">&lt;&lt;extend&gt;&gt;</text>

  <!-- UC4: Assigner Equipe -->
  <g transform="translate(540, 200)">
    <ellipse cx="90" cy="20" rx="80" ry="18" fill="#F3F4F6" stroke="#4B5563" stroke-width="1.5" />
    <text x="90" y="24" font-family="Arial, sans-serif" font-size="11" fill="#374151" text-anchor="middle">Assigner Équipe</text>
  </g>
  <path d="M 540 220 L 430 220" stroke="#4B5563" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <text x="485" y="215" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">&lt;&lt;extend&gt;&gt;</text>

  <!-- UC5: Lier Procedure -->
  <g transform="translate(540, 290)">
    <ellipse cx="90" cy="20" rx="80" ry="18" fill="#F3F4F6" stroke="#4B5563" stroke-width="1.5" />
    <text x="90" y="24" font-family="Arial, sans-serif" font-size="11" fill="#374151" text-anchor="middle">Lier Procédure</text>
  </g>
  <path d="M 540 305 L 410 235" stroke="#4B5563" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <text x="475" y="280" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">&lt;&lt;extend&gt;&gt;</text>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'incidents_module_use_cases.svg'), wrapSVG(800, 400, content), 'utf-8');
};

// 5. SLA MODULE USE CASE
const generateSlaUseCase = () => {
  const content = `
  <!-- Actor -->
  <g transform="translate(80, 200)">
    <rect x="-40" y="-30" width="80" height="60" rx="6" fill="#F3F4F6" stroke="#374151" stroke-width="2" />
    <text x="0" y="0" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#374151" text-anchor="middle">Système</text>
    <text x="0" y="15" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">(Worker/Cron)</text>
  </g>

  <!-- Boundary -->
  <rect x="200" y="20" width="560" height="360" fill="#FFFFFF" stroke="#374151" stroke-width="2" rx="4" />
  <text x="220" y="45" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#374151">Module Gestion des SLAs</text>

  <!-- Use Cases -->
  <!-- UC1 -->
  <g transform="translate(250, 180)">
    <ellipse cx="90" cy="25" rx="80" ry="20" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
    <text x="90" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#1D4ED8" text-anchor="middle">Vérifier SLA</text>
  </g>
  <line x1="120" y1="200" x2="250" y2="205" stroke="#374151" stroke-width="1.5" />

  <!-- UC2: Notifier Breach -->
  <g transform="translate(520, 100)">
    <ellipse cx="90" cy="25" rx="80" ry="20" fill="#FFF5F5" stroke="#EF4444" stroke-width="1.5" />
    <text x="90" y="28" font-family="Arial, sans-serif" font-size="11" fill="#C53030" text-anchor="middle">Notifier Breach</text>
  </g>
  <path d="M 520 125 L 410 185" stroke="#4B5563" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <text x="465" y="145" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">&lt;&lt;extend&gt;&gt;</text>

  <!-- UC3: Escalader Incident -->
  <g transform="translate(520, 260)">
    <ellipse cx="90" cy="25" rx="80" ry="20" fill="#FFF5F5" stroke="#EF4444" stroke-width="1.5" />
    <text x="90" y="28" font-family="Arial, sans-serif" font-size="11" fill="#C53030" text-anchor="middle">Escalader Incident</text>
  </g>
  <path d="M 520 285 L 410 225" stroke="#4B5563" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <text x="465" y="265" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">&lt;&lt;extend&gt;&gt;</text>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'sla_module_use_cases.svg'), wrapSVG(800, 400, content), 'utf-8');
};

// 6. WAR ROOM MODULE USE CASE
const generateWarRoomUseCase = () => {
  const content = `
  <!-- Actor -->
  <g transform="translate(80, 200)">
    <circle cx="0" cy="-20" r="10" fill="none" stroke="#7C3AED" stroke-width="2"/>
    <line x1="0" y1="-10" x2="0" y2="15" stroke="#7C3AED" stroke-width="2"/>
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#7C3AED" stroke-width="2"/>
    <line x1="0" y1="15" x2="-12" y2="35" stroke="#7C3AED" stroke-width="2"/>
    <line x1="0" y1="15" x2="12" y2="35" stroke="#7C3AED" stroke-width="2"/>
    <text x="0" y="55" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#7C3AED" text-anchor="middle">Expert</text>
  </g>

  <!-- Boundary -->
  <rect x="200" y="20" width="560" height="360" fill="#FFFFFF" stroke="#374151" stroke-width="2" rx="4" />
  <text x="220" y="45" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#374151">Module War Room (Collaboration)</text>

  <!-- Use Cases -->
  <!-- UC1 -->
  <g transform="translate(380, 80)">
    <ellipse cx="100" cy="25" rx="90" ry="20" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.5" />
    <text x="100" y="28" font-family="Arial, sans-serif" font-size="11" fill="#6D28D9" text-anchor="middle">Rejoindre War Room</text>
  </g>
  <line x1="140" y1="180" x2="380" y2="105" stroke="#374151" stroke-width="1.5" />

  <!-- UC2 -->
  <g transform="translate(380, 180)">
    <ellipse cx="100" cy="25" rx="90" ry="20" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.5" />
    <text x="100" y="28" font-family="Arial, sans-serif" font-size="11" fill="#6D28D9" text-anchor="middle">Envoyer Message (Chat)</text>
  </g>
  <line x1="140" y1="200" x2="380" y2="205" stroke="#374151" stroke-width="1.5" />

  <!-- UC3 -->
  <g transform="translate(380, 280)">
    <ellipse cx="100" cy="25" rx="90" ry="20" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.5" />
    <text x="100" y="28" font-family="Arial, sans-serif" font-size="11" fill="#6D28D9" text-anchor="middle">Voir Timeline Système</text>
  </g>
  <line x1="140" y1="220" x2="380" y2="300" stroke="#374151" stroke-width="1.5" />
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'warroom_module_use_cases.svg'), wrapSVG(800, 400, content), 'utf-8');
};

// 7. INCIDENT CREATION SEQUENCE DIAGRAM
const generateIncidentCreationSequence = () => {
  const content = `
  <!-- Vertical Lifelines -->
  <g stroke="#374151" stroke-width="1" stroke-dasharray="4">
    <line x1="80" y1="80" x2="80" y2="520" />
    <line x1="200" y1="80" x2="200" y2="520" />
    <line x1="320" y1="80" x2="320" y2="520" />
    <line x1="440" y1="80" x2="440" y2="520" />
    <line x1="560" y1="80" x2="560" y2="520" />
    <line x1="680" y1="80" x2="680" y2="520" />
    <line x1="800" y1="80" x2="800" y2="520" />
    <line x1="920" y1="80" x2="920" y2="520" />
  </g>

  <!-- Lifeline Headers -->
  <g filter="url(#shadow)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">
    <!-- Client -->
    <rect x="30" y="30" width="100" height="40" rx="4" fill="#E5E7EB" stroke="#374151" />
    <text x="80" y="55">Client (User)</text>

    <!-- Frontend -->
    <rect x="150" y="30" width="100" height="40" rx="4" fill="#DBEAFE" stroke="#2563EB" />
    <text x="200" y="55" fill="#1E40AF">Frontend React</text>

    <!-- API -->
    <rect x="270" y="30" width="100" height="40" rx="4" fill="#E0F2FE" stroke="#0369A1" />
    <text x="320" y="55" fill="#0369A1">API Express</text>

    <!-- Zod -->
    <rect x="390" y="30" width="100" height="40" rx="4" fill="#F3E8FF" stroke="#7E22CE" />
    <text x="440" y="55" fill="#6B21A8">Zod Validate</text>

    <!-- Prisma -->
    <rect x="510" y="30" width="100" height="40" rx="4" fill="#ECFDF5" stroke="#047857" />
    <text x="560" y="55" fill="#047857">Prisma / DB</text>

    <!-- SLA -->
    <rect x="630" y="30" width="100" height="40" rx="4" fill="#FEF3C7" stroke="#D97706" />
    <text x="680" y="55" fill="#B45309">SLA Matcher</text>

    <!-- Socket -->
    <rect x="750" y="30" width="100" height="40" rx="4" fill="#FFFBEB" stroke="#D97706" />
    <text x="800" y="55" fill="#B45309">Socket.IO</text>

    <!-- Audit -->
    <rect x="870" y="30" width="100" height="40" rx="4" fill="#FEE2E2" stroke="#DC2626" />
    <text x="920" y="55" fill="#991B1B">Audit Trail</text>
  </g>

  <!-- Activation Bars -->
  <g fill="#F3F4F6" stroke="#374151" stroke-width="1">
    <rect x="76" y="100" width="8" height="410" />
    <rect x="196" y="110" width="8" height="380" />
    <rect x="316" y="120" width="8" height="340" />
    <rect x="436" y="140" width="8" height="40" />
    <rect x="556" y="200" width="8" height="70" />
    <rect x="676" y="290" width="8" height="40" />
    <rect x="796" y="350" width="8" height="40" />
    <rect x="916" y="410" width="8" height="40" />
  </g>

  <!-- Message Arrows -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <!-- 1 -->
    <path d="M 84 110 L 196 110" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="140" y="102" text-anchor="middle">1. Créer Incident (click)</text>

    <!-- 2 -->
    <path d="M 204 125 L 316 125" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="260" y="118" text-anchor="middle">2. POST /api/incidents</text>

    <!-- 3 -->
    <path d="M 324 140 L 436 140" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="380" y="133" text-anchor="middle">3. validate(body)</text>
    
    <!-- 4 -->
    <path d="M 436 170 L 324 170" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="380" y="165" text-anchor="middle">4. Validated payload</text>

    <!-- 5 -->
    <path d="M 324 200 L 556 200" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="440" y="193" text-anchor="middle">5. prisma.incident.create()</text>

    <!-- 6 -->
    <path d="M 556 250 L 324 250" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="440" y="245" text-anchor="middle">6. DB object returned</text>

    <!-- 7 -->
    <path d="M 324 290 L 676 290" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="500" y="283" text-anchor="middle">7. matchSLA()</text>

    <!-- 8 -->
    <path d="M 676 320 L 324 320" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="500" y="315" text-anchor="middle">8. Attached SLAs</text>

    <!-- 9 -->
    <path d="M 324 350 L 796 350" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="560" y="343" text-anchor="middle">9. emit('incident:created')</text>

    <!-- 10 -->
    <path d="M 324 410 L 916 410" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="620" y="403" text-anchor="middle">10. logAction('CREATE_INCIDENT')</text>

    <!-- 11 -->
    <path d="M 316 460 L 204 460" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="260" y="453" text-anchor="middle">11. HTTP 201 Response</text>

    <!-- 12 -->
    <path d="M 196 490 L 84 490" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="140" y="483" text-anchor="middle">12. Redirect & Render success</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'incident_creation_sequence.svg'), wrapSVG(1000, 560, content), 'utf-8');
};

// 8. SLA ESCALATION SEQUENCE
const generateSlaEscalationSequence = () => {
  const content = `
  <!-- Vertical Lifelines -->
  <g stroke="#374151" stroke-width="1" stroke-dasharray="4">
    <line x1="100" y1="80" x2="100" y2="480" />
    <line x1="240" y1="80" x2="240" y2="480" />
    <line x1="380" y1="80" x2="380" y2="480" />
    <line x1="520" y1="80" x2="520" y2="480" />
    <line x1="660" y1="80" x2="660" y2="480" />
    <line x1="800" y1="80" x2="800" y2="480" />
  </g>

  <!-- Lifeline Headers -->
  <g filter="url(#shadow)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">
    <rect x="50" y="30" width="100" height="40" rx="4" fill="#E5E7EB" stroke="#374151" />
    <text x="100" y="55">BullMQ Cron</text>

    <rect x="190" y="30" width="100" height="40" rx="4" fill="#DBEAFE" stroke="#2563EB" />
    <text x="240" y="55" fill="#1E40AF">SLA Worker</text>

    <rect x="330" y="30" width="100" height="40" rx="4" fill="#ECFDF5" stroke="#047857" />
    <text x="380" y="55" fill="#047857">Database (DB)</text>

    <rect x="470" y="30" width="100" height="40" rx="4" fill="#F3E8FF" stroke="#7E22CE" />
    <text x="520" y="55" fill="#6B21A8">Rules Engine</text>

    <rect x="610" y="30" width="100" height="40" rx="4" fill="#FEE2E2" stroke="#DC2626" />
    <text x="660" y="55" fill="#991B1B">Notifier</text>

    <rect x="750" y="30" width="100" height="40" rx="4" fill="#FFFBEB" stroke="#D97706" />
    <text x="800" y="55" fill="#B45309">Socket.IO</text>
  </g>

  <!-- Activation Bars -->
  <g fill="#F3F4F6" stroke="#374151" stroke-width="1">
    <rect x="96" y="100" width="8" height="360" />
    <rect x="236" y="110" width="8" height="330" />
    <rect x="376" y="130" width="8" height="60" />
    <rect x="516" y="210" width="8" height="40" />
    <rect x="656" y="270" width="8" height="40" />
    <rect x="796" y="380" width="8" height="40" />
  </g>

  <!-- Message Flows -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <path d="M 104 115 L 236 115" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="170" y="107" text-anchor="middle">1. triggerTick()</text>

    <path d="M 244 130 L 376 130" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="310" y="122" text-anchor="middle">2. findMany(activeIncidents)</text>

    <path d="M 376 170 L 236 170" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="310" y="165" text-anchor="middle">3. Active incidents list</text>

    <path d="M 244 210 L 516 210" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="380" y="202" text-anchor="middle">4. checkThresholds()</text>

    <path d="M 516 240 L 236 240" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="380" y="235" text-anchor="middle">5. breachResult (e.g. true)</text>

    <path d="M 244 270 L 656 270" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="450" y="262" text-anchor="middle">6. sendBreachAlert(Incident, level)</text>

    <path d="M 244 330 L 376 330" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="310" y="322" text-anchor="middle">7. update(incidentId, { isBreached })</text>

    <path d="M 244 380 L 796 380" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="520" y="372" text-anchor="middle">8. emit('incident:escalated')</text>

    <path d="M 236 430 L 104 430" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="170" y="422" text-anchor="middle">9. jobCompleted()</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'sla_escalation_sequence.svg'), wrapSVG(900, 500, content), 'utf-8');
};

// 9. JWT AUTH SEQUENCE
const generateJwtAuthSequence = () => {
  const content = `
  <!-- Vertical Lifelines -->
  <g stroke="#374151" stroke-width="1" stroke-dasharray="4">
    <line x1="100" y1="80" x2="100" y2="480" />
    <line x1="240" y1="80" x2="240" y2="480" />
    <line x1="380" y1="80" x2="380" y2="480" />
    <line x1="520" y1="80" x2="520" y2="480" />
    <line x1="660" y1="80" x2="660" y2="480" />
  </g>

  <!-- Lifeline Headers -->
  <g filter="url(#shadow)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">
    <rect x="50" y="30" width="100" height="40" rx="4" fill="#E5E7EB" stroke="#374151" />
    <text x="100" y="55">Client (Browser)</text>

    <rect x="190" y="30" width="100" height="40" rx="4" fill="#DBEAFE" stroke="#2563EB" />
    <text x="240" y="55" fill="#1E40AF">API Auth Controller</text>

    <rect x="330" y="30" width="100" height="40" rx="4" fill="#ECFDF5" stroke="#047857" />
    <text x="380" y="55" fill="#047857">Database (DB)</text>

    <rect x="470" y="30" width="100" height="40" rx="4" fill="#F3E8FF" stroke="#7E22CE" />
    <text x="520" y="55" fill="#6B21A8">bcrypt (Hasher)</text>

    <rect x="610" y="30" width="100" height="40" rx="4" fill="#FEF3C7" stroke="#D97706" />
    <text x="660" y="55" fill="#B45309">JWT Service</text>
  </g>

  <!-- Activation Bars -->
  <g fill="#F3F4F6" stroke="#374151" stroke-width="1">
    <rect x="96" y="100" width="8" height="360" />
    <rect x="236" y="110" width="8" height="330" />
    <rect x="376" y="130" width="8" height="60" />
    <rect x="516" y="210" width="8" height="40" />
    <rect x="656" y="270" width="8" height="80" />
  </g>

  <!-- Message Flows -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <path d="M 104 115 L 236 115" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="170" y="107" text-anchor="middle">1. POST /api/auth/login</text>

    <path d="M 244 130 L 376 130" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="310" y="122" text-anchor="middle">2. findUniqueUser(email)</text>

    <path d="M 376 170 L 236 170" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="310" y="165" text-anchor="middle">3. user record (passwordHash)</text>

    <path d="M 244 210 L 516 210" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="380" y="202" text-anchor="middle">4. compare(password, passwordHash)</text>

    <path d="M 516 240 L 236 240" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="380" y="235" text-anchor="middle">5. matchResult (true)</text>

    <path d="M 244 270 L 656 270" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="450" y="262" text-anchor="middle">6. signAccessToken(userPayload)</text>

    <path d="M 656 295 L 244 295" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="450" y="288" text-anchor="middle">7. accessToken (15m)</text>

    <path d="M 244 320 L 656 320" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="450" y="312" text-anchor="middle">8. signRefreshToken(userPayload)</text>

    <path d="M 656 345 L 244 345" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="450" y="338" text-anchor="middle">9. refreshToken (7d)</text>

    <path d="M 244 380 L 376 380" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="310" y="372" text-anchor="middle">10. createRefreshToken(hash, userId)</text>

    <path d="M 236 430 L 104 430" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="170" y="422" text-anchor="middle">11. HTTP 200 OK {tokens}</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'jwt_auth_sequence.svg'), wrapSVG(900, 500, content), 'utf-8');
};

// 10. ARCHITECTURE MODULAR MONOLITH
const generateModularMonolithArchitecture = () => {
  const content = `
  <!-- Tier 1 -->
  <g filter="url(#shadow)" transform="translate(100, 30)">
    <rect x="0" y="0" width="600" height="70" rx="8" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2" />
    <text x="300" y="30" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#1E40AF" text-anchor="middle">Tier 1: Couche Présentation (SPA React)</text>
    <text x="300" y="52" font-family="Arial, sans-serif" font-size="11" fill="#2563EB" text-anchor="middle">Vite / TypeScript / Zustand / Recharts (Dashboard, War Room Chat, Astreintes)</text>
  </g>

  <!-- Communication arrows -->
  <path d="M 250 100 L 250 150" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <text x="240" y="130" font-family="Arial, sans-serif" font-size="10" fill="#374151" text-anchor="end">Requêtes HTTPS / APIs REST</text>

  <path d="M 550 100 L 550 150" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)" />
  <text x="560" y="130" font-family="Arial, sans-serif" font-size="10" fill="#7C3AED" text-anchor="start">WebSocket / Socket.IO</text>

  <!-- Tier 2 -->
  <g filter="url(#shadow)" transform="translate(100, 160)">
    <rect x="0" y="0" width="600" height="150" rx="8" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="300" y="30" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#6D28D9" text-anchor="middle">Tier 2: Couche Métier (Node.js Modular Monolith)</text>
    
    <!-- Modules grid -->
    <g transform="translate(20, 50)" font-family="Arial, sans-serif" font-size="11" fill="#5B21B6" text-anchor="middle">
      <rect x="0" y="0" width="100" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="50" y="21">Auth &amp; RBAC</text>

      <rect x="110" y="0" width="100" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="160" y="21">Incidents</text>

      <rect x="220" y="0" width="100" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="270" y="21">SLA Engine</text>

      <rect x="330" y="0" width="100" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="380" y="21">War Room</text>

      <rect x="440" y="0" width="110" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="495" y="21">Procédures (KB)</text>

      <rect x="50" y="45" width="110" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="105" y="66">Planning Batchs</text>

      <rect x="175" y="45" width="100" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="225" y="66">Astreintes</text>

      <rect x="285" y="45" width="100" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="335" y="66">Webhooks</text>

      <rect x="395" y="45" width="110" height="35" rx="4" fill="#EDE7F6" stroke="#C3B0E8" />
      <text x="450" y="66">Audit Trail</text>
    </g>
  </g>

  <!-- Connectors -->
  <path d="M 250 310 L 250 360" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <text x="240" y="340" font-family="Arial, sans-serif" font-size="10" fill="#374151" text-anchor="end">Prisma ORM</text>

  <path d="M 550 310 L 550 360" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <text x="560" y="340" font-family="Arial, sans-serif" font-size="10" fill="#374151" text-anchor="start">BullMQ / Redis Queue</text>

  <!-- Tier 3 -->
  <g filter="url(#shadow)" transform="translate(100, 370)">
    <rect x="0" y="0" width="600" height="100" rx="8" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="300" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#047857" text-anchor="middle">Tier 3: Données &amp; Services Annexes</text>
    
    <g transform="translate(40, 45)" font-family="Arial, sans-serif" font-size="11" fill="#065F46" text-anchor="middle">
      <rect x="0" y="0" width="110" height="40" rx="4" fill="#D1FAE5" stroke="#6EE7B7" />
      <text x="55" y="24" font-weight="bold">PostgreSQL 16</text>

      <rect x="130" y="0" width="110" height="40" rx="4" fill="#D1FAE5" stroke="#6EE7B7" />
      <text x="185" y="24" font-weight="bold">Redis Cache</text>

      <rect x="260" y="0" width="110" height="40" rx="4" fill="#D1FAE5" stroke="#6EE7B7" />
      <text x="315" y="24" font-weight="bold">MinIO Storage</text>

      <rect x="390" y="0" width="120" height="40" rx="4" fill="#D1FAE5" stroke="#6EE7B7" />
      <text x="450" y="24" font-weight="bold">Prometheus/Grafana</text>
    </g>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'modular_monolith_architecture.svg'), wrapSVG(800, 500, content), 'utf-8');
};

// 11. LAYERED ARCHITECTURE
const generateLayeredArchitecture = () => {
  const content = `
  <!-- Presentation -->
  <g filter="url(#shadow)" transform="translate(100, 40)">
    <rect x="0" y="0" width="600" height="70" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2" />
    <text x="300" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#1E40AF" text-anchor="middle">1. Couche Présentation (Presentation Layer)</text>
    <text x="300" y="48" font-family="Arial, sans-serif" font-size="11" fill="#2563EB" text-anchor="middle">Express Routes &amp; Controllers / Socket Handlers / Middlewares (Auth JWT, Zod Validation)</text>
  </g>

  <path d="M 400 110 L 400 145" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Business -->
  <g filter="url(#shadow)" transform="translate(100, 150)">
    <rect x="0" y="0" width="600" height="70" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="300" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#6D28D9" text-anchor="middle">2. Couche Métier / Domaine (Business / Domain Layer)</text>
    <text x="300" y="48" font-family="Arial, sans-serif" font-size="11" fill="#7C3AED" text-anchor="middle">Services (Incident, SLA, WarRoom) / Moteur de Règles d'Escalade / Logique Métier</text>
  </g>

  <path d="M 400 220 L 400 255" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Data Access -->
  <g filter="url(#shadow)" transform="translate(100, 260)">
    <rect x="0" y="0" width="600" height="70" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="300" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#047857" text-anchor="middle">3. Couche Accès aux Données (Data Access Layer)</text>
    <text x="300" y="48" font-family="Arial, sans-serif" font-size="11" fill="#059669" text-anchor="middle">Prisma Client Client ORM / Repositories / Schémas de base de données</text>
  </g>

  <path d="M 400 330 L 400 365" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Infrastructure -->
  <g filter="url(#shadow)" transform="translate(100, 370)">
    <rect x="0" y="0" width="600" height="70" rx="6" fill="#F9FAFB" stroke="#4B5563" stroke-width="2" />
    <text x="300" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#374151" text-anchor="middle">4. Couche Infrastructure (Infrastructure Layer)</text>
    <text x="300" y="48" font-family="Arial, sans-serif" font-size="11" fill="#4B5563" text-anchor="middle">PostgreSQL Database / Redis Broker / MinIO S3 Object Storage / Mail SMTP</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'backend_layered_architecture.svg'), wrapSVG(800, 480, content), 'utf-8');
};

// 12. REACT FEATURE ARCHITECTURE
const generateReactFeatureArchitecture = () => {
  const content = `
  <!-- Shared -->
  <g filter="url(#shadow)" transform="translate(50, 40)">
    <rect x="0" y="0" width="220" height="320" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2" />
    <text x="110" y="30" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#1E40AF" text-anchor="middle">Shared / Common</text>
    <text x="110" y="50" font-family="Arial, sans-serif" font-size="11" fill="#2563EB" text-anchor="middle">Dossiers réutilisables</text>
    
    <g transform="translate(20, 80)" font-family="Arial, sans-serif" font-size="11" fill="#1D4ED8">
      <rect x="0" y="0" width="180" height="30" rx="4" fill="#DBEAFE" />
      <text x="15" y="18">📂 components/ (UI standard)</text>

      <rect x="0" y="45" width="180" height="30" rx="4" fill="#DBEAFE" />
      <text x="15" y="63">📂 hooks/ (generic state)</text>

      <rect x="0" y="90" width="180" height="30" rx="4" fill="#DBEAFE" />
      <text x="15" y="108">📂 stores/ (transverse state)</text>

      <rect x="0" y="135" width="180" height="30" rx="4" fill="#DBEAFE" />
      <text x="15" y="153">📂 utils/ (Axios client)</text>
    </g>
  </g>

  <!-- Features -->
  <g filter="url(#shadow)" transform="translate(320, 40)">
    <rect x="0" y="0" width="250" height="320" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="125" y="30" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#6D28D9" text-anchor="middle">Features (Domain Modules)</text>
    <text x="125" y="50" font-family="Arial, sans-serif" font-size="11" fill="#7C3AED" text-anchor="middle">features/</text>
    
    <g transform="translate(20, 80)" font-family="Arial, sans-serif" font-size="11" fill="#5B21B6">
      <rect x="0" y="0" width="210" height="40" rx="4" fill="#EDE7F6" />
      <text x="15" y="24">📂 auth/ (Login Page, components)</text>

      <rect x="0" y="50" width="210" height="40" rx="4" fill="#EDE7F6" />
      <text x="15" y="74">📂 incidents/ (List, Cards, hooks)</text>

      <rect x="0" y="100" width="210" height="40" rx="4" fill="#EDE7F6" />
      <text x="15" y="124">📂 warroom/ (Socket connection, Chat)</text>

      <rect x="0" y="150" width="210" height="40" rx="4" fill="#EDE7F6" />
      <text x="15" y="174">📂 planning/ (Canvas drag-drop)</text>
    </g>
  </g>

  <!-- Connectors -->
  <path d="M 270 200 L 310 200" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Entry / Router -->
  <g filter="url(#shadow)" transform="translate(610, 40)">
    <rect x="0" y="0" width="160" height="320" rx="6" fill="#F9FAFB" stroke="#4B5563" stroke-width="2" />
    <text x="80" y="30" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#374151" text-anchor="middle">Entry / Routing</text>
    
    <g transform="translate(15, 80)" font-family="Arial, sans-serif" font-size="11" fill="#374151">
      <rect x="0" y="0" width="130" height="35" rx="4" fill="#E5E7EB" />
      <text x="10" y="21">📂 routes/ (React Router)</text>

      <rect x="0" y="50" width="130" height="35" rx="4" fill="#E5E7EB" />
      <text x="10" y="71">📄 App.tsx</text>

      <rect x="0" y="100" width="130" height="35" rx="4" fill="#E5E7EB" />
      <text x="10" y="121">📄 main.tsx</text>
    </g>
  </g>

  <!-- Features import into Router -->
  <path d="M 570 200 L 600 200" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'react_feature_architecture.svg'), wrapSVG(820, 400, content), 'utf-8');
};

// 13. DATABASE ERD
const generateDatabaseERD = () => {
  const content = `
  <!-- User Table -->
  <g filter="url(#shadow)" transform="translate(40, 40)" font-family="Arial, sans-serif" font-size="10">
    <rect x="0" y="0" width="160" height="150" rx="4" fill="#FFFFFF" stroke="#2563EB" stroke-width="2" />
    <rect x="0" y="0" width="160" height="30" fill="#2563EB" rx="4" />
    <text x="80" y="20" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle">User</text>
    
    <text x="10" y="50" font-weight="bold">id : String [PK]</text>
    <text x="10" y="70">name : String</text>
    <text x="10" y="90">email : String [Unique]</text>
    <text x="10" y="110">password : String</text>
    <text x="10" y="130">roleId : String [FK]</text>
  </g>

  <!-- Role Table -->
  <g filter="url(#shadow)" transform="translate(260, 40)" font-family="Arial, sans-serif" font-size="10">
    <rect x="0" y="0" width="150" height="90" rx="4" fill="#FFFFFF" stroke="#374151" stroke-width="2" />
    <rect x="0" y="0" width="150" height="30" fill="#4B5563" rx="4" />
    <text x="75" y="20" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle">Role</text>
    
    <text x="10" y="50" font-weight="bold">id : String [PK]</text>
    <text x="10" y="70">name : String [Unique]</text>
  </g>

  <!-- User -> Role Relation -->
  <path d="M 200 85 L 260 85" stroke="#4B5563" stroke-width="1.5" />
  <circle cx="205" cy="85" r="3" fill="#4B5563" />
  <line x1="250" y1="80" x2="250" y2="90" stroke="#4B5563" stroke-width="1.5" />

  <!-- Incident Table -->
  <g filter="url(#shadow)" transform="translate(470, 40)" font-family="Arial, sans-serif" font-size="10">
    <rect x="0" y="0" width="180" height="230" rx="4" fill="#FFFFFF" stroke="#EF4444" stroke-width="2" />
    <rect x="0" y="0" width="180" height="30" fill="#EF4444" rx="4" />
    <text x="90" y="20" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle">Incident</text>
    
    <text x="10" y="55" font-weight="bold">id : String [PK]</text>
    <text x="10" y="75">title : String</text>
    <text x="10" y="95">status : String</text>
    <text x="10" y="115">severity : String</text>
    <text x="10" y="135">systemId : String [FK]</text>
    <text x="10" y="155">teamId : String [FK]</text>
    <text x="10" y="175">userId : String [FK]</text>
    <text x="10" y="195">slaId : String [FK]</text>
    <text x="10" y="215">astreinteId : String [FK]</text>
  </g>

  <!-- User -> Incident Relation -->
  <path d="M 120 190 L 120 310 L 560 310 L 560 270" stroke="#4B5563" stroke-width="1.5" fill="none" />
  <circle cx="120" cy="195" r="3" fill="#4B5563" />
  <line x1="555" y1="280" x2="565" y2="280" stroke="#4B5563" stroke-width="1.5" />

  <!-- System Table -->
  <g filter="url(#shadow)" transform="translate(710, 40)" font-family="Arial, sans-serif" font-size="10">
    <rect x="0" y="0" width="140" height="90" rx="4" fill="#FFFFFF" stroke="#047857" stroke-width="2" />
    <rect x="0" y="0" width="140" height="30" fill="#047857" rx="4" />
    <text x="70" y="20" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle">System</text>
    
    <text x="10" y="50" font-weight="bold">id : String [PK]</text>
    <text x="10" y="70">name : String [Unique]</text>
  </g>

  <!-- System -> Incident Relation -->
  <path d="M 710 85 L 650 85" stroke="#4B5563" stroke-width="1.5" />
  <circle cx="655" cy="85" r="3" fill="#4B5563" />
  <line x1="700" y1="80" x2="700" y2="90" stroke="#4B5563" stroke-width="1.5" />

  <!-- SLA Table -->
  <g filter="url(#shadow)" transform="translate(710, 160)" font-family="Arial, sans-serif" font-size="10">
    <rect x="0" y="0" width="140" height="110" rx="4" fill="#FFFFFF" stroke="#D97706" stroke-width="2" />
    <rect x="0" y="0" width="140" height="30" fill="#D97706" rx="4" />
    <text x="70" y="20" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle">SLA</text>
    
    <text x="10" y="50" font-weight="bold">id : String [PK]</text>
    <text x="10" y="70">mttaLimit : Int</text>
    <text x="10" y="90">mttrLimit : Int</text>
  </g>

  <!-- SLA -> Incident Relation -->
  <path d="M 710 205 L 650 205" stroke="#4B5563" stroke-width="1.5" />
  <circle cx="655" cy="205" r="3" fill="#4B5563" />
  <line x1="700" y1="200" x2="700" y2="210" stroke="#4B5563" stroke-width="1.5" />
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'database_erd_diagram.svg'), wrapSVG(900, 360, content), 'utf-8');
};

// 14. WEBSOCKET REALTIME
const generateWebSocketRealtime = () => {
  const content = `
  <!-- Clients (React) -->
  <g filter="url(#shadow)" transform="translate(40, 50)" font-family="Arial, sans-serif" font-size="11">
    <rect x="0" y="0" width="160" height="200" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2" />
    <text x="80" y="25" font-weight="bold" fill="#1E40AF" text-anchor="middle">Clients Web (React)</text>
    
    <rect x="15" y="50" width="130" height="30" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
    <text x="25" y="68">Opérateur N1</text>

    <rect x="15" y="95" width="130" height="30" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
    <text x="25" y="113">Astreinte IT</text>

    <rect x="15" y="140" width="130" height="30" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
    <text x="25" y="158">Manager DSI</text>
  </g>

  <!-- Connection Lines (WebSockets) -->
  <g stroke="#374151" stroke-width="2">
    <path d="M 200 100 L 360 100" marker-end="url(#arrow)" />
    <path d="M 200 150 L 360 150" marker-end="url(#arrow)" />
  </g>
  <text x="280" y="85" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Connexion WS persistante</text>
  <text x="280" y="135" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Authentification JWT</text>

  <!-- Socket.IO Server Rooms -->
  <g filter="url(#shadow)" transform="translate(380, 50)" font-family="Arial, sans-serif" font-size="11">
    <rect x="0" y="0" width="280" height="200" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="140" y="25" font-weight="bold" fill="#6D28D9" text-anchor="middle">Instance Socket.IO (Backend)</text>
    
    <!-- Room global -->
    <g transform="translate(20, 50)">
      <rect x="0" y="0" width="240" height="50" rx="4" fill="#F3E8FF" stroke="#C084FC" />
      <text x="120" y="20" font-weight="bold" fill="#6B21A8" text-anchor="middle">Room "global"</text>
      <text x="120" y="38" font-size="9" fill="#7E22CE" text-anchor="middle">Evénements: incident:created, alert:sla</text>
    </g>

    <!-- Room warroom -->
    <g transform="translate(20, 120)">
      <rect x="0" y="0" width="240" height="60" rx="4" fill="#F3E8FF" stroke="#C084FC" />
      <text x="120" y="20" font-weight="bold" fill="#6B21A8" text-anchor="middle">Room "incident:uuid" (War Room)</text>
      <text x="120" y="38" font-size="9" fill="#7E22CE" text-anchor="middle">Evénements: chat:message, system:event</text>
    </g>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'websocket_realtime_architecture.svg'), wrapSVG(700, 300, content), 'utf-8');
};

// 15. ASYNC WORKERS
const generateAsyncWorkers = () => {
  const content = `
  <!-- API Server -->
  <g filter="url(#shadow)" transform="translate(30, 80)" font-family="Arial, sans-serif" font-size="11">
    <rect x="0" y="0" width="160" height="120" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2" />
    <text x="80" y="30" font-weight="bold" fill="#1E40AF" text-anchor="middle">App Backend</text>
    <text x="80" y="50" fill="#2563EB" text-anchor="middle">(Express API)</text>
    <text x="80" y="80" font-size="9" fill="#4B5563" text-anchor="middle">Pousse les tâches lourdes</text>
    <text x="80" y="95" font-size="9" fill="#4B5563" text-anchor="middle">sans attendre la fin</text>
  </g>

  <!-- Connect -->
  <path d="M 190 140 L 260 140" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <text x="225" y="125" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">addJob()</text>

  <!-- Redis Queue -->
  <g filter="url(#shadow)" transform="translate(280, 80)" font-family="Arial, sans-serif" font-size="11">
    <rect x="0" y="0" width="160" height="120" rx="6" fill="#FEE2E2" stroke="#EF4444" stroke-width="2" />
    <text x="80" y="30" font-weight="bold" fill="#991B1B" text-anchor="middle">Redis Queue</text>
    <text x="80" y="50" fill="#DC2626" text-anchor="middle">(BullMQ Queue)</text>
    <text x="80" y="80" font-size="9" fill="#4B5563" text-anchor="middle">File de stockage</text>
    <text x="80" y="95" font-size="9" fill="#4B5563" text-anchor="middle">mémoire temporaire</text>
  </g>

  <!-- Connect -->
  <path d="M 440 140 L 510 140" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <text x="475" y="125" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">process()</text>

  <!-- Worker Process -->
  <g filter="url(#shadow)" transform="translate(530, 80)" font-family="Arial, sans-serif" font-size="11">
    <rect x="0" y="0" width="160" height="120" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="80" y="30" font-weight="bold" fill="#6D28D9" text-anchor="middle">Worker Process</text>
    <text x="80" y="50" fill="#7C3AED" text-anchor="middle">(BullMQ Worker)</text>
    <text x="80" y="80" font-size="9" fill="#4B5563" text-anchor="middle">Consomme le job</text>
    <text x="80" y="95" font-size="9" fill="#4B5563" text-anchor="middle">et exécute l'action</text>
  </g>

  <!-- Targets connection -->
  <path d="M 690 140 L 730 140" stroke="#374151" stroke-width="2" />
  <path d="M 730 60 L 775 60" stroke="#374151" stroke-width="1.5" marker-end="url(#arrow)" />
  <path d="M 730 140 L 775 140" stroke="#374151" stroke-width="1.5" marker-end="url(#arrow)" />
  <path d="M 730 220 L 775 220" stroke="#374151" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- Target Blocks -->
  <g filter="url(#shadow)" font-family="Arial, sans-serif" font-size="10" fill="#065F46" text-anchor="middle">
    <!-- DB -->
    <rect x="790" y="40" width="100" height="40" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="1.5" />
    <text x="840" y="65">PostgreSQL (DB)</text>
    
    <!-- Email -->
    <rect x="790" y="120" width="100" height="40" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="1.5" />
    <text x="840" y="145">SMTP Server (Mail)</text>
    
    <!-- Webhook -->
    <rect x="790" y="200" width="100" height="40" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="1.5" />
    <text x="840" y="225">Webhook Client</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'async_workers_architecture.svg'), wrapSVG(920, 280, content), 'utf-8');
};

// 16. JWT ROTATION SEQUENCE
const generateJwtRotationSequence = () => {
  const content = `
  <!-- Vertical Lifelines -->
  <g stroke="#374151" stroke-width="1" stroke-dasharray="4">
    <line x1="80" y1="80" x2="80" y2="700" />
    <line x1="240" y1="80" x2="240" y2="700" />
    <line x1="400" y1="80" x2="400" y2="700" />
    <line x1="560" y1="80" x2="560" y2="700" />
    <line x1="720" y1="80" x2="720" y2="700" />
  </g>

  <!-- Lifeline Headers -->
  <g filter="url(#shadow)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">
    <rect x="30" y="30" width="100" height="40" rx="4" fill="#E5E7EB" stroke="#374151" />
    <text x="80" y="55">Client (Browser)</text>

    <rect x="190" y="30" width="100" height="40" rx="4" fill="#DBEAFE" stroke="#2563EB" />
    <text x="240" y="55" fill="#1E40AF">API Gateway</text>

    <rect x="310" y="30" width="100" height="40" rx="4" fill="#ECFDF5" stroke="#047857" />
    <text x="400" y="55" fill="#047857">Database (DB)</text>

    <rect x="510" y="30" width="100" height="40" rx="4" fill="#FEF3C7" stroke="#D97706" />
    <text x="560" y="55" fill="#B45309">JWT Service</text>

    <rect x="670" y="30" width="100" height="40" rx="4" fill="#FEE2E2" stroke="#EF4444" />
    <text x="720" y="55" fill="#EF4444">Pirate (Attacker)</text>
  </g>

  <!-- Activation Bars -->
  <g fill="#F3F4F6" stroke="#374151" stroke-width="1">
    <!-- Client -->
    <rect x="76" y="100" width="8" height="410" />
    
    <!-- API Gateway -->
    <rect x="236" y="110" width="8" height="115" />
    <rect x="236" y="265" width="8" height="40" />
    <rect x="236" y="345" width="8" height="165" />
    <rect x="236" y="555" width="8" height="115" />
    
    <!-- DB -->
    <rect x="396" y="130" width="8" height="20" />
    <rect x="396" y="370" width="8" height="40" />
    <rect x="396" y="470" width="8" height="20" />
    <rect x="396" y="580" width="8" height="65" />
    
    <!-- JWT -->
    <rect x="556" y="155" width="8" height="40" />
    <rect x="556" y="420" width="8" height="40" />
    
    <!-- Pirate -->
    <rect x="716" y="555" width="8" height="115" />
  </g>

  <!-- Phase 1: Login & Token Issuance -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <path d="M 84 115 L 236 115" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="160" y="107" text-anchor="middle">1. POST /login</text>

    <path d="M 244 135 L 396 135" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="320" y="127" text-anchor="middle">2. saveRefreshToken(RT1)</text>

    <path d="M 244 160 L 556 160" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="400" y="152" text-anchor="middle">3. signTokens()</text>

    <path d="M 556 185 L 244 185" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="400" y="177" text-anchor="middle">4. AT1 (15m) + RT1 (7d)</text>

    <path d="M 236 210 L 84 210" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="160" y="202" text-anchor="middle">5. Set RT1 in HttpOnly Cookie</text>
  </g>

  <!-- Divider: Token Expiry -->
  <line x1="40" y1="240" x2="760" y2="240" stroke="#9CA3AF" stroke-dasharray="4" />
  <text x="400" y="235" font-family="Arial, sans-serif" font-size="9" fill="#9CA3AF" text-anchor="middle">[ Temps s'écoule : AT1 expire ]</text>

  <!-- Phase 2.1: Expiration & HTTP 401 -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <path d="M 84 275 L 236 275" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="160" y="267" text-anchor="middle">6. GET /api/protected (with AT1)</text>

    <path d="M 236 300 L 84 300" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="2" marker-end="url(#arrow-red)" />
    <text x="160" y="292" fill="#EF4444" text-anchor="middle">7. HTTP 401 Unauthorized (Expired)</text>
  </g>

  <!-- Phase 2.2: Silent Refresh & Token Rotation -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <path d="M 84 355 L 236 355" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="160" y="347" text-anchor="middle">8. POST /refresh (Cookie RT1)</text>

    <path d="M 244 375 L 396 375" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="320" y="367" text-anchor="middle">9. verifyAndRevoke(RT1)</text>

    <path d="M 396 405 L 244 405" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="320" y="397" text-anchor="middle">10. RT1 is valid (Revoked &amp; rotated)</text>

    <path d="M 244 430 L 556 430" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="400" y="422" text-anchor="middle">11. signNewTokens()</text>

    <path d="M 556 455 L 244 455" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="400" y="447" text-anchor="middle">12. Return AT2 + RT2</text>

    <path d="M 244 475 L 396 475" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="320" y="467" text-anchor="middle">13. saveRefreshToken(RT2)</text>

    <path d="M 236 500 L 84 500" stroke="#4B5563" stroke-width="1" stroke-dasharray="2" marker-end="url(#arrow)" />
    <text x="160" y="492" text-anchor="middle">14. Set RT2 in Cookie (AT2 returned)</text>
  </g>

  <!-- Divider: Replay Attack -->
  <line x1="40" y1="530" x2="760" y2="530" stroke="#9CA3AF" stroke-dasharray="4" />
  <text x="400" y="525" font-family="Arial, sans-serif" font-size="9" fill="#EF4444" font-weight="bold" text-anchor="middle">[ Phase 3 : Détection du rejeu du Refresh Token RT1 par un pirate ]</text>

  <!-- Phase 3: Protection against Replay Attack -->
  <g font-family="Arial, sans-serif" font-size="10" fill="#374151">
    <path d="M 716 565 L 244 565" stroke="#EF4444" stroke-width="1.5" marker-end="url(#arrow-red)" />
    <text x="480" y="557" fill="#EF4444" font-weight="bold" text-anchor="middle">15. POST /refresh (Intercepted Cookie RT1)</text>

    <path d="M 244 585 L 396 585" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="320" y="577" text-anchor="middle">16. verifyAndRevoke(RT1)</text>

    <path d="M 396 610 L 244 610" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="2" marker-end="url(#arrow-red)" />
    <text x="320" y="602" fill="#EF4444" font-weight="bold" text-anchor="middle">17. RT1 has already been used!</text>

    <path d="M 244 635 L 396 635" stroke="#EF4444" stroke-width="1.5" marker-end="url(#arrow-red)" />
    <text x="320" y="627" fill="#EF4444" font-weight="bold" text-anchor="middle">18. revokeAllTokensForUser()</text>

    <path d="M 244 665 L 716 665" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="2" marker-end="url(#arrow-red)" />
    <text x="480" y="657" fill="#EF4444" font-weight="bold" text-anchor="middle">19. HTTP 403 Forbidden</text>
  </g>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'jwt_rotation_sequence.svg'), wrapSVG(800, 720, content), 'utf-8');
};

// 17. DOCKER SERVICES DEPENDENCIES
const generateDockerServicesDependencies = () => {
  const content = `
  <!-- Column Headers -->
  <g font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#374151" text-anchor="middle">
    <text x="130" y="45">Client &amp; Astreintes</text>
    <text x="330" y="45">Application Core</text>
    <text x="530" y="45">Bases de Données &amp; Storage</text>
    <text x="710" y="45">Télémétrie (Exporters)</text>
    <text x="890" y="45">Supervision &amp; Logs</text>
  </g>

  <!-- Group Boxes background -->
  <!-- App Stack Boundary -->
  <rect x="40" y="55" width="580" height="425" rx="8" fill="none" stroke="#E5E7EB" stroke-width="1.5" stroke-dasharray="4" />
  <text x="50" y="70" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#9CA3AF">App &amp; Data Stack</text>

  <!-- Monitoring Stack Boundary -->
  <rect x="800" y="55" width="180" height="585" rx="8" fill="none" stroke="#E5E7EB" stroke-width="1.5" stroke-dasharray="4" />
  <text x="810" y="70" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#9CA3AF">Observabilité Stack</text>

  <!-- Nodes (16 + 3) -->
  <!-- Column 1: Client & Workers -->
  <!-- Frontend (Nginx) -->
  <g filter="url(#shadow)" transform="translate(60, 80)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#F0F9FF" stroke="#0284C7" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#0369A1" text-anchor="middle">frontend</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#0284C7" text-anchor="middle">Nginx (SPA React)</text>
  </g>

  <!-- Workers Group -->
  <g filter="url(#shadow)" transform="translate(60, 180)">
    <rect x="0" y="0" width="140" height="280" rx="8" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
    <text x="70" y="20" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#6D28D9" text-anchor="middle">Workers (BullMQ)</text>
    
    <!-- SLA Worker -->
    <g transform="translate(10, 30)">
      <rect x="0" y="0" width="120" height="45" rx="4" fill="#EDE7F6" stroke="#9F7AEA" stroke-width="1" />
      <text x="60" y="26" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#5B21B6" text-anchor="middle">sla-worker</text>
    </g>
    <!-- Webhook Worker -->
    <g transform="translate(10, 90)">
      <rect x="0" y="0" width="120" height="45" rx="4" fill="#EDE7F6" stroke="#9F7AEA" stroke-width="1" />
      <text x="60" y="26" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#5B21B6" text-anchor="middle">webhook-worker</text>
    </g>
    <!-- Cleanup Worker -->
    <g transform="translate(10, 150)">
      <rect x="0" y="0" width="120" height="45" rx="4" fill="#EDE7F6" stroke="#9F7AEA" stroke-width="1" />
      <text x="60" y="26" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#5B21B6" text-anchor="middle">cleanup-worker</text>
    </g>
    <!-- Astreinte Worker -->
    <g transform="translate(10, 210)">
      <rect x="0" y="0" width="120" height="45" rx="4" fill="#EDE7F6" stroke="#9F7AEA" stroke-width="1" />
      <text x="60" y="26" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#5B21B6" text-anchor="middle">astreinte-worker</text>
    </g>
  </g>

  <!-- Column 2: Application Core -->
  <!-- Backend API -->
  <g filter="url(#shadow)" transform="translate(260, 80)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#F0F9FF" stroke="#0284C7" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#0369A1" text-anchor="middle">backend</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#0284C7" text-anchor="middle">Express / Socket.IO</text>
  </g>

  <!-- Redis -->
  <g filter="url(#shadow)" transform="translate(260, 200)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#047857" text-anchor="middle">redis</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">Queue &amp; Cache</text>
  </g>

  <!-- MinIO -->
  <g filter="url(#shadow)" transform="translate(260, 320)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#047857" text-anchor="middle">minio</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">S3 Object Storage</text>
  </g>

  <!-- Column 3: Databases & Storage -->
  <!-- Adminer -->
  <g filter="url(#shadow)" transform="translate(460, 80)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#F3F4F6" stroke="#4B5563" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#374151" text-anchor="middle">adminer</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Database GUI</text>
  </g>

  <!-- PgBouncer -->
  <g filter="url(#shadow)" transform="translate(460, 200)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#047857" text-anchor="middle">pgbouncer</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">Connection Pooler</text>
  </g>

  <!-- PostgreSQL -->
  <g filter="url(#shadow)" transform="translate(460, 320)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#047857" text-anchor="middle">postgres</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">PostgreSQL 16 DB</text>
  </g>

  <!-- Column 4: Telemetry Exporters (The "+3" services) -->
  <!-- Redis Exporter -->
  <g filter="url(#shadow)" transform="translate(640, 200)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#F9FAFB" stroke="#4B5563" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#374151" text-anchor="middle">redis-exporter</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Scrapes Redis INFO</text>
  </g>

  <!-- Postgres Exporter -->
  <g filter="url(#shadow)" transform="translate(640, 320)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#F9FAFB" stroke="#4B5563" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#374151" text-anchor="middle">postgres-exporter</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Scrapes pg_stat metrics</text>
  </g>

  <!-- Node Exporter -->
  <g filter="url(#shadow)" transform="translate(640, 440)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#F9FAFB" stroke="#4B5563" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#374151" text-anchor="middle">node-exporter</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#4B5563" text-anchor="middle">Scrapes EC2 Hardware</text>
  </g>

  <!-- Column 5: Observability Stack -->
  <!-- Loki -->
  <g filter="url(#shadow)" transform="translate(820, 80)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#B45309" text-anchor="middle">loki</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#D97706" text-anchor="middle">Log Aggregator</text>
  </g>

  <!-- Promtail -->
  <g filter="url(#shadow)" transform="translate(820, 200)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#B45309" text-anchor="middle">promtail</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#D97706" text-anchor="middle">Scrapes Container Logs</text>
  </g>

  <!-- Prometheus -->
  <g filter="url(#shadow)" transform="translate(820, 320)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#B45309" text-anchor="middle">prometheus</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#D97706" text-anchor="middle">Metrics DB (Pull Model)</text>
  </g>

  <!-- Alertmanager -->
  <g filter="url(#shadow)" transform="translate(820, 440)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#B45309" text-anchor="middle">alertmanager</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#D97706" text-anchor="middle">Alert Routing &amp; Email</text>
  </g>

  <!-- Grafana -->
  <g filter="url(#shadow)" transform="translate(820, 560)">
    <rect x="0" y="0" width="140" height="60" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="2" />
    <text x="70" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#B45309" text-anchor="middle">grafana</text>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="9" fill="#D97706" text-anchor="middle">Visualization (Port 3001)</text>
  </g>


  <!-- Dependency Connector Lines -->
  <!-- 1. Frontend -> Backend -->
  <path d="M 200 110 L 250 110" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="230" y="102" font-family="Arial, sans-serif" font-size="8" fill="#4B5563" text-anchor="middle">HTTP/REST</text>

  <!-- 2. Backend -> Redis -->
  <path d="M 330 140 L 330 190" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />
  
  <!-- 3. Backend -> MinIO -->
  <path d="M 380 140 L 380 170 L 420 170 L 420 340 L 410 340" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="425" y="240" font-family="Arial, sans-serif" font-size="8" fill="#4B5563" text-anchor="start">S3 API</text>

  <!-- 4. Backend -> PgBouncer -->
  <path d="M 400 110 L 430 110 L 430 230 L 450 230" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="435" y="150" font-family="Arial, sans-serif" font-size="8" fill="#4B5563" text-anchor="start">SQL Pool</text>

  <!-- 5. Workers -> Redis -->
  <path d="M 200 320 L 230 320 L 230 230 L 250 230" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="235" y="280" font-family="Arial, sans-serif" font-size="8" fill="#4B5563" text-anchor="middle">Jobs</text>

  <!-- 6. Workers -> PgBouncer -->
  <path d="M 200 360 L 430 360 L 430 250 L 450 250" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- 7. PgBouncer -> PostgreSQL -->
  <path d="M 530 260 L 530 310" fill="none" stroke="#10B981" stroke-width="1.5" marker-end="url(#arrow)" />
  
  <!-- 8. Adminer -> PostgreSQL -->
  <path d="M 600 110 L 615 110 L 615 340 L 610 340" fill="none" stroke="#4B5563" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- 9. Telemetry Connections (Exporters -> Services) -->
  <!-- Redis Exporter -> Redis -->
  <path d="M 640 230 L 410 230" fill="none" stroke="#4B5563" stroke-width="1.2" stroke-dasharray="2" marker-end="url(#arrow)" />
  <!-- Postgres Exporter -> Postgres -->
  <path d="M 640 350 L 610 350" fill="none" stroke="#4B5563" stroke-width="1.2" stroke-dasharray="2" marker-end="url(#arrow)" />

  <!-- 10. Prometheus Scrape pulls -->
  <!-- Pull Redis Exporter -->
  <path d="M 820 330 L 790 330 L 790 230 L 780 230" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  <!-- Pull Postgres Exporter -->
  <path d="M 820 350 L 780 350" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  <!-- Pull Node Exporter -->
  <path d="M 820 370 L 790 370 L 790 470 L 780 470" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  <!-- Pull Backend API -->
  <path d="M 820 325 L 800 325 L 800 150 L 330 150 L 330 145" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="760" y="160" font-family="Arial, sans-serif" font-size="8" fill="#D97706" text-anchor="middle">pull /metrics</text>

  <!-- 11. Logging Flows -->
  <!-- Promtail -> Loki -->
  <path d="M 890 200 L 890 150" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="895" y="175" font-family="Arial, sans-serif" font-size="8" fill="#D97706" text-anchor="start">push logs</text>

  <!-- 12. Alertmanager -> Prometheus -->
  <path d="M 890 380 L 890 430" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- 13. Grafana Pulls -->
  <!-- Grafana -> Prometheus -->
  <path d="M 870 560 L 870 390" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  <!-- Grafana -> Loki -->
  <path d="M 960 590 L 980 590 L 980 110 L 970 110" fill="none" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow)" />
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'docker_services_dependencies.svg'), wrapSVG(1000, 750, content), 'utf-8');
};

// 18. AWS EC2 DEPLOYMENT TOPOLOGY
const generateAwsEc2Deployment = () => {
  const content = `
  <!-- External World / Internet -->
  <g font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#374151" text-anchor="middle">
    <rect x="20" y="80" width="160" height="460" rx="8" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="1.5" />
    <text x="100" y="100" font-size="13" fill="#4B5563">Internet Public</text>
    
    <!-- User Client -->
    <g transform="translate(40, 130)">
      <circle cx="60" cy="-20" r="10" fill="none" stroke="#3B82F6" stroke-width="2"/>
      <line x1="60" y1="-10" x2="60" y2="15" stroke="#3B82F6" stroke-width="2"/>
      <line x1="45" y1="0" x2="75" y2="0" stroke="#3B82F6" stroke-width="2"/>
      <line x1="60" y1="15" x2="48" y2="35" stroke="#3B82F6" stroke-width="2"/>
      <line x1="60" y1="15" x2="72" y2="35" stroke="#3B82F6" stroke-width="2"/>
      <text x="60" y="55" font-weight="bold" font-size="11" fill="#1D4ED8" text-anchor="middle">Client (Opérateur)</text>
      <text x="60" y="68" font-size="9" fill="#2563EB" text-anchor="middle">Web / WebSocket</text>
    </g>

    <!-- Admin SSH -->
    <g transform="translate(40, 270)">
      <rect x="10" y="-10" width="100" height="50" rx="4" fill="#F3F4F6" stroke="#4B5563" stroke-width="1.5" />
      <text x="60" y="10" font-size="10" fill="#374151">Administrateur</text>
      <text x="60" y="25" font-size="9" fill="#6B7280">(Console SSH)</text>
    </g>

    <!-- SMTP Server -->
    <g transform="translate(40, 390)">
      <rect x="10" y="-10" width="100" height="50" rx="4" fill="#ECFDF5" stroke="#059669" stroke-width="1.5" />
      <text x="60" y="10" font-size="10" fill="#047857">SMTP Serveur</text>
      <text x="60" y="25" font-size="9" fill="#065F46">(Banque / SMTP)</text>
    </g>
  </g>

  <!-- AWS EC2 Host Boundary -->
  <g filter="url(#shadow)" transform="translate(260, 40)">
    <rect x="0" y="0" width="600" height="540" rx="10" fill="#FFFFFF" stroke="#F97316" stroke-width="2.5" />
    <text x="20" y="28" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#C2410C">Serveur Virtuel AWS EC2 (Ubuntu 22.04 LTS)</text>
    <text x="20" y="45" font-family="Arial, sans-serif" font-size="10" fill="#EA580C">Adresse IP Publique (CIH Bank / BAM DMZ)</text>

    <!-- Host OS services -->
    <g transform="translate(40, 70)" font-family="Arial, sans-serif" font-size="10">
      <rect x="0" y="0" width="140" height="35" rx="4" fill="#FFF7ED" stroke="#F97316" stroke-width="1" />
      <text x="70" y="21" font-weight="bold" fill="#C2410C" text-anchor="middle">Daemon Docker 24+</text>
    </g>
    <g transform="translate(200, 70)" font-family="Arial, sans-serif" font-size="10">
      <rect x="0" y="0" width="140" height="35" rx="4" fill="#FFF7ED" stroke="#F97316" stroke-width="1" />
      <text x="70" y="21" font-weight="bold" fill="#C2410C" text-anchor="middle">Certbot (SSL Certs)</text>
    </g>

    <!-- Docker Network Boundary -->
    <g transform="translate(20, 130)">
      <rect x="0" y="0" width="560" height="380" rx="8" fill="#F8FAFC" stroke="#3B82F6" stroke-width="2" stroke-dasharray="6,4" />
      <text x="15" y="22" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#1D4ED8">Réseau Docker Interne (prodkb-network — 172.20.0.0/16)</text>
      
      <!-- Containers Grid -->
      <!-- Column 1 (Proxy/API) -->
      <!-- frontend -->
      <g filter="url(#shadow)" transform="translate(30, 50)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#1E40AF" text-anchor="middle">frontend</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#2563EB" text-anchor="middle">Nginx / Static SPA</text>
        <rect x="-10" y="18" width="20" height="15" rx="2" fill="#3B82F6" />
        <text x="0" y="29" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#FFFFFF" text-anchor="middle">80</text>
      </g>
      <!-- backend -->
      <g filter="url(#shadow)" transform="translate(30, 160)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#1E40AF" text-anchor="middle">backend</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#2563EB" text-anchor="middle">Express / API</text>
        <rect x="-10" y="18" width="22" height="15" rx="2" fill="#3B82F6" />
        <text x="1" y="29" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#FFFFFF" text-anchor="middle">3000</text>
      </g>

      <!-- Column 2 (Cache & Store) -->
      <!-- redis -->
      <g filter="url(#shadow)" transform="translate(210, 50)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#065F46" text-anchor="middle">redis</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">BullMQ / Cache</text>
      </g>
      <!-- pgbouncer -->
      <g filter="url(#shadow)" transform="translate(210, 160)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#065F46" text-anchor="middle">pgbouncer</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">Connection Pool</text>
      </g>
      <!-- postgres -->
      <g filter="url(#shadow)" transform="translate(210, 270)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#065F46" text-anchor="middle">postgres</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">Database (SQL)</text>
      </g>

      <!-- Column 3 (Workers & Storage) -->
      <!-- minio -->
      <g filter="url(#shadow)" transform="translate(390, 50)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#065F46" text-anchor="middle">minio</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#059669" text-anchor="middle">S3 Files Storage</text>
      </g>
      <!-- Workers -->
      <g filter="url(#shadow)" transform="translate(390, 160)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#5B21B6" text-anchor="middle">sla-worker</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#7C3AED" text-anchor="middle">(&amp; Astreinte/Mail)</text>
      </g>
      <!-- promtail -->
      <g filter="url(#shadow)" transform="translate(390, 270)">
        <rect x="0" y="0" width="140" height="60" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5" />
        <text x="70" y="25" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#B45309" text-anchor="middle">promtail</text>
        <text x="70" y="42" font-family="Arial, sans-serif" font-size="9" fill="#D97706" text-anchor="middle">Collecteur Logs</text>
      </g>
    </g>
  </g>

  <!-- Firewall Firewall overlay at x=260 -->
  <line x1="260" y1="40" x2="260" y2="580" stroke="#EF4444" stroke-width="3" stroke-dasharray="8,4" />
  <rect x="235" y="60" width="50" height="20" rx="3" fill="#EF4444" />
  <text x="260" y="73" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#FFFFFF" text-anchor="middle">FW</text>

  <!-- Open Firewall Ports indicators -->
  <!-- Port 80/443 (HTTP/HTTPS) -->
  <circle cx="260" cy="180" r="10" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5" />
  <text x="260" y="200" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#10B981" text-anchor="middle">80/443</text>
  
  <!-- Port 22 (SSH) -->
  <circle cx="260" cy="310" r="10" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5" />
  <text x="260" y="330" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#10B981" text-anchor="middle">22</text>

  <!-- Blocked Ports (e.g. 5432, 6379) -->
  <circle cx="260" cy="400" r="10" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5" />
  <line x1="255" y1="395" x2="265" y2="405" stroke="#FFFFFF" stroke-width="2" />
  <line x1="265" y1="395" x2="255" y2="405" stroke="#FFFFFF" stroke-width="2" />
  <text x="260" y="420" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#EF4444" text-anchor="middle">6379/5432</text>

  <!-- Network Traffic Arrows -->
  <!-- Public user -> port 80/443 -> frontend Nginx -->
  <path d="M 180 180 L 250 180" fill="none" stroke="#3B82F6" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 270 180 L 340 210" fill="none" stroke="#3B82F6" stroke-width="2" marker-end="url(#arrow)" />
  <text x="190" y="168" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#1D4ED8">Clients (HTTPS)</text>

  <!-- SSH Admin -> port 22 -> Host OS -->
  <path d="M 140 310 L 250 310" fill="none" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 270 310 L 290 310" fill="none" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow)" />
  <text x="180" y="298" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#4B5563">SSH Admin</text>

  <!-- Frontend -> Backend (Proxy API) -->
  <path d="M 430 240 L 430 260 L 320 260 L 320 310" fill="none" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="360" y="255" font-family="Arial, sans-serif" font-size="8" fill="#1D4ED8" text-anchor="middle">proxy /api</text>

  <!-- Backend -> Redis (inside network) -->
  <path d="M 430 330 L 470 240" fill="none" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow)" />
  
  <!-- Backend -> PgBouncer -->
  <path d="M 430 350 L 470 350" fill="none" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- PgBouncer -> Postgres -->
  <path d="M 510 370 L 510 400" fill="none" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- Workers -> Redis -->
  <path d="M 590 310 L 510 270" fill="none" stroke="#7C3AED" stroke-width="1.5" marker-end="url(#arrow)" />

  <!-- Workers -> SMTP Outbound -->
  <path d="M 590 350 L 320 480 Q 280 490 270 490" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <path d="M 250 490 Q 220 490 150 460" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrow)" />
  <text x="210" y="475" font-family="Arial, sans-serif" font-size="8" fill="#B91C1C">Outbound SMTP</text>
  `;
  fs.writeFileSync(path.join(IMAGES_DIR, 'aws_ec2_deployment.svg'), wrapSVG(900, 620, content), 'utf-8');
};

// RUN ALL GENERATIONS
console.log('Generating vector SVG diagrams...');
try {
  generateIncidentLifecycle();
  generateRadarChart();
  generateGlobalUseCase();
  generateIncidentsUseCase();
  generateSlaUseCase();
  generateWarRoomUseCase();
  generateIncidentCreationSequence();
  generateSlaEscalationSequence();
  generateJwtAuthSequence();
  generateModularMonolithArchitecture();
  generateLayeredArchitecture();
  generateReactFeatureArchitecture();
  generateDatabaseERD();
  generateWebSocketRealtime();
  generateAsyncWorkers();
  generateJwtRotationSequence();
  generateDockerServicesDependencies();
  generateAwsEc2Deployment();
  console.log('All vector SVG diagrams generated successfully!');
} catch (e) {
  console.error('Failed to generate diagrams:', e);
}
