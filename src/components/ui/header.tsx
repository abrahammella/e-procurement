'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Menu,
  Building2,
  Clock,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const pathname = usePathname()
  const { user, signOut, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs = segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      return { href, label }
    })
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

  const handleSignOut = async () => {
    const success = await signOut()
    if (success) {
      // Redirect will be handled by middleware
      window.location.href = '/login'
    }
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumbs and Search */}
        <div className="flex items-center space-x-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">E-Procurement</span>
            {breadcrumbs.length > 0 && (
              <>
                <span className="text-gray-400">/</span>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    <a
                      href={crumb.href}
                      className={`hover:text-navy-600 transition-colors ${
                        index === breadcrumbs.length - 1 
                          ? 'text-navy-700 font-medium' 
                          : 'text-gray-600'
                      }`}
                    >
                      {crumb.label}
                    </a>
                    {index < breadcrumbs.length - 1 && (
                      <span className="text-gray-400">/</span>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </nav>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
            />
          </div>
        </div>

        {/* Right side - User Info and Actions */}
        <div className="flex items-center space-x-4">
          {/* Time Tracker */}
          <Button variant="outline" size="sm" className="border-navy-200 text-navy-700 hover:bg-navy-50">
            <Clock className="h-4 w-4 mr-2" />
            Time Tracker
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <Button
                variant="ghost"
                onClick={toggleUserMenu}
                className="flex items-center space-x-3 hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.user_metadata?.role === 'admin' ? 'Administrador' : 'Proveedor'}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </Button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || 'Usuario'}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Mi Perfil
                  </a>
                  
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configuración
                  </a>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">No autenticado</p>
                <p className="text-xs text-gray-500">Inicia sesión</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}
