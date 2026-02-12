
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/health';
const INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL || '60000', 10); // 1 minute

async function checkHealth() {
    try {
        const start = Date.now();
        const response = await fetch(TARGET_URL);
        const duration = Date.now() - start;

        if (response.ok) {
            try {
                const data = await response.json();
                if (data?.success) {
                    console.log(`[${new Date().toISOString()}] UP - Latency: ${duration}ms`);
                } else {
                    console.error(`[${new Date().toISOString()}] DEGRADED - Status: ${response.status}`, data);
                }
            } catch (e) {
                console.log(`[${new Date().toISOString()}] UP (Non-JSON) - Latency: ${duration}ms - Status: ${response.status}`);
            }
        } else {
            console.error(`[${new Date().toISOString()}] DOWN - Status: ${response.status} - ${response.statusText}`);
        }
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] DOWN - Error: ${error.message}`);
    }
}

console.log(`Starting monitoring probe for ${TARGET_URL}...`);
checkHealth(); // Initial check
setInterval(checkHealth, INTERVAL_MS);
