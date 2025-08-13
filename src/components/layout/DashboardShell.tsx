'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/ui/sidebar'
import { Header } from '@/components/ui/header'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start collapsed

  return (
    <div className="h-screen bg-bg flex overflow-hidden">
      {/* Sidebar - Fixed height, no scroll */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar />
      </div>

      {/* Main content - Fixed height with scroll */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Fixed at top */}
        <Header />
        
        {/* Main content area - Scrollable */}
        <main className={`flex-1 overflow-y-auto p-6 ${className}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-lg"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
