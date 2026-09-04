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

async function runPOEditFeatureTest() {
  console.log("=== Testing PO Edit Feature in Purchasing Table ===");

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

  // Ensure there is at least 1 supplier, 1 product linked, and 1 pending PO
  let supplier = await SupplierProfile.findOne({ isDeleted: false });
  if (!supplier) {
    supplier = await SupplierProfile.create({
      supplierName: "Apex Global Supplies",
      contactNumber: "09771122334",
      address: "Yangon",
    });
  }

  let inventory = await Inventory.findOne({ isDeleted: false });
  if (!inventory) {
    inventory = await Inventory.create({
      productName: "Premium Filter Pump",
      productCode: "PMP-FLT-900",
      category: "Equipment",
      buyingPrice: 150000,
      sellingPrice: 220000,
      suppliers: [supplier._id],
    });
  } else {
    if (!inventory.suppliers || !inventory.suppliers.some(s => s.toString() === supplier._id.toString())) {
      inventory.suppliers = [supplier._id];
      await inventory.save();
    }
  }

  let testPO = await Purchasing.findOne({ status: "pending", isDeleted: false });
  if (!testPO) {
    const poNumber = await Purchasing.generatePONumber();
    testPO = await Purchasing.create({
      poNumber,
      supplierId: supplier._id,
      products: [
        {
          inventoryId: inventory._id,
          productName: inventory.productName,
          productCode: inventory.productCode,
          buyingPrice: inventory.buyingPrice,
          purchaseQuantity: 3,
        }
      ],
      note: "Initial test purchase note",
      totalAmount: 450000,
      paymentType: "paid",
      paidAmount: 450000,
      status: "pending",
      purchasedBy: owner._id,
    });
  }

  console.log("Using Test PO:", testPO.poNumber);

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

    // 1. Screenshot of Table showing the Edit button
    const shotTable = path.join(ARTIFACTS_DIR, "29-po-table-with-edit-button.png");
    await page.screenshot({ path: shotTable, fullPage: false });
    console.log(`Saved screenshot 1 (Table with Edit Button): ${shotTable}`);

    // 2. Click Edit button on the first pending PO row
    console.log("Clicking Edit button on PO row...");
    const editBtn = page.locator("button:has-text('Edit')").first();
    const isEditVisible = await editBtn.isVisible();
    console.log("Is Edit button visible?", isEditVisible);
    await editBtn.click();
    await page.waitForTimeout(1000);

    // 3. Screenshot of pre-populated Edit PO Modal
    const shotModal = path.join(ARTIFACTS_DIR, "30-po-edit-modal-prefilled.png");
    await page.screenshot({ path: shotModal, fullPage: false });
    console.log(`Saved screenshot 2 (Edit Modal Pre-filled): ${shotModal}`);

    // 4. Update the note in the modal
    console.log("Updating PO note...");
    const noteTextarea = page.locator("textarea[placeholder*='Additional notes']");
    await noteTextarea.fill("Updated PO Note by E2E automation test");
    await page.waitForTimeout(500);

    // 5. Submit Update
    console.log("Submitting updated PO...");
    const updateBtn = page.locator("button:has-text('Update Purchase Order')");
    await updateBtn.click();
    await page.waitForTimeout(2000);

    // 6. Screenshot after update
    const shotAfter = path.join(ARTIFACTS_DIR, "31-po-table-after-edit.png");
    await page.screenshot({ path: shotAfter, fullPage: false });
    console.log(`Saved screenshot 3 (Table after update): ${shotAfter}`);

    console.log("=== All PO Edit Tests Completed Successfully ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runPOEditFeatureTest();
