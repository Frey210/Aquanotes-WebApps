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
devices[1].historical_data[10].suhu = null;

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const role of ['admin', 'user']) {
      const context = await browser.newContext({ reducedMotion: 'no-preference' });
      await context.addInitScript(() => sessionStorage.setItem('aquanotes_session_token', 'synthetic-test-token'));
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (!pathname.startsWith('/api/')) return route.continue();
        const endpoint = pathname.replace('/api', '');
        let data;
        if (endpoint === '/users/session') data = { id: 1, name: 'Pengguna uji', email: 'test@example.invalid', role };
        else if (/\/monitoring\/devices\/\d+\/history/.test(endpoint)) {
          const id = Number(endpoint.split('/')[3]);
          const parameter = new URL(route.request().url()).searchParams.get('parameter');
          const readings = devices.find((device) => device.id === id).historical_data;
          const last = readings.map((reading) => reading[parameter]).findLastIndex((value) => value != null);
          data = { readings: last < 0 ? [] : readings.slice(Math.max(0, last-23), last+1), next_before_id: null };
        }
        else if (endpoint === '/admin/sensors') data = { generated_at: new Date().toISOString(), devices, parameters: [] };
        else if (endpoint === '/monitoring') data = { current_device_id: 1, current_kolam_id: 1, kolam_list: [{ id: 1, nama: 'Kolam uji', devices }] };
        else if (endpoint === '/devices/') data = devices;
        else if (endpoint.endsWith('/thresholds')) data = { temp_min: 20, temp_max: 27, ph_min: 8.2, ph_max: 9 };
        else throw new Error(`Unexpected API request: ${endpoint}`);
        await route.fulfill({ json: data });
      });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${base}/${role === 'admin' ? 'admin' : 'app'}/monitoring`);
      const reveal = page.locator('.recharts-area clipPath rect');
      await reveal.waitFor({ state: 'attached' });
      const initialWidth = Number(await reveal.getAttribute('width'));
      await page.waitForFunction((width) => Number(document.querySelector('.recharts-area clipPath rect')?.getAttribute('width')) > width, initialWidth);
      await reveal.waitFor({ state: 'detached' });
      const animatedCurve = page.locator('.recharts-area-curve');
      assert.match(await animatedCurve.getAttribute('d'), /C/, 'Trend must use smooth cubic segments');
      const before = await animatedCurve.getAttribute('d');
      devices[0].historical_data[5].suhu += .3;
      await page.locator('.header-actions .icon-button').click();
      await page.waitForFunction((previous) => document.querySelector('.recharts-area-curve')?.getAttribute('d') !== previous, before);
      const intermediate = await animatedCurve.getAttribute('d');
      await page.waitForFunction((previous) => document.querySelector('.recharts-area-curve')?.getAttribute('d') !== previous, intermediate);
      await page.locator('.sensor-choice').filter({ hasText: 'pH' }).click();
      await reveal.waitFor({ state: 'attached' });
      await reveal.waitFor({ state: 'detached' });
      await page.getByRole('searchbox').fill('0002');
      await page.locator('.navigator-device').click();
      await page.locator('.sensor-choice').filter({ hasText: 'Suhu' }).click();
      await reveal.waitFor({ state: 'detached' });
      await page.waitForFunction(() => (document.querySelector('.recharts-area-curve')?.getAttribute('d')?.match(/M/g) || []).length === 2);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.sensor-choice').filter({ hasText: 'pH' }).click();
      await animatedCurve.waitFor({ state: 'attached' });
      assert.equal(await reveal.count(), 0, 'Reduced motion must skip the series reveal');
      console.log(`${role}: smooth curve, entrance, refresh morph, parameter change, null gaps, reduced motion passed`);
      for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'laptop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }, { name: 'small-mobile', width: 360, height: 800 }, { name: 'narrow-mobile', width: 320, height: 700 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/${role === 'admin' ? 'admin' : 'app'}/monitoring`);
        await page.getByRole('heading', { name: 'Tren suhu', exact: false }).waitFor();
        await page.locator('.recharts-area').waitFor();
        if (role === 'user') {
          await page.locator('.sensor-choice.high .sensor-alert').first().waitFor();
          await page.locator('.sensor-choice.low .sensor-alert').first().waitFor();
        }
        const box = await page.locator('.chart').boundingBox();
        assert(box.y < (viewport.width > 1024 ? Math.min(600, viewport.height * .75) : 850), `${role}/${viewport.name}: chart too far down: ${box.y}`);
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
        await page.waitForFunction(() => document.querySelector('.monitor-device-heading h2')?.textContent.includes('Perangkat 31'));
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(artifacts, `${role}-${viewport.name}.png`), fullPage: true });
        console.log(`${role}/${viewport.name}: chart_y=${Math.round(box.y)} passed`);
      }
      await page.locator('.mobile-device-select select').selectOption('2');
      await page.waitForFunction(() => document.querySelector('.monitor-device-heading h2')?.textContent.includes('Perangkat 2'));
      const curve = await page.locator('.recharts-area-curve').getAttribute('d');
      assert.equal((curve.match(/M/g) || []).length, 2, `${role}: null sample must interrupt the line`);
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
