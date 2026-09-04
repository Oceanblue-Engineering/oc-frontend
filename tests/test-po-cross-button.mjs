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

async function runPOCrossButtonTest() {
  console.log("=== Testing Delete Cross Button in Add Item to PO ===");

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
    console.log("Navigating to /purchasing ...");
    await page.goto(`${BASE_URL}/purchasing`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Click "Create New PO" button
    console.log("Opening Create PO modal...");
    const createPOBtn = page.locator("button:has-text('Create New PO')").first();
    await createPOBtn.click();
    await page.waitForTimeout(1000);

    // Select supplier inside modal
    console.log("Selecting supplier in modal...");
    const supplierSelect = page.locator("div.fixed select").first();
    await supplierSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Type in product search box
    console.log("Typing in product search box...");
    const productInput = page.locator("div.fixed input[placeholder*='Type to search']").first();
    await productInput.fill("Master Audit Smart TV 55");
    await page.waitForTimeout(600);

    // Screenshot with typed search & cross button visible
    const shotWithCross = path.join(ARTIFACTS_DIR, "27-po-add-item-cross-button.png");
    await page.screenshot({ path: shotWithCross, fullPage: false });
    console.log(`Saved screenshot before click: ${shotWithCross}`);

    // Click the clear cross button
    console.log("Clicking the clear cross button...");
    const clearBtn = page.locator("button[title='Clear item search']").first();
    const isVisible = await clearBtn.isVisible();
    console.log("Is clear button visible?", isVisible);

    await clearBtn.click();
    await page.waitForTimeout(600);

    const valAfter = await productInput.inputValue();
    console.log("Input value after clicking clear button:", `"${valAfter}"`);

    const shotCleared = path.join(ARTIFACTS_DIR, "28-po-add-item-cleared.png");
    await page.screenshot({ path: shotCleared, fullPage: false });
    console.log(`Saved screenshot after clear: ${shotCleared}`);

    console.log("=== All Tests Completed Successfully ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runPOCrossButtonTest();
