const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL || 'admin@prodkb.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'password123';

const cookieJar = new Map();

const updateCookies = (response) => {
  const setCookie = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  for (const cookie of setCookie) {
    const [pair] = cookie.split(';');
    const [name, value] = pair.split('=');
    if (name && value) cookieJar.set(name.trim(), value.trim());
  }
};

const cookieHeader = () => [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join('; ');

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { 'content-type': 'application/json' } : {}),
    ...(cookieJar.size ? { cookie: cookieHeader() } : {}),
    ...options.headers,
  };
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  updateCookies(response);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text.slice(0, 300)}`);
  }
  return body;
};

const checks = [
  ['incidents list', '/api/v1/incidents?limit=3'],
  ['systems list', '/api/v1/systems'],
  ['planning list', '/api/v1/planning/instances'],
  ['current astreinte', '/api/v1/astreintes/current'],
  ['my tasks', '/api/v1/equipe/me/tasks/today'],
];

async function main() {
  await request('/auth/v1/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  console.log(`OK login as ${EMAIL}`);

  for (const [label, path] of checks) {
    await request(path);
    console.log(`OK ${label}`);
  }
}

main().catch((error) => {
  console.error(`Smoke check failed: ${error.message}`);
  process.exitCode = 1;
});
