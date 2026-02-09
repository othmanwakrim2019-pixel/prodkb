const http = require('http');

function testEndpoint(method, path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`\n${description}`);
                console.log(`  Method: ${method} ${path}`);
                console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
                if (data) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`  Response:`, JSON.stringify(json, null, 2).substring(0, 200));
                    } catch (e) {
                        console.log(`  Response:`, data.substring(0, 200));
                    }
                }
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.log(`\n${description}`);
            console.log(`  Method: ${method} ${path}`);
            console.log(`  ❌ Error: ${e.message}`);
            resolve(0);
        });

        req.end();
    });
}

async function runTests() {
    console.log('🔍 Testing ProdKB Backend Routes...\n');
    console.log('='.repeat(60));

    // Test health endpoint
    await testEndpoint('GET', '/health', '1️⃣ Health Check');

    // Test API endpoints (these will return 401 without auth, but that proves the route exists!)
    await testEndpoint('GET', '/api/users', '2️⃣ GET /api/users (should return 401 - needs auth)');
    await testEndpoint('PUT', '/api/users/test-id', '3️⃣ PUT /api/users/:id (should return 401)');
    await testEndpoint('DELETE', '/api/users/test-id', '4️⃣ DELETE /api/users/:id (should return 401)');

    await testEndpoint('GET', '/api/systems', '5️⃣ GET /api/systems (should return 401)');
    await testEndpoint('PUT', '/api/systems/test-id', '6️⃣ PUT /api/systems/:id (should return 401)');
    await testEndpoint('DELETE', '/api/systems/test-id', '7️⃣ DELETE /api/systems/:id (should return 401)');

    await testEndpoint('PUT', '/api/jobs/test-id', '8️⃣ PUT /api/jobs/:id (should return 401)');
    await testEndpoint('DELETE', '/api/jobs/test-id', '9️⃣ DELETE /api/jobs/:id (should return 401)');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Route exists if status is 401 (Unauthorized)');
    console.log('❌ Route NOT FOUND if status is 404');
    console.log('✅ No auth required if status is 200');
}

runTests();
