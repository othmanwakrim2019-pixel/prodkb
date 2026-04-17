import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';

async function login(email: string) {
    return await axios.post(`${BASE_URL}/auth/v1/login`, {
        email,
        password: 'password123'
    });
}

async function runSpeedTest() {
    console.log('🚀 Starting API Speed Test...\n');

    let loginRes;
    try {
        console.log('Attempting login with admin@prodkb.com...');
        const startLogin = performance.now();
        loginRes = await login('admin@prodkb.com');
        const endLogin = performance.now();
        console.log(`✅ Login (Admin): ${(endLogin - startLogin).toFixed(2)}ms`);
    } catch (e) {
        console.log('Admin login failed, attempting fallback with marianna.zulauf@yahoo.com...');
        try {
            const startLogin = performance.now();
            loginRes = await login('marianna.zulauf@yahoo.com');
            const endLogin = performance.now();
            console.log(`✅ Login (Fallback): ${(endLogin - startLogin).toFixed(2)}ms`);
        } catch (error: any) {
            console.error('❌ Login failed:', error.message);
            return;
        }
    }

    try {
        const cookies = loginRes.headers['set-cookie'];
        const axiosConfig = {
            headers: {
                Cookie: cookies?.join('; ') || ''
            }
        };

        const startHealth = performance.now();
        await axios.get(`${BASE_URL}/health`);
        const endHealth = performance.now();
        console.log(`✅ GET /health (Public): ${(endHealth - startHealth).toFixed(2)}ms`);

        const startIncidents = performance.now();
        await axios.get(`${BASE_URL}/api/v1/incidents`, axiosConfig);
        const endIncidents = performance.now();
        console.log(`✅ GET /api/v1/incidents: ${(endIncidents - startIncidents).toFixed(2)}ms`);

        const startSystems = performance.now();
        await axios.get(`${BASE_URL}/api/v1/systems`, axiosConfig);
        const endSystems = performance.now();
        console.log(`✅ GET /api/v1/systems: ${(endSystems - startSystems).toFixed(2)}ms`);

        const startUsers = performance.now();
        await axios.get(`${BASE_URL}/api/v1/users`, axiosConfig);
        const endUsers = performance.now();
        console.log(`✅ GET /api/v1/users: ${(endUsers - startUsers).toFixed(2)}ms`);

        const startProcedures = performance.now();
        await axios.get(`${BASE_URL}/api/v1/procedures`, axiosConfig);
        const endProcedures = performance.now();
        console.log(`✅ GET /api/v1/procedures: ${(endProcedures - startProcedures).toFixed(2)}ms`);

        console.log('\n✨ Speed test complete.');
    } catch (error: any) {
        console.error('❌ Speed test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

runSpeedTest();
