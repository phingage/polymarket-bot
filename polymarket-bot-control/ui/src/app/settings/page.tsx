'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import LoginForm from '@/components/LoginForm'

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

      {/* Placeholder content */}
      <div className="card-enhanced p-12 text-center">
        <div 
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{backgroundColor: 'var(--secondary-light)'}}
        >
          <span className="text-3xl">⚙️</span>
        </div>
        <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--foreground)'}}>
          Settings Panel Coming Soon
        </h3>
        <p className="text-base max-w-md mx-auto" style={{color: 'var(--foreground-muted)'}}>
          This section will allow you to customize bot behavior, set trading parameters, manage API keys, and configure system preferences.
        </p>
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