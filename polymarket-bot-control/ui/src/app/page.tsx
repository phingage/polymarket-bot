'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import LoginForm from '@/components/LoginForm'
import { ArrowTrendingUpIcon, BanknotesIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline'

// Componente per le statistiche della dashboard
function StatsCard({ title, value, icon: Icon, trend }: {
  title: string
  value: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  trend?: { value: string; isPositive: boolean }
}) {
  return (
    <div className="stats-card overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
        {trend && (
          <div className="mt-3">
            <div className={`flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <ArrowTrendingUpIcon
                className={`h-4 w-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`}
              />
              {trend.value}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente per gli activity log
function RecentActivity() {
  const activities = [
    { id: 1, action: 'Bot started trading', time: '2 minutes ago', status: 'success' },
    { id: 2, action: 'Market position opened', time: '5 minutes ago', status: 'info' },
    { id: 3, action: 'Profit realized', time: '10 minutes ago', status: 'success' },
    { id: 4, action: 'Risk threshold adjusted', time: '15 minutes ago', status: 'warning' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'info': return 'status-info'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="stats-card shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${getStatusColor(activity.status).split(' ')[1]}`} />
                <span className="text-sm text-gray-900">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="text-sm text-link hover:text-link transition-colors">
            View all activities →
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente principale della Home page
function HomePage() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your Polymarket bot performance and activities
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 space-y-5 sm:grid-cols-2 lg:grid-cols-4 sm:space-y-0 sm:space-x-5">
        <StatsCard
          title="Active Bots"
          value="3"
          icon={ChartBarIcon}
          trend={{ value: "+2 from yesterday", isPositive: true }}
        />
        <StatsCard
          title="Total Profit"
          value="$1,234.56"
          icon={BanknotesIcon}
          trend={{ value: "+12.5% from last week", isPositive: true }}
        />
        <StatsCard
          title="Open Positions"
          value="8"
          icon={ArrowTrendingUpIcon}
          trend={{ value: "-2 from yesterday", isPositive: false }}
        />
        <StatsCard
          title="Uptime"
          value="99.8%"
          icon={ClockIcon}
          trend={{ value: "+0.2% from last month", isPositive: true }}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 space-y-6 lg:grid-cols-2 lg:space-y-0 lg:space-x-6">
        {/* Chart placeholder */}
        <div className="stats-card shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Performance Chart
            </h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Chart coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <RecentActivity />
      </div>

      {/* Quick actions */}
      <div className="stats-card shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 space-y-4 sm:grid-cols-3 sm:space-y-0 sm:space-x-4">
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
              Start Bot
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
              View Positions
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
              Generate Report
            </button>
          </div>
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
