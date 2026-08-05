I have completed the frontend implementation for the "Transfer to Supplier" flow and Supplier Detail view:

Summary of Changes
Bulk Link API Service (services/Inventory/bulkLinkSuppliers.ts):

Created 

bulkLinkSuppliers.ts
 which provides:
bulkLinkSuppliers({ productIds, supplierIds }) calling POST /api/v1/inventory/bulk-link-suppliers.
bulkUnlinkSuppliers({ productIds, supplierIds }) calling POST /api/v1/inventory/bulk-unlink-suppliers.
Param-aware Product Fetch Service (services/Inventory/fetchProducts.ts):

Updated 

fetchProducts.ts
 to accept optional query parameters (supplier, category, status, search, page, limit, etc.) and pass them to GET /api/v1/inventory.
Inventory Transfer Modal (pages/Inventory.tsx):

In 

Inventory.tsx
, updated handleTransferToSupplier to replace the mock logic with the actual bulkLinkSuppliers API call linking the selected inventoryIds to the chosen selectedSupplierId.
Handles success notifications, selection resetting, modal close, and reloads inventory data.
Supplier Detail Page (pages/SupplierDetail.tsx):

In 

SupplierDetail.tsx
, updated loadRelatedProducts to fetch products using fetchProducts({ supplier: id }) (GET /api/v1/inventory?supplier=SUPPLIER_ID).
Mapped the returned product list into Product models (properly mapping productName, productCode, category, buyingPrice/costPrice, sellingPrice, and status).
The "Total Products" summary card and section badge dynamically reflect the linked products count with proper loading and empty states.