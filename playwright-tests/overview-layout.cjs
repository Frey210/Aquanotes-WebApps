const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const sizes = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }, { name: 'small-mobile', width: 360, height: 800 }, { name: 'narrow-mobile', width: 320, height: 700 }];
const devices = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: i % 2 ? 'Perangkat dengan nama tambak yang cukup panjang' : null, uid: `AER2023AQ00${31 + i}`, connectivity_status: i % 2 ? 'offline' : 'never_seen', status: i % 2 ? 'offline' : 'never_seen', operational_mode: 'active', user_name: null, tambak_name: 'Gotong Global Sejahtera', kolam_name: 'Kolam Selada Laut', last_seen: i % 2 ? new Date(Date.now() - 172800000).toISOString() : null }));
devices[1].status = 'maintenance';
devices[3].status = 'inactive';
(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync('.impeccable/review', { recursive: true });
  try {
    for (const role of ['admin', 'user']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => sessionStorage.setItem('aquanotes_session_token', 'synthetic-token'));
      await page.route('**/api/**', async route => {
        const pathname = new URL(route.request().url()).pathname;
        if (!pathname.startsWith('/api/')) return route.continue();
        let data;
        if (pathname === '/api/users/session') data = { id: 1, name: 'Pengguna uji', email: 'test@example.invalid', role };
        else if (pathname === '/api/admin/summary') data = { total: 33, online: 8, stale: 3, offline: 15, never_seen: 7, pending_maintenance: 0, unassigned: 3, scheduled_deactivation: 0, active_alerts: 9 };
        else if (pathname === '/api/admin/fleet/devices') data = { items: devices, total: 33, page: 1, page_size: 8 };
        else if (pathname === '/api/devices/status/') data = { devices, online: 0, offline: 4, maintenance: 0 };
        else if (pathname === '/api/notifications/unread-count') data = 4;
        else throw new Error(`Unexpected API ${pathname}`);
        await route.fulfill({ json: data });
      });
      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.goto(`${base}/${role === 'admin' ? 'admin' : 'app'}`);
        await page.locator('.fleet-health').waitFor();
        await page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${role}/${size.name}: overflow`);
        assert.equal(await page.locator('.priority-list table').count(), 0);
        assert.equal(await page.locator('.priority-device').count(), 4);
        const health = await page.locator('.fleet-health svg[role="img"]').getAttribute('aria-label');
        assert.match(health, /Online/);
        if (role === 'user') { assert.match(health, /2 Offline/); assert.match(health, /1 Perawatan/); assert.match(health, /1 Nonaktif/); }
        if (size.width <= 860) {
          const dock = await page.locator('.mobile-dock').boundingBox();
          assert(dock && dock.y + dock.height <= size.height + 1);
          await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
          await page.locator('.sidebar.open').waitFor();
          await page.keyboard.press('Shift+Tab');
          assert.equal(await page.locator('.sidebar-logout').evaluate(el => el === document.activeElement), true);
          await page.keyboard.press('Tab');
          assert.equal(await page.locator('.sidebar').getByRole('button', { name: 'Tutup navigasi', exact: true }).evaluate(el => el === document.activeElement), true);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.sidebar.open').count(), 0);
          assert.equal(await page.locator('.sidebar').evaluate(el => el.inert), true);
        }
        await page.screenshot({ path: path.join('.impeccable/review', `${role}-overview-${size.name}.png`), fullPage: true });
        console.log(`${role}/overview/${size.name}: passed`);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.route-view').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.evaluate(() => {
        const fixture = document.createElement('section');
        fixture.className = 'panel';
        fixture.innerHTML = '<div class="table-wrap"><table style="min-width:900px"><tbody><tr><td style="width:850px">Synthetic table fixture</td><td><span class="sr-only">Aksi</span></td></tr></tbody></table></div>';
        document.querySelector('.page').append(fixture);
      });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'Visually hidden table header must not escape the table scroll container');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('overview_layout=passed');
  } finally { await browser.close(); }
})();
