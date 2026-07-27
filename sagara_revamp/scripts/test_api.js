/**
 * scripts/test_api.js
 * End-to-end API smoke test: consultation POST → admin login → consultations GET.
 * Usage: node scripts/test_api.js
 */
const BASE = 'http://localhost:3000';

async function runTests() {
  const line = '='.repeat(54);
  console.log(`\n${line}\n🔄  SAGARA BACKEND API SMOKE TESTS\n${line}\n`);

  // ── 1. POST /api/consultation ─────────────────────────────
  console.log('1. [POST] /api/consultation');
  const postBody = {
    full_name:      'Budi Santoso',
    business_email: 'budi.test@gmail.com',
    service_type:   'Digital transformation / custom software',
    message:        'Kami butuh sistem ERP untuk perusahaan kami.',
    company_size:   150,
    budget:         250000000,
    industry:       'manufacturing',
  };
  console.log('   Request:', JSON.stringify(postBody));
  try {
    const r = await fetch(`${BASE}/api/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
    });
    console.log(`   Response [${r.status}]:`, JSON.stringify(await r.json(), null, 2));
  } catch { console.log('   ❌ Server not running.'); }

  // ── 2. POST /admin/login ──────────────────────────────────
  console.log('\n2. [POST] /admin/login');
  let cookie = '';
  try {
    const r = await fetch(`${BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=samuel&password=samuel123&redirectTo=homepage',
      redirect: 'manual',
    });
    cookie = r.headers.get('set-cookie') || '';
    console.log(`   Response [${r.status}]  Set-Cookie: ${cookie.split(';')[0]}`);
  } catch { console.log('   ❌ Server not running.'); }

  // ── 3. GET /api/admin/consultations ──────────────────────
  console.log('\n3. [GET] /api/admin/consultations');
  try {
    const r = await fetch(`${BASE}/api/admin/consultations`, {
      headers: { Cookie: cookie },
    });
    const data = await r.json();
    console.log(`   Response [${r.status}]  Records: ${Array.isArray(data) ? data.length : '?'}`);
    if (Array.isArray(data) && data.length > 0)
      console.log('   Latest entry:', JSON.stringify(data[0], null, 2));
  } catch { console.log('   ❌ Server not running.'); }

  console.log(`\n${line}\n✅  TESTS COMPLETE\n${line}\n`);
}

runTests();
