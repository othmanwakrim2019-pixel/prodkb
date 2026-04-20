
import { prisma } from '../src/common/utils/prisma';

async function main() {
    const users = await prisma.user.findMany();
    const teams = await prisma.team.findMany();
    console.log('Users:', users.map(u => u.email));
    console.log('Teams:', teams.map(t => t.name));
    process.exit(0);
}

main();
