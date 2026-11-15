const app = require('../backend/src/app');
const http = require('http');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Sede routes by slug
    console.log('\n--- Test 1: Sede by Slug & Isolation ---');
    const resBernabeu = await fetch(`${baseUrl}/api/venues/by-slug/la-bernabeu`);
    const dataBernabeu = await resBernabeu.json();
    assert(dataBernabeu.success && dataBernabeu.venue.slug === 'la-bernabeu', 'GET /api/venues/by-slug/la-bernabeu');

    const resFavela = await fetch(`${baseUrl}/api/venues/by-slug/la-favela`);
    const dataFavela = await resFavela.json();
    assert(dataFavela.success && dataFavela.venue.slug === 'la-favela', 'GET /api/venues/by-slug/la-favela');

    // 2. Strict isolation in Multi-Grid
    console.log('\n--- Test 2: Multi-Grid Court Isolation ---');
    const resGridBernabeu = await fetch(`${baseUrl}/api/reservations/multi-grid?date=2026-11-15&venue_id=a0000000-0000-0000-0000-000000000001`);
    const dataGridBernabeu = await resGridBernabeu.json();
    assert(dataGridBernabeu.success, 'Multi-grid returns success');
    assert(dataGridBernabeu.day_name === 'Domingo', 'Multi-grid day_name is Domingo (no undefined)');
    const bernabeuFieldIds = dataGridBernabeu.fields.map(f => f.id);
    assert(bernabeuFieldIds.length === 3 && !bernabeuFieldIds.includes('f0000000-0000-0000-0000-000000000005'), 'Bernabéu multi-grid has 3 fields and ZERO Favela fields');

    const resGridFavela = await fetch(`${baseUrl}/api/reservations/multi-grid?date=2026-11-15&venue_id=a0000000-0000-0000-0000-000000000003`);
    const dataGridFavela = await resGridFavela.json();
    const favelaFieldIds = dataGridFavela.fields.map(f => f.id);
    assert(favelaFieldIds.length === 2 && favelaFieldIds.includes('f0000000-0000-0000-0000-000000000005') && !favelaFieldIds.includes('f0000000-0000-0000-0000-000000000001'), 'Favela multi-grid has only Favela fields, ZERO Bernabéu fields');

    // 3. Folio Calculation (Court + Abono + Itemized Cafeteria)
    console.log('\n--- Test 3: Folio Calculation ---');
    const resFolio = await fetch(`${baseUrl}/api/reservations/res-demo-001/folio`);
    const dataFolio = await resFolio.json();
    assert(dataFolio.success && dataFolio.folio, 'GET /api/reservations/res-demo-001/folio succeeds');
    const f = dataFolio.folio;
    assert(f.court_price === 130000, `Court price is $130.000 (actual: ${f.court_price})`);
    assert(f.court_deposit_paid === 65000, `Court deposit is $65.000 (actual: ${f.court_deposit_paid})`);
    assert(f.court_pending_balance === 65000, `Pending court balance is $65.000 (actual: ${f.court_pending_balance})`);
    assert(Array.isArray(f.cafeteria_items) && f.cafeteria_items.length >= 2, 'Cafeteria items are itemized');
    assert(f.cafeteria_total === 25500, `Cafeteria total is $25.500 (actual: ${f.cafeteria_total})`);
    assert(f.grand_total_due === 90500, `Grand total net due is $90.500 ($65k + $25.5k) (actual: ${f.grand_total_due})`);

    // 4. SaaS Billing & MRR
    console.log('\n--- Test 4: SaaS Plans & Billing ---');
    const authHeaders = { 'Authorization': 'Bearer demo-user-b0000000-0000-0000-0000-000000000001' };
    const resSaas = await fetch(`${baseUrl}/api/venues/saas/billing`, { headers: authHeaders });
    const dataSaas = await resSaas.json();
    assert(dataSaas.success && dataSaas.overview.plans.length === 3, '3 SaaS commercial plans (Básico, Pro, Enterprise)');
    assert(dataSaas.overview.mrr === 947000, `MRR is 947.000 COP (actual: ${dataSaas.overview.mrr})`);
    assert(dataSaas.overview.billing.length === 3, 'Billing records for all 3 venues');

    // Pay SaaS subscription
    const resPay = await fetch(`${baseUrl}/api/venues/saas/billing/a0000000-0000-0000-0000-000000000001/pay`, {
      method: 'POST',
      headers: authHeaders
    });
    const dataPay = await resPay.json();
    assert(dataPay.success, 'Record SaaS subscription payment succeeds');

    // 5. Venue Payment Methods (B2C)
    console.log('\n--- Test 5: Venue Direct Payment Methods ---');
    const resPayMethods = await fetch(`${baseUrl}/api/venues/a0000000-0000-0000-0000-000000000001/payment-methods`);
    const dataPayMethods = await resPayMethods.json();
    assert(dataPayMethods.success && dataPayMethods.payment_methods.nequi.phone_number === '3006799595', 'Get venue payment methods returns Nequi');

    // Update payment methods
    const resUpdatePay = await fetch(`${baseUrl}/api/venues/a0000000-0000-0000-0000-000000000001/payment-methods`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        nequi: { phone_number: '3009998877', account_name: 'Don Mario Gómez', is_active: true }
      })
    });
    const dataUpdatePay = await resUpdatePay.json();
    assert(dataUpdatePay.success && dataUpdatePay.payment_methods.nequi.phone_number === '3009998877', 'Update venue payment methods persists');

    // 6. Clients & Receivables
    console.log('\n--- Test 6: Clients Directory & Receivables ---');
    const resClients = await fetch(`${baseUrl}/api/venues/a0000000-0000-0000-0000-000000000001/clients`, { headers: authHeaders });
    const dataClients = await resClients.json();
    assert(dataClients.success && dataClients.clients.length >= 2, 'Clients directory returned');
    const mateo = dataClients.clients.find(c => c.name.includes('Mateo'));
    assert(mateo && mateo.total_debt === 90500, `Mateo total debt reflects $90.500 ($65k court + $25.5k bar) (actual: ${mateo ? mateo.total_debt : 0})`);

    // 7. Shifts History (Courts vs Cafeteria separation)
    console.log('\n--- Test 7: Shifts History Breakdown ---');
    const resShifts = await fetch(`${baseUrl}/api/venues/a0000000-0000-0000-0000-000000000001/shifts/history`, { headers: authHeaders });
    const dataShifts = await resShifts.json();
    assert(dataShifts.success && dataShifts.shifts.length >= 1, 'Shifts history returned');
    assert(dataShifts.shifts[0].courts_income > 0 && dataShifts.shifts[0].cafeteria_income > 0, 'Shift separates courts income vs cafeteria income');

    // 8. Auth config & RBAC
    console.log('\n--- Test 8: Auth Config ---');
    const resAuth = await fetch(`${baseUrl}/api/auth/config`);
    const dataAuth = await resAuth.json();
    assert(dataAuth.success && typeof dataAuth.demo_mode === 'boolean', 'Auth config returns demo_mode');

    // 9. Receipt upload & Approve flow
    console.log('\n--- Test 9: Receipt Upload & Reservation Approve ---');
    const resReceipt = await fetch(`${baseUrl}/api/reservations/res-demo-001/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_reference: 'NEQUI-998877',
        receipt_url: 'https://storage.canchapro.com/receipts/test.jpg'
      })
    });
    const dataReceipt = await resReceipt.json();
    assert(dataReceipt.success && dataReceipt.reservation.status === 'pending_verification', 'Receipt upload sets status to pending_verification');

    const resApprove = await fetch(`${baseUrl}/api/reservations/res-demo-001/approve`, {
      method: 'POST',
      headers: authHeaders
    });
    const dataApprove = await resApprove.json();
    assert(dataApprove.success && dataApprove.reservation.status === 'confirmed', 'Admin approve sets status to confirmed');

    // 10. Settle Folio
    console.log('\n--- Test 10: Settle Folio ---');
    const resSettle = await fetch(`${baseUrl}/api/reservations/res-demo-001/settle-folio`, {
      method: 'POST',
      headers: authHeaders
    });
    const dataSettle = await resSettle.json();
    assert(dataSettle.success && dataSettle.folio.grand_total_due === 0, 'Settle folio sets grand_total_due to $0');

    console.log(`\n========================================`);
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
