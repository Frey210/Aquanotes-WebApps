const { chromium } = require("playwright");
const path = require("node:path");

const baseUrl = "https://aquanotes.farlabs.my.id";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${baseUrl}/login`);
    if ((await page.title()) !== "Aquanotes") throw new Error("Judul tab tidak sesuai");
    await page.getByLabel("Email").fill(process.env.TEST_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(process.env.TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await page.waitForURL("**/admin");
    await page.getByRole("heading", { name: "Ringkasan perangkat" }).waitFor();
    await page.goto(`${baseUrl}/admin/monitoring`);
    await page.getByRole("heading", { name: "Monitoring sensor", exact: true }).waitFor();
    await page.locator(".monitor-device-heading h2").waitFor();
    await page.locator(".sensor-choice").first().waitFor();
    if ((await page.locator(".chart-panel").boundingBox()).y > 700) throw new Error("Grafik terdorong terlalu jauh ke bawah");
    await page.locator(".fleet-disclosure > summary").click();
    await page.locator(".fleet-disclosure tbody tr").first().waitFor();
    await page.goto(`${baseUrl}/admin/devices`);
    await page.getByRole("heading", { name: "Daftar device" }).waitFor();
    await page.screenshot({ path: path.join(process.env.PW_ARTIFACT_DIR, "aquanotes-production-admin.png"), fullPage: true });
    if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
    console.log("production_browser_smoke=ok");
  } finally {
    await browser.close();
  }
})();
