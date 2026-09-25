import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Store,
  ChevronDown,
  Loader2,
  Scan,
  X,
  User,
  Calculator,
  Calendar,
  ShoppingCart,
  ArrowLeft,
  Save,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";
import {
  fetchTownships,
  Township,
} from "../services/Township/fetchTownships";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { Order } from "../services/Order/fetchOrders";
import {
  updateEntireOrder,
  UpdateEntireOrderPayload,
} from "../services/Order/updateEntireOrder";

// Payment methods
enum PaymentMethod {
  CASH = "Cash",
  KBZ_PAY = "KBZPay",
  WAVE_PAY = "WavePay",
  AYA_PAY = "AYA Pay",
  UAB_PAY = "UAB Pay",
  MMQR = "MMQR",
  BANK_TRANSFER = "Bank Transfer",
  NORMAL = "Normal",
  HOT = "Hot",
  FOC = "FOC",
}

const paymentMethodMap: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "cash",
  [PaymentMethod.KBZ_PAY]: "kpay",
  [PaymentMethod.WAVE_PAY]: "wavepay",
  [PaymentMethod.AYA_PAY]: "ayapay",
  [PaymentMethod.UAB_PAY]: "uabpay",
  [PaymentMethod.BANK_TRANSFER]: "bank_transfer",
  [PaymentMethod.NORMAL]: "normal",
  [PaymentMethod.HOT]: "hot",
  [PaymentMethod.FOC]: "foc",
  [PaymentMethod.MMQR]: "MMQR",
};

const reversePaymentMethodMap: Record<string, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  kpay: PaymentMethod.KBZ_PAY,
  wavepay: PaymentMethod.WAVE_PAY,
  ayapay: PaymentMethod.AYA_PAY,
  uabpay: PaymentMethod.UAB_PAY,
  bank_transfer: PaymentMethod.BANK_TRANSFER,
  normal: PaymentMethod.NORMAL,
  hot: PaymentMethod.HOT,
  foc: PaymentMethod.FOC,
  MMQR: PaymentMethod.MMQR,
  Cash: PaymentMethod.CASH,
  KBZPay: PaymentMethod.KBZ_PAY,
  WavePay: PaymentMethod.WAVE_PAY,
  "AYA Pay": PaymentMethod.AYA_PAY,
  "UAB Pay": PaymentMethod.UAB_PAY,
};

interface CartItem {
  stockItem: StorefrontStockItem;
  qty: number;
}

