import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  Lock,
  Calendar,
  CreditCard,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  PieChart as PieChartIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchPersonalExpenses,
  fetchPersonalExpenseSummary,
  createPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
  PersonalExpense,
  PersonalExpenseSummary,
} from "../services/PersonalExpense/personalExpense.service";
import { useLanguage } from "../context/LanguageContext";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  DATE_RANGE_STORAGE_KEYS,
  createDateRangeInitializer,
  saveStoredDateRange,
} from "../utils/dateRangeStorage";
import {
  PageHeader,
  StatsCard,
  Input,
  Select,
  Button,
  Badge,
  Modal,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../components/ui";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { value: "Food & Dining", labelMy: "အစားအသောက်", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Travel & Transport", labelMy: "ခရီးစရိတ် / သွားလာရေး", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Family & Home", labelMy: "မိသားစုနှင့် အိမ်သုံး", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "Health & Medical", labelMy: "ကျန်းမာရေးနှင့် ဆေးဝါး", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "Shopping & Personal", labelMy: "ဈေးဝယ်နှင့် ကိုယ်ပိုင်သုံး", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "Utilities & Bills", labelMy: "မီတာခနှင့် ဘေလ်များ", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { value: "Education & Learning", labelMy: "ပညာရေး", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "Donation & Charity", labelMy: "အလှူဒါန", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "Investment", labelMy: "ရင်းနှီးမြှုပ်နှံမှု", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "Other", labelMy: "အခြား", color: "bg-slate-50 text-slate-700 border-slate-200" },
];

