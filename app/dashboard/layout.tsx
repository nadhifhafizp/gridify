"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Settings, LogOut, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "My Tournaments", icon: Trophy, href: "/dashboard/tournaments" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] opacity-30"></div>
      </div>

      {/* SIDEBAR */}
      {/* Perbaikan: flex-shrink-0 -> shrink-0 */}
      <aside className="w-64 relative z-10 shrink-0 border-r border-white/5 bg-slate-900/30 backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Logo Area */}
          <div className="p-6 flex items-center gap-3">
            {/* Perbaikan: bg-gradient-to-br -> bg-linear-to-br */}
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-lg">G</span>
            </div>
            {/* Perbaikan: bg-gradient-to-r -> bg-linear-to-r */}
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
              Gridify
            </span>
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-1 mt-6">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.1)] border border-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={
                      isActive
                        ? "text-indigo-400"
                        : "text-slate-500 group-hover:text-white transition-colors"
                    }
                  />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Create Button & Logout */}
        <div className="p-4 space-y-4">
          <Link
            href="/dashboard/create"
            // Perbaikan: bg-gradient-to-r -> bg-linear-to-r
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>New Tournament</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut
              size={20}
              className="group-hover:text-red-400 transition-colors"
            />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT SCROLLABLE AREA */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
