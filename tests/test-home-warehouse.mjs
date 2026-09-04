import { chromium } from "playwright-core";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity\\brain\\f337c8ca-a0cb-4554-a40d-642c4520a570";
const BASE_URL = "http://localhost:3000";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODQ5NDQ4MywiZXhwIjoxNzkxMDg2NDgzfQ.t1fHMRPkIkX2CWsuwEct1B9Vu3R-8kHgrDaUX6NjS_I";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function runWarehouseHomeTest() {
  console.log("=== Launching Chrome to test Warehouse on Home Page ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("language", "my");
  }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

  const page = await context.newPage();

  try {
    console.log("Navigating to Home / ...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const shot1 = path.join(ARTIFACTS_DIR, "24-home-page-with-warehouse.png");
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`Saved screenshot: ${shot1}`);

    // Check Warehouse card
    const warehouseCard = page.locator('a[href="/warehouse"]');
    const isVis = await warehouseCard.isVisible();
    console.log("Is Warehouse card visible?", isVis);

    console.log("=== Test Completed Successfully ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

runWarehouseHomeTest();
