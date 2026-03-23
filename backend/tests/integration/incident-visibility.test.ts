import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/common/utils/prisma';
import { authService } from '../../src/modules/auth/auth.service';
import { clearAuthCache } from '../../src/common/middleware/auth.middleware';

describe('Incident Visibility Integration', () => {
    const unique = Date.now().toString();
    const adminEmail = `incident-admin-${unique}@example.com`;
    const operatorEmail = `incident-operator-${unique}@example.com`;
    const globalViewerEmail = `incident-global-${unique}@example.com`;
    const password = 'password123';

    let adminId: string;
    let operatorId: string;
    let globalViewerId: string;
    let customRoleId: string;
    let teamAId: string;
    let teamBId: string;
    let systemId: string;
    let teamAIncidentId: string;
    let teamBIncidentId: string;

    const loginAndGetCookie = async (email: string) => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email, password });

        expect(response.status).toBe(200);
        const cookies = response.headers['set-cookie'];
        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith('access_token='))
            : typeof cookies === 'string' && cookies.startsWith('access_token=') ? cookies : undefined;

        expect(accessCookie).toBeDefined();
        return accessCookie!;
    };

    beforeAll(async () => {
        await prisma.user.deleteMany({
            where: {
                email: { in: [adminEmail, operatorEmail, globalViewerEmail] },
            },
        });

        await authService.register({
            name: 'Incident Admin',
            email: adminEmail,
            password,
            role: 'ADMIN',
        });

        await authService.register({
            name: 'Incident Operator',
            email: operatorEmail,
            password,
            role: 'OPERATOR',
        });

        const incidentViewPermission = await prisma.permission.findUnique({
            where: { code: 'INCIDENT_VIEW' },
        });
        const globalViewPermission = await prisma.permission.findUnique({
            where: { code: 'VIEW_ALL_INCIDENTS' },
        });

        customRoleId = `global-role-${unique}`;
        const customRole = await prisma.role.create({
            data: {
                name: `GLOBAL_INCIDENT_VIEWER_${unique}`,
                description: 'Integration test role with global incident visibility',
                permissions: {
                    connect: [
                        { id: incidentViewPermission!.id },
                        { id: globalViewPermission!.id },
                    ],
                },
            },
        });
        customRoleId = customRole.id;

        const globalViewer = await prisma.user.create({
            data: {
                name: 'Global Incident Viewer',
                email: globalViewerEmail,
                password: await prisma.user.findUnique({ where: { email: adminEmail } }).then((user) => user!.password),
                roleId: customRole.id,
                isActive: true,
            },
        });

        const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
        const operator = await prisma.user.findUniqueOrThrow({ where: { email: operatorEmail } });

        adminId = admin.id;
        operatorId = operator.id;
        globalViewerId = globalViewer.id;

        const [teamA, teamB] = await Promise.all([
            prisma.team.create({
                data: {
                    name: `Visibility Team A ${unique}`,
                    emailDistribution: `team-a-${unique}@example.com`,
                },
            }),
            prisma.team.create({
                data: {
                    name: `Visibility Team B ${unique}`,
                    emailDistribution: `team-b-${unique}@example.com`,
                },
            }),
        ]);

        teamAId = teamA.id;
        teamBId = teamB.id;

        await prisma.teamMember.create({
            data: {
                userId: operatorId,
                teamId: teamAId,
                role: 'MEMBER',
            },
        });

        const system = await prisma.system.create({
            data: {
                name: `Visibility System ${unique}`,
            },
        });
        systemId = system.id;

        const [incidentA, incidentB] = await Promise.all([
            prisma.incident.create({
                data: {
                    title: 'Team A Incident',
                    description: 'Visible to team A operator',
                    environment: 'PROD',
                    severity: 'High',
                    status: 'Open',
                    systemId,
                    createdById: adminId,
                    assignedTeamId: teamAId,
                },
            }),
            prisma.incident.create({
                data: {
                    title: 'Team B Incident',
                    description: 'Hidden from team A operator',
                    environment: 'PROD',
                    severity: 'High',
                    status: 'Open',
                    systemId,
                    createdById: adminId,
                    assignedTeamId: teamBId,
                },
            }),
        ]);

        teamAIncidentId = incidentA.id;
        teamBIncidentId = incidentB.id;

        await clearAuthCache();
    });

    afterAll(async () => {
        await clearAuthCache();
        await prisma.incident.deleteMany({
            where: { id: { in: [teamAIncidentId, teamBIncidentId] } },
        });
        await prisma.teamMember.deleteMany({
            where: { userId: operatorId },
        });
        await prisma.team.deleteMany({
            where: { id: { in: [teamAId, teamBId] } },
        });
        await prisma.system.deleteMany({
            where: { id: systemId },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [adminId, operatorId, globalViewerId] } },
        });
        await prisma.role.deleteMany({
            where: { id: customRoleId },
        });
    });

    it('allows admin users to see all incidents', async () => {
        const adminCookie = await loginAndGetCookie(adminEmail);

        const response = await request(app)
            .get('/api/v1/incidents')
            .set('Cookie', [adminCookie]);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: teamAIncidentId }),
                expect.objectContaining({ id: teamBIncidentId }),
            ]),
        );
    });

    it('allows users with VIEW_ALL_INCIDENTS to see all incidents', async () => {
        const globalViewerCookie = await loginAndGetCookie(globalViewerEmail);

        const response = await request(app)
            .get('/api/v1/incidents')
            .set('Cookie', [globalViewerCookie]);

        expect(response.status).toBe(200);
        expect(response.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: teamAIncidentId }),
                expect.objectContaining({ id: teamBIncidentId }),
            ]),
        );
    });

    it('restricts regular users to incidents assigned to their teams', async () => {
        const operatorCookie = await loginAndGetCookie(operatorEmail);

        const response = await request(app)
            .get('/api/v1/incidents')
            .set('Cookie', [operatorCookie]);

        expect(response.status).toBe(200);
        expect(response.body.data.items).toEqual([
            expect.objectContaining({ id: teamAIncidentId }),
        ]);
    });

    it('forbids regular users from fetching incidents outside their teams', async () => {
        const operatorCookie = await loginAndGetCookie(operatorEmail);

        const response = await request(app)
            .get(`/api/v1/incidents/${teamBIncidentId}`)
            .set('Cookie', [operatorCookie]);

        expect(response.status).toBe(403);
    });
});
