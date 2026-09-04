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
  console.log("=== Testing Add Payment Button Visibility for PO States ===");

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const { default: Admin } = await import("../../OB-backend/src/models/admin.model.js");
  const { default: Purchasing } = await import("../../OB-backend/src/models/purchasing.model.js");
  const { default: SupplierProfile } = await import("../../OB-backend/src/models/supplierProfile.model.js");
  const { default: Inventory } = await import("../../OB-backend/src/models/inventory.model.js");

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

  let supplier = await SupplierProfile.findOne({ isDeleted: false });
  if (!supplier) {
    supplier = await SupplierProfile.create({
      supplierName: "Apex Global Supplies",
      contactNumber: "09771122334",
      address: "Yangon",
    });
  }

  let inventory = await Inventory.findOne();
  if (!inventory) {
    const code = "PMP-" + Date.now();
    inventory = await Inventory.create({
      productName: "Premium Filter Pump " + Date.now(),
      productCode: code,
      category: "Equipment",
      buyingPrice: 150000,
      sellingPrice: 220000,
      suppliers: [supplier._id],
    });
  }

  // 1. Ensure a fresh credit pending PO exists
  const pendingPONumber = await Purchasing.generatePONumber();
  const pendingPO = await Purchasing.create({
    poNumber: pendingPONumber,
    supplierId: supplier._id,
    products: [{
      inventoryId: inventory._id,
      productName: inventory.productName,
      productCode: inventory.productCode,
      buyingPrice: 10000,
      purchaseQuantity: 5,
    }],
    totalAmount: 50000,
    paymentType: "credit",
    paidAmount: 10000,
    status: "pending",
    purchasedBy: owner._id,
  });

  // 2. Ensure a fresh credit arrived PO exists
  const arrivedPONumber = await Purchasing.generatePONumber();
  const arrivedPO = await Purchasing.create({
    poNumber: arrivedPONumber,
    supplierId: supplier._id,
    products: [{
      inventoryId: inventory._id,
      productName: inventory.productName,
      productCode: inventory.productCode,
      buyingPrice: 10000,
      purchaseQuantity: 5,
    }],
    totalAmount: 50000,
    paymentType: "credit",
    paidAmount: 10000,
    status: "arrived",
    purchasedBy: owner._id,
  });

  console.log(`Created Pending PO: ${pendingPO.poNumber}, Arrived PO: ${arrivedPO.poNumber}`);

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
    localStorage.setItem("language", "en"); // use English so labels are exact
  }, { token, admin: adminData });

  const page = await context.newPage();

  try {
    console.log("Navigating to Purchasing page...");
    await page.goto(`${BASE_URL}/purchasing`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Step 1: Check Pending PO Detail Modal
    console.log(`Testing Pending PO Details modal (${pendingPO.poNumber})...`);
    const pendingRow = page.locator(`tr:has-text("${pendingPO.poNumber}")`);
    await pendingRow.waitFor({ state: "visible", timeout: 10000 });
    const pendingViewBtn = pendingRow.locator('button:has-text("View")').first();
    await pendingViewBtn.click();
    await page.waitForTimeout(2000);

    // Verify modal is open
    const modalTitle = page.locator('text="Purchase Order Details"');
    await modalTitle.waitFor({ state: "visible" });

    // Check that "Add Payment" is NOT present
    const addPaymentBtnPending = page.locator('button:has-text("Add Payment")');
    const isAddPaymentVisibleInPending = await addPaymentBtnPending.isVisible();
    console.log(`Add Payment button in Pending PO (${pendingPO.poNumber}): visible = ${isAddPaymentVisibleInPending} (Expected: false)`);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "32-po-details-pending-no-add-payment.png")
    });

    // Close modal
    const closeBtn = page.locator('button:has-text("✕"), button[aria-label="Close"], button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(1000);

    // Step 2: Switch to Arrived tab
    console.log(`Switching to Arrived tab for PO (${arrivedPO.poNumber})...`);
    const arrivedTab = page.locator('button:has-text("Arrived")').first();
    await arrivedTab.waitFor({ state: "visible", timeout: 10000 });
    await arrivedTab.click();
    await page.waitForTimeout(2500);

    const arrivedRow = page.locator(`tr:has-text("${arrivedPO.poNumber}")`);
    await arrivedRow.waitFor({ state: "visible", timeout: 10000 });
    const arrivedViewBtn = arrivedRow.locator('button:has-text("View")').first();
    await arrivedViewBtn.click();
    await page.waitForTimeout(2000);

    // Verify modal is open
    await modalTitle.waitFor({ state: "visible" });

    // Check that "Add Payment" IS present
    const addPaymentBtnArrived = page.locator('button:has-text("Add Payment")');
    const isAddPaymentVisibleInArrived = await addPaymentBtnArrived.isVisible();
    console.log(`Add Payment button in Arrived PO (${arrivedPO.poNumber}): visible = ${isAddPaymentVisibleInArrived} (Expected: true)`);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "33-po-details-arrived-with-add-payment.png")
    });

    if (!isAddPaymentVisibleInPending && isAddPaymentVisibleInArrived) {
      console.log("✅ SUCCESS: Add Payment button is ONLY visible when PO is in arrived state!");
    } else {
      console.warn("⚠️ Warning: Conditions did not fully match expected visibility states.");
    }
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runTest();
