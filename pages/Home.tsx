import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import {
  navigationItems,
  navigationSlides,
  hasPermission,
  NavigationCategory,
} from "../config/navigation";

type SlideTabType = NavigationCategory | "all";

/**
 * Home — the central Menu Hub (Hub-and-Spoke launcher).
 * Features a 2-slide carousel / tabbed layout:
 * - Slide 1: Purchasing & Orders (POS, inventory, purchasing, expenses, orders, financials)
 * - Slide 2: Project Management (Client leads, active projects, worker wages, support tickets)
 */
export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminData, setAdminData] = useState<any>(null);

  // Initialize active slide from URL query or default to 'purchasing_orders'
  const initialSlide = (searchParams.get("slide") as SlideTabType) || "purchasing_orders";
  const [activeSlide, setActiveSlide] = useState<SlideTabType>(
    initialSlide === "project_management" || initialSlide === "all"
      ? initialSlide
      : "purchasing_orders"
  );
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }
  }, []);

  const userRole = adminData?.role || currentUser?.role;

  // Filter all permitted items
  const allPermittedItems = useMemo(() => {
    return navigationItems.filter((item) => hasPermission(item.path, userRole));
  }, [userRole]);

  // Group items by slide category
  const purchasingItems = useMemo(() => {
    return allPermittedItems.filter((item) => item.category === "purchasing_orders");
  }, [allPermittedItems]);

  const projectItems = useMemo(() => {
    return allPermittedItems.filter((item) => item.category === "project_management");
  }, [allPermittedItems]);

  // Items to display on current active slide
  const displayedItems = useMemo(() => {
    if (activeSlide === "all") return allPermittedItems;
    if (activeSlide === "project_management") return projectItems;
    return purchasingItems;
  }, [activeSlide, allPermittedItems, purchasingItems, projectItems]);

  // Slide navigation handlers
  const handleSlideChange = (newSlide: SlideTabType, direction?: "left" | "right") => {
    if (newSlide === activeSlide) return;
    const dir = direction || (newSlide === "project_management" ? "right" : "left");
    setSlideDirection(dir);
    setActiveSlide(newSlide);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSlide === "purchasing_orders") {
        next.delete("slide");
      } else {
        next.set("slide", newSlide);
      }
      return next;
    });
  };

  const handleToggleNextPrev = (direction: "next" | "prev") => {
    if (activeSlide === "purchasing_orders") {
      handleSlideChange("project_management", "right");
    } else if (activeSlide === "project_management") {
      handleSlideChange("purchasing_orders", "left");
    } else {
      handleSlideChange("purchasing_orders", "left");
    }
  };

  // Keyboard navigation for slide flipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "ArrowRight") {
        if (activeSlide === "purchasing_orders") {
          handleSlideChange("project_management", "right");
        }
      } else if (e.key === "ArrowLeft") {
        if (activeSlide === "project_management") {
          handleSlideChange("purchasing_orders", "left");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide]);

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Hub Header */}
        <header className="mb-6 text-center">
          <div className="inline-flex items-center gap-3 justify-center mb-3">
            <div className="w-14 h-14 bg-white border border-zinc-200/80 rounded-2xl flex items-center justify-center shadow-md overflow-hidden p-2 hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="OceanBlue Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ocean-900 tracking-tight">
            {t("home.title")}
          </h1>
          <p className="text-ocean-600 mt-1.5 text-sm sm:text-base font-medium">
            {t("home.subtitle")}
          </p>
        </header>

        {/* Slide Selector & Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white/80 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-zinc-200/80 shadow-sm">
          {/* Segmented Slide Tabs */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl w-full sm:w-auto">
            {/* Slide 1: Purchasing & Orders */}
            <button
              onClick={() => handleSlideChange("purchasing_orders", "left")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeSlide === "purchasing_orders"
                  ? "bg-white text-ocean-900 shadow-sm border border-zinc-200/60"
                  : "text-slate-600 hover:text-ocean-700 hover:bg-white/50"
              }`}
            >
              <ShoppingBag className={`w-4 h-4 ${activeSlide === "purchasing_orders" ? "text-ocean-600" : "text-slate-500"}`} />
              <span>{t("home.slides.purchasingOrders")}</span>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeSlide === "purchasing_orders"
                    ? "bg-ocean-100 text-ocean-700"
                    : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {purchasingItems.length}
              </span>
            </button>

            {/* Slide 2: Project Management */}
            <button
              onClick={() => handleSlideChange("project_management", "right")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeSlide === "project_management"
                  ? "bg-white text-ocean-900 shadow-sm border border-zinc-200/60"
                  : "text-slate-600 hover:text-ocean-700 hover:bg-white/50"
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeSlide === "project_management" ? "text-indigo-600" : "text-slate-500"}`} />
              <span>{t("home.slides.projectManagement")}</span>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeSlide === "project_management"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {projectItems.length}
              </span>
            </button>

            {/* All Modules Tab */}
            <button
              onClick={() => handleSlideChange("all", activeSlide === "purchasing_orders" ? "right" : "left")}
              className={`hidden md:flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeSlide === "all"
                  ? "bg-white text-ocean-900 shadow-sm border border-zinc-200/60"
                  : "text-slate-500 hover:text-ocean-700 hover:bg-white/50"
              }`}
              title="View all modules"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t("home.allModules")}</span>
            </button>
          </div>

          {/* Quick Slide Arrow Controls & Indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <span className="font-semibold text-ocean-800">
                {activeSlide === "purchasing_orders"
                  ? "1"
                  : activeSlide === "project_management"
                  ? "2"
                  : "All"}
              </span>
              <span>/</span>
              <span>2</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleToggleNextPrev("prev")}
                disabled={activeSlide === "purchasing_orders"}
                aria-label={t("home.previousSlide")}
                className={`p-2 rounded-xl border border-zinc-200 text-slate-700 transition-all cursor-pointer ${
                  activeSlide === "purchasing_orders"
                    ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-400"
                    : "bg-white hover:bg-ocean-50 hover:text-ocean-700 hover:border-ocean-300 shadow-sm active:scale-95"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToggleNextPrev("next")}
                disabled={activeSlide === "project_management"}
                aria-label={t("home.nextSlide")}
                className={`p-2 rounded-xl border border-zinc-200 text-slate-700 transition-all cursor-pointer ${
                  activeSlide === "project_management"
                    ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-400"
                    : "bg-white hover:bg-ocean-50 hover:text-ocean-700 hover:border-ocean-300 shadow-sm active:scale-95"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Slide Header Summary */}
        <div className="mb-5 flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ocean-900 flex items-center gap-2">
              {activeSlide === "purchasing_orders" && (
                <>
                  <ShoppingBag className="w-5 h-5 text-ocean-600" />
                  <span>{t("home.slides.purchasingOrders")}</span>
                </>
              )}
              {activeSlide === "project_management" && (
                <>
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <span>{t("home.slides.projectManagement")}</span>
                </>
              )}
              {activeSlide === "all" && (
                <>
                  <LayoutGrid className="w-5 h-5 text-ocean-600" />
                  <span>{t("home.allModules")}</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {activeSlide === "purchasing_orders" && t("home.slides.purchasingOrdersDesc")}
              {activeSlide === "project_management" && t("home.slides.projectManagementDesc")}
              {activeSlide === "all" && t("home.subtitle")}
            </p>
          </div>

          {/* Switch to other slide quick link button */}
          {activeSlide === "purchasing_orders" && (
            <button
              onClick={() => handleSlideChange("project_management", "right")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-600 hover:text-ocean-800 bg-ocean-50/80 hover:bg-ocean-100 px-3 py-1.5 rounded-full border border-ocean-200/70 transition-colors cursor-pointer"
            >
              <span>{t("home.slides.projectManagement")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {activeSlide === "project_management" && (
            <button
              onClick={() => handleSlideChange("purchasing_orders", "left")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-600 hover:text-ocean-800 bg-ocean-50/80 hover:bg-ocean-100 px-3 py-1.5 rounded-full border border-ocean-200/70 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t("home.slides.purchasingOrders")}</span>
            </button>
          )}
        </div>

        {/* Menu Grid Cards with Smooth Fade-Slide Transition */}
        <div
          key={activeSlide}
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300 ${
            slideDirection === "right" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          }`}
        >
          {displayedItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className="group relative bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm hover:shadow-xl hover:shadow-ocean-500/10 hover:-translate-y-1.5 transition-all duration-300 hover:border-ocean-300/80 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle top gradient line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ocean-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110 shadow-sm ${item.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-ocean-900 group-hover:text-ocean-600 transition-colors">
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {t(item.descKey)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-ocean-600 transition-colors">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {item.category === "project_management" ? "Project" : "Sales/Stock"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Slide Pagination Dots */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSlideChange("purchasing_orders", "left")}
              aria-label="Slide 1: Purchasing & Orders"
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === "purchasing_orders"
                  ? "w-8 bg-ocean-600"
                  : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
            <button
              onClick={() => handleSlideChange("project_management", "right")}
              aria-label="Slide 2: Project Management"
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === "project_management"
                  ? "w-8 bg-indigo-600"
                  : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          </div>
          <span className="text-xs text-slate-400">
            {activeSlide === "purchasing_orders"
              ? "Slide 1 of 2: Purchasing & Orders"
              : activeSlide === "project_management"
              ? "Slide 2 of 2: Project Management"
              : "All Modules"}
          </span>
        </div>
      </div>
    </div>
  );
};