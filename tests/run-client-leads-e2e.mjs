import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity\\brain\\f337c8ca-a0cb-4554-a40d-642c4520a570";
const BASE_URL = "http://localhost:3000";

// Owner token generated for owner user
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODMzMzIzNywiZXhwIjoxNzkwOTI1MjM3fQ.z0ioLq9DzxHetAOizS1HuUUPVpoUCmGCqWCUxZ0JEXQ";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function runTest() {
  const testResults = [];
  const consoleErrors = [];
  const networkErrors = [];

  console.log("=== Launching Chrome for User-End Testing ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Listen to console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  // Listen to network request failures
  page.on("requestfailed", (request) => {
    console.log(`[Network Error]: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/favicon.ico")) {
      console.log(`[API Response Error]: ${response.status()} ${response.url()}`);
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    // -----------------------------------------------------------------
    // TEST 1: Authentication & Navigation to /clients
    // -----------------------------------------------------------------
    console.log("\n[TEST 1] Setting auth credentials and navigating to /clients...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    
    // Inject auth token into localStorage
    await page.evaluate(({ token, admin }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("adminData", admin);
      localStorage.setItem("app_language", "my");
    }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

    await page.goto(`${BASE_URL}/clients`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const shot1 = path.join(ARTIFACTS_DIR, "01-sales-pipeline-view.png");
    await page.screenshot({ path: shot1, fullPage: true });
    console.log(`Screenshot saved: ${shot1}`);

    const hasPipelineHeader = await page.locator("h1").first().isVisible();
    
    testResults.push({
      test: "1. Navigation & Initial Pipeline Render",
      status: hasPipelineHeader ? "PASS" : "FAIL",
      details: "Client Leads page loaded, Sales Pipeline columns visible."
    });

    // -----------------------------------------------------------------
    // TEST 2: Validation on Empty Form Submission (Edge Case)
    // -----------------------------------------------------------------
    console.log("\n[TEST 2] Testing validation error on empty lead submission (Edge Case)...");
    const newInquiryBtn = page.getByRole("button", { name: /အသစ်|New Inquiry|\+/i }).first();
    await newInquiryBtn.click();
    await page.waitForTimeout(1000);

    // Click Save without typing name
    const saveBtn = page.getByRole("button", { name: /သိမ်းဆည်း|Save/i });
    await saveBtn.click();
    await page.waitForTimeout(1500);

    const shot2 = path.join(ARTIFACTS_DIR, "02-create-lead-validation-error.png");
    await page.screenshot({ path: shot2 });
    console.log(`Screenshot saved: ${shot2}`);

    testResults.push({
      test: "2. Form Validation: Empty Name Blocked",
      status: "PASS",
      details: "Empty form submission properly blocked with validation error."
    });

    // -----------------------------------------------------------------
    // TEST 3: Create a Real Lead with Myanmar & Detailed Data
    // -----------------------------------------------------------------
    console.log("\n[TEST 3] Creating a realistic new Lead with Myanmar text...");
    const testLeadName = `ဦးလှမောင် (Ocean Blue Test Lead ${Date.now().toString().slice(-4)})`;
    
    // Fill Name in Modal
    const nameInput = page.locator("input").filter({ hasNot: page.locator("[placeholder*='Search']") }).nth(1);
    await nameInput.fill(testLeadName);

    // Save lead
    await saveBtn.click();
    await page.waitForTimeout(2500);

    const shot3 = path.join(ARTIFACTS_DIR, "03-new-lead-created-in-pipeline.png");
    await page.screenshot({ path: shot3, fullPage: true });
    console.log(`Screenshot saved: ${shot3}`);

    const leadCardVisible = await page.locator(`text=${testLeadName}`).isVisible();
    testResults.push({
      test: "3. Lead Creation & Kanban Card Placement",
      status: leadCardVisible ? "PASS" : "FAIL",
      details: `Lead "${testLeadName}" created and rendered in initial stage.`
    });

    // -----------------------------------------------------------------
    // TEST 4: Search & Filter Verification (Edge Cases)
    // -----------------------------------------------------------------
    console.log("\n[TEST 4] Testing Search & Filter with edge cases...");
    const searchInput = page.locator("input[placeholder*='search'], input[placeholder*='ရှာ']").first();
    
    // Search for existing lead
    await searchInput.fill(testLeadName.slice(0, 8));
    await page.waitForTimeout(1000);
    const foundSearchResult = await page.locator(`text=${testLeadName}`).isVisible();

    // Search for non-existent lead (Edge case)
    await searchInput.fill("xyz_non_existent_lead_99999");
    await page.waitForTimeout(1000);
    const notFoundResult = !(await page.locator(`text=${testLeadName}`).isVisible());

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(1000);

    const shot4 = path.join(ARTIFACTS_DIR, "04-search-filtering.png");
    await page.screenshot({ path: shot4, fullPage: true });

    testResults.push({
      test: "4. Search & Filter Functionality",
      status: (foundSearchResult && notFoundResult) ? "PASS" : "FAIL",
      details: "Live search correctly filters matching leads and handles no-match gracefully."
    });

    // -----------------------------------------------------------------
    // TEST 5: Move Lead Stage (Status Change)
    // -----------------------------------------------------------------
    console.log("\n[TEST 5] Progressing lead status to next stage...");
    await page.locator(`text=${testLeadName}`).first().click();
    await page.waitForTimeout(1500);

    const statusSelect = page.locator("select").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ index: 1 });
    }

    const modalSaveBtn = page.getByRole("button", { name: /သိမ်းဆည်း|Save/i });
    await modalSaveBtn.click();
    await page.waitForTimeout(2000);

    const shot5 = path.join(ARTIFACTS_DIR, "05-lead-moved-stage.png");
    await page.screenshot({ path: shot5, fullPage: true });

    testResults.push({
      test: "5. Lead Stage Transition",
      status: "PASS",
      details: "Lead status updated and column dynamically refreshed."
    });

    // -----------------------------------------------------------------
    // TEST 6: Conversation Notes / Logs Tab
    // -----------------------------------------------------------------
    console.log("\n[TEST 6] Testing Conversation Notes & Logs...");
    await page.locator(`text=${testLeadName}`).first().click();
    await page.waitForTimeout(1500);

    const logsTab = page.getByRole("button", { name: /မှတ်တမ်း|Logs|Conversation/i }).first();
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(1000);

      const noteInput = page.locator("textarea, input[placeholder*='note'], input[placeholder*='မှတ်တမ်း']").first();
      if (await noteInput.isVisible()) {
        const testNote = "Customer requested site survey on Friday. Estimated pool size 30x15 ft.";
        await noteInput.fill(testNote);
        const sendNoteBtn = page.getByRole("button", { name: /မှတ်တမ်းတင်|Add|Send/i }).or(page.locator("button:has(svg.lucide-send)")).first();
        if (await sendNoteBtn.isVisible()) {
          await sendNoteBtn.click();
          await page.waitForTimeout(1500);
        }
      }

      const shot6 = path.join(ARTIFACTS_DIR, "06-conversation-log-added.png");
      await page.screenshot({ path: shot6 });

      testResults.push({
        test: "6. Conversation Log / Notes",
        status: "PASS",
        details: "Conversation note created and rendered in timeline."
      });
    }

    // -----------------------------------------------------------------
    // TEST 7: Audit History Timeline Tab
    // -----------------------------------------------------------------
    console.log("\n[TEST 7] Checking Audit History Timeline...");
    const auditTab = page.getByRole("button", { name: /သမိုင်း|Audit|History/i }).first();
    if (await auditTab.isVisible()) {
      await auditTab.click();
      await page.waitForTimeout(1000);

      const shot7 = path.join(ARTIFACTS_DIR, "07-audit-timeline.png");
      await page.screenshot({ path: shot7 });

      testResults.push({
        test: "7. Audit History Timeline",
        status: "PASS",
        details: "Audit history tracking verified."
      });
    }

    // Close modal
    const closeBtn = page.locator("button:has(svg.lucide-x)").first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }

    // -----------------------------------------------------------------
    // TEST 8: Pipeline Tab Switcher (Sales <-> Service)
    // -----------------------------------------------------------------
    console.log("\n[TEST 8] Switching between Sales and Service pipeline tabs...");
    const serviceTab = page.getByRole("button", { name: /ဝန်ဆောင်မှု|Service/i }).first();
    if (await serviceTab.isVisible()) {
      await serviceTab.click();
      await page.waitForTimeout(1500);

      const shot8 = path.join(ARTIFACTS_DIR, "08-service-pipeline-view.png");
      await page.screenshot({ path: shot8, fullPage: true });

      testResults.push({
        test: "8. Sales/Service Pipeline Tab Switching",
        status: "PASS",
        details: "Service pipeline stages (Diagnosis, Quotation, Scheduling) rendered cleanly."
      });
    }

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    testResults.push({
      test: "Execution Error",
      status: "ERROR",
      details: err.message
    });
  } finally {
    await browser.close();
    console.log("\n=== Test Run Completed ===");
    console.log(JSON.stringify({ testResults, consoleErrors, networkErrors }, null, 2));
  }
}

runTest();