export const OrderEditPOS: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isMy = language === "my";

  // Order & Storefront state
  const [order, setOrder] = useState<Order | null>(null);
  const [storefrontId, setStorefrontId] = useState<string>("");
  const [storefrontName, setStorefrontName] = useState<string>("");
  const [originalOrderQuantities, setOriginalOrderQuantities] = useState<
    Record<string, number>
  >({});

  // Catalog & Inventory state
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(100);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [activeWholesalePopoverId, setActiveWholesalePopoverId] = useState<
    string | null
  >(null);

  // Checkout modal & Financial state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer / Credit Person state
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showAddCreditPersonModal, setShowAddCreditPersonModal] =
    useState(false);
  const [newCreditPersonName, setNewCreditPersonName] = useState("");
  const [newCreditPersonPhone, setNewCreditPersonPhone] = useState("");
  const [newCreditPersonAddress, setNewCreditPersonAddress] = useState("");
  const [isAddingCreditPerson, setIsAddingCreditPerson] = useState(false);

  // Delivery state
  const [isDelivery, setIsDelivery] = useState(false);
  const [townships, setTownships] = useState<Township[]>([]);
  const [selectedTownshipId, setSelectedTownshipId] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Discount calculator modal
  const [showDiscountCalculator, setShowDiscountCalculator] = useState(false);
  const [discountPercentInput, setDiscountPercentInput] = useState("");

  // Helper to extract inventory ID string safely
  const getInventoryIdStr = (stockItem: StorefrontStockItem): string => {
    return (
      stockItem.inventoryId?._id ||
      (stockItem.inventoryId as any)?.id ||
      String(stockItem.inventoryId)
    );
  };

  const getShelfStock = (stockItem: StorefrontStockItem): number => {
    return Number(stockItem.availableQuantity ?? stockItem.quantity ?? 0);
  };

  // Smart Stock Ceiling Formula: origQty held by customer + current shelf stock
  const getMaxAllowedQty = useCallback(
    (stockItem: StorefrontStockItem): number => {
      const invId = getInventoryIdStr(stockItem);
      const origQty = originalOrderQuantities[invId] || 0;
      const shelfAvailable = getShelfStock(stockItem);
      return origQty + Math.max(0, shelfAvailable);
    },
    [originalOrderQuantities]
  );

  // 1. Initial Load: fetch order by ID, then fetch categories, credit personas, townships, stock
  useEffect(() => {
    if (!id) {
      toast.error("Invalid Order ID");
      navigate("/orders");
      return;
    }
    loadOrderAndDependencies(id);
  }, [id]);

  const loadOrderAndDependencies = async (orderId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Order Details
      const orderRes = await fetchOrderById(orderId);
      if (!orderRes.success || !orderRes.data) {
        toast.error(orderRes.message || "Failed to load order details");
        navigate("/orders");
        return;
      }

      const ord = orderRes.data;
      setOrder(ord);

      // Determine storefront
      const sfId =
        ord.storefrontId?._id ||
        ord.storefrontId?.id ||
        (typeof ord.storefrontId === "string" ? ord.storefrontId : "");
      setStorefrontId(sfId);
      setStorefrontName(
        ord.storefrontId?.locationName ||
          ord.storefrontId?.storefrontName ||
          "Storefront"
      );

      // Map original quantities
      const origQtyMap: Record<string, number> = {};
      (ord.ordersProducts || []).forEach((p: any) => {
        const invId =
          p.inventoryId?._id || p.inventoryId?.id || (typeof p.inventoryId === "string" ? p.inventoryId : "");
        if (invId) {
          origQtyMap[invId] = (origQtyMap[invId] || 0) + Number(p.quantity || 0);
        }
      });
      setOriginalOrderQuantities(origQtyMap);

      // Payment type
      setPaymentType(ord.paymentType === "credit" ? "credit" : "paid");

      // Payment method
      if (ord.paymentMethod && reversePaymentMethodMap[ord.paymentMethod]) {
        setPaymentMethod(reversePaymentMethodMap[ord.paymentMethod]);
      } else {
        setPaymentMethod(PaymentMethod.CASH);
      }

      // Financials
      setPaidAmount(Number(ord.paidAmount || 0));
      setNote(ord.note || "");
      if (ord.createdAt) {
        setCreatedAt(new Date(ord.createdAt).toISOString().split("T")[0]);
      }

      // Discount flat MMK amount
      if (ord.discount) {
        setDiscount(Number(ord.discount) || 0);
      } else {
        setDiscount(0);
      }

      // Delivery state pre-fill
      if (ord.deliveryDetails && ord.deliveryDetails.township) {
        setIsDelivery(true);
        setSelectedTownshipId(String(ord.deliveryDetails.township));
        setDeliveryFee(Number(ord.deliveryDetails.deliveryFee) || 0);
        setRecipientName(ord.deliveryDetails.recipientName || "");
        setRecipientPhone(ord.deliveryDetails.recipientPhone || "");
        setDeliveryAddress(ord.deliveryDetails.deliveryAddress || "");
      }

      // Customer / Credit Person Pre-selection & Preservation
      if (ord.creditPersonId) {
        const cp =
          typeof ord.creditPersonId === "object" ? ord.creditPersonId : null;
        const cpId = cp ? cp._id : ord.creditPersonId;
        setSelectedCreditPersonId(cpId || "");
      }

      // 2. Fetch categories
      fetchCategories()
        .then((res) => {
          if (res.success && res.data) setCategories(res.data);
        })
        .catch(console.error);

      // 3. Fetch townships
      fetchTownships(true)
        .then((res) => {
          if (res.success) setTownships(res.data.townships);
        })
        .catch(console.error);

      // 4. Fetch credit personas with existing customer preservation
      fetchCreditPersonas()
        .then((res) => {
          if (res.success && res.data) {
            const list = res.data.filter((p) => !p.blacklist);
            if (ord.creditPersonId && typeof ord.creditPersonId === "object") {
              const currentCp = ord.creditPersonId as any;
              if (currentCp._id && !list.some((p) => p._id === currentCp._id)) {
                list.unshift(currentCp);
              }
            }
            setCreditPersonas(list);
          }
        })
        .catch(console.error);

      // 5. Fetch storefront stock and pre-populate cart
      if (sfId) {
        await loadStockAndInitCart(sfId, ord);
      }
    } catch (err: any) {
      console.error("Error initializing order edit:", err);
      toast.error("Failed to initialize order edit");
    } finally {
      setLoading(false);
    }
  };

  const loadStockAndInitCart = async (sfId: string, ord: Order) => {
    try {
      const stockRes = await fetchStorefrontStock(sfId, 1, 100);
      const stockItems: StorefrontStockItem[] =
        stockRes.success && stockRes.data ? stockRes.data : [];
      setAllStockItems(stockItems);

      if (stockRes.pagination) {
        setTotalPages(stockRes.pagination.totalPages);
        setTotalItems(stockRes.pagination.totalItems);
      }

      // Pre-populate cart items from ord.ordersProducts
      const initialCart: CartItem[] = [];
      for (const op of ord.ordersProducts || []) {
        const inv = op.inventoryId;
        const invId = inv?._id || inv?.id || (typeof inv === "string" ? inv : "");
        if (!invId) continue;

        let matchingStockItem = stockItems.find(
          (si) => getInventoryIdStr(si) === invId
        );

        if (!matchingStockItem) {
          // Synthesize stock item snapshot if not currently in page 1
          matchingStockItem = {
            _id: `temp_${invId}`,
            storefrontId: ord.storefrontId as any,
            inventoryId: {
              _id: invId,
              productName: inv?.productName || "Product Item",
              productCode: inv?.productCode || "CODE",
              SKU: inv?.SKU || "",
              category: "General",
              sellingPrice: op.unitPrice || 0,
              profitMargin: null,
              profitAmount: null,
            },
            quantity: 0,
            availableQuantity: 0,
            isLowStock: false,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        initialCart.push({
          stockItem: matchingStockItem,
          qty: op.quantity,
        });
      }

      setCart(initialCart);
    } catch (err) {
      console.error("Error loading stock & cart:", err);
    }
  };

  // Re-fetch stock when pagination, search, or category changes
  useEffect(() => {
    if (!storefrontId || loading) return;

    fetchStorefrontStock(
      storefrontId,
      currentPage,
      itemsPerPage,
      selectedCategory === "All" ? undefined : selectedCategory,
      search
    ).then((res) => {
      if (res.success && res.data) {
        setAllStockItems(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.totalItems);
        }
      }
    });
  }, [storefrontId, search, selectedCategory, currentPage]);

  // Click outside wholesale popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!activeWholesalePopoverId) return;
      const target = e.target as HTMLElement | null;
      if (!target?.closest(`[data-wholesale-container="${activeWholesalePopoverId}"]`)) {
        setActiveWholesalePopoverId(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveWholesalePopoverId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeWholesalePopoverId]);

  // Filter products by search & hide specific internal IDs
  const filteredProducts = allStockItems.filter(
    (item) => item.inventoryId?._id !== "69a15d55218ec5ff9a3fe4a3"
  );

  // Cart operations
  const addToCart = (stockItem: StorefrontStockItem) => {
    const maxAllowed = getMaxAllowedQty(stockItem);
    if (maxAllowed <= 0) {
      toast.error(t("pos.outOfStock") || "Out of stock");
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => getInventoryIdStr(item.stockItem) === getInventoryIdStr(stockItem)
      );
      if (existing) {
        if (existing.qty + 1 > maxAllowed) {
          toast.error(
            `${t("pos.cannotExceedStock") || "Cannot exceed available stock"} (Max: ${maxAllowed})`
          );
          return prev;
        }
        return prev.map((item) =>
          getInventoryIdStr(item.stockItem) === getInventoryIdStr(stockItem)
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { stockItem, qty: 1 }];
    });
  };

  const updateQty = (invId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getInventoryIdStr(item.stockItem) === invId) {
          const maxAllowed = getMaxAllowedQty(item.stockItem);
          const newQty = item.qty + delta;
          if (newQty > maxAllowed) {
            toast.error(
              `${t("pos.cannotExceedStock") || "Cannot exceed available stock"} (Max: ${maxAllowed})`
            );
            return item;
          }
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const setQty = (invId: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getInventoryIdStr(item.stockItem) === invId) {
          const maxAllowed = getMaxAllowedQty(item.stockItem);
          if (newQty < 1) return { ...item, qty: 1 };
          if (newQty > maxAllowed) {
            toast.error(
              `${t("pos.cannotExceedStock") || "Cannot exceed available stock"} (Max: ${maxAllowed})`
            );
            return { ...item, qty: maxAllowed };
          }
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (invId: string) => {
    setCart((prev) =>
      prev.filter((item) => getInventoryIdStr(item.stockItem) !== invId)
    );
  };

  const applyWholesaleTierQuantity = (
    stockItem: StorefrontStockItem,
    tierQuantity: number
  ) => {
    const maxAllowed = getMaxAllowedQty(stockItem);
    const parsedTierQty = Math.max(1, Math.floor(Number(tierQuantity) || 1));

    if (maxAllowed <= 0) {
      toast.error(t("pos.outOfStock") || "Out of stock");
      return;
    }

    const finalQty = Math.min(parsedTierQty, maxAllowed);
    if (parsedTierQty > maxAllowed) {
      toast.error(
        `${t("pos.cannotExceedStock") || "Cannot exceed stock"} (Max: ${maxAllowed})`
      );
    }

    const invId = getInventoryIdStr(stockItem);
    setCart((prev) => {
      const existing = prev.find(
        (item) => getInventoryIdStr(item.stockItem) === invId
      );
      if (existing) {
        return prev.map((item) =>
          getInventoryIdStr(item.stockItem) === invId
            ? { ...item, qty: finalQty }
            : item
        );
      }
      return [...prev, { stockItem, qty: finalQty }];
    });
  };

  // Pricing calculations
  const getItemPrice = (item: StorefrontStockItem, qty: number = 1) => {
    const basePrice = item.inventoryId.sellingPrice || 0;
    const wholesaleTiers = item.inventoryId.wholesalePrices || [];
    if (wholesaleTiers.length === 0) return basePrice;

    const eligibleTier = wholesaleTiers
      .slice()
      .sort((a, b) => a.quantity - b.quantity)
      .filter((tier) => qty >= tier.quantity)
      .pop();

    return eligibleTier?.price ?? basePrice;
  };

  const getSortedWholesaleTiers = (item: StorefrontStockItem) =>
    (item.inventoryId.wholesalePrices || [])
      .slice()
      .sort((a, b) => a.quantity - b.quantity);

  const getSafeQty = (qty: number) =>
    Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;

  const subtotal = cart.reduce((sum, item) => {
    const qty = getSafeQty(item.qty);
    return sum + getItemPrice(item.stockItem, qty || 1) * qty;
  }, 0);

  const discountAmount = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const total =
    totalAfterDiscount + (isDelivery ? Number(deliveryFee) || 0 : 0);
  const combinedDiscountAmount = discountAmount;
  const equivalentDiscountPercent =
    subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

  // Auto-update paid amount when subtotal/discount/method changes in checkout modal
  useEffect(() => {
    if (showCheckoutModal) {
      if (paymentType === "paid" && paymentMethod !== PaymentMethod.FOC) {
        setPaidAmount(Math.ceil(total));
      } else if (paymentMethod === PaymentMethod.FOC) {
        setPaidAmount(0);
      }
    }
  }, [showCheckoutModal, total, paymentType, paymentMethod]);

  // Handle Save Order Changes
  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("pos.cartEmpty") || "Cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      let finalPaidAmount = paidAmount;
      if (paymentType === "credit") {
        if (paidAmount < 0 || paidAmount > total) {
          toast.error("Invalid paid amount for credit order");
          setIsProcessing(false);
          return;
        }
      } else {
        finalPaidAmount =
          paymentMethod === PaymentMethod.FOC ? 0 : Math.ceil(total);
      }

      const selectedTownship = townships.find(
        (t) => t._id === selectedTownshipId
      );

      const payload: UpdateEntireOrderPayload = {
        storefrontId,
        ordersProducts: cart.map((item) => ({
          inventoryId: getInventoryIdStr(item.stockItem),
          quantity: item.qty,
          unitPrice: getItemPrice(item.stockItem, item.qty),
        })),
        subTotal: subtotal,
        discount: combinedDiscountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        paymentType,
        note,
        paymentMethod: paymentMethodMap[paymentMethod] || "cash",
        orderDate: new Date(createdAt).toISOString(),
        creditPersonId:
          selectedCreditPersonId && selectedCreditPersonId.trim() !== ""
            ? selectedCreditPersonId
            : null,
        deliveryDetails: isDelivery
          ? {
              township: selectedTownshipId || null,
              townshipName: selectedTownship?.name || "",
              deliveryFee: Number(deliveryFee) || 0,
              recipientName: recipientName || "",
              recipientPhone: recipientPhone || "",
              deliveryAddress: deliveryAddress || "",
            }
          : undefined,
      };

      const result = await updateEntireOrder(id!, payload);

      if (result.success) {
        toast.success(
          isMy
            ? "ဘောင်ချာ အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ"
            : "Order updated successfully"
        );

        const orderNum =
          result.data?.orderNumber || order?.orderNumber || `INV-${Date.now()}`;
        const updatedCp =
          creditPersonas.find((cp) => cp._id === selectedCreditPersonId) ||
          (result.data?.creditPersonId &&
          typeof result.data.creditPersonId === "object"
            ? (result.data.creditPersonId as any)
            : null);

        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: orderNum,
          storefrontName: storefrontName || "HONGCHI Myanmar",
          items: cart.map((i) => ({
            name: i.stockItem.inventoryId.productName,
            code: i.stockItem.inventoryId.productCode,
            qty: i.qty,
            price: getItemPrice(i.stockItem, i.qty),
          })),
          subtotal,
          discountPercent: Math.round(equivalentDiscountPercent),
          discountAmount: discountAmount,
          deliveryFee: isDelivery ? Number(deliveryFee) || 0 : 0,
          total,
          paidAmount: finalPaidAmount,
          change: Math.max(0, finalPaidAmount - total),
          paymentMethod,
          note,
          serviceCharge: 0,
          tax: 0,
          customerName: updatedCp?.name || "",
          customerPhone: updatedCp?.phone || "",
          customerAddress: updatedCp?.address || "",
        };

        // Cache updated receipt data for on-demand print
        localStorage.setItem(
          `receipt_${receiptData.invoiceNumber}`,
          JSON.stringify(receiptData)
        );

        // Close modal and navigate back to /orders without auto-print popup
        setShowCheckoutModal(false);
        navigate("/orders");
      } else {
        toast.error(result.message || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update order");
    } finally {
      setIsProcessing(false);
    }
  };

  // Add new customer inline
  const handleAddNewCustomer = async () => {
    if (!newCreditPersonName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!newCreditPersonPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    setIsAddingCreditPerson(true);
    try {
      const res = await createCreditPersona({
        name: newCreditPersonName.trim(),
        phone: newCreditPersonPhone.trim(),
        address: newCreditPersonAddress.trim(),
      });

      if (res.success && res.data) {
        toast.success("Customer added successfully");
        setCreditPersonas((prev) => [res.data, ...prev]);
        setSelectedCreditPersonId(res.data._id);
        setShowAddCreditPersonModal(false);
        setNewCreditPersonName("");
        setNewCreditPersonPhone("");
        setNewCreditPersonAddress("");
      } else {
        toast.error(res.message || "Failed to add customer");
      }
    } catch (err) {
      console.error("Error creating customer:", err);
      toast.error("Failed to add customer");
    } finally {
      setIsAddingCreditPerson(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ocean-600 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">
            {t("pos.loading") || "Loading order for edit..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] overflow-hidden gap-4 bg-transparent p-2 sm:p-4">
      {/* Product Catalog Grid */}
      <div className="flex-1 bg-white border border-gray-200/50 rounded-3xl p-4 lg:p-6 shadow-sm flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-700"
              title="Return to Orders"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#18181b] tracking-tight">
                  {isMy ? "ဘောင်ချာ ပြင်ဆင်ခြင်း" : "Edit Order"}:{" "}
                  <span className="text-amber-600 font-mono">
                    {order?.orderNumber || "INV-001"}
                  </span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Editing Mode
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Modify order items, adjustments, customer, and payment details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Storefront badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium">
              <Store className="w-4 h-4 text-ocean-600" />
              <span>{storefrontName}</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
            <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
            <input
              type="text"
              placeholder="Search products to add..."
              className="search-input w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <select
            className="w-full sm:w-auto border border-dark-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">{t("pos.allCategories") || "All Categories"}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Product Count & Pagination */}
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {t("pos.showingProducts")
              ? t("pos.showingProducts").replace(
                  "{count}",
                  filteredProducts.length.toString()
                )
              : `Showing ${filteredProducts.length} products`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-xs"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-xs font-semibold">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 pb-16">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No products found
            </div>
          ) : (
            filteredProducts.map((stockItem) => {
              const maxAllowed = getMaxAllowedQty(stockItem);
              const isOutOfStock = maxAllowed <= 0;
              const invId = getInventoryIdStr(stockItem);
              const origQty = originalOrderQuantities[invId] || 0;

              return (
                <div
                  key={stockItem._id}
                  onClick={() => addToCart(stockItem)}
                  className={`bg-white p-2.5 sm:p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.01] flex flex-col justify-between ${
                    isOutOfStock ? "opacity-50 grayscale pointer-events-none" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-medium text-gray-800 text-xs sm:text-sm line-clamp-2">
                        {stockItem.inventoryId.productName}
                      </h3>
                      {origQty > 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          Orig: {origQty}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-mono">
                      {stockItem.inventoryId.productCode}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                      {stockItem.inventoryId.category}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-between items-end">
                    <div>
                      <span className="font-bold text-primary-600 text-xs sm:text-sm block">
                        {getItemPrice(stockItem).toLocaleString()} MMK
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Max: {maxAllowed}
                      </span>
                    </div>

                    {stockItem.inventoryId.wholesalePrices &&
                      stockItem.inventoryId.wholesalePrices.length > 0 && (
                        <div
                          className="relative"
                          data-wholesale-container={stockItem._id}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWholesalePopoverId((prev) =>
                                prev === stockItem._id ? null : stockItem._id
                              );
                            }}
                            className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition-colors"
                          >
                            Wholesale
                          </button>

                          {activeWholesalePopoverId === stockItem._id && (
                            <div
                              className="absolute right-0 bottom-7 z-20 w-52 bg-white border border-gray-200 rounded-lg shadow-xl p-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-[11px] font-semibold text-slate-600 mb-2">
                                Wholesale prices
                              </div>
                              <div className="border-t border-slate-200">
                                {getSortedWholesaleTiers(stockItem).map((tier) => (
                                  <button
                                    type="button"
                                    key={tier._id || `${tier.quantity}-${tier.price}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyWholesaleTierQuantity(
                                        stockItem,
                                        Number(tier.quantity)
                                      );
                                      setActiveWholesalePopoverId(null);
                                    }}
                                    className="w-full grid grid-cols-2 py-1.5 px-1 border-b border-slate-100 last:border-b-0 text-[11px] rounded hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
                                  >
                                    <span className="text-slate-700">
                                      {tier.quantity}+
                                    </span>
                                    <span className="text-right text-slate-800 font-medium">
                                      {tier.price.toLocaleString()} MMK
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="hidden lg:flex lg:w-96 bg-white flex-col border border-gray-200/50 rounded-3xl shadow-sm h-full overflow-hidden p-6 justify-between">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xl text-gray-800 tracking-tight">
              Order Items
            </h2>
            <span className="inline-block mt-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)} items in cart
            </span>
          </div>
          <button
            onClick={() => setCart([])}
            className="text-xs text-red-500 hover:text-red-700 font-semibold"
            title="Clear Cart"
          >
            Clear
          </button>
        </div>

        {/* Cart Item List */}
        <div
          className={`flex-1 overflow-y-auto p-2 space-y-3 ${
            cart.length === 0 ? "flex flex-col justify-center" : ""
          }`}
        >
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-3xl p-8 my-auto text-center">
              <ShoppingCart className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-600">
                Cart is empty. Select items from the catalog.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const invId = getInventoryIdStr(item.stockItem);
              const maxAllowed = getMaxAllowedQty(item.stockItem);
              const price = getItemPrice(item.stockItem, getSafeQty(item.qty) || 1);

              return (
                <div
                  key={invId}
                  className="flex justify-between items-start border-b border-gray-100 pb-3"
                >
                  <div className="flex-1 pr-2">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                      {item.stockItem.inventoryId.productName}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {price.toLocaleString()} MMK x {item.qty} ={" "}
                      <span className="font-bold text-slate-700">
                        {(price * item.qty).toLocaleString()} MMK
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Stock Limit: {maxAllowed}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      onClick={() => updateQty(invId, -1)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxAllowed}
                      value={item.qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQty(invId, val);
                      }}
                      className="text-xs font-bold w-11 text-center border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                      onClick={() => updateQty(invId, 1)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(invId)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded ml-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Bottom Summary */}
        <div className="mt-auto pt-4 border-t border-gray-100 bg-white space-y-3">
          <div className="border border-gray-200/80 rounded-2xl p-4 bg-white space-y-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>{t("pos.items") || "Total Items"}</span>
              <span>
                {cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-700">Subtotal</span>
              <span className="text-base font-black text-[#27272a]">
                {subtotal.toLocaleString()} MMK
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowCheckoutModal(true);
            }}
            disabled={cart.length === 0}
            className="w-full bg-[#27272a] hover:bg-ocean-900 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Proceed to Save Changes</span>
          </button>
        </div>
      </div>

      {/* Checkout / Modify Order Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isMy ? "ဘောင်ချာ အချက်အလက်များ သိမ်းဆည်းရန်" : "Save Order Modifications"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm payment type, customer, date, and adjusted amounts
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
              {/* Payment Type: Paid vs Credit */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t("pos.paymentType") || "Payment Type"}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType("paid");
                      setPaidAmount(Math.ceil(total));
                    }}
                    className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      paymentType === "paid"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Paid (အပြည့်ချေ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType("credit");
                      setPaidAmount(0);
                    }}
                    className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      paymentType === "credit"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Credit (အကြွေး)
                  </button>
                </div>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t("pos.orderDate") || "Order Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer / Credit Person Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Customer (Optional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <select
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none bg-white"
                      value={selectedCreditPersonId}
                      onChange={(e) => setSelectedCreditPersonId(e.target.value)}
                    >
                      <option value="">-- No customer / Walk-in --</option>
                      {creditPersonas.map((cp) => (
                        <option key={cp._id} value={cp._id}>
                          {cp.name} - {cp.phone}
                          {cp.address ? ` (${cp.address})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCreditPersonModal(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t("pos.paymentMethod") || "Payment Method"}
                </label>
                <select
                  className="w-full border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none bg-white"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                >
                  <option value={PaymentMethod.CASH}>Cash</option>
                  <option value={PaymentMethod.KBZ_PAY}>KBZPay</option>
                  <option value={PaymentMethod.WAVE_PAY}>WavePay</option>
                  <option value={PaymentMethod.AYA_PAY}>AYA Pay</option>
                  <option value={PaymentMethod.UAB_PAY}>UAB Pay</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                  <option value={PaymentMethod.MMQR}>MMQR</option>
                  <option value={PaymentMethod.FOC}>FOC</option>
                </select>
              </div>

              {/* Delivery / Pickup Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t("pos.deliveryMethod") || "Delivery Method"}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDelivery(false);
                      setDeliveryFee(0);
                    }}
                    className={`py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      !isDelivery
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDelivery(true)}
                    className={`py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      isDelivery
                        ? "bg-ocean-600 text-white shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {isDelivery && (
                <div className="p-3 bg-ocean-50/50 border border-ocean-100 rounded-xl space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Township
                    </label>
                    <select
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                      value={selectedTownshipId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedTownshipId(id);
                        const tw = townships.find((t) => t._id === id);
                        setDeliveryFee(tw ? Number(tw.deliveryFee) || 0 : 0);
                      }}
                    >
                      <option value="">Select Township</option>
                      {townships.map((tw) => (
                        <option key={tw._id} value={tw._id}>
                          {tw.name} — {tw.deliveryFee.toLocaleString()} MMK
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Recipient Name"
                      className="border border-slate-200 rounded-lg p-2 text-xs bg-white"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Recipient Phone"
                      className="border border-slate-200 rounded-lg p-2 text-xs bg-white"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Delivery Address"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Discount (Flat MMK) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <span>Discount (MMK)</span>
                    {discountAmount > 0 && (
                      <span className="text-[10px] font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/60 px-1.5 py-0.5 rounded-full">
                        ≈ {equivalentDiscountPercent.toFixed(1)}%
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountPercentInput(
                        equivalentDiscountPercent > 0
                          ? String(Math.round(equivalentDiscountPercent * 10) / 10)
                          : ""
                      );
                      setShowDiscountCalculator(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-ocean-700 hover:text-ocean-800 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Calculate from percentage (%)"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>% Calculator</span>
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none"
                  value={discount === 0 ? "" : discount}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    setDiscount(Math.min(Math.max(0, val), subtotal));
                  }}
                />
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Paid Amount (MMK)
                  {paymentType === "paid" && paymentMethod !== PaymentMethod.FOC && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={paymentMethod === PaymentMethod.FOC}
                  className={`w-full border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none ${
                    paymentMethod === PaymentMethod.FOC ? "bg-slate-100" : ""
                  }`}
                  value={paymentMethod === PaymentMethod.FOC ? 0 : paidAmount}
                  onChange={(e) =>
                    setPaidAmount(Math.max(0, Number(e.target.value) || 0))
                  }
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Order Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional remarks..."
                  className="w-full border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Discount ({equivalentDiscountPercent.toFixed(1)}%)</span>
                    <span>-{discountAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                {isDelivery && deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-ocean-700 font-medium">
                    <span>Delivery Fee</span>
                    <span>+{deliveryFee.toLocaleString()} MMK</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Final Total</span>
                  <span>{total.toLocaleString()} MMK</span>
                </div>
                {paidAmount > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1">
                    <span>
                      {paymentType === "credit"
                        ? "Paid / Remaining"
                        : "Paid / Change"}
                    </span>
                    <span>
                      {paidAmount.toLocaleString()} /{" "}
                      {paymentType === "credit"
                        ? `${Math.max(0, total - paidAmount).toLocaleString()} MMK (Remaining)`
                        : `${Math.max(0, paidAmount - total).toLocaleString()} MMK (Change)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>
                  {isProcessing
                    ? "Saving changes..."
                    : isMy
                    ? "သိမ်းဆည်းမည်"
                    : "Save Changes"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCreditPersonModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">
                Add New Customer
              </h4>
              <button
                onClick={() => setShowAddCreditPersonModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCreditPersonName}
                  onChange={(e) => setNewCreditPersonName(e.target.value)}
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCreditPersonPhone}
                  onChange={(e) => setNewCreditPersonPhone(e.target.value)}
                  placeholder="09..."
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCreditPersonAddress}
                  onChange={(e) => setNewCreditPersonAddress(e.target.value)}
                  placeholder="Address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowAddCreditPersonModal(false)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCustomer}
                disabled={isAddingCreditPerson}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                {isAddingCreditPerson && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Percentage Discount Calculator Modal */}
      {showDiscountCalculator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-[#27272a]/5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Discount Calculator (%)
                </h3>
                <p className="text-xs text-slate-500">
                  Enter percentage to calculate MMK discount
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDiscountCalculator(false);
                  setDiscountPercentInput("");
                }}
                className="p-1.5 hover:bg-slate-200/50 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Subtotal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Current Subtotal
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              {/* Percentage Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Discount Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full border border-slate-200 rounded-xl p-3 pr-10 text-base font-bold text-slate-800 focus:ring-2 focus:ring-[#27272a] focus:border-transparent outline-none transition-all"
                    placeholder="Enter percentage (e.g. 10)"
                    value={discountPercentInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (
                        val === "" ||
                        (Number(val) >= 0 && Number(val) <= 100)
                      ) {
                        setDiscountPercentInput(val);
                      }
                    }}
                  />
                  <span className="absolute right-3.5 top-3.5 font-bold text-slate-400 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercentInput(String(pct))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      Number(discountPercentInput) === pct
                        ? "bg-[#27272a] text-white border-[#27272a]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Calculated Summary Card */}
              {discountPercentInput && Number(discountPercentInput) > 0 && (
                <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700">
                    <span>Discount Percentage:</span>
                    <span className="font-bold text-emerald-700">
                      {Number(discountPercentInput)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700">
                    <span>Calculated Discount:</span>
                    <span className="font-bold text-emerald-700">
                      -
                      {Math.round(
                        (subtotal * Number(discountPercentInput)) / 100
                      ).toLocaleString()}{" "}
                      MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-emerald-200">
                    <span>New Total:</span>
                    <span className="text-emerald-800">
                      {Math.max(
                        0,
                        Math.round(
                          subtotal -
                            (subtotal * Number(discountPercentInput)) / 100
                        )
                      ).toLocaleString()}{" "}
                      MMK
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscountCalculator(false);
                    setDiscountPercentInput("");
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pct = Number(discountPercentInput) || 0;
                    if (pct > 0 && pct <= 100) {
                      const calculatedMMK = Math.round((subtotal * pct) / 100);
                      setDiscount(calculatedMMK);
                      setShowDiscountCalculator(false);
                      setDiscountPercentInput("");
                      toast.success(
                        `Applied ${pct}% discount (-${calculatedMMK.toLocaleString()} MMK)`
                      );
                    }
                  }}
                  disabled={
                    !discountPercentInput ||
                    Number(discountPercentInput) <= 0 ||
                    Number(discountPercentInput) > 100
                  }
                  className="px-5 py-2.5 bg-[#27272a] hover:bg-[#27272a]/90 text-white rounded-xl transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
