// === ADMIN DEBUG SCRIPT ===
// Rulează acest script în F12 Console când ești în admin panel

console.log('%c=== ADMIN API DEBUG ===', 'background: #e94560; color: white; font-size: 14px; padding: 5px;');

async function debugAPI(endpoint, name) {
  console.log(`\n📡 Testing ${name}...`);
  try {
    const res = await fetch(endpoint, { credentials: 'include' });
    const data = await res.json();
    
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
    
    if (res.ok) {
      if (data.invoices) console.log(`   ✅ Found ${data.invoices.length} invoices`);
      if (data.orders) console.log(`   ✅ Found ${data.orders.length} orders`);
      if (data.user) console.log(`   ✅ Logged in as: ${data.user.email}`);
    } else {
      console.log(`   ❌ Error: ${data.message || JSON.stringify(data)}`);
    }
    return { ok: res.ok, data };
  } catch (e) {
    console.log(`   ❌ Network error: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting all API tests...\n');
  
  // Test auth
  await debugAPI('/admin/users/me', 'Auth Status');
  
  // Test invoices
  await debugAPI('/admin/invoices', 'Invoices API');
  
  // Test orders
  await debugAPI('/admin/orders', 'Orders API');
  
  // Test products
  await debugAPI('/admin/products', 'Products API');
  
  console.log('\n✅ All tests completed!');
  console.log('%c Check results above', 'color: green; font-weight: bold');
}

runAllTests();
