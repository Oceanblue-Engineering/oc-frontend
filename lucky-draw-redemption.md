# Task: Lucky Draw Promotion Management & Redemption Processing UI & API Integration

**Objective:**
Build a user-friendly UI/UX for store staff to manage Lucky Draw Promotions (CRUD) and process redemptions with automatic fee calculation, stock deduction, and proper error handling.

---

## **1. Promotion Management UI (CRUD)**

* **Promotion List View:**
  * Create a responsive Table to display existing Lucky Draw promotions.
  * Columns required: Ticket Name, Linked Product, Redemption Price/Fee, and Active Status.
  * Implement Search and Filter functionality (by Ticket Name and Product Name).

* **Create & Edit Promotion Modal/Form:**
  * **Ticket Name Input:** Field to enter the promotion title/ticket name.
  * **Linked Product Selector:** A searchable dropdown (Combobox/Select) to select products from the existing inventory.
  * **Redemption Fee Input:** Field to input the required fee/price.
  * **Validation:** Prevent negative values or zero where applicable (e.g., fee cannot be negative). Show warning messages if required fields are empty.

* **Delete Promotion:**
  * Add a confirmation modal (Yes/No dialog) before deleting any promotion.

---

## **2. Redemption Processing UI (Staff Interface)**

* **Redemption Form:**
  * Promotion selector UI for staff to choose an active promotion.
  * Auto-populate the corresponding Linked Product Name and Redemption Price once a promotion is selected.
  * Input field for scanning or entering the Ticket Code.

* **Submit & Confirmation:**
  * Confirm button to submit the redemption.
  * On success: Display a success toast/modal and instantly update/sync the local stock state.
  * On error / out of stock: Show appropriate error alerts (e.g., "Out of stock" or server error messages).

---

## **3. API Integration & State Management**

* **Promotions API Hook:** Connect Get list, Create, Update, and Delete APIs using Axios.
* **Redemption Processing API:** Integrate the redemption submit API endpoint.
* **Loading & Error Handling:** Display loading spinners during API requests and use proper alert/toast components for error handling.