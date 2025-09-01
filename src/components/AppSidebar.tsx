import { LayoutDashboard, Users, Home, Megaphone } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
];

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

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
              <div className="h-8 w-8 bg-primary rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CI</span>
              </div>
              <h2 className="text-lg font-bold text-sidebar-foreground truncate">CompoundInvest</h2>
            </div>
          ) : (
            <div className="h-8 w-8 bg-primary rounded flex-shrink-0 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CI</span>
            </div>
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