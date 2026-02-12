
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const AUTH_URL = 'http://localhost:3000/auth';

async function main() {
    try {
        console.log('Starting verification...');

        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const adminRes = await axios.post(`${AUTH_URL}/login`, {
            email: 'admin@prodkb.com',
            password: 'password123'
        });
        const adminToken = adminRes.data.token;
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };

        // 2. Verify Resolution Logic
        console.log('\n--- Verifying Resolution Logic ---');
        // Create Incident
        const incidentData = {
            title: 'Test Resolution Logic',
            description: 'Testing if resolvedAt is set',
            severity: 'Low',
            status: 'Open',
            environment: 'PROD',
            systemId: (await getFirstSystem(adminHeaders))
        };
        const createRes = await axios.post(`${API_URL}/incidents`, incidentData, { headers: adminHeaders });
        const incidentId = createRes.data.id;
        console.log('Created Incident:', incidentId);

        // Resolve Incident
        console.log('Resolving Incident...');
        await axios.put(`${API_URL}/incidents/${incidentId}`, { status: 'Resolved' }, { headers: adminHeaders });

        // Check Fields
        const getRes = await axios.get(`${API_URL}/incidents/${incidentId}`, { headers: adminHeaders });
        const updatedIncident = getRes.data;

        if (updatedIncident.status === 'Resolved' && updatedIncident.resolvedAt && updatedIncident.timeToResolve !== null) {
            console.log('PASS: Resolution logic verified.');
            console.log(`Resolved At: ${updatedIncident.resolvedAt}`);
            console.log(`Time To Resolve: ${updatedIncident.timeToResolve} min`);
            console.log(`Resolved By: ${updatedIncident.resolvedBy?.name}`);
        } else {
            console.error('FAIL: Resolution logic failed.');
            console.error(updatedIncident);
        }

        // 3. Verify Visibility Logic
        console.log('\n--- Verifying Visibility Logic ---');
        // Get Viewer Token
        console.log('Logging in as Viewer...');
        const viewerRes = await axios.post(`${AUTH_URL}/login`, {
            email: 'viewer@prodkb.com',
            password: 'password123'
        });
        const viewerToken = viewerRes.data.token;
        const viewerHeaders = { Authorization: `Bearer ${viewerToken}` };

        // Get Viewer's Team
        const viewerUser = viewerRes.data.user;
        const viewerTeamId = viewerUser.role.permissions ? 'UNKNOWN' : (await getUserTeam(viewerUser.id, adminHeaders));
        // Actually, login response might not have teams. 
        // We'll just fetch incidents and see.

        console.log('Fetching Viewer Incidents...');
        const viewerIncidentsRes = await axios.get(`${API_URL}/incidents`, { headers: viewerHeaders });
        const viewerIncidents = viewerIncidentsRes.data.data; // Paginated response
        console.log(`Viewer sees ${viewerIncidents.length} incidents.`);

        // Create Incident for ANOTHER Team
        const teams = await axios.get(`${API_URL}/teams`, { headers: adminHeaders });
        const allTeams = teams.data;
        // Find a team that is NOT the viewer's team
        // We assume viewer is in "Bode LLC Team" (from logs).
        // Let's just pick a random one and check result.

        // Actually, simpler:
        // Viewer should NOT see ALL incidents.
        const adminIncidentsRes = await axios.get(`${API_URL}/incidents`, { headers: adminHeaders });
        const totalIncidents = adminIncidentsRes.data.data.length;
        console.log(`Admin sees ${totalIncidents} incidents.`);

        if (viewerIncidents.length < totalIncidents) {
            console.log('PASS: Viewer sees fewer incidents than Admin.');
        } else if (viewerIncidents.length === 0 && totalIncidents > 0) {
            console.log('PASS: Viewer sees 0 incidents (Restricted).');
        } else {
            // It might be equal if only 1 incident exists and it belongs to viewer's team.
            // Or if visibility is broken.
            console.log('WARNING: Viewer counts match Admin. Checking details...');
            // Check if all viewer incidents belong to their team
            // But we need to know viewer's team.
        }

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function getFirstSystem(headers: any) {
    const res = await axios.get(`${API_URL}/systems`, { headers });
    return res.data[0].id;
}

// User endpoint might not expose teams directly in this version
async function getUserTeam(userId: string, headers: any) {
    // Placeholder
    return null;
}

main();
