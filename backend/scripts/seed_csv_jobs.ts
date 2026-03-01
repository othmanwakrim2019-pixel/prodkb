import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = [
    { system: { name: 'GP', description: 'Système GP' }, jobs: [{ code: 'GP_FDM', name: 'Traitement GP Fin de Mois' }] },
    { system: { name: 'GM', description: 'Système GM' }, jobs: [{ code: 'GM_DAILY', name: 'Traitement de la GM quotidienne' }] },
    { system: { name: 'PACK', description: 'Système PACK' }, jobs: [{ code: 'PACK_MENS', name: 'Traitements PACK et SB Mensuels' }] },
    {
        system: { name: 'COMPTA', description: 'Comptabilité' }, jobs: [
            { code: 'COMPTA_MENS', name: 'Comptabilisation ECR/GM' },
            { code: 'COMPTA_SUITE', name: 'Comptabilisation de la suite' },
            { code: 'ICNE_COMPTA', name: 'Comptabilisation ICNE EVOLAN' },
            { code: 'RECLASS_COMPTA', name: 'Ecritures Reclassement+Classif' },
            { code: 'EXTOURNES', name: 'Comptabilisation Extournes' }
        ]
    },
    { system: { name: 'SOFAC', description: 'Système SOFAC' }, jobs: [{ code: 'SOFAC_MENS', name: 'Fichiers Icne SOFAC' }] },
    { system: { name: 'EI', description: 'Echanges Interbancaires' }, jobs: [{ code: 'EI_QUOTID', name: 'Traitement Dernière EI' }] },
    { system: { name: 'EVOLAN', description: 'Système EVOLAN' }, jobs: [{ code: 'ICNE_MENS', name: 'Traitement ICNE EVOLAN Mensuel' }] },
    { system: { name: 'CLASSIF', description: 'Classification' }, jobs: [{ code: 'CLASSIF_CREANCES', name: 'Classification des créances' }] },
    { system: { name: 'DEPOT', description: 'Dépôts' }, jobs: [{ code: 'DEPOT_FDM', name: 'Extrait dépôt Fin de mois' }] },
    {
        system: { name: 'TB', description: 'Tableaux de Bord' }, jobs: [
            { code: 'TB_PREP', name: 'Préparatif TB' },
            { code: 'TB_CA', name: 'Chiffres d\'affaires TB' },
        ]
    },
    { system: { name: 'QLIK', description: 'QlikView' }, jobs: [{ code: 'QLIK_CHARGE', name: 'Chargement des données' }] },
    { system: { name: 'RISQUES', description: 'Déclaration Risques' }, jobs: [{ code: 'BAM_DECLAR', name: 'Envoi des fichiers à BAM' }] },
    { system: { name: 'GL', description: 'Grand Livre' }, jobs: [{ code: 'PURGE_GL', name: 'Purge historique GL' }] },
];

async function main() {
    console.log('Seeding systems and jobs...');
    for (const item of data) {
        // Upsert System
        let sys = await prisma.system.findFirst({ where: { name: item.system.name } });
        if (!sys) {
            sys = await prisma.system.create({ data: item.system });
            console.log(`Created system: ${sys.name}`);
        }

        // Upsert Jobs
        for (const job of item.jobs) {
            const existingJob = await prisma.job.findFirst({ where: { code: job.code, systemId: sys.id } });
            if (!existingJob) {
                await prisma.job.create({ data: { ...job, systemId: sys.id } });
                console.log(`Created job: ${job.name} under ${sys.name}`);
            }
        }
    }
    console.log('Seeding complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
