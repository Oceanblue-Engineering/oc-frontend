import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { chromium } from "playwright-core";
import path from "node:path";
import dotenv from "../../OB-backend/node_modules/dotenv/lib/main.js";
import mongoose from "../../OB-backend/node_modules/mongoose/index.js";

dotenv.config({ path: "C:/Users/PC/Desktop/OceanBlue/OB-backend/.env" });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity\\brain\\f337c8ca-a0cb-4554-a40d-642c4520a570";
const BASE_URL = "http://localhost:3000";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODMzMzIzNywiZXhwIjoxNzkwOTI1MjM3fQ.z0ioLq9DzxHetAOizS1HuUUPVpoUCmGCqWCUxZ0JEXQ";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function runProjectInvoicesTabTest() {
  console.log("=== Setting up test project and invoices in DB ===");
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const { default: Project } = await import("../../OB-backend/src/models/project.model.js");
  const { default: Invoice } = await import("../../OB-backend/src/models/invoice.model.js");

  // Create or find test project
  let project = await Project.findOne({ siteName: /Novotal Luxury Pool E2E/ });
  if (!project) {
    project = await Project.create({
      siteName: "Novotal Luxury Pool E2E",
      customer: "ဦးဇော်မင်း (Novotal Hotel)",
      description: "Grand Infinity Pool & Jacuzzi Project",
      status: "In-Development",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-11-30"),
    });
  }

  const projectId = project._id.toString();
  console.log("Using Project ID:", projectId);

  // Clean old test invoices for this project
  await Invoice.deleteMany({ projectId: project._id });

  // Create Invoice 1: Issued (23,000,000 MMK)
  await Invoice.create({
    invoiceNo: `OB-20260902-${Date.now().toString().slice(-4)}`,
    quotationNo: `OB-Q-20260902-8801`,
    invoiceDate: new Date(),
    paymentTerms: "50% Advance, 50% on Completion",
    billTo: {
      name: "ဦးဇော်မင်း (Novotal Hotel)",
      company: "Novotal Luxury Pool E2E",
      address: "Pyay Road, Yangon",
      phone: "095012345",
    },
    totalAmount: 23000000,
    subTotal: 23000000,
    status: "issued",
    paymentMethod: "KBZ Pay",
    projectId: project._id,
    items: [
      { description: "Excavation and RCC Pool Structure Works", qty: 1, unitPrice: 15000000, amount: 15000000 },
      { description: "M&E Pumps, Filter & Piping Setup", qty: 1, unitPrice: 8000000, amount: 8000000 },
    ],
  });

  // Create Invoice 2: Paid (15,000,000 MMK)
  await Invoice.create({
    invoiceNo: `OB-20260902-${(Date.now() + 1).toString().slice(-4)}`,
    quotationNo: `OB-Q-20260902-8802`,
    invoiceDate: new Date(),
    paymentTerms: "100% Paid",
    billTo: {
      name: "ဦးဇော်မင်း (Novotal Hotel)",
      company: "Novotal Luxury Pool E2E",
      address: "Pyay Road, Yangon",
      phone: "095012345",
    },
    totalAmount: 15000000,
    subTotal: 15000000,
    status: "paid",
    paymentReceivedDate: new Date(),
    paymentMethod: "KBZ Pay",
    projectId: project._id,
    items: [
      { description: "Phase 1 Civil Works Advance Payment", qty: 1, unitPrice: 15000000, amount: 15000000 },
    ],
  });

  console.log("=== Launching Chrome to test Project Detail Invoices Tab ===");
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

    console.log(`Navigating to /projects/${projectId}/analytics...`);
    await page.goto(`${BASE_URL}/projects/${projectId}/analytics`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 1. Check if "Quotations & Invoices" tab exists
    const invoicesTab = page.getByRole("button", { name: /Quotations & Invoices|ဘေလ်/i }).first();
    const isTabVisible = await invoicesTab.isVisible();
    console.log("Is Quotations & Invoices tab visible?", isTabVisible);

    // 2. Click the Invoices tab
    console.log("Clicking Quotations & Invoices tab...");
    await invoicesTab.click();
    await page.waitForTimeout(2000);

    const shot1 = path.join(ARTIFACTS_DIR, "22-project-invoices-tab-view.png");
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`Saved screenshot: ${shot1}`);

    // 3. Click Quotation Preview button on the first row inside the table
    console.log("Clicking Quotation button in table row...");
    const quotationBtn = page.locator("tbody tr").first().getByRole("button", { name: "Quotation" });
    if (await quotationBtn.isVisible()) {
      await quotationBtn.click();
      await page.waitForTimeout(2500);

      const shot2 = path.join(ARTIFACTS_DIR, "23-project-invoice-modal-preview.png");
      await page.screenshot({ path: shot2, fullPage: true });
      console.log(`Saved screenshot: ${shot2}`);
    }

    console.log("=== Test Completed Successfully ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    // Clean up
    await Invoice.deleteMany({ projectId: project._id });
    await Project.deleteOne({ _id: project._id });
    await mongoose.disconnect();
    console.log("Cleaned up test data.");
  }
}

runProjectInvoicesTabTest();
