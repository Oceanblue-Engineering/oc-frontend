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
  console.log("=== Capturing PO Table without Total Remaining Column ===");

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const { default: Admin } = await import("../../OB-backend/src/models/admin.model.js");

  const owner = await Admin.findOne({ role: "owner" });
  if (!owner) throw new Error("Owner admin not found");

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

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await context.addInitScript(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("language", "my");
  }, { token, admin: adminData });

  const page = await context.newPage();

  try {
    console.log("Navigating to Purchasing page...");
    await page.goto(`${BASE_URL}/purchasing`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const table = page.locator("table");
    await table.waitFor({ state: "visible", timeout: 10000 });

    const remainingHeader = page.locator('th:has-text("Total Remaining")');
    const isHeaderPresent = await remainingHeader.isVisible();
    console.log(`Total Remaining column header present: ${isHeaderPresent} (Expected: false)`);

    const screenshotPath = path.join(ARTIFACTS_DIR, "34-po-table-no-total-remaining.png");
    await page.screenshot({ path: screenshotPath });
    console.log("Saved screenshot:", screenshotPath);
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runTest();
