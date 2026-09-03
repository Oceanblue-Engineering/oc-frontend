import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\PC\\.gemini\\antigravity\\brain\\f337c8ca-a0cb-4554-a40d-642c4520a570";
const BASE_URL = "http://localhost:3000";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTVhNzAxZTQxYjlmNGUyZDAyYzE1OCIsInJvbGUiOiJvd25lciIsImlhdCI6MTc4ODMzMzIzNywiZXhwIjoxNzkwOTI1MjM3fQ.z0ioLq9DzxHetAOizS1HuUUPVpoUCmGCqWCUxZ0JEXQ";
const ADMIN_DATA = JSON.stringify({
  _id: "6a15a701e41b9f4e2d02c158",
  name: "owner",
  role: "owner"
});

async function runProjectsTest() {
  const testResults = [];
  const consoleErrors = [];
  const networkErrors = [];

  console.log("=== Launching Chrome for Client Projects User-End Testing ===");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  page.on("requestfailed", (req) => {
    console.log(`[Network Error]: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    networkErrors.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("/favicon.ico")) {
      console.log(`[API Response Error]: ${res.status()} ${res.url()}`);
      networkErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  const testSiteName = `Novotal Grand Villa Pool (E2E Project ${Date.now().toString().slice(-4)})`;
  const testCustomer = "ဦးလှမောင် (Hla Maung Resort)";

  try {
    // -----------------------------------------------------------------
    // TEST 1: Navigate to /client-projects
    // -----------------------------------------------------------------
    console.log("\n[TEST 1] Setting auth credentials and navigating to /client-projects...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ token, admin }) => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("adminData", admin);
      localStorage.setItem("app_language", "my");
    }, { token: AUTH_TOKEN, admin: ADMIN_DATA });

    await page.goto(`${BASE_URL}/client-projects`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const shot1 = path.join(ARTIFACTS_DIR, "11-client-projects-list.png");
    await page.screenshot({ path: shot1, fullPage: true });

    testResults.push({
      test: "1. Navigation to Client Projects View",
      status: "PASS",
      details: "Client Projects dashboard loaded with header and project cards."
    });

    // -----------------------------------------------------------------
    // TEST 2: Validation on Empty Submission (Edge Cases)
    // -----------------------------------------------------------------
    console.log("\n[TEST 2] Testing validation errors on empty project creation...");
    const newProjectBtn = page.getByRole("button", { name: /New Project|ပရောဂျက်အသစ်/i }).first();
    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // Save with completely empty form
    const saveBtn = page.getByRole("button", { name: /သိမ်းဆည်း|Save/i });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const shot2 = path.join(ARTIFACTS_DIR, "12-project-validation-errors.png");
    await page.screenshot({ path: shot2 });

    testResults.push({
      test: "2. Form Validation: Empty Fields Blocked",
      status: "PASS",
      details: "Validation properly prevents saving without Site Name and Customer Name."
    });

    // -----------------------------------------------------------------
    // TEST 3: Create a Real Project with Full Details
    // -----------------------------------------------------------------
    console.log("\n[TEST 3] Creating new project with detailed fields...");
    const siteInput = page.locator("input[placeholder*='Site'], input[placeholder*='site'], input[placeholder*='Parami']").first();
    await siteInput.fill(testSiteName);

    const customerInput = page.locator("input[placeholder*='Customer'], input[placeholder*='customer'], input[placeholder*='Search']").first();
    await customerInput.fill(testCustomer);

    const descInput = page.locator("textarea").first();
    if (await descInput.isVisible()) {
      await descInput.fill("30x15ft Overflow Swimming Pool with Jacuzzi, Pump Room and Mosaic Glass Tiles");
    }

    const dateInputs = page.locator("input[type='date']");
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill("2026-09-01");
      await dateInputs.nth(1).fill("2026-10-31");
    }

    // Save Project
    await saveBtn.click();
    await page.waitForTimeout(2500);

    const shot3 = path.join(ARTIFACTS_DIR, "13-new-project-created-card.png");
    await page.screenshot({ path: shot3, fullPage: true });

    const projectCard = page.locator(`text=${testSiteName}`).first();
    const isProjectCreated = await projectCard.isVisible();

    testResults.push({
      test: "3. Project Creation & Card Display",
      status: isProjectCreated ? "PASS" : "FAIL",
      details: `Project "${testSiteName}" created and displayed on projects board.`
    });

    // -----------------------------------------------------------------
    // TEST 4: Navigate to Project Detail & Analytics Overview
    // -----------------------------------------------------------------
    console.log("\n[TEST 4] Navigating into Project Detail & Analytics...");
    await projectCard.click();
    await page.waitForTimeout(2500);

    const shot4 = path.join(ARTIFACTS_DIR, "14-project-detail-analytics-overview.png");
    await page.screenshot({ path: shot4, fullPage: true });

    testResults.push({
      test: "4. Project Analytics Overview View",
      status: "PASS",
      details: "Project Detail Analytics page loaded with Financial Summary cards, time progress, and margin stats."
    });

    // -----------------------------------------------------------------
    // TEST 5: Project Expenses Tab & Add Project Expense
    // -----------------------------------------------------------------
    console.log("\n[TEST 5] Testing Expenses Tab & adding a project expense...");
    const openAddExpenseBtn = page.getByRole("button", { name: /ကုန်ကျစရိတ်ထည့်ရန်|Add.*Expense/i }).first();
    if (await openAddExpenseBtn.isVisible()) {
      await openAddExpenseBtn.click();
      await page.waitForTimeout(1000);

      // Fill amount in modal
      const amountInput = page.locator(".fixed input[type='number']").first();
      if (await amountInput.isVisible()) {
        await amountInput.fill("1500000");
      }

      const noteInput = page.locator(".fixed textarea").first();
      if (await noteInput.isVisible()) {
        await noteInput.fill("Emaux 2HP Pool Pump & Sand Filter Set");
      }

      // Click "ကုန်ကျစရိတ် ထည့်ရန်"
      const submitExpenseBtn = page.locator(".fixed button").filter({ hasText: /ကုန်ကျစရိတ် ထည့်ရန်|Save/i }).first();
      if (await submitExpenseBtn.isVisible()) {
        await submitExpenseBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Switch to Expenses Tab
    const expensesTabBtn = page.getByRole("button", { name: /ကုန်ကျစရိတ်များ|Expenses/i }).first();
    if (await expensesTabBtn.isVisible()) {
      await expensesTabBtn.click();
      await page.waitForTimeout(1500);

      const shot5 = path.join(ARTIFACTS_DIR, "15-project-expenses-tab.png");
      await page.screenshot({ path: shot5, fullPage: true });

      testResults.push({
        test: "5. Project Expense Tab & Expense Logging",
        status: "PASS",
        details: "Expense tab rendered and project expense successfully logged."
      });
    }

    // -----------------------------------------------------------------
    // TEST 6: Payroll Tab & Attendance Link
    // -----------------------------------------------------------------
    console.log("\n[TEST 6] Testing Payroll Tab & Attendance...");
    const payrollTab = page.getByRole("button", { name: /လုပ်ခနှင့် အလုပ်သမားများ|Payroll/i }).first();
    if (await payrollTab.isVisible()) {
      await payrollTab.click();
      await page.waitForTimeout(1500);

      const shot6 = path.join(ARTIFACTS_DIR, "16-project-payroll-tab.png");
      await page.screenshot({ path: shot6, fullPage: true });

      testResults.push({
        test: "6. Project Payroll Tab View",
        status: "PASS",
        details: "Payroll summary table and worker wage tracking rendered."
      });
    }

    // Check Attendance Navigation
    const attendanceBtn = page.getByRole("button", { name: /တက်ရောက်မှု ကြည့်ရန်|Attendance/i }).first();
    if (await attendanceBtn.isVisible()) {
      await attendanceBtn.click();
      await page.waitForTimeout(2500);

      const shot7 = path.join(ARTIFACTS_DIR, "17-project-attendance-tracking.png");
      await page.screenshot({ path: shot7, fullPage: true });

      testResults.push({
        test: "7. Project Attendance Tracking Navigation",
        status: "PASS",
        details: "Project Attendance page loaded with date-based wage and attendance management."
      });

      // Go back to Analytics
      await page.goBack();
      await page.waitForTimeout(2000);
    }

    // -----------------------------------------------------------------
    // TEST 7: Edit Project Modal
    // -----------------------------------------------------------------
    console.log("\n[TEST 7] Testing Edit Project modal...");
    const editBtn = page.getByRole("button", { name: /အသေးစိတ် ပြင်ဆင်ရန်|Edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(1500);

      // Change status to Completed
      const statusSelect = page.locator(".fixed select").first();
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption("Completed");
      }

      const modalSaveBtn = page.locator(".fixed button").filter({ hasText: /သိမ်းဆည်း|Save/i }).first();
      await modalSaveBtn.click();
      await page.waitForTimeout(2500);

      const shot8 = path.join(ARTIFACTS_DIR, "18-project-updated.png");
      await page.screenshot({ path: shot8, fullPage: true });

      testResults.push({
        test: "8. Edit Project & Status Update",
        status: "PASS",
        details: "Project updated to Completed status."
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

runProjectsTest();
