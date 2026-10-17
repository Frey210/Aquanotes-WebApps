// Synthetic API fixtures: this test never writes to production.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const artifacts = path.resolve('.impeccable/review');
const devices = Array.from({ length: 31 }, (_, index) => {
  const id = index + 1;
  const latest = { suhu: 28.6, ph: 7.9, do: 6.8, tds: 0, ammonia: null, salinitas: 22.4, timestamp: new Date().toISOString() };
  return { id, uid: `AER2023AQ${String(id).padStart(4, '0')}`, name: id === 1 ? 'AQ Selada' : `Perangkat ${id}`, user_id: 1, user_name: 'Pengguna uji', tambak_name: 'Tambak uji', kolam_name: `Kolam ${id}`, connectivity_status: id % 3 ? 'online' : 'offline', operational_mode: 'active', connection_interval: 5, last_seen: latest.timestamp, attention_parameters: [], latest_data: latest, historical_data: Array.from({ length: 24 }, (_, i) => ({ ...latest, suhu: 28 + Math.sin(i / 3) * .6, timestamp: new Date(Date.now() - (23 - i) * 60000).toISOString() })) };
});

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const role of ['admin', 'user']) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      await context.addInitScript(() => sessionStorage.setItem('aquanotes_session_token', 'synthetic-test-token'));
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (!pathname.startsWith('/api/')) return route.continue();
        const endpoint = pathname.replace('/api', '');
        let data;
        if (endpoint === '/users/session') data = { id: 1, name: 'Pengguna uji', email: 'test@example.invalid', role };
        else if (endpoint === '/admin/sensors') data = { generated_at: new Date().toISOString(), devices, parameters: [] };
        else if (endpoint === '/monitoring') data = { current_device_id: 1, current_kolam_id: 1, kolam_list: [{ id: 1, nama: 'Kolam uji', devices }] };
        else if (endpoint === '/devices/') data = devices;
        else if (endpoint.endsWith('/thresholds')) data = { temp_min: 20, temp_max: 32, ph_min: 6, ph_max: 9 };
        else throw new Error(`Unexpected API request: ${endpoint}`);
        await route.fulfill({ json: data });
      });
      for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'laptop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }, { name: 'small-mobile', width: 375, height: 812 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/${role === 'admin' ? 'admin' : 'app'}/monitoring`);
        await page.getByRole('heading', { name: 'Tren suhu', exact: false }).waitFor();
        await page.locator('.recharts-area').waitFor();
        const box = await page.locator('.chart').boundingBox();
        assert(box.y < (viewport.width > 1024 ? 550 : 850), `${role}/${viewport.name}: chart too far down: ${box.y}`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${role}/${viewport.name}: horizontal overflow`);
        const broken = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src));
        assert.equal(broken.length, 0, `Broken logos: ${broken}`);
        await page.locator('.sensor-choice').filter({ hasText: 'Amonia' }).click();
        await page.getByRole('heading', { name: 'Sensor Amonia belum mengirim data' }).waitFor();
        await page.locator('.sensor-choice').filter({ hasText: 'TDS' }).click();
        await page.getByRole('heading', { name: 'Tren tds', exact: false }).waitFor();
        assert.match(await page.locator('.sensor-choice[aria-pressed="true"]').innerText(), /0/);
        await page.locator('.sensor-choice').filter({ hasText: 'Suhu' }).click();
        if (viewport.width > 1024) {
          await page.getByRole('searchbox').fill('0031');
          assert.equal(await page.locator('.navigator-device').count(), 1);
          await page.locator('.navigator-device').click();
          await page.getByRole('searchbox').fill('');
        } else {
          await page.locator('.mobile-device-select select').selectOption('31');
        }
        await page.locator('.monitor-device-heading h2').filter({ hasText: 'Perangkat 31' }).waitFor();
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(artifacts, `${role}-${viewport.name}.png`), fullPage: true });
        console.log(`${role}/${viewport.name}: chart_y=${Math.round(box.y)} passed`);
      }
      if (role === 'admin') {
        await page.locator('.fleet-disclosure > summary').click();
        assert.equal(await page.locator('.fleet-disclosure tbody tr').count(), 31);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
    console.log('monitoring_layout=passed');
  } finally { await browser.close(); }
})();
