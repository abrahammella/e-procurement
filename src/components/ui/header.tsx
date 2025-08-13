'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Bell, 
  Clock,
  ChevronRight,
  Home
} from 'lucide-react'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    // Add home
    breadcrumbs.push({ name: 'Home', href: '/', icon: Home })
    
    // Add other segments
    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      const name = segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ name, href })
    })
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumbs */}
        <div className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center space-x-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              <a
                href={breadcrumb.href}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                  index === breadcrumbs.length - 1
                    ? 'text-navy-900 font-medium bg-navy-50'
                    : 'text-gray-600 hover:text-navy-700 hover:bg-gray-50'
                }`}
              >
                {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
                <span>{breadcrumb.name}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Right side - Search, Actions, User */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documents and projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
            />
          </div>

          {/* Time Tracker Button */}
          <Button className="bg-navy-600 hover:bg-navy-700 text-white">
            <Clock className="h-4 w-4 mr-2" />
            Time Tracker
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-navy-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">AU</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
