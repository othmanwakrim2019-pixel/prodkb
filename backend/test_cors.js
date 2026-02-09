
const axios = require('axios');

async function testCors() {
    try {
        const response = await axios.post('http://localhost:3000/auth/login', {}, {
            headers: {
                'Origin': 'http://localhost:5173'
            }
        });
        console.log('Response headers:', response.headers);
    } catch (error) {
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Response headers:', error.response.headers);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testCors();
