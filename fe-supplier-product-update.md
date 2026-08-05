# Plan: Frontend UI Updates for Supplier & Product Modules

**Date:** 2026-07-29
**Status:** To Do

## Objective
Update the Frontend UI to support recent backend schema changes. Specifically, add the `township` field to Supplier profiles and allow linking Suppliers directly from Product/Inventory forms.

## Context
1. **Supplier Module:** The UI needs to allow users to input `township` data during supplier creation/editing and view it in the supplier lists/details.
2. **Product Module:** Products need to be linked to suppliers upon creation or editing. A multi-select dropdown is required in the Product form, fetching active suppliers from the backend.

## Requirements

### 1. Supplier Module Updates
*   **Create/Edit Form:** Add a text input field for `Township` (`township`).
*   **Form State & Payload:** Bind the `township` input to the form's state. Ensure it is included in the JSON payload when sending `POST` and `PUT` requests to the supplier API.
*   **Table/List View:** Add a "Township" column to the Supplier List data grid/table to display the newly added data.

### 2. Product (Inventory) Module Updates
*   **Data Fetching:** Fetch the list of available suppliers (using `GET /api/v1/supplier-profile`) when the Product Create/Edit form mounts.
*   **Create/Edit Form:** Add a Multi-select dropdown component. The options should be populated with the fetched suppliers (label: `supplierName`, value: `_id`).
*   **Form State & Payload:** Capture the selected supplier IDs as an array. Include this `suppliers` array in the API payload when creating or updating a product (`POST/PUT /api/v1/inventory`).

## Target Files (To be identified in the workspace)
*   Supplier Form Component (e.g., `SupplierForm.jsx/tsx`)
*   Supplier Table Component (e.g., `SupplierList.jsx/tsx`)
*   Product Form Component (e.g., `ProductForm.jsx/tsx`)

## Test Plan
1. **Test Supplier Township:** Navigate to Supplier creation. Fill in details including the new **township**. Submit and verify it appears correctly in the Supplier table.
2. **Test Product-Supplier Link:** Navigate to Product creation. Verify the new "Suppliers" dropdown is visible, loads without errors, and is populated with supplier names.
3. **Test Submission:** Select one or more suppliers, fill in other product details, and submit.
4. **Test Edit Mode:** Edit the newly created product and verify the previously selected suppliers are correctly pre-populated in the multi-select dropdown.