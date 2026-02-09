
const axios = require('axios');

async function testCorsOptions() {
    console.log('Testing OPTIONS request...');
    try {
        const response = await axios({
            method: 'options',
            url: 'http://localhost:3000/auth/login',
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type'
            }
        });
        console.log('OPTIONS status:', response.status);
        console.log('OPTIONS headers:', response.headers);
    } catch (error) {
        if (error.response) {
            console.log('OPTIONS Error status:', error.response.status);
            console.log('OPTIONS Response headers:', error.response.headers);
        } else {
            console.error('OPTIONS Error:', error.message);
        }
    }
}

testCorsOptions();
