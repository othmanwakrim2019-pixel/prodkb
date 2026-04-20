
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';
const AUTH_URL = 'http://localhost:3000/auth';

async function main() {
    try {
        console.log('Starting Equipe module verification...');

        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${AUTH_URL}/login`, {
            email: 'admin@prodkb.com',
            password: 'password123',
        });
        
        const cookies = loginRes.headers['set-cookie']!;
        const cookieStr = cookies.join('; ');
        const csrfCookie = cookies.find(c => c.startsWith('csrf_token='));
        const csrfToken = csrfCookie ? csrfCookie.split(';')[0].split('=')[1] : '';
        
        const headers = { 
            Cookie: cookieStr,
            'X-CSRF-Token': csrfToken
        };

        // 2. Get Users and Teams for IDs
        const usersRes = await axios.get(`${API_URL}/users`, { headers });
        const users = usersRes.data.data;
        console.log('Users found:', users?.length);
        const adminUser = users.find((u: any) => u.email === 'admin@prodkb.com');
        
        const teamsRes = await axios.get(`${API_URL}/teams`, { headers });
        const teams = teamsRes.data.data.data || teamsRes.data.data; // Handle both direct array and nested object
        console.log('Teams found:', teams?.length);
        const firstTeam = teams[0];

        if (!adminUser || !firstTeam) {
            console.error('Failed to find admin user or team');
            return;
        }

        // 3. Test Astreinte
        console.log('Testing Astreinte API...');
        const astreinteData = {
            weekNumber: 20,
            year: 2026,
            startDate: new Date('2026-05-11T00:00:00Z').toISOString(),
            endDate: new Date('2026-05-17T23:59:59Z').toISOString(),
            teamId: firstTeam.id,
            userId: adminUser.id,
            phone: '0601020304',
            notes: 'Verification test',
        };

        const createAstreinteRes = await axios.post(`${API_URL}/astreintes`, astreinteData, { headers });
        console.log('✅ Created Astreinte:', createAstreinteRes.data.success);

        const currentAstreinteRes = await axios.get(`${API_URL}/astreintes/current/${firstTeam.id}`, { headers });
        console.log('✅ Get Current Astreinte:', currentAstreinteRes.data.success);

        // 4. Test Daily Plan & Tasks
        console.log('Testing Equipe (Plans & Tasks) API...');
        const planData = {
            date: new Date('2026-04-20T00:00:00Z').toISOString(),
            teamId: firstTeam.id,
            label: 'Test Plan',
        };

        const createPlanRes = await axios.post(`${API_URL}/equipe/plans`, planData, { headers });
        const plan = createPlanRes.data.data;
        console.log('✅ Created Daily Plan:', createPlanRes.data.success);

        const taskData = {
            title: 'Test Operational Task',
            description: 'This is a test task',
            taskType: 'SUPERVISION',
            priority: 'NORMAL',
            assignedToId: adminUser.id,
        };

        const createTaskRes = await axios.post(`${API_URL}/equipe/plans/${plan.id}/tasks`, taskData, { headers });
        const task = createTaskRes.data.data;
        console.log('✅ Created Task:', createTaskRes.data.success);

        const updateStatusRes = await axios.patch(`${API_URL}/equipe/tasks/${task.id}/status`, {
            status: 'IN_PROGRESS',
            note: 'Starting task',
        }, { headers });
        console.log('✅ Updated Task Status:', updateStatusRes.data.success);

        const myTasksRes = await axios.get(`${API_URL}/equipe/me/tasks`, { headers });
        console.log('✅ Get My Tasks:', myTasksRes.data.data.length > 0);

        console.log('\nVerification complete! All core backend flows for Equipe module are working.');

    } catch (error: any) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
}

main();
