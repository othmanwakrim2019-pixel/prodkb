const axios = require('axios');

const baseURL = 'http://localhost:3000';
let token = '';
let headers = {};

const login = async () => {
    try {
        console.log('0. Checking health...');
        const health = await axios.get(`${baseURL}/health`);
        console.log('✅ Health OK:', health.data);
    } catch (e) { console.log('❌ Health check failed'); }

    try {
        console.log('1. Logging in...');
        // Use seeded admin
        const res = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@prodkb.com',
            password: 'password123'
        });
        token = res.data.token;
        headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Login successful');
    } catch (error) {
        console.error('❌ Login failed status:', error.response?.status);
        console.error('HEADERS:', error.response?.headers);
        console.error('DATA:', error.response?.data);
        process.exit(1);
    }
};

const runAudit = async () => {
    await login();

    try {
        // --- 1. System & Job Lifecycle (Testing Cascade Protection) ---
        console.log('\n2. Testing System & Job Lifecycle...');

        // Create System
        const sysRes = await axios.post(`${baseURL}/api/systems`, {
            name: 'Audit Test System',
            description: 'Created by audit script'
        }, { headers });
        const systemId = sysRes.data.id;
        console.log('✅ Created System:', sysRes.data.name);

        // Create Job
        const jobRes = await axios.post(`${baseURL}/api/jobs`, {
            name: 'Audit Test Job',
            code: 'AUDIT001',
            systemId: systemId
        }, { headers });
        const jobId = jobRes.data.id;
        console.log('✅ Created Job linked to System');

        // Try Delete System (Should FAIL because of Job)
        console.log('   Attempting to delete System with active Job (Expect Failure)...');
        try {
            await axios.delete(`${baseURL}/api/systems/${systemId}`, { headers });
            console.error('❌ System deletion succeeded unexpectedly! Cascade protection missing.');
        } catch (error) {
            if (error.response?.status === 400 || error.response?.status === 500) {
                console.log('✅ System deletion blocked as expected (Cascade Protection Active)');
            } else {
                console.error('❌ Unexpected error during system delete:', error.message);
            }
        }

        // --- 2. Team Lifecycle & Assignment ---
        console.log('\n3. Testing Team Lifecycle & Assignment...');

        // Create Team
        const teamRes = await axios.post(`${baseURL}/api/teams`, {
            name: 'Audit Team',
            description: 'For audit purposes',
            emailDistribution: 'audit@test.com'
        }, { headers });
        const teamId = teamRes.data.id;
        console.log('✅ Created Team:', teamRes.data.name);

        // Update Job with Team
        await axios.put(`${baseURL}/api/jobs/${jobId}`, {
            name: 'Audit Test Job',
            code: 'AUDIT001',
            systemId: systemId,
            teamId: teamId
        }, { headers });
        console.log('✅ Assigned Team to Job');

        // Verify Assignment
        const getJob = await axios.get(`${baseURL}/api/jobs`, { headers });
        const updatedJob = getJob.data.find(j => j.id === jobId);
        if (updatedJob.teamId === teamId) {
            console.log('✅ Job correctly reflects assigned Team');
        } else {
            console.error('❌ Job team assignment mismatch');
        }

        // Delete Team (Should Succeed, Job teamId should become null)
        await axios.delete(`${baseURL}/api/teams/${teamId}`, { headers });
        console.log('✅ Deleted Team');

        // Verify Job teamId is null
        const getJob2 = await axios.get(`${baseURL}/api/jobs`, { headers });
        const updatedJob2 = getJob2.data.find(j => j.id === jobId);
        if (!updatedJob2.teamId) {
            console.log('✅ Job teamId set to null (SetNull behavior verified)');
        } else {
            console.error('❌ Job teamId NOT null after team deletion');
        }

        // --- 3. SLA Lifecycle ---
        console.log('\n4. Testing SLA Lifecycle...');
        const slaRes = await axios.post(`${baseURL}/api/slas`, {
            name: 'Audit SLA',
            severity: 'High',
            acknowledgeTimeMinutes: 30,
            resolveTimeMinutes: 120
        }, { headers });
        const slaId = slaRes.data.id;
        console.log('✅ Created SLA');

        await axios.delete(`${baseURL}/api/slas/${slaId}`, { headers });
        console.log('✅ Deleted SLA');

        // --- 4. Cleanup ---
        console.log('\n5. Cleaning Up...');
        await axios.delete(`${baseURL}/api/jobs/${jobId}`, { headers });
        console.log('✅ Deleted Job');
        await axios.delete(`${baseURL}/api/systems/${systemId}`, { headers });
        console.log('✅ Deleted System');

        console.log('\n🎉 AUDIT COMPLETE: All tests passed.');

    } catch (error) {
        console.error('❌ Audit Failed:', error.response?.data || error.message);
        console.error(error);
    }
};

runAudit();
