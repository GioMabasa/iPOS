import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left: iPOS Branding */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-sm">
          <span className="text-sm font-extrabold tracking-tight text-white">
            i
          </span>
        </div>

        <div className="leading-tight">
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            iPOS
          </h2>

          <p className="text-[11px] font-medium text-slate-500">
            Integrated Point of Sale & Inventory System | Developed by
            GioTechWorks
          </p>
        </div>
      </div>

      {/* Right: User + Logout */}
      <div className="flex items-center gap-4">
        {/* User Information */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
            <span className="text-sm font-bold text-indigo-600">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>

          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-slate-800">
              {user?.name ?? "User"}
            </p>

            <p className="mt-0.5 text-[11px] font-medium capitalize text-slate-500">
              {user?.role ?? ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 12h9m0 0l-3-3m3 3l-3 3"
            />
          </svg>

          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
