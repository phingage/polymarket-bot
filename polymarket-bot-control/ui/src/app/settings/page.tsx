'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import LoginForm from '@/components/LoginForm'
import ServiceStatusWidget from '@/components/ServiceStatusWidget'

// Componente principale della pagina Settings
function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{color: 'var(--foreground)'}}>
          Settings
        </h1>
        <p className="text-lg" style={{color: 'var(--foreground-muted)'}}>
          Configure your trading bot preferences, account settings, and system parameters
        </p>
      </div>

      {/* Grid layout for sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Management Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold" style={{color: 'var(--foreground)'}}>Service Management</h2>
          <ServiceStatusWidget />
        </div>

        {/* Application Settings Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold" style={{color: 'var(--foreground)'}}>Application Settings</h2>
          <div className="card-enhanced p-6">
            <h3 className="text-lg font-semibold mb-3" style={{color: 'var(--foreground)'}}>
              Configuration
            </h3>
            <p className="text-sm mb-4" style={{color: 'var(--foreground-muted)'}}>
              Configure your application preferences and settings.
            </p>
            <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
              Additional settings coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--background)'}}>
        <div className="text-center animate-fade-in">
          <div className="loading-spinner-enhanced mb-6" style={{width: '48px', height: '48px', margin: '0 auto'}}></div>
          <h2 className="text-xl font-semibold mb-2" style={{color: 'var(--foreground)'}}>Loading Application...</h2>
          <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>Please wait while we prepare everything for you</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  )
}