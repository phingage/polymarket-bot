'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../components/LoginPage'

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
}

export default function MarketsPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Market | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true)
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'
      const response = await fetch(`${apiBaseUrl}/api/markets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMarkets(data)
      setCurrentPage(1) // Reset alla prima pagina quando vengono caricati nuovi dati
      setError(null)
    } catch (err) {
      setError('Errore nel caricamento dei mercati')
      console.error(err)
      // Fallback ai dati mock in caso di errore
      const mockMarkets: Market[] = [
        {
          id: "1",
          question: "Will Bitcoin reach $100,000 by the end of 2025?",
          reward: "0.05",
          minSize: "100",
          maxSpread: "0.02",
          spread: "0.015",
          endDate: "2025-12-31",
          volume: "50000",
          liquidity: "10000",
          active: true,
          closed: false,
          archived: false
        }
      ]
      setMarkets(mockMarkets)
      setCurrentPage(1)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (user && token) {
      fetchMarkets()
    }
  }, [user, token, fetchMarkets])

  // Mostra la pagina di login se l'utente non è autenticato
  if (!user) {
    return <LoginPage />
  }

  // Filtra i mercati in base al termine di ricerca
  const filteredMarkets = markets.filter(market =>
    market.question.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Ordina i mercati filtrati
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (!sortField) return 0

    let aValue: string | number | boolean = a[sortField]
    let bValue: string | number | boolean = b[sortField]

    // Gestisci campi numerici
    if (sortField === 'volume' || sortField === 'liquidity' || sortField === 'reward' || 
        sortField === 'minSize' || sortField === 'maxSpread' || sortField === 'spread') {
      aValue = parseFloat(aValue as string) || 0
      bValue = parseFloat(bValue as string) || 0
    }
    
    // Gestisci date
    if (sortField === 'endDate') {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    }

    // Gestisci booleani
    if (sortField === 'active' || sortField === 'closed' || sortField === 'archived') {
      aValue = aValue ? 1 : 0
      bValue = bValue ? 1 : 0
    }

    // Confronta i valori
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1
    }
    return 0
  })

  // Calcola gli indici per la paginazione sui dati ordinati
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentMarkets = sortedMarkets.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedMarkets.length / itemsPerPage)

  // Funzioni per la paginazione
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Funzione per gestire la ricerca
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset alla prima pagina quando si effettua una ricerca
  }

  // Funzione per gestire l'ordinamento
  const handleSort = (field: keyof Market) => {
    if (sortField === field) {
      // Se stessa colonna, inverte la direzione
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Nuova colonna, inizia con ascendente
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset alla prima pagina quando si ordina
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento mercati...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Polymarket Bot Control
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Benvenuto, {user?.username}
            </span>
            <button
              onClick={fetchMarkets}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Aggiorna
            </button>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Barra di ricerca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cerca nelle domande dei mercati..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                title="Cancella ricerca"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              Trovati {sortedMarkets.length} mercati che contengono &ldquo;{searchTerm}&rdquo;
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {searchTerm ? `Mercati Filtrati (${filteredMarkets.length})` : `Mercati Attivi (${markets.length})`}
              </h2>
              <div className="text-sm text-gray-500">
                Pagina {currentPage} di {totalPages} - Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedMarkets.length)} di {sortedMarkets.length} mercati
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <button
                      onClick={() => handleSort('question')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Domanda</span>
                      {sortField === 'question' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('reward')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Reward</span>
                      {sortField === 'reward' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('minSize')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>MinSize</span>
                      {sortField === 'minSize' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('maxSpread')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>MaxSpread</span>
                      {sortField === 'maxSpread' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('spread')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Spread</span>
                      {sortField === 'spread' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    <button
                      onClick={() => handleSort('volume')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Volume</span>
                      {sortField === 'volume' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    <button
                      onClick={() => handleSort('liquidity')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Liquidità</span>
                      {sortField === 'liquidity' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('endDate')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Scadenza</span>
                      {sortField === 'endDate' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('active')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Stato</span>
                      {sortField === 'active' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentMarkets.length > 0 ? (
                  currentMarkets.map((market) => (
                    <tr key={market.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm font-medium text-gray-900 truncate" title={market.question}>
                          {market.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ${parseFloat(market.reward).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(market.minSize).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(market.maxSpread).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(market.spread).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(market.volume).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(market.liquidity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(market.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Attivo
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 
                        `Nessun mercato trovato per la ricerca &ldquo;${searchTerm}&rdquo;` : 
                        'Nessun mercato disponibile'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Controlli di paginazione */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Precedente
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Successiva
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Vai alla pagina:{' '}
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    placeholder="Pagina"
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        goToPage(page);
                      }
                    }}
                    className="ml-1 w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
