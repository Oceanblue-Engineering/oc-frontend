import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home as HomeIcon, LogOut, Settings } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { removeAuthToken } from "../services/axios";
import { toast } from "sonner";

interface TopBarProps {
  /** Show the "Home / Back to Menu" control (hidden on standalone views). */
  showHome?: boolean;
}

/**
 * Minimal top bar for the Hub-and-Spoke layout.
 * Holds app branding, user info, and global actions (Home, Settings, Logout).
 */
export const TopBar: React.FC<TopBarProps> = ({ showHome = true }) => {
  const { t } = useLanguage();
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminData, setAdminData] = useState<any>(null);

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

  const isHome = location.pathname === "/";
  const userRole = adminData?.role || currentUser?.role;

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("adminData");
    toast.success(t("sidebar.loggedOut"));
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-zinc-200/70 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 cursor-pointer select-none"
          aria-label={t("home.backToMenu")}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-ocean-600 to-ocean-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-ocean-600/20">
            <span className="font-black text-sm tracking-widest">OB</span>
          </div>
          <span className="hidden sm:block text-ocean-800 font-bold tracking-wide">
            OceanBlue CMS
          </span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {showHome && !isHome && (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full border border-ocean-200 text-ocean-600 bg-white hover:bg-ocean-50/60 transition-all cursor-pointer"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("home.backToMenu")}</span>
            </button>
          )}

          <button
            onClick={() => navigate("/invoice-generator")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-full bg-ocean-50 text-ocean-700 hover:bg-ocean-100 border border-ocean-200/80 transition-all cursor-pointer"
            title="Generate Official Invoice"
          >
            <span>Invoice</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="p-2 text-gray-400 hover:text-ocean-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User chip */}
          <div className="flex items-center gap-2 pl-1">
            <div className="bg-ocean-600 rounded-full w-9 h-9 flex items-center justify-center text-white text-sm font-bold uppercase select-none">
              {(adminData?.name || currentUser?.name || "U")
                .substring(0, 1)
                .toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col min-w-0">
              <span className="text-slate-800 font-bold text-sm leading-tight truncate">
                {adminData?.name || currentUser?.name || "User"}
              </span>
              <span className="text-gray-400 font-semibold text-xs capitalize leading-none mt-0.5">
                {userRole || "User"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title={t("sidebar.logout")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};