const CUSTOM_COLORS = [
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-lime-50 text-lime-700 border-lime-200",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "kpay", label: "KBZPay" },
  { value: "wavepay", label: "WavePay" },
  { value: "ayapay", label: "AYA Pay" },
  { value: "uabpay", label: "UAB Pay" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export const PersonalExpenses: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isMy = language === "my";

  // Role Verification
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const isOwner = userRole === "owner";

  // Data State
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [summary, setSummary] = useState<PersonalExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Date Filter
  const [dateRange, setDateRange] = useState(
    createDateRangeInitializer(DATE_RANGE_STORAGE_KEYS.personalExpenses)
  );
  const { startDate, endDate } = dateRange;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Food & Dining",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    notes: "",
  });
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);

  // Delete State
  const [expenseToDelete, setExpenseToDelete] = useState<PersonalExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOwner) {
      loadExpenses();
      loadSummary();
    }
  }, [startDate, endDate, categoryFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const startStr = startDate ? startDate.toISOString().split("T")[0] : undefined;
      const endStr = endDate ? endDate.toISOString().split("T")[0] : undefined;

      const response = await fetchPersonalExpenses({
        startDate: startStr,
        endDate: endStr,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });

      if (response.success) {
        setExpenses(response.data);
      } else {
        toast.error(response.message || "Failed to load personal expenses");
      }
    } catch (error) {
      console.error("Error loading personal expenses:", error);
      toast.error("Failed to load personal expenses");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetchPersonalExpenseSummary();
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      category: "Food & Dining",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: PersonalExpense) => {
    setEditingId(expense._id);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
      paymentMethod: expense.paymentMethod || "cash",
      notes: expense.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(isMy ? "အသုံးစရိတ် အကြောင်းအရာ ရိုက်ထည့်ပါ" : "Title is required");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error(isMy ? "ငွေပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ" : "Valid amount is required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        const res = await updatePersonalExpense(editingId, formData);
        if (res.success) {
          toast.success(isMy ? "အသုံးစရိတ် ပြင်ဆင်ပြီးပါပြီ" : "Personal expense updated");
          setIsModalOpen(false);
          loadExpenses();
          loadSummary();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createPersonalExpense(formData);
        if (res.success) {
          toast.success(isMy ? "အသုံးစရိတ် အသစ် ထည့်သွင်းပြီးပါပြီ" : "Personal expense added");
          setIsModalOpen(false);
          loadExpenses();
          loadSummary();
        } else {
          toast.error(res.message);
        }
      }
    } catch (error) {
      console.error("Error saving personal expense:", error);
      toast.error("Failed to save personal expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      const res = await deletePersonalExpense(expenseToDelete._id);
      if (res.success) {
        toast.success(isMy ? "အသုံးစရိတ် ဖျက်ပြီးပါပြီ" : "Personal expense deleted");
        setExpenseToDelete(null);
        loadExpenses();
        loadSummary();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete personal expense");
    } finally {
      setIsDeleting(false);
    }
  };

  // If not owner, block access immediately
  if (!isOwner) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white border border-rose-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {isMy ? "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်" : "Access Restricted"}
          </h2>
          <p className="text-sm text-slate-500">
            {isMy
              ? "ဤစာမျက်နှာသည် ဆိုင်ပိုင်ရှင် (Owner) သာလျှင် ကြည့်ရှုအသုံးပြုနိုင်သော သီးသန့် ကိုယ်ပိုင်အသုံးစရိတ် ကဏ္ဍဖြစ်ပါသည်။"
              : "This page is private and only accessible by the Owner account."}
          </p>
          <Button
            variant="default"
            className="w-full mt-4"
            onClick={() => navigate("/")}
          >
            {isMy ? "ပင်မစာမျက်နှာသို့ ပြန်သွားမည်" : "Return to Home"}
          </Button>
        </div>
      </div>
    );
  }

  const filteredExpenses = expenses.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const rangeTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const allCategoriesList = useMemo(() => {
    const map = new Map<string, { name: string; labelMy?: string; isPreset: boolean }>();
    CATEGORIES.forEach((c) => {
      map.set(c.value.toLowerCase(), { name: c.value, labelMy: c.labelMy, isPreset: true });
    });
    expenses.forEach((e) => {
      if (e.category && e.category.trim()) {
        const key = e.category.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: e.category.trim(), isPreset: false });
        }
      }
    });
    if (summary?.categoryBreakdown) {
      summary.categoryBreakdown.forEach((b) => {
        if (b.category && b.category.trim()) {
          const key = b.category.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, { name: b.category.trim(), isPreset: false });
          }
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [expenses, summary]);

  const filteredCategorySuggestions = useMemo(() => {
    const input = (formData.category || "").toLowerCase().trim();
    if (!input) return allCategoriesList;
    return allCategoriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(input) ||
        (c.labelMy && c.labelMy.toLowerCase().includes(input))
    );
  }, [allCategoriesList, formData.category]);

  const isExactCategoryMatch = useMemo(() => {
    const input = (formData.category || "").toLowerCase().trim();
    if (!input) return true;
    return allCategoriesList.some((c) => c.name.toLowerCase() === input);
  }, [allCategoriesList, formData.category]);

  const getCategoryMeta = (cat: string) => {
    const found = CATEGORIES.find(
      (c) => c.value.toLowerCase() === (cat || "").toLowerCase()
    );
    if (found) return found;

    // Generate deterministic color for custom category
    let hash = 0;
    for (let i = 0; i < (cat || "").length; i++) {
      hash = (hash << 5) - hash + cat.charCodeAt(i);
      hash |= 0;
    }
    const colorIndex = Math.abs(hash) % CUSTOM_COLORS.length;
    return {
      value: cat,
      labelMy: cat,
      color: CUSTOM_COLORS[colorIndex],
    };
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <PageHeader
        title={isMy ? "ကိုယ်ပိုင် အသုံးစရိတ်" : "Personal Expenses"}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[11px]">
              <Lock className="w-3 h-3 mr-1" />
              {isMy ? "Owner သီးသန့်" : "Owner Only Private"}
            </Badge>
            <span>
              {isMy
                ? "မိမိ၏ ကိုယ်ပိုင်အသုံးစရိတ်များကို သီးခြား မှတ်တမ်းတင် တွက်ချက်နိုင်ပါသည်"
                : "Privately track and manage your personal personal expenses"}
            </span>
          </span>
        }
        icon={<Wallet className="w-5 h-5 text-ocean-600" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                loadExpenses();
                loadSummary();
              }}
              disabled={loading}
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              {isMy ? "အသစ်ပြန်တင်မည်" : "Refresh"}
            </Button>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(newStartDate, newEndDate) => {
                if (!newStartDate || !newEndDate) return;
                setDateRange({
                  startDate: newStartDate,
                  endDate: newEndDate,
                });
                saveStoredDateRange(
                  DATE_RANGE_STORAGE_KEYS.personalExpenses,
                  newStartDate,
                  newEndDate
                );
              }}
            />
            <Button
              variant="default"
              size="default"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-[#27272a] hover:bg-[#27272a]/90 text-white font-bold"
            >
              {isMy ? "အသုံးစရိတ် အသစ်ထည့်မည်" : "Add Personal Expense"}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={isMy ? "ရွေးချယ်ထားသော ကာလစုစုပေါင်း" : "Selected Period Total"}
          value={`${rangeTotal.toLocaleString()} MMK`}
          description={isMy ? `${filteredExpenses.length} ကြိမ် အသုံးပြုထားသည်` : `${filteredExpenses.length} transactions`}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
        />
        <StatsCard
          title={isMy ? "ယခုလ အသုံးစရိတ်" : "This Month"}
          value={`${(summary?.thisMonth.totalAmount || 0).toLocaleString()} MMK`}
          description={isMy ? `${summary?.thisMonth.count || 0} ကြိမ်` : `${summary?.thisMonth.count || 0} transactions`}
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
        />
        <StatsCard
          title={isMy ? "ယခုအပတ် အသုံးစရိတ်" : "This Week"}
          value={`${(summary?.thisWeek.totalAmount || 0).toLocaleString()} MMK`}
          description={isMy ? `${summary?.thisWeek.count || 0} ကြိမ်` : `${summary?.thisWeek.count || 0} transactions`}
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
        />
        <StatsCard
          title={isMy ? "စုစုပေါင်း မှတ်တမ်း" : "All-Time Total"}
          value={`${(summary?.allTime.totalAmount || 0).toLocaleString()} MMK`}
          description={isMy ? `စုစုပေါင်း ${summary?.allTime.count || 0} ခု` : `Total ${summary?.allTime.count || 0} records`}
          icon={<CreditCard className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Category Pills Breakdown */}
      {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <PieChartIcon className="w-3.5 h-3.5 text-ocean-600" />
            {isMy ? "အသုံးစရိတ် ခေါင်းစဉ်အလိုက် ခြုံငုံသုံးသပ်ချက်" : "Category Breakdown"}
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.categoryBreakdown.map((item) => {
              const meta = getCategoryMeta(item.category);
              return (
                <div
                  key={item.category}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${meta.color}`}
                >
                  <span>{isMy ? meta.labelMy : item.category}</span>
                  <span className="font-bold">
                    {item.totalAmount.toLocaleString()} MMK
                  </span>
                  <span className="text-[10px] opacity-75">
                    ({item.count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            placeholder={isMy ? "ခေါင်းစဉ်၊ မှတ်ချက်ဖြင့် ရှာရန်..." : "Search title or notes..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {isMy ? "အမျိုးအစား:" : "Category:"}
          </span>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-56"
          >
            <option value="all">{isMy ? "အမျိုးအစား အားလုံး" : "All Categories"}</option>
            {allCategoriesList.map((c) => (
              <option key={c.name} value={c.name}>
                {isMy && c.labelMy ? `${c.name} (${c.labelMy})` : c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>{isMy ? "ရက်စွဲ" : "Date"}</TableHead>
              <TableHead>{isMy ? "အကြောင်းအရာ" : "Title"}</TableHead>
              <TableHead>{isMy ? "အမျိုးအစား" : "Category"}</TableHead>
              <TableHead>{isMy ? "ငွေပေးချေမှု" : "Payment"}</TableHead>
              <TableHead className="text-right">{isMy ? "ပမာဏ" : "Amount"}</TableHead>
              <TableHead>{isMy ? "မှတ်ချက်" : "Notes"}</TableHead>
              <TableHead className="text-right">{isMy ? "လုပ်ဆောင်ချက်" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-ocean-600 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    {isMy ? "အချက်အလက်များ ဆွဲယူနေပါသည်..." : "Loading personal expenses..."}
                  </p>
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message={
                  isMy
                    ? "သတ်မှတ်ထားသော ကာလအတွင်း ကိုယ်ပိုင်အသုံးစရိတ် မှတ်တမ်း မရှိသေးပါ"
                    : "No personal expenses found for this period"
                }
              />
            ) : (
              filteredExpenses.map((expense, idx) => {
                const meta = getCategoryMeta(expense.category);
                const paymentLabel =
                  PAYMENT_METHODS.find((p) => p.value === expense.paymentMethod)?.label ||
                  expense.paymentMethod;

                return (
                  <TableRow key={expense._id}>
                    <TableCell className="text-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {expense.date
                        ? new Date(expense.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 text-sm">
                      {expense.title}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.color}`}
                      >
                        {isMy ? meta.labelMy : expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        {paymentLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-slate-900 text-sm whitespace-nowrap">
                      {expense.amount.toLocaleString()} MMK
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {expense.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(expense)}
                          className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(expense)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingId
            ? isMy
              ? "ကိုယ်ပိုင် အသုံးစရိတ် ပြင်ဆင်ခြင်း"
              : "Edit Personal Expense"
            : isMy
              ? "ကိုယ်ပိုင် အသုံးစရိတ် အသစ် ထည့်သွင်းခြင်း"
              : "Add Personal Expense"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isMy ? "အကြောင်းအရာ" : "Title / Description"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder={isMy ? "ဥပမာ - နေ့လယ်စာ စားစရိတ်၊ ကားဆီဖြည့်ခ" : "e.g. Lunch with client, Fuel"}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isMy ? "အမျိုးအစား" : "Category"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={
                    isMy
                      ? "ရွေးချယ်ပါ သို့မဟုတ် အမျိုးအစားအသစ် ရိုက်ထည့်ပါ..."
                      : "Select or type new category..."
                  }
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none transition-all"
                  value={formData.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, category: val });
                    setCategoryShowDropdown(true);
                  }}
                  onFocus={() => setCategoryShowDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setCategoryShowDropdown(false), 250);
                  }}
                />

                {categoryShowDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {/* Add as new category prompt if typed value is custom */}
                    {formData.category.trim() && !isExactCategoryMatch && (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({
                            ...formData,
                            category: formData.category.trim(),
                          });
                          setCategoryShowDropdown(false);
                        }}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {isMy ? "အမျိုးအစားအသစ် ထည့်မည်:" : "Create new category:"}{" "}
                            <span className="underline font-black">"{formData.category.trim()}"</span>
                          </span>
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                          + New
                        </span>
                      </div>
                    )}

                    {/* Filtered suggestions */}
                    {filteredCategorySuggestions.map((cat) => (
                      <div
                        key={cat.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, category: cat.name });
                          setCategoryShowDropdown(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between ${
                          formData.category === cat.name
                            ? "bg-ocean-50 text-ocean-700 font-bold"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span>
                          {isMy && cat.labelMy ? `${cat.name} (${cat.labelMy})` : cat.name}
                        </span>
                        {cat.isPreset ? (
                          <span className="text-[10px] text-slate-400 font-medium">Preset</span>
                        ) : (
                          <span className="text-[10px] text-ocean-600 font-bold bg-ocean-50 px-1.5 py-0.5 rounded">Custom</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORIES.slice(0, 5).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: c.value });
                      setCategoryShowDropdown(false);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                      formData.category === c.value
                        ? "bg-[#27272a] text-white border-[#27272a]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {isMy ? c.labelMy : c.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isMy ? "ပမာဏ (MMK)" : "Amount (MMK)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                required
                placeholder="0"
                value={formData.amount === 0 ? "" : formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isMy ? "ရက်စွဲ" : "Date"} <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isMy ? "ငွေပေးချေမှု ပုံစံ" : "Payment Method"}
              </label>
              <Select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isMy ? "မှတ်ချက် (ရွေးချယ်နိုင်သည်)" : "Notes (Optional)"}
            </label>
            <textarea
              rows={3}
              placeholder={isMy ? "အခြား မှတ်သားလိုသည်များ..." : "Additional details..."}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none transition-all"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              {isMy ? "ပယ်ဖျက်မည်" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="bg-[#27272a] hover:bg-[#27272a]/90 text-white font-bold"
            >
              {isSubmitting
                ? isMy
                  ? "သိမ်းဆည်းနေသည်..."
                  : "Saving..."
                : editingId
                  ? isMy
                    ? "ပြင်ဆင်မှု သိမ်းမည်"
                    : "Update Expense"
                  : isMy
                    ? "သိမ်းဆည်းမည်"
                    : "Save Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={isMy ? "ကိုယ်ပိုင်အသုံးစရိတ် ဖျက်ရန် အတည်ပြုပါ" : "Delete Personal Expense"}
        message={
          isMy
            ? `"${expenseToDelete?.title}" (${expenseToDelete?.amount.toLocaleString()} MMK) ကို ဖျက်ရန် သေချာပါသလား?`
            : `Are you sure you want to delete "${expenseToDelete?.title}" (${expenseToDelete?.amount.toLocaleString()} MMK)?`
        }
        confirmText={isMy ? "ဖျက်မည်" : "Delete"}
        cancelText={isMy ? "မဖျက်တော့ပါ" : "Cancel"}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PersonalExpenses;
