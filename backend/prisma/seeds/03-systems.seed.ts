/**
 * 03 — Seed Systems & Jobs
 * Creates the 10 core systems used across the application.
 * Uses upsert — safe to run multiple times.
 */

import { prisma, logSeed } from '../helpers/seed.utils';

const SYSTEMS = [
    { name: 'Core Banking', description: 'Core banking transaction processing system' },
    { name: 'Payment Gateway', description: 'Online payment processing and routing' },
    { name: 'CRM', description: 'Customer Relationship Management platform' },
    { name: 'Reporting', description: 'Business intelligence and reporting engine' },
    { name: 'HR System', description: 'Human resources management system' },
    { name: 'Mobile App', description: 'Customer-facing mobile banking application' },
    { name: 'ATM Network', description: 'ATM fleet management and monitoring' },
    { name: 'Loan Processing', description: 'Loan origination and servicing system' },
    { name: 'Fraud Detection', description: 'Real-time fraud detection and prevention' },
    { name: 'Data Warehouse', description: 'Enterprise data warehouse and ETL pipelines' },
];

export async function seedSystems(): Promise<void> {
    console.log('\nSeeding systems...');

    for (const sys of SYSTEMS) {
        const result = await prisma.system.upsert({
            where: { name: sys.name },
            update: { description: sys.description },
            create: { name: sys.name, description: sys.description },
        });
        const created = !result.updatedById && !('updatedAt' in result && result.updatedAt);
        logSeed('System', sys.name, created);
    }
}
