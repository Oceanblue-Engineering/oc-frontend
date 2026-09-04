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

async function runTabsTest() {
  console.log("=== Launching Chrome to test Warehouse & Storefront Active/Inactive Tabs ===");

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
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("language", "my");
  }, { token, admin: adminData });

  const page = await context.newPage();

  try {
    // 1. Warehouse Page Test
    console.log("1. Navigating to /warehouse ...");
    await page.goto(`${BASE_URL}/warehouse`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const warehouseShot = path.join(ARTIFACTS_DIR, "25-warehouse-active-inactive-tabs.png");
    await page.screenshot({ path: warehouseShot, fullPage: true });
    console.log(`Saved screenshot: ${warehouseShot}`);

    // 2. Storefront Page Test
    console.log("2. Navigating to /storefront ...");
    await page.goto(`${BASE_URL}/storefront`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const storefrontShot = path.join(ARTIFACTS_DIR, "26-storefront-active-inactive-tabs.png");
    await page.screenshot({ path: storefrontShot, fullPage: true });
    console.log(`Saved screenshot: ${storefrontShot}`);

    console.log("=== All Tests Completed Successfully ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runTabsTest();
