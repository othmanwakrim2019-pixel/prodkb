/**
 * Master Seed Runner
 *
 * Runs all seed files in order (01 → 07).
 * Demo data (07) is optional — pass --demo flag to include it.
 *
 * Usage:
 *   npx tsx prisma/seeds/index.ts           # Core data only (roles, users, systems, SLAs, templates, config)
 *   npx tsx prisma/seeds/index.ts --demo    # Core + demo data (50 users, 120 incidents, etc.)
 */

import { disconnect } from '../helpers/seed.utils';
import { seedRoles } from './01-roles.seed';
import { seedUsers } from './02-users.seed';
import { seedSystems } from './03-systems.seed';
import { seedSLAs } from './04-slas.seed';
import { seedEmailTemplates } from './05-email-templates.seed';
import { seedConfig } from './06-config.seed';
import { seedDemo } from './07-demo.seed';

const includeDemo = process.argv.includes('--demo');

async function main(): Promise<void> {
    console.log('═══════════════════════════════════════');
    console.log('  ProdKB — Database Seed Runner');
    console.log(`  Mode: ${includeDemo ? 'FULL (core + demo)' : 'CORE ONLY'}`);
    console.log('═══════════════════════════════════════');

    // Core seeds — always run (safe for production)
    await seedRoles();
    await seedUsers();
    await seedSystems();
    await seedSLAs();
    await seedEmailTemplates();
    await seedConfig();

    // Demo seed — only when explicitly requested
    if (includeDemo) {
        await seedDemo();
    } else {
        console.log('\n Tip: Run with --demo to include demo data (50 users, 120 incidents, etc.)');
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  Seed complete!');
    console.log('═══════════════════════════════════════');
    console.log('\n  Login: admin@prodkb.com / password123\n');
}

main()
    .catch((e: Error) => {
        console.error('\n Seed failed:', e.message);
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await disconnect();
    });
