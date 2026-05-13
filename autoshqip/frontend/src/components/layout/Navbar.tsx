'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Car, Menu, X, LogOut, Plus, LayoutDashboard, MessageCircle, Shield } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`font-medium transition-colors ${pathname.startsWith(href) ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600 text-xl flex-shrink-0">
          <Car size={22} />
          <span>AutoShqip</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLink('/cars', 'Makina')}
          {navLink('/pricing', 'Çmimet')}
          {user && navLink('/messages', 'Mesazhet')}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/cars/new" className="btn-primary gap-1.5 text-sm">
                <Plus size={15} /> Posto
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email ?? ''}</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{(user.creditBalance ?? 0).toFixed(2)}€ kredite</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link href="/messages" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <MessageCircle size={14} /> Mesazhet
                    </Link>
                    <Link href="/dashboard/referral" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <span className="w-3.5 h-3.5 text-center text-xs">€</span> Referalët
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <Shield size={14} /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full"
                      >
                        <LogOut size={14} /> Dil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm">Hyr</Link>
              <Link href="/register" className="btn-primary text-sm">Regjistrohu</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-1">
          <Link href="/cars" className="py-3 px-2 font-medium text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-3">
            <Car size={18} className="text-gray-400" /> Makina
          </Link>
          <Link href="/pricing" className="py-3 px-2 font-medium text-gray-700 rounded-lg hover:bg-gray-50">
            Çmimet
          </Link>
          {user ? (
            <>
              <Link href="/messages" className="py-3 px-2 font-medium text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-3">
                <MessageCircle size={18} className="text-gray-400" /> Mesazhet
              </Link>
              <Link href="/dashboard" className="py-3 px-2 font-medium text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-3">
                <LayoutDashboard size={18} className="text-gray-400" /> Dashboard
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="py-3 px-2 font-medium text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-3">
                  <Shield size={18} className="text-red-400" /> Admin Panel
                </Link>
              )}
              <div className="pt-2 border-t mt-2 flex flex-col gap-2">
                <Link href="/cars/new" className="btn-primary text-center py-3">
                  + Posto Njoftim
                </Link>
                <button onClick={logout} className="text-red-500 py-2.5 px-2 text-left font-medium text-sm flex items-center gap-2">
                  <LogOut size={16} /> Dil nga llogaria
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t mt-2 flex flex-col gap-2">
              <Link href="/login" className="btn-secondary text-center py-3">Hyr</Link>
              <Link href="/register" className="btn-primary text-center py-3">Regjistrohu</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
