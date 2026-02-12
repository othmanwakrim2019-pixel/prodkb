const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const operatorRole = await prisma.role.findFirst({ where: { name: 'OPERATOR' } });
    if (!operatorRole) {
        console.error("OPERATOR role not found");
        return;
    }

    const editPerm = await prisma.permission.findFirst({ where: { code: 'INCIDENT_EDIT' } });
    if (!editPerm) {
        console.error("INCIDENT_EDIT permission not found");
        return;
    }

    // Check if already has it?
    // prisma update connect is idempotent usually, but let's just do it.
    console.log(`Adding ${editPerm.code} to ${operatorRole.name}...`);
    await prisma.role.update({
        where: { id: operatorRole.id },
        data: {
            permissions: {
                connect: { id: editPerm.id }
            }
        }
    });
    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
