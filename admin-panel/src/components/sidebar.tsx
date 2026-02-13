"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Store,
  FileText,
  Mail,
  Settings,
  LogOut,
  Search,
  Shield,
  Menu,
  X,
  Globe,
  Receipt,
  Building2,
  Activity,
  Megaphone,
  Users,
} from "lucide-react"
import { useState, useEffect } from "react"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

const NavItem = ({ href, icon, label, active, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95",
      active
        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
)

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/app/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      })
      window.location.href = "/app/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/app/login"
    }
  }

  const isActive = (path: string) => pathname.startsWith(path)

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const closeSidebar = () => setIsOpen(false)

  const navContent = (
    <>
      {/* Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            CC
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">CarphaCom</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
          active={pathname === "/dashboard" || pathname === "/"}
          onClick={closeSidebar}
        />

        <NavItem
          href="/magazin"
          icon={<Store className="w-5 h-5" />}
          label="Store"
          active={isActive("/magazin")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/cms"
          icon={<FileText className="w-5 h-5" />}
          label="CMS"
          active={isActive("/cms")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/marketing"
          icon={<Mail className="w-5 h-5" />}
          label="Marketing"
          active={isActive("/marketing")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/seo"
          icon={<Search className="w-5 h-5" />}
          label="SEO"
          active={isActive("/seo")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/securitate"
          icon={<Shield className="w-5 h-5" />}
          label="Security"
          active={isActive("/securitate")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/google"
          icon={<Globe className="w-5 h-5" />}
          label="Google"
          active={isActive("/google") && !isActive("/google/ads")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/google/ads"
          icon={<Megaphone className="w-5 h-5" />}
          label="Google Ads"
          active={isActive("/google/ads")}
          onClick={closeSidebar}
        />

        <NavItem
          href="/facturare"
          icon={<Receipt className="w-5 h-5" />}
          label="Invoicing"
          active={isActive("/facturare") || isActive("/firma")}
          onClick={closeSidebar}
        />

        <div className="pt-4 mt-4 border-t border-gray-800">
          <NavItem
            href="/utilizatori"
            icon={<Users className="w-5 h-5" />}
            label="Users"
            active={isActive("/utilizatori")}
            onClick={closeSidebar}
          />
          <NavItem
            href="/logs"
            icon={<Activity className="w-5 h-5" />}
            label="Logs"
            active={isActive("/logs")}
            onClick={closeSidebar}
          />
          <NavItem
            href="/settings"
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={isActive("/settings")}
            onClick={closeSidebar}
          />
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-gray-400">admin@example.com</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 transition-colors p-2"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-400 hover:text-white rounded-lg -ml-2"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            CC
          </div>
          <span className="font-bold text-white">CarphaCom</span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 min-h-screen flex-col fixed left-0 top-0 bottom-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeSidebar}
        />
        
        {/* Sidebar Drawer */}
        <aside 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-gray-900 flex flex-col transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {navContent}
        </aside>
      </div>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg"
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}
