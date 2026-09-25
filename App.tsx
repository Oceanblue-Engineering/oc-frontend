import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { TopBar } from "./components/TopBar";
import { Home } from "./pages/Home";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { POS } from "./pages/POS";
import { Warehouse } from "./pages/Warehouse";
import { WarehouseDetail } from "./pages/WarehouseDetail";
import { Storefront } from "./pages/Storefront";
import { StorefrontDetail } from "./pages/StorefrontDetail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Inventory } from "./pages/Inventory";
import { Purchasing } from "./pages/Purchasing";
import { Credits } from "./pages/Credits";
import { CreditDetail } from "./pages/CreditDetail";
import { Expenses } from "./pages/Expenses";
import { Suppliers } from "./pages/Suppliers";
import { SupplierDetail } from "./pages/SupplierDetail";
import { Orders } from "./pages/Orders";
import { CreditOrders } from "./pages/CreditOrders";
import { AccountManagement } from "./pages/AccountManagement";
import { WorkerManagement } from "./pages/WorkerManagement";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PrintReceipt from "./pages/PrintReceipt";
import { AIChat } from "./components/AIChat";
import { DailyReports } from "./pages/DailyReports";
import MobilePrint from "./pages/MobilePrint";
import { LuckyDraw } from "./pages/LuckyDraw";
import { ClientLeads } from "./pages/ClientLeads";
import { ClientProjects } from "./pages/ClientProjects";
import { DeliveryManagement } from "./pages/DeliveryManagement";
import { ScrollToTop } from "./components/ScrollToTop";
import { Tickets } from "./pages/Tickets";
import { TicketDetail } from "./pages/TicketDetail";
import { ProjectAttendance } from "./pages/ProjectAttendance";
import ProjectDetailAnalytics from "./pages/ProjectDetailAnalytics";
import { InvoiceGenerator } from "./pages/InvoiceGenerator";
import { ActivityLogs } from "./pages/ActivityLogs";
import { OrderEditPOS } from "./pages/OrderEditPOS";
import { PersonalExpenses } from "./pages/PersonalExpenses";

const AppLayout: React.FC = () => {
  const location = useLocation();
  // Standalone print views — no top bar so receipts render cleanly.
  const isPrintView =
    location.pathname.startsWith("/mobile-print") ||
    location.pathname.startsWith("/print-receipt");

  return (
    <div className="min-h-screen flex flex-col bg-ocean-50/30">
      {/* Top Bar */}
      {!isPrintView && <TopBar />}

      {/* Main Content — full width (Hub-and-Spoke) */}
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute>
                <Warehouse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse/:id"
            element={
              <ProtectedRoute>
                <WarehouseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront"
            element={
              <ProtectedRoute>
                <Storefront />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront/:id"
            element={
              <ProtectedRoute>
                <StorefrontDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:id"
            element={
              <ProtectedRoute>
                <SupplierDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing"
            element={
              <ProtectedRoute>
                <Purchasing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/edit/:id"
            element={
              <ProtectedRoute>
                <OrderEditPOS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-orders"
            element={
              <ProtectedRoute>
                <CreditOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits/:id"
            element={
              <ProtectedRoute>
                <CreditDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal-expenses"
            element={
              <ProtectedRoute>
                <PersonalExpenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workers"
            element={
              <ProtectedRoute>
                <WorkerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute>
                <AIChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-reports"
            element={
              <ProtectedRoute>
                <DailyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lucky-draw"
            element={
              <ProtectedRoute>
                <LuckyDraw />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-projects"
            element={
              <ProtectedRoute>
                <ClientProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/attendance"
            element={
              <ProtectedRoute>
                <ProjectAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/analytics"
            element={
              <ProtectedRoute>
                <ProjectDetailAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery"
            element={
              <ProtectedRoute>
                <DeliveryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice-generator"
            element={
              <ProtectedRoute>
                <InvoiceGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={<Navigate to="/settings?tab=activity" replace />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/mobile-print/:orderId" element={<MobilePrint />} />
          <Route path="/print-receipt/:orderId" element={<PrintReceipt />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              borderRadius: '1rem',
              fontFamily: 'inherit',
            },
            classNames: {
              toast: 'border shadow-xl text-sm font-semibold p-4',
              success: '!bg-white !text-[#27272a] !border-[#27272a]/30',
              error: '!bg-white !text-red-600 !border-red-600/30',
              info: '!bg-white !text-[#27272a] !border-[#27272a]/30',
              warning: '!bg-white !text-amber-600 !border-amber-600/30',
            }
          }} 
        />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
};

export default App;
