import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const TOTAL_REQUESTS = 1000;
const CONCURRENT_BATCH_SIZE = 50; // Process 50 requests at a time to avoid overwhelming the local machine

async function getAuthCookie() {
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/v1/login`, {
            email: 'admin@prodkb.com',
            password: 'password123'
        });
        return loginRes.headers['set-cookie']?.join('; ') || '';
    } catch (err: any) {
        console.error('Login failed:', err.response?.data || err.message);
        return null;
    }
}

async function makeRequest(config: any) {
    const start = performance.now();
    try {
        const endpoints = ['/api/v1/incidents', '/api/v1/systems', '/api/v1/users', '/health'];
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        await axios.get(`${BASE_URL}${endpoint}`, endpoint === '/health' ? {} : config);
        return { success: true, latency: performance.now() - start };
    } catch (err) {
        return { success: false, latency: performance.now() - start };
    }
}

async function run1000RequestTest() {
    console.log(`🚀 Starting 1000 Request Stress Test...`);
    
    const authCookie = await getAuthCookie();
    if (!authCookie) return;

    const config = { headers: { Cookie: authCookie } };
    const allResults = [];
    const startTime = performance.now();

    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < CONCURRENT_BATCH_SIZE && (i + j) < TOTAL_REQUESTS; j++) {
            batch.push(makeRequest(config));
        }
        const batchResults = await Promise.all(batch);
        allResults.push(...batchResults);
        
        if ((i + CONCURRENT_BATCH_SIZE) % 250 === 0) {
            console.log(`📡 Processed ${i + CONCURRENT_BATCH_SIZE}/${TOTAL_REQUESTS} requests...`);
        }
    }

    const endTime = performance.now();
    const durationSec = (endTime - startTime) / 1000;
    
    const successes = allResults.filter(r => r.success);
    const failures = allResults.filter(r => !r.success);
    const latencies = successes.map(r => r.latency).sort((a, b) => a - b);
    
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`\n🏁 1000 Request Test Results:`);
    console.log(`⏱️  Total Time: ${durationSec.toFixed(2)}s`);
    console.log(`✅ Success: ${successes.length}`);
    console.log(`❌ Failed: ${failures.length}`);
    console.log(`📈 Throughput: ${(successes.length / durationSec).toFixed(2)} req/s`);
    console.log(`🚀 Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`🥇 p95 Latency: ${p95?.toFixed(2)}ms`);
    console.log(`🏆 p99 Latency: ${p99?.toFixed(2)}ms`);
}

run1000RequestTest();
