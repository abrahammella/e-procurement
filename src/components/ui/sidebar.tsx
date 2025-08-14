'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  FileText, 
  ClipboardList, 
  Users, 
  FileCheck, 
  Receipt, 
  Settings,
  Menu,
  ChevronRight,
  Building2,
  CheckCircle,
  FolderOpen,
  Bell
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Licitaciones', href: '/tenders', icon: FileText },
  { name: 'RFPs', href: '/rfp', icon: FolderOpen },
  { name: 'Proveedores', href: '/suppliers', icon: Users },
  { name: 'Propuestas', href: '/proposals', icon: FileCheck },
  { name: 'Aprobaciones', href: '/approvals', icon: CheckCircle },
  { name: 'Service Orders', href: '/service-orders', icon: ClipboardList },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true) // Start collapsed
  const pathname = usePathname()

  return (
    <div className={`bg-navy-900 text-white h-screen flex flex-col transition-all duration-300 flex-shrink-0 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-navy-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-navy-700 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">EP</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-navy-300 hover:text-white hover:bg-navy-800"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation - Scrollable if needed */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-navy-700 text-white shadow-lg'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${
                isActive ? 'text-white' : 'text-navy-400 group-hover:text-white'
              }`} />
              {!isCollapsed && (
                <span className={`font-medium ${
                  isActive ? 'text-white' : 'text-navy-300 group-hover:text-white'
                }`}>
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-navy-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-navy-700 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-navy-400 truncate">admin@eprocurement.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
