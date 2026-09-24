import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSettings } from "../../services/settingService";

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
    roles: ["admin", "manager"],
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
    label: "Receivables",
    path: "/receivables",
    roles: ["admin", "manager"],
  },
  {
    label: "Approval Requests",
    path: "/approval-requests",
    roles: ["admin", "manager"],
  },
  {
    label: "Reports",
    path: "/reports",
    roles: ["admin", "manager"],
  },
  {
    label: "Settings",
    path: "/settings",
    roles: ["admin"],
  },
];

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function PosIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="15" rx="2" />
      <path d="M7 8h4M7 12h2M14 8h3M14 12h3" />
      <path d="M8 19v2M16 19v2M6 21h12" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SuppliersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 20h18" />
      <path d="M5 20V9l7-5 7 5v11" />
      <path d="M8 12h2M14 12h2M8 16h2M14 16h2" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M17 11a3.5 3.5 0 1 0-1.2-6.8M21 20v-1.5a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function PurchasesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M14 4v6M11 7h6" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4.5 7.8 12 12l7.5-4.2M12 12v9" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 5-6" />
      <path d="M16 7h3v3" />
    </svg>
  );
}

function ReceivablesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
      <path d="M16 13v4M14 15h4" />
    </svg>
  );
}

function ApprovalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 20V10M12 20V4M19 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.5 1.5-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.12v-.4a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.5-1.5.06-.06A1.7 1.7 0 0 0 9.14 15a1.7 1.7 0 0 0-1.56-1.03H7.2v-2.12h.38a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.5-1.5.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5.8h2.12v.42a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.5 1.5-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.4v2.12h-.4A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

function getMenuIcon(label: string) {
  switch (label) {
    case "Dashboard":
      return <DashboardIcon />;
    case "POS":
      return <PosIcon />;
    case "Products":
      return <ProductsIcon />;
    case "Categories":
      return <CategoriesIcon />;
    case "Suppliers":
      return <SuppliersIcon />;
    case "Customers":
      return <CustomersIcon />;
    case "Purchases":
      return <PurchasesIcon />;
    case "Inventory":
      return <InventoryIcon />;
    case "Sales":
      return <SalesIcon />;
    case "Receivables":
      return <ReceivablesIcon />;
    case "Approval Requests":
      return <ApprovalIcon />;
    case "Reports":
      return <ReportsIcon />;
    case "Settings":
      return <SettingsIcon />;
    default:
      return <DashboardIcon />;
  }
}

function getIconStyle(label: string) {
  switch (label) {
    case "Dashboard":
      return "bg-sky-50 text-sky-600";
    case "POS":
      return "bg-violet-50 text-violet-600";
    case "Products":
      return "bg-emerald-50 text-emerald-600";
    case "Categories":
      return "bg-amber-50 text-amber-600";
    case "Suppliers":
      return "bg-orange-50 text-orange-600";
    case "Customers":
      return "bg-pink-50 text-pink-600";
    case "Purchases":
      return "bg-cyan-50 text-cyan-600";
    case "Inventory":
      return "bg-indigo-50 text-indigo-600";
    case "Sales":
      return "bg-green-50 text-green-600";
    case "Receivables":
      return "bg-yellow-50 text-yellow-600";
    case "Approval Requests":
      return "bg-rose-50 text-rose-600";
    case "Reports":
      return "bg-blue-50 text-blue-600";
    case "Settings":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Sidebar() {
  const { user } = useAuth();

  const [businessName, setBusinessName] = useState("iPOS");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await getSettings();

        setBusinessName(response.data.business_name?.trim() || "iPOS");
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    void loadSettings();
  }, []);

  const visibleItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
            {businessName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h1
              className="truncate text-base font-bold tracking-tight text-slate-900"
              title={businessName}
            >
              {businessName}
            </h1>

            <p className="text-[11px] font-medium text-slate-400">
              Point of Sale
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Main Menu
          </p>
        </div>

        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `group flex min-h-9.5 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100"
                          : `${getIconStyle(item.label)} group-hover:scale-105`
                      }`}
                    >
                      {getMenuIcon(item.label)}
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom area */}
      <div className="shrink-0 border-t border-slate-100 px-4 py-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="truncate text-[11px] font-semibold text-slate-500">
            iPOS Local POS
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            Business Management System
          </p>
        </div>
      </div>
    </aside>
  );
}
