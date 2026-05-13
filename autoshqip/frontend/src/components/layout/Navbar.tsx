'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Car, Menu, X, User, LogOut, Plus, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600 text-xl">
          <Car size={24} />
          AutoShqip
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/cars" className="text-gray-600 hover:text-gray-900 font-medium">Makina</Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Çmimet</Link>
          {user ? (
            <>
              <Link href="/cars/new" className="btn-primary flex items-center gap-1">
                <Plus size={16} /> Posto
              </Link>
              <div className="relative">
                <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name[0].toUpperCase()}
                  </div>
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.creditBalance.toFixed(2)}€ kredite</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenu(false)}>
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link href="/dashboard/referral" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenu(false)}>
                      <User size={14} /> Referalët
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-600" onClick={() => setUserMenu(false)}>
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-red-600">
                      <LogOut size={14} /> Dil
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">Hyr</Link>
              <Link href="/register" className="btn-primary">Regjistrohu</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-3">
          <Link href="/cars" className="py-2 font-medium" onClick={() => setOpen(false)}>Makina</Link>
          <Link href="/pricing" className="py-2 font-medium" onClick={() => setOpen(false)}>Çmimet</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="py-2 font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/cars/new" className="btn-primary text-center" onClick={() => setOpen(false)}>+ Posto Njoftim</Link>
              <button onClick={logout} className="text-red-600 py-2 text-left font-medium">Dil</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-center" onClick={() => setOpen(false)}>Hyr</Link>
              <Link href="/register" className="btn-primary text-center" onClick={() => setOpen(false)}>Regjistrohu</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
