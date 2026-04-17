import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users (high traffic)
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000';

  // 1. Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'status is 200': (r) => r.status === 200 });

  // 2. Fetch Incidents (Simulating a dashboard load)
  // Note: In a real scenario, you'd add an Auth header here
  const res = http.get(`${BASE_URL}/api/v1/incidents`);
  
  check(res, {
    'is status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'transaction time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
