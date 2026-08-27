import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface MenuItem {
  label: string;
  path: string;
  roles: Array<"admin" | "manager" | "cashier">;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/",
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "POS",
    path: "/pos",
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "Products",
    path: "/products",
    roles: ["admin", "manager"],
  },
  {
    label: "Categories",
    path: "/categories",
    roles: ["admin", "manager"],
  },
  {
    label: "Suppliers",
    path: "/suppliers",
    roles: ["admin", "manager"],
  },
  {
    label: "Customers",
    path: "/customers",
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "Purchases",
    path: "/purchases",
    roles: ["admin", "manager"],
  },
  {
    label: "Inventory",
    path: "/inventory",
    roles: ["admin", "manager"],
  },
  {
    label: "Sales",
    path: "/sales",
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "Reports",
    path: "/reports",
    roles: ["admin"],
  },
  {
    label: "Settings",
    path: "/settings",
    roles: ["admin"],
  },
  {
    label: "BIR Settings",
    path: "/bir-settings",
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white">
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <h1 className="text-2xl font-bold">iPOS</h1>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
