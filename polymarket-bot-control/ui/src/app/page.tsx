'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import LoginForm from '@/components/LoginForm'
import { ArrowTrendingUpIcon, BanknotesIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline'

// Componente per le statistiche della dashboard
function StatsCard({ title, value, icon: Icon, trend, index }: {
  title: string
  value: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  trend?: { value: string; isPositive: boolean }
  index?: number
}) {
  return (
    <div 
      className="card-enhanced p-6 animate-fade-in"
      style={{animationDelay: `${(index || 0) * 100}ms`}}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="p-3 rounded-xl"
          style={{
            backgroundColor: index === 0 ? 'var(--primary-light)' :
                           index === 1 ? 'var(--success-light)' :
                           index === 2 ? 'var(--info-light)' :
                           'var(--secondary-light)'
          }}
        >
          <Icon 
            className="h-6 w-6" 
            style={{
              color: index === 0 ? 'var(--primary)' :
                     index === 1 ? 'var(--success)' :
                     index === 2 ? 'var(--info)' :
                     'var(--secondary)'
            }} 
          />
        </div>
        {trend && (
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            trend.isPositive ? 'status-success' : 'status-error'
          }`}>
            <ArrowTrendingUpIcon
              className={`h-3 w-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`}
            />
            {trend.value}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{color: 'var(--foreground-muted)'}}>
          {title}
        </h3>
        <p className="text-2xl font-bold" style={{color: 'var(--foreground)'}}>
          {value}
        </p>
      </div>
    </div>
  )
}

// Componente per gli activity log
function RecentActivity() {
  const activities = [
    { id: 1, action: 'Bot started trading', time: '2 minutes ago', status: 'success', icon: '🤖' },
    { id: 2, action: 'Market position opened', time: '5 minutes ago', status: 'info', icon: '📈' },
    { id: 3, action: 'Profit realized', time: '10 minutes ago', status: 'success', icon: '💰' },
    { id: 4, action: 'Risk threshold adjusted', time: '15 minutes ago', status: 'warning', icon: '⚠️' },
  ]

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success': return { backgroundColor: 'var(--success-light)', color: 'var(--success)' }
      case 'warning': return { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }
      case 'info': return { backgroundColor: 'var(--info-light)', color: 'var(--info)' }
      default: return { backgroundColor: 'var(--gray-200)', color: 'var(--gray-700)' }
    }
  }

  return (
    <div className="card-enhanced p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{color: 'var(--foreground)'}}>
          Recent Activity
        </h3>
        <div 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{backgroundColor: 'var(--success)'}}
          title="Live updates"
        ></div>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02] animate-slide-in"
            style={{
              backgroundColor: 'var(--background-alt)',
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                style={getStatusStyle(activity.status)}
              >
                {activity.icon}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{color: 'var(--foreground)'}}>
                  {activity.action}
                </p>
                <p className="text-xs" style={{color: 'var(--foreground-muted)'}}>
                  {activity.time}
                </p>
              </div>
            </div>
            <div 
              className="w-2 h-2 rounded-full"
              style={getStatusStyle(activity.status)}
            ></div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button 
          className="btn-secondary-enhanced text-sm px-4 py-2"
          style={{width: '100%'}}
        >
          View All Activities
        </button>
      </div>
    </div>
  )
}

// Componente principale della Home page
function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="text-center lg:text-left animate-fade-in">
        <div className="mb-4">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3" style={{color: 'var(--foreground)'}}>
            Dashboard Overview
          </h1>
          <div className="w-24 h-1 mx-auto lg:mx-0 rounded-full" style={{backgroundColor: 'var(--primary)'}}></div>
        </div>
        <p className="text-lg max-w-2xl mx-auto lg:mx-0" style={{color: 'var(--foreground-muted)'}}>
          Monitor your Polymarket bot performance, analyze market trends, and optimize your trading strategies in real-time.
        </p>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatsCard
          title="Active Bots"
          value="3"
          icon={ChartBarIcon}
          trend={{ value: "+2 today", isPositive: true }}
          index={0}
        />
        <StatsCard
          title="Total Profit"
          value="$1,234.56"
          icon={BanknotesIcon}
          trend={{ value: "+12.5% week", isPositive: true }}
          index={1}
        />
        <StatsCard
          title="Open Positions"
          value="8"
          icon={ArrowTrendingUpIcon}
          trend={{ value: "-2 today", isPositive: false }}
          index={2}
        />
        <StatsCard
          title="System Uptime"
          value="99.8%"
          icon={ClockIcon}
          trend={{ value: "+0.2% month", isPositive: true }}
          index={3}
        />
      </div>

      {/* Main content grid */}
      <div className="grid-spacing">
        {/* Performance Chart */}
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{color: 'var(--foreground)'}}>
              Performance Overview
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'var(--success)'}}></div>
              <span className="text-sm font-medium" style={{color: 'var(--success)'}}>Live</span>
            </div>
          </div>
          
          <div 
            className="h-64 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{backgroundColor: 'var(--background-alt)'}}
          >
            <div className="text-center z-10">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{backgroundColor: 'var(--info-light)'}}
              >
                <ChartBarIcon className="h-8 w-8" style={{color: 'var(--info)'}} />
              </div>
              <h4 className="text-lg font-semibold mb-2" style={{color: 'var(--foreground)'}}>
                Advanced Analytics
              </h4>
              <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
                Interactive charts and detailed performance metrics coming soon
              </p>
            </div>
            
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t" style={{background: 'linear-gradient(to top, var(--primary), transparent)'}}></div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <RecentActivity />
      </div>

      {/* Quick actions */}
      <div className="card-enhanced p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2" style={{color: 'var(--foreground)'}}>
            Quick Actions
          </h3>
          <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
            Take immediate control of your trading operations
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button className="btn-primary-enhanced p-4 text-center group">
            <div className="mb-2">
              <div 
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{backgroundColor: 'var(--primary-foreground)', opacity: 0.2}}
              >
                ▶️
              </div>
            </div>
            <span className="font-semibold">Start Bot</span>
            <p className="text-xs mt-1 opacity-90">Launch automated trading</p>
          </button>
          
          <button className="btn-secondary-enhanced p-4 text-center group">
            <div className="mb-2">
              <div 
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{backgroundColor: 'var(--info-light)'}}
              >
                📊
              </div>
            </div>
            <span className="font-semibold">View Positions</span>
            <p className="text-xs mt-1 opacity-75">Monitor current trades</p>
          </button>
          
          <button className="btn-secondary-enhanced p-4 text-center group">
            <div className="mb-2">
              <div 
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{backgroundColor: 'var(--secondary-light)'}}
              >
                📈
              </div>
            </div>
            <span className="font-semibold">Generate Report</span>
            <p className="text-xs mt-1 opacity-75">Export performance data</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 loading-spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <HomePage />
    </DashboardLayout>
  )
}
