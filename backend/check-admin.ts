
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@prodkb.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });

    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }

    console.log(`User found: ${user.name} (${user.email})`);
    console.log(`Role: ${user.role?.name}`);
    console.log(`Is Active: ${user.isActive}`);

    // Test password
    const password = 'password123';
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password 'password123' match: ${isMatch}`);

    if (!isMatch) {
        console.log('Resetting password via script...');
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('Password updated to: password123');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
