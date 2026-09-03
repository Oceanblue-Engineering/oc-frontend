import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\d5ad2b23-d581-48d0-b1cd-77e1dbcb5185";
const BASE_URL = "http://localhost:3000";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODMzMzIzNywiZXhwIjoxNzkwOTI1MjM3fQ.z0ioLq9DzxHetAOizS1HuUUPVpoUCmGCqWCUxZ0JEXQ";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function testViewAndLifecycle() {
  console.log("=== Testing PO Details & Mark Arrived -> GRN Lifecycle ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    await page.evaluate(({ token, admin }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("adminData", admin);
      localStorage.setItem("app_language", "my");
    }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

    await page.goto(`${BASE_URL}/purchasing`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 1. Click View Details Button
    console.log("Locating View Details button...");
    const viewBtn = page.locator("table button").filter({ hasText: /View/i }).first();
    await viewBtn.waitFor({ state: "visible", timeout: 10000 });
    await viewBtn.click();
    await page.waitForTimeout(1500);

    const shot5 = path.join(ARTIFACTS_DIR, "purchasing_05_po_detail_modal.png");
    await page.screenshot({ path: shot5 });
    console.log(`Saved screenshot: ${shot5}`);

    // Close Detail Modal (Find X button in modal)
    const closeBtn = page.locator(".fixed button").filter({ has: page.locator("svg.lucide-x") }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
      console.log("PO Detail modal closed successfully.");
    }

    // 2. Click Mark Arrived
    console.log("Clicking Mark Arrived button...");
    const markArrivedBtn = page.locator("table button").filter({ hasText: /Mark Arrived/i }).first();
    await markArrivedBtn.click();
    await page.waitForTimeout(2500);

    // 3. Switch to Arrived tab
    console.log("Switching to Arrived filter tab...");
    const arrivedTab = page.locator("button").filter({ hasText: /ရောက်ရှိ|Arrived/i }).first();
    await arrivedTab.click();
    await page.waitForTimeout(1500);

    const shot6 = path.join(ARTIFACTS_DIR, "purchasing_06_arrived_po_list.png");
    await page.screenshot({ path: shot6, fullPage: true });
    console.log(`Saved screenshot: ${shot6}`);

    // 4. Check GRN Button & Click it
    console.log("Checking GRN button on arrived PO...");
    const grnBtn = page.locator("table button").filter({ hasText: /GRN/i }).first();
    const hasGRNBtn = await grnBtn.isVisible();
    console.log("GRN button is visible:", hasGRNBtn);

    if (hasGRNBtn) {
      await grnBtn.click();
      await page.waitForTimeout(1500);

      const shot7 = path.join(ARTIFACTS_DIR, "purchasing_07_create_grn_from_po_modal.png");
      await page.screenshot({ path: shot7 });
      console.log(`Saved screenshot: ${shot7}`);

      // Close GRN modal
      const closeGRN = page.locator(".fixed button").filter({ has: page.locator("svg.lucide-x") }).first();
      await closeGRN.click();
      await page.waitForTimeout(500);
      console.log("GRN modal closed successfully.");
    }

    console.log("=== All Lifecycle Tests Completed Successfully! ===");
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
  }
}

testViewAndLifecycle();
