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

  const formatPercentage = (value: string) => {
    const num = parseFloat(value) * 100
    return isNaN(num) ? '0%' : `${num.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT')
    } catch {
      return 'N/A'
    }
  }

  const getStatusBadge = (market: Market) => {
    if (market.archived) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Archived</span>
    if (market.closed) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Closed</span>
    if (market.active) return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Inactive</span>
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 loading-spinner"></div>
        <span className="ml-2 text-gray-600">Caricamento mercati...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stats-card p-6 text-center">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Errore nel caricamento</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button 
          onClick={fetchMarkets}
          className="btn-primary px-4 py-2 rounded-lg text-sm"
        >
          Riprova
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Markets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and analyze Polymarket trading opportunities
        </p>
      </div>

      {/* Filters and Search */}
      <div className="stats-card p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Markets</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} markets
          </span>
          <button 
            onClick={fetchMarkets}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Markets Table */}
      <div className="stats-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('question')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Market Question</span>
                    {getSortIcon('question')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reward')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Reward Rate</span>
                    {getSortIcon('reward')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Volume</span>
                    {getSortIcon('volume')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('liquidity')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Liquidity</span>
                    {getSortIcon('liquidity')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('endDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>End Date</span>
                    {getSortIcon('endDate')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageItems.map((market) => (
                <tr key={market.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={market.question}>
                      {market.question}
                    </div>
                    {market.slug && (
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {market.slug}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(market)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatPercentage(market.reward)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(market.volume)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(market.liquidity)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(market.endDate)}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:text-primary/80 p-1">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentPageItems.length === 0 && totalItems > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FunnelIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No results on this page</h3>
            <p className="text-gray-500">Try going to a different page or adjusting your filters</p>
          </div>
        )}

        {totalItems === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FunnelIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No markets found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="stats-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <span>·</span>
              <span>
                {totalItems} total results
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center space-x-1">
                {getVisiblePages().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'bg-primary text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
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
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          
          {/* Mobile page indicator */}
          <div className="sm:hidden mt-3 flex justify-center">
            <div className="flex items-center space-x-1">
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded-full ${
                    page === currentPage
                      ? 'bg-primary text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
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
      <MarketsTable />
    </DashboardLayout>
  )
}