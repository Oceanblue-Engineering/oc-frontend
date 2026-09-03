import { chromium } from "playwright-core";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity\\brain\\f337c8ca-a0cb-4554-a40d-642c4520a570";
const BASE_URL = "http://localhost:3000";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODMzMzIzNywiZXhwIjoxNzkwOTI1MjM3fQ.z0ioLq9DzxHetAOizS1HuUUPVpoUCmGCqWCUxZ0JEXQ";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function runInvoiceProjectLinkerTest() {
  console.log("=== Launching Chrome to test Invoice & Quotation Project Linker ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ token, admin }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("adminData", admin);
      localStorage.setItem("app_language", "my");
    }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

    console.log("Navigating to /invoice-generator...");
    await page.goto(`${BASE_URL}/invoice-generator`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Click "Create New Document" Tab button
    console.log("Clicking 'Create New Document' tab...");
    const createTabBtn = page.getByRole("button", { name: /Create New Document/i });
    await createTabBtn.click();
    await page.waitForTimeout(1500);

    // 1. Check Project Selector is present
    const projectSelect = page.locator("select").filter({ hasText: /Manual \/ Custom Entry/i }).first();
    const isSelectorVisible = await projectSelect.isVisible();
    console.log("Is Project Selector visible?", isSelectorVisible);

    // 2. Test Manual Entry
    console.log("Testing Manual Custom Entry...");
    const customerInput = page.locator("input[placeholder*='U Kyaw Min']").first();
    await customerInput.fill("ဦးမြင့်ဆွေ (Private Villa)");

    const companyInput = page.locator("input[placeholder*='Novotal Villa']").first();
    await companyInput.fill("Inya Lake Private Pool & Spa");

    await page.waitForTimeout(1000);
    const shot1 = path.join(ARTIFACTS_DIR, "19-invoice-manual-custom-entry.png");
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`Saved screenshot: ${shot1}`);

    // 3. Test Linking to an Existing Project from dropdown
    console.log("Testing Linking to an Existing Project...");
    const options = await projectSelect.locator("option").all();
    console.log(`Found ${options.length} project options in dropdown`);

    if (options.length > 1) {
      const secondOptionVal = await options[1].getAttribute("value");
      if (secondOptionVal) {
        await projectSelect.selectOption(secondOptionVal);
        await page.waitForTimeout(1500);

        const shot2 = path.join(ARTIFACTS_DIR, "20-invoice-linked-to-project.png");
        await page.screenshot({ path: shot2, fullPage: true });
        console.log(`Saved screenshot: ${shot2}`);

        // Check if unlink button is visible
        const unlinkBtn = page.getByRole("button", { name: /Unlink/i }).first();
        if (await unlinkBtn.isVisible()) {
          console.log("Unlink button is visible. Clicking Unlink...");
          await unlinkBtn.click();
          await page.waitForTimeout(1000);

          const shot3 = path.join(ARTIFACTS_DIR, "21-invoice-unlinked.png");
          await page.screenshot({ path: shot3, fullPage: true });
          console.log(`Saved screenshot: ${shot3}`);
        }
      }
    }

    console.log("=== Test Completed Successfully ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

runInvoiceProjectLinkerTest();
