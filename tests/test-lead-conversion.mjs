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

async function testConversion() {
  console.log("=== Testing Lead Conversion to Signed Client ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("app_language", "my");
  }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

  await page.goto(`${BASE_URL}/clients`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Click on the test lead
  const testLeadCard = page.locator("text=ဦးလှမောင်").first();
  if (await testLeadCard.isVisible()) {
    await testLeadCard.click();
    await page.waitForTimeout(1000);

    // Change status to Signed
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("Signed");

    const saveBtn = page.getByRole("button", { name: /သိမ်းဆည်း|Save/i });
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const shotConv = path.join(ARTIFACTS_DIR, "09-lead-signed-converted.png");
    await page.screenshot({ path: shotConv, fullPage: true });
    console.log(`Saved screenshot: ${shotConv}`);

    // Navigate to Client Projects page to verify the converted client is listed
    await page.goto(`${BASE_URL}/client-projects`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const shotProj = path.join(ARTIFACTS_DIR, "10-client-projects-view.png");
    await page.screenshot({ path: shotProj, fullPage: true });
    console.log(`Saved screenshot: ${shotProj}`);
  }

  await browser.close();
  console.log("Conversion test complete!");
}

testConversion();
