import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings,
  LogOut,
  Users,
  Shield,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingCart, label: "POS", path: "/pos" },
  { icon: Users, label: "Guests", path: "/guests" },
  { icon: Package, label: "Inventory", path: "/inventory" },
];

const Sidebar = () => {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm overflow-hidden">
            <img 
              src="/logo.jpg" 
              alt="Minima Hotel Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-heading text-base font-medium text-sidebar-foreground">
              Minima Hotel
            </h1>
            <p className="text-xs text-sidebar-foreground/50">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs text-sidebar-foreground/40 px-4 mb-4">
          Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "nav-item",
                isActive && "nav-item-active"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-foreground/10 flex items-center justify-center">
              {isManager ? (
                <Shield className="w-4 h-4 text-sidebar-foreground/70" />
              ) : (
                <User className="w-4 h-4 text-sidebar-foreground/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  isManager 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                )}
              >
                {isManager ? "Manager" : "Receptionist"}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink to="/settings" className="nav-item">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </NavLink>
        <button 
          onClick={handleLogout}
          className="nav-item w-full text-gray-500 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
