import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ContactsListPage from "./pages/ContactsList";
import ContactDetail from "./pages/ContactDetail";
import CampaignsList from "./pages/CampaignsList";
import CampaignDetail from "./pages/CampaignDetail";
import AddCampaign from "./pages/AddCampaign";
import AddContact from "./pages/AddContact";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { ProfileDropdown } from "./components/ProfileDropdown";

const FaviconLoader = () => {
  const { data: settings } = useQuery({
    queryKey: ['company-settings-favicon'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('favicon_url')
        .limit(1)
        .single();
      return data;
    }
  });

  useEffect(() => {
    if (settings?.favicon_url) {
      const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = settings.favicon_url;
      } else {
        // Create favicon link if it doesn't exist
        const newFaviconLink = document.createElement("link");
        newFaviconLink.rel = "icon";
        newFaviconLink.href = settings.favicon_url;
        newFaviconLink.type = "image/png";
        document.head.appendChild(newFaviconLink);
      }
    }
  }, [settings?.favicon_url]);

  return null;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider defaultOpen={true}>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <SidebarInset className="flex-1">
        <header className="h-12 flex items-center justify-between border-b border-border bg-background px-4">
          <SidebarTrigger />
          <ProfileDropdown />
        </header>
        <main className="p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FaviconLoader />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contacts" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContactsListPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contacts/add" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AddContact />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contacts/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContactDetail />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaigns" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CampaignsList />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaigns/add" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AddCampaign />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaigns/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CampaignDetail />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;