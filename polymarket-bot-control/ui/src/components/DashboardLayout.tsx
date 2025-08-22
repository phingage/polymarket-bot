'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import BrandLogo from './BrandLogo'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const menuItems: MenuItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Markets', href: '/markets', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden" style={{backgroundColor: 'var(--background)'}}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sidebar-enhanced transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b" style={{borderColor: 'var(--sidebar-border)'}}>
          <div className="animate-slide-in">
            <BrandLogo variant="full" size="sm" theme="sidebar" />
          </div>
          <button
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10 focus:bg-white focus:bg-opacity-20"
            style={{color: 'var(--sidebar-text)'}}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-item-enhanced flex items-center space-x-3 px-4 py-3 text-sm font-semibold animate-fade-in ${
                  isActive ? 'active' : ''
                }`}
                style={{animationDelay: `${index * 50}ms`}}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 p-4 border-t" style={{borderColor: 'var(--sidebar-border)'}}>
          <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl transition-colors hover:bg-white hover:bg-opacity-5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm"
              style={{backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)'}}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{color: 'var(--sidebar-text)'}}>
                {user?.username}
              </p>
              <p className="text-xs truncate" style={{color: 'var(--sidebar-text-muted)'}}>
                Administrator
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-item-enhanced flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div 
          className="flex-shrink-0 border-b backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden p-2 rounded-lg transition-all duration-200 hover:bg-opacity-10 focus:bg-opacity-20"
                style={{color: 'var(--foreground)', ':hover': {backgroundColor: 'var(--gray-100)'}}}
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-100)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="animate-fade-in">
                <h1 className="text-xl font-bold" style={{color: 'var(--foreground)'}}>
                  PolyBot Dashboard
                </h1>
                <p className="text-xs" style={{color: 'var(--foreground-muted)'}}>
                  Trading Control Panel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium hidden sm:inline" style={{color: 'var(--foreground-muted)'}}>
                Welcome back, {user?.username}
              </span>
              <div 
                className="w-9 h-9 rounded-xl lg:hidden flex items-center justify-center font-semibold text-sm"
                style={{backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)'}}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main 
          className="flex-1 p-4 lg:p-8 overflow-y-auto animate-fade-in"
          style={{backgroundColor: 'var(--background)'}}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
