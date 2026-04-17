import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
    console.log('🔄 Resetting admin password to password123...');
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
            where: { email: 'admin@prodkb.com' },
            data: { password: hashedPassword }
        });
        console.log('✅ Admin password reset successfully!');
    } catch (error) {
        console.error('❌ Failed to reset admin password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
