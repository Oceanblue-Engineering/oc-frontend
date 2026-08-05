import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { navigationItems, hasPermission } from "../config/navigation";

/**
 * Home — the central Menu Hub (Hub-and-Spoke launcher).
 * Renders every permitted feature as an interactive icon card.
 */
export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useApp();
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

  const userRole = adminData?.role || currentUser?.role;
  const visibleItems = navigationItems.filter((item) =>
    hasPermission(item.path, userRole),
  );

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hub Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-ocean-600 to-ocean-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-ocean-600/20">
              <Store className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ocean-800">
            {t("home.title")}
          </h1>
          <p className="text-ocean-600 mt-2 font-medium">{t("home.subtitle")}</p>
        </header>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:shadow-ocean-500/10 hover:-translate-y-1 transition-all duration-300 hover:border-ocean-300 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${item.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-ocean-800">
                  {t(item.titleKey)}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  {t(item.descKey)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};