// Quick test script for RAG API
const http = require('http');

console.log('Testing RAG Agent API...\n');

// Test health endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET'
};

const req = http.request(healthOptions, (res) => {
  console.log(`Health Check Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    
    // Test billing search
    testBillingSearch();
  });
});

req.on('error', (e) => {
  console.error(`❌ Backend not running: ${e.message}`);
  console.log('\nPlease start the backend server:');
  console.log('  cd backend');
  console.log('  npm run dev');
});

req.end();

function testBillingSearch() {
  const searchOptions = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/billing/search?q=emergency',
    method: 'GET'
  };

  const searchReq = http.request(searchOptions, (res) => {
    console.log(`\nSearch Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`Found ${json.codes?.length || 0} codes`);
        if (json.codes && json.codes.length > 0) {
          console.log('Sample code:', json.codes[0]);
        }
      } catch (e) {
        console.log('Response:', data.substring(0, 200));
      }
    });
  });

  searchReq.on('error', (e) => {
    console.error(`Search error: ${e.message}`);
  });

  searchReq.end();
}

