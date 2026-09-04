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
  console.log("=== Testing Customer Credit Orders Action Buttons ===");

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

  // Test 1: English language
  const contextEn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await contextEn.addInitScript(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("language", "en");
  }, { token, admin: adminData });

  const pageEn = await contextEn.newPage();
  try {
    console.log("Navigating to /credit-orders in English...");
    await pageEn.goto(`${BASE_URL}/credit-orders`, { waitUntil: "networkidle" });
    await pageEn.waitForTimeout(2000);

    const assignBtn = pageEn.locator('table button:has-text("Assign")').first();
    const viewBtn = pageEn.locator('table button:has-text("View")').first();

    const isAssignVisible = await assignBtn.isVisible();
    const isViewVisible = await viewBtn.isVisible();
    console.log(`English - Assign button visible: ${isAssignVisible}, View button visible: ${isViewVisible}`);

    const screenshotEn = path.join(ARTIFACTS_DIR, "35-credit-orders-buttons-en.png");
    await pageEn.screenshot({ path: screenshotEn });
    console.log("Saved screenshot:", screenshotEn);
  } catch (err) {
    console.error("Test error En:", err);
  } finally {
    await contextEn.close();
  }

  // Test 2: Myanmar language
  const contextMy = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await contextMy.addInitScript(({ token, admin }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("adminData", admin);
    localStorage.setItem("language", "my");
  }, { token, admin: adminData });

  const pageMy = await contextMy.newPage();
  try {
    console.log("Navigating to /credit-orders in Myanmar...");
    await pageMy.goto(`${BASE_URL}/credit-orders`, { waitUntil: "networkidle" });
    await pageMy.waitForTimeout(2000);

    const assignBtn = pageMy.locator('table button:has-text("သတ်မှတ်မည်")').first();
    const viewBtn = pageMy.locator('table button:has-text("ကြည့်ရှုမည်")').first();

    const isAssignVisible = await assignBtn.isVisible();
    const isViewVisible = await viewBtn.isVisible();
    console.log(`Myanmar - Assign (သတ်မှတ်မည်) button visible: ${isAssignVisible}, View (ကြည့်ရှုမည်) button visible: ${isViewVisible}`);

    const screenshotMy = path.join(ARTIFACTS_DIR, "36-credit-orders-buttons-my.png");
    await pageMy.screenshot({ path: screenshotMy });
    console.log("Saved screenshot:", screenshotMy);
  } catch (err) {
    console.error("Test error My:", err);
  } finally {
    await contextMy.close();
    await browser.close();
    await mongoose.disconnect();
  }
}

runTest();
