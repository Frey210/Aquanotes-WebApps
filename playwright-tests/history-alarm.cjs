// Synthetic fixtures only: never change production thresholds or sensor records.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const empty = { suhu: 29, ph: null, do: null, tds: null, ammonia: null, salinitas: null, timestamp: new Date().toISOString() };
const device = { id: 1, name: 'Kolam uji', uid: 'TEST0001', user_id: 1, connection_interval: 5, latest_data: empty, historical_data: [empty], attention_parameters: [], connectivity_status: 'online', operational_mode: 'active' };
let saved = { device_id: 1, device_name: device.name, temp_min: 20, temp_max: 30, ph_min: 0, ph_max: 9, do_min: null, tds_max: null, ammonia_max: null, salinitas_min: null, salinitas_max: null };
let writes = 0;
(async () => {
  fs.mkdirSync('.impeccable/review', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(() => sessionStorage.setItem('aquanotes_session_token', 'synthetic'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      let data;
      if (url.pathname.endsWith('/users/session')) data = { id: 1, name: 'Pengguna uji', email: 'test@example.invalid', role: 'user' };
      else if (url.pathname.endsWith('/thresholds')) {
        if (route.request().method() === 'PUT') { saved = { ...saved, ...route.request().postDataJSON() }; writes++; }
        data = saved;
      } else if (url.pathname.endsWith('/devices/')) data = [device];
      else if (url.pathname.endsWith('/monitoring')) data = { current_device_id: 1, current_kolam_id: 1, kolam_list: [{ id: 1, nama: 'Kolam uji', devices: [device] }] };
      else if (url.pathname.endsWith('/history')) {
        const parameter = url.searchParams.get('parameter');
        data = parameter === 'ph' ? { readings: [0, 1, 2].map((i) => ({ ...empty, ph: url.searchParams.has('before_id') ? 0 : (i === 1 ? null : 7+i/10), timestamp: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() })), next_before_id: url.searchParams.has('before_id') ? null : 10 } : { readings: parameter === 'suhu' ? [empty] : [], next_before_id: null };
      } else throw Error(`Unexpected API endpoint: ${url.pathname}`);
      await route.fulfill({ json: data });
    });
    for (const width of [1440, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/app/monitoring`);
      await page.locator('.sensor-choice').filter({ hasText: 'pH' }).click();
      await page.locator('.history-notice').filter({ hasText: 'Grafik menampilkan histori' }).waitFor();
      assert.match(await page.locator('.sensor-choice.selected').innerText(), /Tidak tersedia/);
      await page.locator('.recharts-area-curve').waitFor({ state: 'attached' });
      assert.equal((await page.locator('.recharts-area-curve').getAttribute('d')).match(/M/g).length, 2);
      await page.getByRole('button', { name: 'Lebih lama', exact: true }).click();
      await page.getByText('Riwayat lebih lama', { exact: true }).waitFor();
      await page.locator('.chart-data-table summary').click();
      assert.match(await page.locator('.chart-data-table tbody').innerText(), /0/);
      await page.getByRole('button', { name: 'Riwayat terbaru', exact: true }).click();
      await page.locator('.sensor-choice').filter({ hasText: 'Amonia' }).click();
      await page.getByRole('heading', { name: 'Sensor Amonia belum mengirim data' }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.goto(`${base}/app/alerts/settings?device=1`);
      await page.getByRole('switch', { name: 'Alarm pH', exact: true }).waitFor();
      assert(await page.getByRole('switch', { name: 'Alarm pH', exact: true }).isChecked());
      assert.equal(await page.getByRole('spinbutton', { name: 'pH minimum', exact: true }).inputValue(), '0');
      await page.getByRole('switch', { name: 'Alarm Suhu', exact: true }).uncheck();
      await page.getByRole('switch', { name: 'Alarm Amonia', exact: true }).check();
      await page.getByRole('button', { name: 'Simpan pengaturan', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Isi setidaknya satu batas' }).waitFor();
      assert.equal(writes, width === 1440 ? 0 : 1);
      await page.getByRole('spinbutton', { name: 'Amonia maksimum', exact: true }).fill('0');
      await page.getByRole('button', { name: 'Simpan pengaturan', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'berhasil disimpan' }).waitFor();
      assert.equal(saved.temp_min, null); assert.equal(saved.temp_max, null); assert.equal(saved.ammonia_max, 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.reload();
      await page.getByRole('switch', { name: 'Alarm Amonia', exact: true }).waitFor();
      assert(await page.getByRole('switch', { name: 'Alarm Amonia', exact: true }).isChecked());
      assert.equal(await page.getByRole('spinbutton', { name: 'Amonia maksimum', exact: true }).inputValue(), '0');
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      await page.screenshot({ path: `.impeccable/review/alarm-settings-${width}.png`, fullPage: true });
      // Reset only the synthetic server fixture before the next viewport.
      saved = { ...saved, temp_min: 20, temp_max: 30, ammonia_max: null };
      console.log(`history_alarm/${width}=passed`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})();
