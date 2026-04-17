import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 20;
const REQUESTS_PER_USER = 10;

// Log in as few times as possible to avoid hitting authLimiter (max 10 in 15m)
async function getAuthCookie() {
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/v1/login`, {
            email: 'admin@prodkb.com',
            password: 'password123'
        });
        return loginRes.headers['set-cookie']?.join('; ') || '';
    } catch (err: any) {
        console.error('Initial login failed:', err.response?.data || err.message);
        return null;
    }
}

async function simulateUser(userId: number, authCookie: string) {
    const stats = {
        userId,
        successCount: 0,
        failCount: 0,
        latencies: [] as number[]
    };

    const config = { headers: { Cookie: authCookie } };

    for (let i = 0; i < REQUESTS_PER_USER; i++) {
        const start = performance.now();
        try {
            const endpoints = ['/api/v1/incidents', '/api/v1/systems', '/api/v1/users', '/health'];
            const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            
            await axios.get(`${BASE_URL}${endpoint}`, endpoint === '/health' ? {} : config);
            
            const end = performance.now();
            stats.latencies.push(end - start);
            stats.successCount++;
        } catch (err: any) {
            stats.failCount++;
            // Optional: log first error to see why it fails
            if (stats.failCount === 1) {
                // console.log(`User ${userId} first failure:`, err.response?.status, err.response?.data);
            }
        }
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    }
    return stats;
}

async function runTrafficTest() {
    console.log(`🔥 Starting High Traffic Simulation...`);
    console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`🔄 Requests per User: ${REQUESTS_PER_USER}`);
    console.log(`📊 Total Expected Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}\n`);

    const authCookie = await getAuthCookie();
    if (!authCookie) {
        console.error('Cannot run test without auth cookie.');
        return;
    }

    const startTime = performance.now();
    const userPromises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        userPromises.push(simulateUser(i, authCookie));
    }

    const results = await Promise.all(userPromises);
    const endTime = performance.now();

    const allLatencies = results.flatMap(r => r.latencies).sort((a, b) => a - b);
    const totalSuccess = results.reduce((acc, r) => acc + r.successCount, 0);
    const totalFail = results.reduce((acc, r) => acc + r.failCount, 0);
    
    const avgLatency = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
    const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)];
    const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)];

    console.log(`🏁 Simulation Results:`);
    console.log(`⏱️  Total Duration: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`✅ Success: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalFail}`);
    console.log(`📈 Throughput: ${(totalSuccess / ((endTime - startTime) / 1000)).toFixed(2)} req/s`);
    console.log(`🚀 Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`🥇 p95 Latency: ${p95?.toFixed(2)}ms`);
    console.log(`🏆 p99 Latency: ${p99?.toFixed(2)}ms`);
}

runTrafficTest();
