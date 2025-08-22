'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import LoginForm from '@/components/LoginForm'
import { useState, useEffect } from 'react'
import Link from 'next/link'


// Widget per i mercati monitorati
function MonitoredMarketsWidget() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const fetchMonitoredMarkets = async () => {
    if (!token) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/markets/monitored?limit=8`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMarkets(data)
      }
    } catch (error) {
      console.error('Error fetching monitored markets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoredMarkets()
  }, [token])

  const formatReward = (value) => {
    const num = parseFloat(value)
    return isNaN(num) ? '$0' : `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  const getStatusBadge = (market) => {
    if (market.archived) return <span className="status-badge" style={{backgroundColor: 'var(--gray-200)', color: 'var(--gray-700)'}}>Archived</span>
    if (market.closed) return <span className="status-badge status-error">Closed</span>
    if (market.active) return <span className="status-badge status-success">Active</span>
    return <span className="status-badge status-warning">Inactive</span>
  }

  return (
    <div className="card-enhanced p-6 col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1" style={{color: 'var(--foreground)'}}>
            📊 Monitored Markets
          </h3>
          <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
            Markets currently being tracked
          </p>
        </div>
        <Link 
          href="/markets" 
          className="btn-secondary-enhanced text-sm px-4 py-2"
        >
          Manage All
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="skeleton w-4 h-4 rounded"></div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-48"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
              <div className="skeleton h-6 w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {markets.map((market, index) => (
            <div 
              key={market.id}
              className="flex items-center justify-between p-3 rounded-lg transition-all hover:bg-opacity-50 animate-fade-in"
              style={{
                backgroundColor: 'var(--background-alt)',
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-semibold text-sm truncate" 
                    style={{color: 'var(--foreground)'}} 
                    title={market.question}
                  >
                    {market.question}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(market)}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-4">
                <div 
                  className="font-bold text-base"
                  style={{color: 'var(--success)'}}
                >
                  {formatReward(market.reward)}
                </div>
                <div 
                  className="text-xs"
                  style={{color: 'var(--foreground-muted)'}}
                >
                  daily
                </div>
              </div>
            </div>
          ))}

          {markets.length === 0 && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{backgroundColor: 'var(--info-light)'}}
              >
                📊
              </div>
              <p className="font-medium mb-2" style={{color: 'var(--foreground)'}}>
                No monitored markets
              </p>
              <p className="text-sm mb-4" style={{color: 'var(--foreground-muted)'}}>
                Go to the Markets page to start monitoring markets
              </p>
              <Link 
                href="/markets" 
                className="btn-primary-enhanced text-sm px-4 py-2"
              >
                Browse Markets
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Widget per i top 10 mercati con reward più alta
function TopRewardsWidget() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const fetchTopMarkets = async () => {
    if (!token) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/markets/top?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMarkets(data)
      }
    } catch (error) {
      console.error('Error fetching markets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopMarkets()
  }, [token])

  const formatReward = (value) => {
    const num = parseFloat(value)
    return isNaN(num) ? '$0' : `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  const getStatusBadge = (market) => {
    if (market.archived) return <span className="status-badge" style={{backgroundColor: 'var(--gray-200)', color: 'var(--gray-700)'}}>Archived</span>
    if (market.closed) return <span className="status-badge status-error">Closed</span>
    if (market.active) return <span className="status-badge status-success">Active</span>
    return <span className="status-badge status-warning">Inactive</span>
  }

  return (
    <div className="card-enhanced p-6 col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1" style={{color: 'var(--foreground)'}}>
            🏆 Top Rewards
          </h3>
          <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
            Markets with highest daily rewards
          </p>
        </div>
        <Link 
          href="/markets" 
          className="btn-secondary-enhanced text-sm px-4 py-2"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-48"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
              <div className="skeleton h-6 w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {markets.map((market, index) => (
            <div 
              key={market.id}
              className="flex items-center justify-between p-3 rounded-lg transition-all hover:bg-opacity-50 animate-fade-in"
              style={{
                backgroundColor: 'var(--background-alt)',
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: index < 3 ? 'var(--primary-light)' : 'var(--secondary-light)',
                    color: index < 3 ? 'var(--primary)' : 'var(--secondary)'
                  }}
                >
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-semibold text-sm truncate" 
                    style={{color: 'var(--foreground)'}} 
                    title={market.question}
                  >
                    {market.question}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(market)}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-4">
                <div 
                  className="font-bold text-lg"
                  style={{color: 'var(--success)'}}
                >
                  {formatReward(market.reward)}
                </div>
                <div 
                  className="text-xs"
                  style={{color: 'var(--foreground-muted)'}}
                >
                  daily
                </div>
              </div>
            </div>
          ))}

          {markets.length === 0 && (
            <div className="text-center py-8">
              <p style={{color: 'var(--foreground-muted)'}}>
                No markets available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente principale della Home page
function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="text-center animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{color: 'var(--foreground)'}}>
            PolyBot Dashboard
          </h1>
          <div className="w-24 h-1 mx-auto rounded-full mb-4" style={{backgroundColor: 'var(--primary)'}}></div>
        </div>
        <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--foreground-muted)'}}>
          Welcome to your Polymarket trading bot control center
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monitored Markets Widget - 2x1 */}
        <MonitoredMarketsWidget />
        
        {/* Top Rewards Widget - 2x1 */}
        <TopRewardsWidget />
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
