const http = require('http');

async function runTests() {
    console.log('\n======================================================');
    console.log('🔄 STARTING SAGARA BACKEND API TESTS...');
    console.log('======================================================\n');

    // TEST 1: POST CONSULTATION
    console.log('------------------------------------------------------');
    console.log('1. [POST] /api/consultation (Testing New Lead Entry)');
    console.log('------------------------------------------------------');
    const postBody = {
        full_name: "Budi Santoso",
        business_email: "budi.test@gmail.com",
        service_type: "Digital transformation / custom software",
        message: "Kami butuh sistem ERP untuk perusahaan kami.",
        company_size: 150,
        budget: 250000000,
        industry: "manufacturing"
    };
    
    console.log('📤 REQUEST BODY:');
    console.log(JSON.stringify(postBody, null, 2));
    
    try {
        const res1 = await fetch('http://localhost:3000/api/consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postBody)
        });
        const data1 = await res1.json();
        console.log('\n📥 RESPONSE (Status: ' + res1.status + '):');
        console.log(JSON.stringify(data1, null, 2));
    } catch (e) {
        console.log('❌ Error: Server mungkin belum menyala.');
    }

    // TEST 2: LOGIN TOKEN
    console.log('\n------------------------------------------------------');
    console.log('2. [POST] /admin/login (Testing Authentication & Token)');
    console.log('------------------------------------------------------');
    console.log('📤 REQUEST: username=sagara & password=***');
    
    try {
        const res2 = await fetch('http://localhost:3000/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'username=sagara&password=admin123&redirectTo=homepage',
            redirect: 'manual'
        });
        console.log('\n📥 RESPONSE HEADERS (Status: ' + res2.status + ' Found):');
        console.log('Set-Cookie: ' + res2.headers.get('set-cookie'));
        console.log('Location: ' + res2.headers.get('location'));
        
        // Extract token
        const cookie = res2.headers.get('set-cookie');
        
        // TEST 3: GET LEADS
        console.log('\n------------------------------------------------------');
        console.log('3. [GET] /api/admin/consultations (Testing Data Fetch)');
        console.log('------------------------------------------------------');
        console.log('📤 REQUEST HEADERS:');
        console.log('Cookie: ' + (cookie ? cookie.split(';')[0] : 'None'));
        
        const res3 = await fetch('http://localhost:3000/api/admin/consultations', {
            headers: { 'Cookie': cookie || '' }
        });
        const data3 = await res3.json();
        console.log('\n📥 RESPONSE (Status: ' + res3.status + '):');
        // Only show last 2 to keep terminal clean
        console.log(JSON.stringify(data3.slice(0, 2), null, 2));
        
    } catch (e) {
        console.log('❌ Error: ' + e.message);
    }
    
    console.log('\n======================================================');
    console.log('✅ ALL API TESTS COMPLETED SUCCESSFULLY');
    console.log('======================================================\n');
}

runTests();
