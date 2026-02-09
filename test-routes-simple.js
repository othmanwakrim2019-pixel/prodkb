const http = require('http');
const fs = require('fs');

const results = [];

function testEndpoint(method, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                results.push({
                    method,
                    path,
                    status: res.statusCode,
                    message: res.statusCode === 404 ? 'ROUTE NOT FOUND' :
                        res.statusCode === 401 ? 'Route exists (needs auth)' :
                            res.statusCode === 200 ? 'SUCCESS' : 'Other: ' + res.statusCode
                });
                resolve();
            });
        });

        req.on('error', (e) => {
            results.push({ method, path, status: 'ERROR', message: e.message });
            resolve();
        });

        req.end();
    });
}

async function runTests() {
    await testEndpoint('GET', '/health');
    await testEndpoint('GET', '/api/users');
    await testEndpoint('PUT', '/api/users/test-id');
    await testEndpoint('DELETE', '/api/users/test-id');
    await testEndpoint('GET', '/api/systems');
    await testEndpoint('PUT', '/api/systems/test-id');
    await testEndpoint('DELETE', '/api/systems/test-id');
    await testEndpoint('PUT', '/api/jobs/test-id');
    await testEndpoint('DELETE', '/api/jobs/test-id');

    const output = results.map(r =>
        `${r.method.padEnd(7)} ${r.path.padEnd(30)} => ${r.status.toString().padEnd(5)} ${r.message}`
    ).join('\n');

    fs.writeFileSync('route-test-results.txt', output);
    console.log(output);
    console.log('\nResults saved to route-test-results.txt');
}

runTests();
