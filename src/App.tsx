import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DeveloperAuthProvider } from "@/contexts/DeveloperAuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";

import InvestorLayout from "./pages/InvestorLayout";
import InvestorDashboard from "./pages/InvestorDashboard";
import InvestmentsPage from "./pages/InvestmentsPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import TransactionsPage from "./pages/TransactionsPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";

import DeveloperLayout from "./pages/developer/DeveloperLayout";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import DeveloperOfferings from "./pages/developer/DeveloperOfferings";
import DeveloperInvestors from "./pages/developer/DeveloperInvestors";
import DeveloperSetup from "./pages/developer/DeveloperSetup";
import DeveloperUnauthorized from "./pages/developer/DeveloperUnauthorized";
import OfferingDetailsPage from "./pages/developer/OfferingDetailsPage";
import DeveloperSettings from "./pages/developer/DeveloperSettings";
import DeveloperAnalytics from "./pages/developer/DeveloperAnalytics";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DeveloperAuthProvider>
              <LayoutProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Developer Portal (unprotected for local dev) */}
                  <Route path="/dev/setup" element={<DeveloperSetup />} />
                  <Route path="/dev/unauthorized" element={<DeveloperUnauthorized />} />
                  <Route path="/dev" element={<DeveloperLayout />}>
                    <Route index element={<DeveloperDashboard />} />
                    <Route path="offerings" element={<DeveloperOfferings />} />
                    <Route path="offerings/:id" element={<OfferingDetailsPage />} />
                    <Route path="investors" element={<DeveloperInvestors />} />
                    <Route
                      path="documents"
                      element={
                        <div className="space-y-6">
                          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                          <p className="text-muted-foreground">Document management coming soon...</p>
                        </div>
                      }
                    />
                    <Route
                      path="updates"
                      element={
                        <div className="space-y-6">
                          <h1 className="text-3xl font-bold tracking-tight">Updates</h1>
                          <p className="text-muted-foreground">Updates management coming soon...</p>
                        </div>
                      }
                    />
                    <Route path="analytics" element={<DeveloperAnalytics />} />
                    <Route path="settings" element={<DeveloperSettings />} />
                  </Route>

                  {/* Investor area (unprotected for local dev) */}
                  <Route path="/dashboard" element={<InvestorLayout />}>
                    <Route index element={<InvestorDashboard />} />
                  </Route>
                  <Route path="/investments" element={<InvestorLayout />}>
                    <Route index element={<InvestmentsPage />} />
                  </Route>
                  <Route path="/properties" element={<InvestorLayout />}>
                    <Route index element={<PropertiesPage />} />
                  </Route>
                  <Route path="/properties/:id" element={<InvestorLayout />}>
                    <Route index element={<PropertyDetailsPage />} />
                  </Route>
                  <Route path="/transactions" element={<InvestorLayout />}>
                    <Route index element={<TransactionsPage />} />
                  </Route>
                  <Route path="/account" element={<InvestorLayout />}>
                    <Route index element={<AccountPage />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </LayoutProvider>
            </DeveloperAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
