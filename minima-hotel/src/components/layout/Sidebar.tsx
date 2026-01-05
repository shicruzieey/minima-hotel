import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings,
  LogOut,
  Hotel
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingCart, label: "POS", path: "/pos" },
  { icon: Package, label: "Inventory", path: "/inventory" },
];

const Sidebar = () => {
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

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink to="/settings" className="nav-item">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </NavLink>
        <button className="nav-item w-full text-gray-500 hover:text-white">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
