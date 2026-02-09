
const axios = require('axios');

async function testCorsPost() {
    console.log('Testing POST request...');
    try {
        const response = await axios.post('http://localhost:3000/auth/login', {
            email: "admin@prodkb.com",
            password: "password123"
        }, {
            headers: {
                'Origin': 'http://localhost:5173',
                'Content-Type': 'application/json'
            }
        });
        console.log('POST status:', response.status);
        console.log('POST headers:', response.headers);
    } catch (error) {
        if (error.response) {
            console.log('POST Error status:', error.response.status);
            console.log('POST Response headers:', error.response.headers);
        } else {
            console.error('POST Error:', error.message);
        }
    }
}

testCorsPost();
