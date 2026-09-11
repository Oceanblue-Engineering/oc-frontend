import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Trash2, AlertCircle, Building2, X } from "lucide-react";
import { Modal } from "../Modal";
import { ConfirmModal } from "../Common/ConfirmModal";
import { Supplier, Product, PurchaseOrderItem, ApiPurchaseOrder } from "../../types";
import { createPurchase } from "../../services/Purchase/createPurchase";
import { updatePurchase } from "../../services/Purchase/updatePurchase";
import { toast } from "sonner";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onSuccess: () => void;
  editingPO?: ApiPurchaseOrder | null;
}

/**
 * Helper to determine if a product is linked to a specific supplier.
 * Checks populated supplier objects, string IDs, and direct supplierId.
 */
const isProductFromSupplier = (product: Product, supplierId: string): boolean => {
  if (!supplierId || !product) return false;

  // Direct supplierId field check
  if ((product as any).supplierId) {
    const sId =
      typeof (product as any).supplierId === "object"
        ? (product as any).supplierId?._id || (product as any).supplierId?.id
        : (product as any).supplierId;
    if (sId && String(sId) === String(supplierId)) return true;
  }

  // Suppliers array check (supports string IDs and populated supplier objects)
  if (product.suppliers && Array.isArray(product.suppliers)) {
    return product.suppliers.some((s: any) => {
      if (!s) return false;
      if (typeof s === "string") return String(s) === String(supplierId);
      if (typeof s === "object") {
        const id = s._id || s.id;
        return id && String(id) === String(supplierId);
      }
      return false;
    });
  }

  return false;
};

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onSuccess,
  editingPO,
}) => {
  const [poSupplierId, setPOSupplierId] = useState("");
  const [poItems, setPOItems] = useState<PurchaseOrderItem[]>([]);
  const [poSelectedProduct, setPOSelectedProduct] = useState("");
  const [poQty, setPOQty] = useState(1);
  const [poItemNote, setPOItemNote] = useState("");
  const [poNote, setPONote] = useState("");
  const [poNewProductName, setPONewProductName] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [paidAmount, setPaidAmount] = useState<number | "">(0);
  const [dueDate, setDueDate] = useState("");
  const [pendingSupplierId, setPendingSupplierId] = useState<string | null>(null);
  const [showSupplierChangeModal, setShowSupplierChangeModal] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Filter products that exclusively belong to the selected supplier
  const supplierProducts = useMemo(() => {
    if (!poSupplierId) return [];
    return products.filter((product) =>
      isProductFromSupplier(product, poSupplierId)
    );
  }, [products, poSupplierId]);

  // Search filtered products of this supplier
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return supplierProducts;
    const query = productSearchQuery.toLowerCase();
    return supplierProducts.filter((product) => {
      const nameMatch = (product.productName || product.name || "")
        .toLowerCase()
        .includes(query);
      const codeMatch =
        product.productCode &&
        product.productCode.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });
  }, [supplierProducts, productSearchQuery]);

  const totalAmount = poItems.reduce(
    (sum, item) => sum + item.qty * item.costPrice,
    0,
  );

  const resetForm = () => {
    setPOSupplierId("");
    setPOItems([]);
    setPOSelectedProduct("");
    setPOQty(1);
    setPOItemNote("");
    setPONote("");
    setPONewProductName("");
    setProductSearchQuery("");
    setShowProductDropdown(false);
    setPaymentType("paid");
    setPaidAmount(0);
    setDueDate("");
    setPendingSupplierId(null);
    setShowSupplierChangeModal(false);
  };

  useEffect(() => {
    if (isOpen && editingPO) {
      const supId =
        typeof editingPO.supplierId === "object" && editingPO.supplierId !== null
          ? editingPO.supplierId._id || editingPO.supplierId.id
          : editingPO.supplierId;
      setPOSupplierId(supId || "");

      if (editingPO.products && Array.isArray(editingPO.products)) {
        const itemMap = new Map<string, PurchaseOrderItem>();
        editingPO.products.forEach((p) => {
          const prodId =
            typeof p.inventoryId === "object" && p.inventoryId !== null
              ? (p.inventoryId as any)._id || (p.inventoryId as any).id
              : p.inventoryId;
          const matchedProd = products.find(
            (prod) => (prod._id || prod.id) === prodId
          );
          const cost =
            p.buyingPrice ??
            matchedProd?.buyingPrice ??
            matchedProd?.costPrice ??
            0;
          const key = String(prodId);
          const existing = itemMap.get(key);
          if (existing) {
            existing.qty += p.purchaseQuantity || 1;
          } else {
            itemMap.set(key, {
              productId: key,
              name:
                p.productName ||
                matchedProd?.productName ||
                matchedProd?.name ||
                "Product",
              qty: p.purchaseQuantity || 1,
              costPrice: cost,
              note: p.productCode || "",
            });
          }
        });
        setPOItems(Array.from(itemMap.values()));
      } else {
        setPOItems([]);
      }

      setPONote(
        editingPO.note === "No note available" ? "" : editingPO.note || ""
      );
      setPaymentType(editingPO.paymentType === "credit" ? "credit" : "paid");
      setPaidAmount(
        editingPO.paymentType === "credit" ? (editingPO.paidAmount ?? 0) : 0
      );
      setDueDate(
        editingPO.dueDate
          ? new Date(editingPO.dueDate).toISOString().split("T")[0]
          : ""
      );
      setProductSearchQuery("");
      setShowProductDropdown(false);
    } else if (isOpen && !editingPO) {
      resetForm();
    }
  }, [isOpen, editingPO, products]);

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleSupplierChange = (newSupplierId: string) => {
    if (newSupplierId === poSupplierId) return;

    // If items exist, ask user confirmation via custom modal
    if (poItems.length > 0) {
      setPendingSupplierId(newSupplierId);
      setShowSupplierChangeModal(true);
      return;
    }

    setPOSupplierId(newSupplierId);
    setPOSelectedProduct("");
    setProductSearchQuery("");
    setShowProductDropdown(false);
  };

  const handleConfirmSupplierChange = () => {
    if (pendingSupplierId !== null) {
      setPOSupplierId(pendingSupplierId);
      setPOItems([]);
      setPOSelectedProduct("");
      setProductSearchQuery("");
      setShowProductDropdown(false);
      setPendingSupplierId(null);
    }
    setShowSupplierChangeModal(false);
  };

  const handleCancelSupplierChange = () => {
    setPendingSupplierId(null);
    setShowSupplierChangeModal(false);
  };

  const handleProductSelect = (productId: string, productName: string) => {
    setPOSelectedProduct(productId);
    setProductSearchQuery(productName);
    setShowProductDropdown(false);
    setPONewProductName("");
  };

  const handleProductInputChange = (value: string) => {
    setProductSearchQuery(value);
    if (poSupplierId) {
      setShowProductDropdown(true);
    }
    if (value === "") {
      setPOSelectedProduct("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addPOItem = () => {
    if (!poSupplierId) {
      toast.error("Please select a supplier first (Supplier ကို အရင်ရွေးချယ်ပါ)");
      return;
    }

    if (!poSelectedProduct && !poNewProductName) {
      toast.error("Please select a product from this supplier");
      return;
    }

    if (poQty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    let productId = poSelectedProduct;
    let productName = "";
    let buyingPrice = 0;

    if (poSelectedProduct) {
      const product = products.find(
        (p) => (p._id || p.id) === poSelectedProduct,
      );
      if (!product) {
        toast.error("Selected product not found");
        return;
      }

      if (!isProductFromSupplier(product, poSupplierId)) {
        toast.error(
          `Product "${product.productName || product.name}" is not supplied by the selected supplier.`
        );
        return;
      }

      productName = product.productName || product.name;
      buyingPrice = product.buyingPrice ?? product.costPrice ?? 0;
    } else {
      // New product - generate ID
      productId = `new-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      productName = poNewProductName;
    }

    const newItem: PurchaseOrderItem = {
      productId,
      name: productName,
      qty: poQty,
      costPrice: buyingPrice,
      note: poItemNote,
    };

    setPOItems((prev) => {
      const existingIndex = prev.findIndex((item) => {
        if (productId && !productId.startsWith("new-")) {
          return String(item.productId) === String(productId);
        }
        return (
          item.name.trim().toLowerCase() === productName.trim().toLowerCase()
        );
      });

      if (existingIndex > -1) {
        return prev.map((item, index) => {
          if (index === existingIndex) {
            return {
              ...item,
              qty: item.qty + poQty,
              costPrice: buyingPrice > 0 ? buyingPrice : item.costPrice,
              note: poItemNote
                ? item.note
                  ? `${item.note}; ${poItemNote}`
                  : poItemNote
                : item.note,
            };
          }
          return item;
        });
      }

      return [...prev, newItem];
    });

    setPOSelectedProduct("");
    setPONewProductName("");
    setProductSearchQuery("");
    setPOQty(1);
    setPOItemNote("");
  };

  const removePOItem = (index: number) => {
    setPOItems((prev) => prev.filter((_, i) => i !== index));
  };

  const submitPO = async () => {
    if (!poSupplierId || poItems.length === 0) {
      toast.error("Please select supplier and add at least one item");
      return;
    }

    // Double validate that all items in PO belong to this supplier
    const invalidItem = poItems.find((item) => {
      if (item.productId.startsWith("new-")) return false;
      const prod = products.find(
        (p) => (p._id || p.id) === item.productId
      );
      return prod && !isProductFromSupplier(prod, poSupplierId);
    });

    if (invalidItem) {
      toast.error(
        `Item "${invalidItem.name}" does not belong to the selected supplier.`
      );
      return;
    }

    const numericPaidAmount = Number(paidAmount) || 0;

    if (paymentType === "credit") {
      if (numericPaidAmount < 0) {
        toast.error(
          "Paid amount cannot be negative (ကြိုတင်ပေးချေငွေသည် 0 သို့မဟုတ် 0 ထက် ကြီးရပါမည်)",
        );
        return;
      }
      if (numericPaidAmount > totalAmount) {
        toast.error(
          `Paid amount cannot exceed total amount of ${totalAmount.toLocaleString()} MMK (ကြိုတင်ပေးချေငွေသည် စုစုပေါင်းပမာဏထက် မကျော်လွန်နိုင်ပါ)`,
        );
        return;
      }
    }

    const payload = {
      products: poItems.map((item) => ({
        inventoryId: item.productId,
        purchaseQuantity: item.qty,
      })),
      supplierId: poSupplierId,
      note: poNote,
      totalAmount,
      paymentType,
      paidAmount: paymentType === "credit" ? numericPaidAmount : totalAmount,
      dueDate: paymentType === "credit" && dueDate ? dueDate : null,
    };

    try {
      if (editingPO) {
        const response = await updatePurchase(editingPO._id, payload);
        if (response.success) {
          toast.success("Purchase Order Updated Successfully!");
          resetForm();
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Failed to update Purchase Order");
        }
      } else {
        const response = await createPurchase(payload);
        if (response.success) {
          toast.success("Purchase Order Created Successfully!");
          resetForm();
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Failed to create Purchase Order");
        }
      }
    } catch (error: any) {
      console.error("Failed to save PO:", error);
      toast.error(
        error.message || "An error occurred while saving the Purchase Order",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        editingPO
          ? `Edit Purchase Order (${editingPO.poNumber})`
          : "Create Purchase Order"
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer bg-white"
                value={poSupplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
              >
                <option value="">Select Supplier (ရွေးချယ်ပါ)</option>
                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id || supplier._id}
                    value={supplier.id || supplier._id}
                  >
                    {supplier.supplierName} {supplier.contactNumber ? `(${supplier.contactNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Add Item to PO
                </label>
                {poSupplierId && (
                  <span className="text-[11px] font-semibold text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-full border border-ocean-200">
                    {supplierProducts.length} products available
                  </span>
                )}
              </div>

              {!poSupplierId ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>Please select a supplier above to view and add their products.</span>
                </div>
              ) : null}

              <div className="mb-2 relative" ref={productDropdownRef}>
                <input
                  type="text"
                  disabled={!poSupplierId}
                  className={`w-full border rounded-lg p-2.5 text-sm transition-all ${
                    productSearchQuery ? "pr-9" : ""
                  } ${
                    !poSupplierId
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  }`}
                  placeholder={
                    poSupplierId
                      ? "Type to search and select product..."
                      : "Select a supplier first..."
                  }
                  value={productSearchQuery}
                  onChange={(e) => handleProductInputChange(e.target.value)}
                  onFocus={() => {
                    if (poSupplierId) setShowProductDropdown(true);
                  }}
                />
                {productSearchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductSearchQuery("");
                      setPOSelectedProduct("");
                      setPONewProductName("");
                      if (poSupplierId) setShowProductDropdown(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Clear item search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showProductDropdown && poSupplierId && (
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl divide-y divide-slate-100">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <div
                          key={p._id || p.id}
                          className="px-3.5 py-2.5 hover:bg-ocean-50 cursor-pointer text-sm flex items-center justify-between transition-colors"
                          onClick={() =>
                            handleProductSelect(p._id || p.id, p.productName || p.name)
                          }
                        >
                          <div>
                            <div className="font-semibold text-slate-800">
                              {p.productName || p.name}
                            </div>
                            {p.productCode && (
                              <div className="text-xs text-slate-400 font-mono">
                                Code: {p.productCode}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-ocean-700 bg-ocean-50/80 px-2 py-1 rounded border border-ocean-200/60">
                              {(p.buyingPrice ?? p.costPrice ?? 0).toLocaleString()} MMK
                            </span>
                          </div>
                        </div>
                      ))
                    ) : supplierProducts.length === 0 ? (
                      <div className="p-4 text-amber-700 bg-amber-50/70 text-xs text-center space-y-1">
                        <p className="font-semibold">No products linked to this supplier</p>
                        <p className="text-[11px] text-slate-500">
                          Please link products to this supplier in the Inventory module.
                        </p>
                      </div>
                    ) : (
                      <div className="px-3 py-3 text-slate-400 text-xs text-center">
                        No matching products found for this supplier
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Qty"
                    value={poQty}
                    onChange={(e) => setPOQty(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPOItem();
                      }
                    }}
                    min="1"
                  />
                  <button
                    onClick={addPOItem}
                    className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Note (Optional)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                value={poNote}
                onChange={(e) => setPONote(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            {/* Payment Type Selection */}
            <div className="border-t pt-4">
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Payment Type (ပေးချေမှု အမျိုးအစား)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    paymentType === "paid"
                      ? "border-green-600 bg-green-50/60 text-green-800 font-semibold shadow-sm"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="paid"
                    checked={paymentType === "paid"}
                    onChange={() => {
                      setPaymentType("paid");
                      setPaidAmount(0);
                      setDueDate("");
                    }}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm">လက်ငင်း (Paid)</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    paymentType === "credit"
                      ? "border-amber-600 bg-amber-50/60 text-amber-800 font-semibold shadow-sm"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="credit"
                    checked={paymentType === "credit"}
                    onChange={() => setPaymentType("credit")}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm">အကြွေး (Credit)</span>
                </label>
              </div>

              {/* Conditional Credit Fields */}
              {paymentType === "credit" && (
                <div className="mt-3 p-3.5 bg-amber-50/40 border border-amber-200 rounded-lg space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-600">
                        Paid Amount / ကြိုတင်ပေးချေငွေ (MMK)
                      </label>
                      {totalAmount > 0 && (
                        <span className="text-[11px] text-slate-500">
                          Max: {totalAmount.toLocaleString()} MMK
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      className={`w-full border rounded p-2 text-sm bg-white outline-none transition-all ${
                        Number(paidAmount) < 0 ||
                        (totalAmount > 0 && Number(paidAmount) > totalAmount)
                          ? "border-red-500 focus:ring-2 focus:ring-red-300"
                          : "border-slate-300 focus:ring-2 focus:ring-amber-400"
                      }`}
                      placeholder="0"
                      value={paidAmount}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setPaidAmount(val);
                      }}
                      min="0"
                      max={totalAmount}
                    />
                    {Number(paidAmount) < 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Paid amount cannot be negative (ကြိုတင်ပေးချေငွေသည် 0 သို့မဟုတ် 0 ထက် ကြီးရပါမည်)
                      </p>
                    )}
                    {totalAmount > 0 && Number(paidAmount) > totalAmount && (
                      <p className="text-xs text-red-600 mt-1">
                        Paid amount cannot exceed total amount (
                        {totalAmount.toLocaleString()} MMK)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Due Date / နောက်ဆုံးပေးချေရမည့်ရက်
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-400"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
          <h2 className="font-bold text-lg mb-4">PO Summary</h2>
          <div className="flex-1 overflow-auto mb-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="py-2 px-1">Item</th>
                  <th className="py-2 px-1">Qty</th>
                  <th className="py-2 px-1">Unit Price</th>
                  <th className="py-2 px-1">Cost Price</th>
                  <th className="py-2 px-1 w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.qty}</td>
                    <td className="py-2">{item.costPrice.toLocaleString()}</td>
                    <td className="py-2">
                      {(item.costPrice * item.qty).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removePOItem(i)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {poItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-4">
                      No items added
                    </td>
                  </tr>
                )}
                <tr className="border-t">
                  <td colSpan={5} className="text-right py-2 font-bold text-slate-800">
                    Total: {totalAmount.toLocaleString()} MMK
                  </td>
                </tr>
                {paymentType === "credit" && (
                  <>
                    <tr className="text-amber-800 text-xs">
                      <td colSpan={3} className="text-right py-1">
                        Paid Amount (ကြိုတင်ပေးချေငွေ):
                      </td>
                      <td colSpan={2} className="text-right py-1 font-semibold">
                        {(Number(paidAmount) || 0).toLocaleString()} MMK
                      </td>
                    </tr>
                    <tr className="text-red-600 text-xs">
                      <td colSpan={3} className="text-right py-1">
                        Remaining Balance (ကျန်ငွေ):
                      </td>
                      <td colSpan={2} className="text-right py-1 font-semibold">
                        {Math.max(
                          0,
                          totalAmount - (Number(paidAmount) || 0),
                        ).toLocaleString()}{" "}
                        MMK
                      </td>
                    </tr>
                    {dueDate && (
                      <tr className="text-slate-600 text-xs">
                        <td colSpan={3} className="text-right py-1">
                          Due Date (နောက်ဆုံးပေးချေရမည့်ရက်):
                        </td>
                        <td colSpan={2} className="text-right py-1 font-semibold">
                          {dueDate}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          {poNote && (
            <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
              <span className="font-semibold text-gray-600 block mb-1">
                Order Note:
              </span>
              <p className="text-gray-800">{poNote}</p>
            </div>
          )}
          <button
            onClick={submitPO}
            disabled={poItems.length === 0 || !poSupplierId}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors cursor-pointer"
          >
            {editingPO ? "Update Purchase Order" : "Create Purchase Order"}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Note: PO does NOT update stock. Use GRN to receive goods.
          </p>
        </div>
      </div>

      {/* Supplier Change Confirmation Modal */}
      <ConfirmModal
        isOpen={showSupplierChangeModal}
        title="Change Supplier"
        message="Changing the supplier will clear all current PO items, as products must belong to the selected supplier. Do you want to proceed?"
        confirmText="Change Supplier"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleConfirmSupplierChange}
        onCancel={handleCancelSupplierChange}
      />
    </Modal>
  );
};
