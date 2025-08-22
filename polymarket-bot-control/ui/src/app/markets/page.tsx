'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import LoginForm from '@/components/LoginForm'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface Market {
  id: string
  question: string
  reward: string
  minSize: string
  maxSpread: string
  spread: string
  endDate: string
  volume: string
  liquidity: string
  active: boolean
  closed: boolean
  archived: boolean
  slug: string
  description: string
  outcomes: string[]
  outcomePrices: string[]
}

interface SortConfig {
  key: keyof Market | null
  direction: 'asc' | 'desc'
}

function MarketsTable() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'archived'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const { user, token } = useAuth()

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato')
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002'}/api/markets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token di autenticazione non valido. Effettua nuovamente il login.')
        } else if (response.status === 403) {
          throw new Error('Non hai i permessi per accedere ai mercati')
        }
        throw new Error(`Errore nel caricamento dei mercati (${response.status})`)
      }

      const data = await response.json()
      setMarkets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && token) {
      fetchMarkets()
    }
  }, [user, token])

  const handleSort = (key: keyof Market) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Reset current page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filter])

  const filteredAndSortedMarkets = markets
    .filter(market => {
      const matchesSearch = market.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           market.slug.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filter === 'all' || 
                           (filter === 'active' && market.active) ||
                           (filter === 'closed' && market.closed) ||
                           (filter === 'archived' && market.archived)
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0

      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue)
        return sortConfig.direction === 'asc' ? result : -result
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue
        return sortConfig.direction === 'asc' ? result : -result
      }

      return 0
    })

  // Calculate pagination
  const totalItems = filteredAndSortedMarkets.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageItems = filteredAndSortedMarkets.slice(startIndex, endIndex)

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return isNaN(num) ? '$0' : `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  const formatReward = (value: string) => {
    const num = parseFloat(value)
    return isNaN(num) ? '$0' : `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  const formatDecimal = (value: string) => {
    const num = parseFloat(value)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const formatShares = (value: string) => {
    const num = parseInt(value)
    return isNaN(num) ? '0' : num.toLocaleString('en-US')
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT')
    } catch {
      return 'N/A'
    }
  }

  const getStatusBadge = (market: Market) => {
    if (market.archived) return <span className="status-badge" style={{backgroundColor: 'var(--gray-200)', color: 'var(--gray-700)'}}>Archived</span>
    if (market.closed) return <span className="status-badge status-error">Closed</span>
    if (market.active) return <span className="status-badge status-success">Active</span>
    return <span className="status-badge status-warning">Inactive</span>
  }

  const getSortIcon = (key: keyof Market) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4" /> : 
      <ArrowDownIcon className="h-4 w-4" />
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }

  const getVisiblePages = () => {
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="loading-spinner-enhanced"></div>
        <div className="text-center">
          <p className="font-semibold" style={{color: 'var(--foreground)'}}>Loading markets...</p>
          <p className="text-sm mt-1" style={{color: 'var(--foreground-muted)'}}>Please wait while we fetch the latest data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-enhanced p-8 text-center animate-fade-in">
        <div className="mb-6">
          <div 
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{backgroundColor: 'var(--error-light)'}}
          >
            <svg className="w-8 h-8" style={{color: 'var(--error)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--error)'}}>Failed to load markets</h3>
          <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>{error}</p>
        </div>
        <button 
          onClick={fetchMarkets}
          className="btn-primary-enhanced"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{color: 'var(--foreground)'}}>
          Trading Markets
        </h1>
        <p className="text-lg" style={{color: 'var(--foreground-muted)'}}>
          Monitor and analyze Polymarket trading opportunities in real-time
        </p>
      </div>

      {/* Filters and Search */}
      <div className="card-enhanced p-6">
        <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2" style={{color: 'var(--foreground)'}}>
              Search Markets
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by question or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-enhanced pl-4 pr-12"
              />
              <MagnifyingGlassIcon 
                className="h-5 w-5 absolute right-4 top-1/2 transform -translate-y-1/2" 
                style={{color: 'var(--foreground-muted)'}} 
              />
            </div>
          </div>

          {/* Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-semibold mb-2" style={{color: 'var(--foreground)'}}>
              Filter Status
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="input-enhanced pl-4 pr-12 appearance-none cursor-pointer"
              >
                <option value="all">All Markets</option>
                <option value="active">Active Only</option>
                <option value="closed">Closed Only</option>
                <option value="archived">Archived Only</option>
              </select>
              <FunnelIcon 
                className="h-4 w-4 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" 
                style={{color: 'var(--foreground-muted)'}} 
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium" style={{color: 'var(--foreground)'}}>
              {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems} markets
            </span>
            {totalItems > 0 && (
              <div className="h-4 w-px" style={{backgroundColor: 'var(--card-border)'}}></div>
            )}
            <span className="text-sm" style={{color: 'var(--foreground-muted)'}}>
              {totalPages} {totalPages === 1 ? 'page' : 'pages'}
            </span>
          </div>
          <button 
            onClick={fetchMarkets}
            className="btn-secondary-enhanced text-sm px-4 py-2"
            disabled={loading}
          >
            {loading ? (
              <><div className="loading-spinner-enhanced w-4 h-4 mr-2"></div>Refreshing</>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>
      </div>

      {/* Markets Table */}
      <div className="card-enhanced overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-enhanced min-w-full">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('question')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>Market Question</span>
                    {getSortIcon('question')}
                  </div>
                </th>
                <th>Status</th>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('reward')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>Reward</span>
                    {getSortIcon('reward')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('minSize')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>Min Size</span>
                    {getSortIcon('minSize')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('maxSpread')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>Max Spread</span>
                    {getSortIcon('maxSpread')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('volume')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>Volume</span>
                    {getSortIcon('volume')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('liquidity')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>Liquidity</span>
                    {getSortIcon('liquidity')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleSort('endDate')}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--background-alt)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center space-x-2">
                    <span>End Date</span>
                    {getSortIcon('endDate')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((market, index) => (
                <tr 
                  key={market.id} 
                  className="animate-fade-in"
                  style={{animationDelay: `${index * 20}ms`}}
                >
                  <td>
                    <div className="max-w-xs">
                      <div 
                        className="font-semibold text-sm leading-tight mb-1 truncate" 
                        style={{color: 'var(--foreground)'}} 
                        title={market.question}
                      >
                        {market.question}
                      </div>
                      {market.slug && (
                        <div 
                          className="text-xs truncate" 
                          style={{color: 'var(--foreground-muted)'}}
                        >
                          {market.slug}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(market)}
                  </td>
                  <td>
                    <div className="font-semibold" style={{color: 'var(--success)'}}>
                      {formatReward(market.reward)}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium" style={{color: 'var(--info)'}}>
                      {formatShares(market.minSize)}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium" style={{color: 'var(--warning)'}}>
                      {formatDecimal(market.maxSpread)}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium" style={{color: 'var(--foreground)'}}>
                      {formatCurrency(market.volume)}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium" style={{color: 'var(--foreground)'}}>
                      {formatCurrency(market.liquidity)}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm" style={{color: 'var(--foreground-muted)'}}>
                      {formatDate(market.endDate)}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="p-2 rounded-lg transition-all hover:scale-110 focus:scale-95"
                      style={{color: 'var(--primary)'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentPageItems.length === 0 && totalItems > 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{backgroundColor: 'var(--info-light)'}}
              >
                <FunnelIcon className="h-10 w-10" style={{color: 'var(--info)'}} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--foreground)'}}>
                No results on this page
              </h3>
              <p style={{color: 'var(--foreground-muted)'}}>
                Try going to a different page or adjusting your filters
              </p>
            </div>
          </div>
        )}

        {totalItems === 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{backgroundColor: 'var(--warning-light)'}}
              >
                <FunnelIcon className="h-10 w-10" style={{color: 'var(--warning)'}} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--foreground)'}}>
                No markets found
              </h3>
              <p className="mb-6" style={{color: 'var(--foreground-muted)'}}>
                Try adjusting your search or filter criteria, or check back later for new markets
              </p>
              <button 
                onClick={fetchMarkets}
                className="btn-secondary-enhanced"
              >
                Refresh Markets
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-enhanced p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3 text-sm">
              <span className="font-medium" style={{color: 'var(--foreground)'}}>
                Page {currentPage} of {totalPages}
              </span>
              <div className="h-4 w-px" style={{backgroundColor: 'var(--card-border)'}}></div>
              <span style={{color: 'var(--foreground-muted)'}}>
                {totalItems} total results
              </span>
            </div>
            
            <div className="pagination-enhanced">
              {/* Previous button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn flex items-center px-4 py-2 text-sm font-medium"
                style={{minWidth: '90px'}}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center space-x-1">
                {getVisiblePages().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`pagination-btn ${
                      page === currentPage ? 'active' : ''
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn flex items-center px-4 py-2 text-sm font-medium"
                style={{minWidth: '90px'}}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
          
          {/* Mobile page indicator */}
          <div className="sm:hidden mt-6 flex justify-center">
            <div className="pagination-enhanced">
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`pagination-btn ${
                    page === currentPage ? 'active' : ''
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MarketsPage() {
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
      <MarketsTable />
    </DashboardLayout>
  )
}