import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAuth() {
    console.log('Testing authentication...\n');

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { email: 'admin@prodkb.com' }
    });

    if (!user) {
        console.log('❌ User not found in database!');
        return;
    }

    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.roleId);
    console.log('   Password Hash:', user.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password);

    console.log('\n🔑 Password Test:');
    console.log('   Testing password:', testPassword);
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (!isValid) {
        console.log('\n⚠️  Password does not match! Re-hashing...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await prisma.user.update({
            where: { email: 'admin@prodkb.com' },
            data: { password: newHash }
        });
        console.log('✅ Password updated successfully!');
    }

    await prisma.$disconnect();
}

testAuth().catch(console.error);
