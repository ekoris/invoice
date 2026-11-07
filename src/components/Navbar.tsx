"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, Settings, Plus, Building2 } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Daftar Invoice", icon: FileText },
    { href: "/clients", label: "Pelanggan", icon: Users },
    { href: "/settings", label: "Pengaturan & Bank", icon: Settings },
  ];

  return (
    <nav className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-lg tracking-tight leading-tight">
                  Lingkara<span className="text-indigo-600">Invoice</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">Sistem Faktur & Penagihan</span>
              </div>
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/invoices/new"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm shadow-indigo-200 hover:shadow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Invoice Baru</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
