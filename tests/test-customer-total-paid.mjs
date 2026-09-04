import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { chromium } from "playwright-core";
import path from "node:path";
import dotenv from "../../OB-backend/node_modules/dotenv/lib/main.js";
import jwt from "../../OB-backend/node_modules/jsonwebtoken/index.js";
import mongoose from "../../OB-backend/node_modules/mongoose/index.js";

dotenv.config({ path: "C:/Users/PC/Desktop/OceanBlue/OB-backend/.env" });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity\\brain\\f337c8ca-a0cb-4554-a40d-642c4520a570";
const BASE_URL = "http://localhost:3000";

async function runTest() {
  console.log("=== Testing Customer Detail Total Paid Amount ===");

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const { default: Admin } = await import("../../OB-backend/src/models/admin.model.js");
  const { default: CreditPerson } = await import("../../OB-backend/src/models/creditPersona.model.js");

  const owner = await Admin.findOne({ role: "owner" });
  if (!owner) throw new Error("Owner admin not found");

  const cp = await CreditPerson.findOne({ name: /Nan Shwe Yee/i });
  if (!cp) throw new Error("Daw Nan Shwe Yee not found");

  const token = jwt.sign(
    { id: owner._id.toString(), role: "owner" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  const adminData = JSON.stringify({
    _id: owner._id.toString(),
    name: owner.name,
    role: "owner"
  });

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("language", "en");
  }, { token, admin: adminData });

  const page = await context.newPage();

  try {
    console.log(`Navigating to /credits/${cp._id} in English ...`);
    await page.goto(`${BASE_URL}/credits/${cp._id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const totalOrderText = await page.locator('div:has-text("Total Order Amount") p.text-2xl').first().textContent();
    console.log(`Customer Detail Total Order Amount: "${totalOrderText}" (Expected: 56,000 MMK)`);

    const totalPaidText = await page.locator('div:has-text("Total Paid") p.text-2xl').first().textContent();
    console.log(`Customer Detail Total Paid: "${totalPaidText}" (Expected: 30,000 MMK)`);

    const creditPaidText = await page.locator('div:has-text("Credit Repaid") p.text-2xl').first().textContent();
    console.log(`Customer Detail Credit Repaid: "${creditPaidText}" (Expected: 0 MMK)`);

    const outstandingText = await page.locator('div:has-text("Outstanding") p.text-2xl').first().textContent();
    console.log(`Customer Detail Outstanding: "${outstandingText}" (Expected: 26,000 MMK)`);

    const screenshotEnPath = path.join(ARTIFACTS_DIR, "38-customer-detail-separated-amounts-en.png");
    await page.screenshot({ path: screenshotEnPath });
    console.log("Saved screenshot EN:", screenshotEnPath);

    // Switch to Myanmar
    console.log(`Navigating in Myanmar ...`);
    const contextMy = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await contextMy.addInitScript(({ token, admin }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("adminData", admin);
      localStorage.setItem("language", "my");
    }, { token, admin: adminData });
    const pageMy = await contextMy.newPage();
    await pageMy.goto(`${BASE_URL}/credits/${cp._id}`, { waitUntil: "networkidle" });
    await pageMy.waitForTimeout(2000);

    const screenshotMyPath = path.join(ARTIFACTS_DIR, "39-customer-detail-separated-amounts-my.png");
    await pageMy.screenshot({ path: screenshotMyPath });
    console.log("Saved screenshot MY:", screenshotMyPath);
    await contextMy.close();

    // Now test Order Detail Modal with delivery fee
    console.log("Navigating to /orders to inspect ORD-2026-09-04-000012 ...");
    await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const orderRow = page.locator('tr:has-text("ORD-2026-09-04-000012")');
    await orderRow.waitFor({ state: "visible", timeout: 10000 });
    const viewBtn = orderRow.locator('button').last();
    await viewBtn.click();
    console.log("Clicked view on ORD-2026-09-04-000012 ...");

    await page.waitForSelector('text=Order Details', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const screenshotOrderModalPath = path.join(ARTIFACTS_DIR, "41-order-detail-with-delivery-fee.png");
    await page.screenshot({ path: screenshotOrderModalPath });
    console.log("Saved screenshot Order Detail Modal:", screenshotOrderModalPath);
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runTest();
