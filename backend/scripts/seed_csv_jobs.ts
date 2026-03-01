import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = [
    { system: { name: 'GP', description: 'Système GP' }, jobs: [{ name: 'GP_FDM', description: 'Traitement GP Fin de Mois' }] },
    { system: { name: 'GM', description: 'Système GM' }, jobs: [{ name: 'GM_DAILY', description: 'Traitement de la GM quotidienne' }] },
    { system: { name: 'PACK', description: 'Système PACK' }, jobs: [{ name: 'PACK_MENS', description: 'Traitements PACK et SB Mensuels' }] },
    {
        system: { name: 'COMPTA', description: 'Comptabilité' }, jobs: [
            { name: 'COMPTA_MENS', description: 'Comptabilisation globale' },
            { name: 'COMPTA_SUITE', description: 'Comptabilisation suite' },
            { name: 'ICNE_COMPTA', description: 'Comptabilisation ICNE' },
            { name: 'RECLASS_COMPTA', description: 'Comptabilisation Reclassement' },
            { name: 'EXTOURNES', description: 'Comptabilisation Extournes' }
        ]
    },
    { system: { name: 'SOFAC', description: 'Système SOFAC' }, jobs: [{ name: 'SOFAC_MENS', description: 'Fichiers Icne SOFAC' }] },
    { system: { name: 'EI', description: 'Echanges Interbancaires' }, jobs: [{ name: 'EI_QUOTID', description: 'Traitement Dernière EI' }] },
    { system: { name: 'EVOLAN', description: 'Système EVOLAN' }, jobs: [{ name: 'ICNE_MENS', description: 'Traitement ICNE EVOLAN Mensuel' }] },
    { system: { name: 'CLASSIF', description: 'Classification' }, jobs: [{ name: 'CLASSIF_CREANCES', description: 'Classification des créances' }] },
    { system: { name: 'DEPOT', description: 'Dépôts' }, jobs: [{ name: 'DEPOT_FDM', description: 'Extrait dépôt Fin de mois' }] },
    {
        system: { name: 'TB', description: 'Tableaux de Bord' }, jobs: [
            { name: 'TB_PREP', description: 'Préparatif TB' },
            { name: 'TB_CA', description: 'Chiffres d\'affaires TB' },
        ]
    },
    { system: { name: 'QLIK', description: 'QlikView' }, jobs: [{ name: 'QLIK_CHARGE', description: 'Chargement des données' }] },
    { system: { name: 'RISQUES', description: 'Déclaration Risques' }, jobs: [{ name: 'BAM_DECLAR', description: 'Envoi des fichiers à BAM' }] },
    { system: { name: 'GL', description: 'Grand Livre' }, jobs: [{ name: 'PURGE_GL', description: 'Purge historique GL' }] },
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
            const existingJob = await prisma.job.findFirst({ where: { name: job.name, systemId: sys.id } });
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
