import { LayoutDashboard, Users, Home, Megaphone, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";


const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  // Fetch company settings for logo and name
  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      return data;
    }
  });

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      
      {/* Company Logo Section */}
      <div className="px-6 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 min-w-0">
          {open ? (
            <div className="flex items-center gap-2 min-w-0">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Company Logo" 
                  className="h-8 w-8 flex-shrink-0 object-contain rounded"
                />
              ) : (
                <div className="h-8 w-8 bg-primary rounded flex-shrink-0 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">CI</span>
                </div>
              )}
              <h2 className="text-lg font-bold text-sidebar-foreground truncate">
                {settings?.company_name || 'CompoundInvest'}
              </h2>
            </div>
          ) : (
            settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Company Logo" 
                className="h-8 w-8 flex-shrink-0 object-contain rounded"
              />
            ) : (
              <div className="h-8 w-8 bg-primary rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CI</span>
              </div>
            )
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}