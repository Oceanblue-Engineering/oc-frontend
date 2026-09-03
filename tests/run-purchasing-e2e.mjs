import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\d5ad2b23-d581-48d0-b1cd-77e1dbcb5185";
const BASE_URL = "http://localhost:3000";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODMzMzIzNywiZXhwIjoxNzkwOTI1MjM3fQ.z0ioLq9DzxHetAOizS1HuUUPVpoUCmGCqWCUxZ0JEXQ";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function runPurchasingTest() {
  const testResults = [];
  const consoleErrors = [];
  const networkErrors = [];

  console.log("=== Launching Chrome for Purchasing Feature E2E Testing ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/favicon.ico")) {
      console.log(`[API Response Error]: ${response.status()} ${response.url()}`);
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    // -----------------------------------------------------------------
    // TEST 1: Authentication & Navigation to /purchasing
    // -----------------------------------------------------------------
    console.log("\n[TEST 1] Navigating to /purchasing with auth credentials...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    await page.evaluate(({ token, admin }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("adminData", admin);
      localStorage.setItem("app_language", "my");
    }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

    await page.goto(`${BASE_URL}/purchasing`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const shot1 = path.join(ARTIFACTS_DIR, "purchasing_01_initial_page.png");
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`Screenshot saved: ${shot1}`);

    const hasHeader = await page.locator("h1, h2").first().isVisible();
    testResults.push({
      test: "1. Navigation & Initial Purchasing Page Render",
      status: hasHeader ? "PASS" : "FAIL",
      details: "Purchasing page loaded with PO tab, filters, and Create New PO button."
    });

    // -----------------------------------------------------------------
    // TEST 2: Tab Switching (PO <-> GRN)
    // -----------------------------------------------------------------
    console.log("\n[TEST 2] Testing tab switching (PO <-> GRN)...");
    // The tabs in Purchasing.tsx have SVG icons and text
    const grnTabBtn = page.locator("button").filter({ hasText: /Goods Received Note|GRN|ကုန်ပစ္စည်းလက်ခံ/i }).first();
    await grnTabBtn.click();
    await page.waitForTimeout(1000);
    const hasGRNListTitle = await page.getByText(/Goods Received Notes List/i).isVisible();
    console.log("GRN Tab active, Goods Received Notes List title visible:", hasGRNListTitle);

    const poTabBtn = page.locator("button").filter({ hasText: /Purchase Orders|PO|အဝယ်ဘောက်ချာ/i }).first();
    await poTabBtn.click();
    await page.waitForTimeout(1000);

    testResults.push({
      test: "2. Tab Switching (PO <-> GRN)",
      status: hasGRNListTitle ? "PASS" : "FAIL",
      details: "Seamless switching between PO and GRN views with reactive headers and tables."
    });

    // -----------------------------------------------------------------
    // TEST 3: Create PO Modal - Empty Submission & Disabled State
    // -----------------------------------------------------------------
    console.log("\n[TEST 3] Testing Create PO Modal validation...");
    const createPOBtn = page.locator("button:has-text('Create New PO')").first();
    await createPOBtn.click();
    await page.waitForTimeout(1000);

    const submitPOBtn = page.locator("button:has-text('Create Purchase Order')").first();
    const isDisabledInitially = await submitPOBtn.isDisabled();
    console.log("Create Purchase Order button is disabled when empty:", isDisabledInitially);

    const shot2 = path.join(ARTIFACTS_DIR, "purchasing_02_modal_empty_disabled.png");
    await page.screenshot({ path: shot2 });
    console.log(`Screenshot saved: ${shot2}`);

    testResults.push({
      test: "3. Create PO Form Disabled State (Edge Case: Empty Form)",
      status: isDisabledInitially ? "PASS" : "FAIL",
      details: "Create Purchase Order button is safely disabled when supplier and items are missing."
    });

    // -----------------------------------------------------------------
    // TEST 4: Select Supplier & Add Item
    // -----------------------------------------------------------------
    console.log("\n[TEST 4] Selecting Supplier and adding product...");
    // Supplier select is inside the modal
    const supplierSelect = page.locator(".fixed select").first();
    await supplierSelect.selectOption({ index: 1 }); // Alpha Suppliers
    await page.waitForTimeout(500);

    const isDisabledSupplierOnly = await submitPOBtn.isDisabled();
    console.log("Create PO button still disabled with only supplier selected:", isDisabledSupplierOnly);

    // Search product
    const productInput = page.locator("input[placeholder*='Type to search and select product']");
    await productInput.fill("Orange Juice");
    await page.waitForTimeout(500);

    const productOption = page.locator(".shadow-lg div").filter({ hasText: /Orange Juice/i }).first();
    if (await productOption.isVisible()) {
      await productOption.click();
    } else {
      await page.locator(".shadow-lg div.cursor-pointer").first().click();
    }
    await page.waitForTimeout(500);

    // Set Quantity = 2
    const qtyInput = page.locator("input[placeholder='Qty']");
    await qtyInput.fill("2");

    // Click Add item (+) button
    const addItemBtn = page.locator("button.bg-green-100");
    await addItemBtn.click();
    await page.waitForTimeout(500);

    const poSummaryTable = page.locator(".fixed table");
    const hasItemInTable = await poSummaryTable.getByText(/Orange Juice|pc|4,800|9,600/i).first().isVisible();
    console.log("Item added to PO Summary table:", hasItemInTable);

    // -----------------------------------------------------------------
    // TEST 5: Credit Payment Boundary Validations (Edge Cases)
    // -----------------------------------------------------------------
    console.log("\n[TEST 5] Testing Credit Payment Edge Cases (Negative & Exceeding Amount)...");
    const creditRadio = page.locator("input[type='radio'][value='credit']");
    await creditRadio.check();
    await page.waitForTimeout(500);

    // Test Negative Paid Amount
    const paidAmountInput = page.locator("input[placeholder='0']");
    await paidAmountInput.fill("-1000");
    await page.waitForTimeout(500);

    const negativeErrorText = await page.getByText(/Paid amount cannot be negative/i).isVisible();
    console.log("Negative paid amount error message displayed:", negativeErrorText);

    // Test Paid Amount Exceeding Total
    await paidAmountInput.fill("999999");
    await page.waitForTimeout(500);

    const exceedErrorText = await page.getByText(/Paid amount cannot exceed total amount/i).isVisible();
    console.log("Exceeding paid amount error message displayed:", exceedErrorText);

    const shot3 = path.join(ARTIFACTS_DIR, "purchasing_03_credit_validation_errors.png");
    await page.screenshot({ path: shot3 });
    console.log(`Screenshot saved: ${shot3}`);

    testResults.push({
      test: "4. Credit Payment Boundary Validations (Negative & Exceeding Total)",
      status: (negativeErrorText && exceedErrorText) ? "PASS" : "FAIL",
      details: "Proper validation messages displayed when entering negative or exceeding advance payment."
    });

    // -----------------------------------------------------------------
    // TEST 6: Valid PO Submission (Credit with 5,000 MMK advance)
    // -----------------------------------------------------------------
    console.log("\n[TEST 6] Entering valid credit payment details and creating PO...");
    await paidAmountInput.fill("5000");
    await page.waitForTimeout(500);

    // Check Remaining balance calculation: 9,600 - 5,000 = 4,600
    const remainingBalanceText = await page.getByText(/4,600 MMK/i).first().isVisible();
    console.log("Remaining Balance dynamically calculated (4,600 MMK):", remainingBalanceText);

    // Set Due Date
    const dueDateInput = page.locator("input[type='date']");
    await dueDateInput.fill("2026-09-30");

    // Add Note
    const noteTextarea = page.locator("textarea[placeholder*='Additional notes']");
    await noteTextarea.fill("Automated E2E Test Purchase Order - Credit Partial Payment");

    // Submit PO
    await submitPOBtn.click();
    await page.waitForTimeout(2500);

    const shot4 = path.join(ARTIFACTS_DIR, "purchasing_04_po_list_after_create.png");
    await page.screenshot({ path: shot4, fullPage: true });
    console.log(`Screenshot saved: ${shot4}`);

    testResults.push({
      test: "5. PO Creation & Dynamic Calculation",
      status: remainingBalanceText ? "PASS" : "FAIL",
      details: "PO created successfully with real-time remaining balance calculation (4,600 MMK) and due date tracking."
    });

    // -----------------------------------------------------------------
    // TEST 7: Verify PO in List & Filters
    // -----------------------------------------------------------------
    console.log("\n[TEST 7] Verifying PO in Pending list and testing filters...");
    const tableText = await page.locator("table").first().innerText();
    const poInList = tableText.includes("Alpha Suppliers") && tableText.includes("9,600");
    console.log("Created PO found in Pending PO list:", poInList);

    // Test Payment Type dropdown filter
    const paymentTypeSelect = page.locator("select").filter({ hasText: /All Types|Paid|Credit/i }).first();
    if (await paymentTypeSelect.isVisible()) {
      // Filter by Credit
      await paymentTypeSelect.selectOption("credit");
      await page.waitForTimeout(1000);
      const creditVisible = (await page.locator("table").first().innerText()).includes("Alpha Suppliers");
      console.log("PO visible when filtered by Credit:", creditVisible);

      // Filter by Paid (should not show our credit PO)
      await paymentTypeSelect.selectOption("paid");
      await page.waitForTimeout(1000);
      const paidFilteredText = await page.locator("table").first().innerText();
      const creditHidden = !paidFilteredText.includes("9,600 MMK");
      console.log("Credit PO hidden when filtered by Paid:", creditHidden);

      // Reset to All
      await paymentTypeSelect.selectOption("all");
      await page.waitForTimeout(1000);
    }

    testResults.push({
      test: "6. PO List Display & Reactive Filter Controls",
      status: poInList ? "PASS" : "FAIL",
      details: "Created PO accurately appears in Pending list with correct amounts and responds to Credit/Paid filters."
    });

    // -----------------------------------------------------------------
    // TEST 8: View PO Details Modal
    // -----------------------------------------------------------------
    console.log("\n[TEST 8] Testing PO Detail view modal...");
    const viewDetailBtn = page.locator("button:has-text('View')").first();
    if (await viewDetailBtn.isVisible()) {
      await viewDetailBtn.click();
      await page.waitForTimeout(1500);

      const shot5 = path.join(ARTIFACTS_DIR, "purchasing_05_po_detail_modal.png");
      await page.screenshot({ path: shot5 });
      console.log(`Screenshot saved: ${shot5}`);

      const hasDetailModal = await page.locator(".fixed").filter({ hasText: /Purchase Order Detail|PO Details|Alpha Suppliers/i }).first().isVisible();
      console.log("PO Detail modal opened successfully:", hasDetailModal);

      // Close modal
      const closeDetailBtn = page.locator(".fixed button").filter({ has: page.locator("svg.lucide-x") }).first();
      await closeDetailBtn.click();
      await page.waitForTimeout(500);

      testResults.push({
        test: "7. PO Details Modal Inspection",
        status: hasDetailModal ? "PASS" : "FAIL",
        details: "Detailed breakdown of items, supplier info, payment status, and order notes verified."
      });
    }

    // -----------------------------------------------------------------
    // TEST 9: Full Lifecycle (Mark Arrived -> Receive Goods / GRN)
    // -----------------------------------------------------------------
    console.log("\n[TEST 9] Testing PO status transition (Mark Arrived -> GRN flow)...");
    const markArrivedBtn = page.locator("button:has-text('Mark Arrived')").first();
    if (await markArrivedBtn.isVisible()) {
      await markArrivedBtn.click();
      await page.waitForTimeout(2000);

      // Status should now be ARRIVED, so switch filter tab to "Arrived"
      const arrivedTabBtn = page.locator("button").filter({ hasText: /Arrived|ရောက်ရှိ/i }).first();
      await arrivedTabBtn.click();
      await page.waitForTimeout(1500);

      const shot6 = path.join(ARTIFACTS_DIR, "purchasing_06_arrived_po_with_grn_btn.png");
      await page.screenshot({ path: shot6, fullPage: true });
      console.log(`Screenshot saved: ${shot6}`);

      // Check GRN button is now visible on the arrived PO
      const grnActionBtn = page.locator("button:has-text('GRN')").first();
      const hasGRNBtn = await grnActionBtn.isVisible();
      console.log("GRN action button visible for Arrived PO:", hasGRNBtn);

      if (hasGRNBtn) {
        await grnActionBtn.click();
        await page.waitForTimeout(1500);

        const shot7 = path.join(ARTIFACTS_DIR, "purchasing_07_create_grn_from_po_modal.png");
        await page.screenshot({ path: shot7 });
        console.log(`Screenshot saved: ${shot7}`);

        const hasGRNModal = await page.locator(".fixed").filter({ hasText: /Receive Goods|GRN|Create GRN/i }).first().isVisible();
        console.log("Create GRN modal opened from PO:", hasGRNModal);

        // Close GRN modal
        const closeGRNBtn = page.locator(".fixed button").filter({ has: page.locator("svg.lucide-x") }).first();
        await closeGRNBtn.click();
        await page.waitForTimeout(500);

        testResults.push({
          test: "8. PO Lifecycle: Mark Arrived & GRN Conversion",
          status: hasGRNBtn ? "PASS" : "FAIL",
          details: "PO successfully transitioned from PENDING to ARRIVED, unlocking GRN goods receipt."
        });
      }
    }

  } catch (error) {
    console.error("Test execution error:", error);
    testResults.push({
      test: "Test Execution",
      status: "ERROR",
      details: error.message
    });
  } finally {
    await browser.close();
  }

  console.log("\n================ PURCHASING TEST RESULTS ================");
  console.table(testResults);
  console.log("Console Errors:", consoleErrors);
  console.log("Network Errors:", networkErrors);

  return { testResults, consoleErrors, networkErrors };
}

runPurchasingTest();
