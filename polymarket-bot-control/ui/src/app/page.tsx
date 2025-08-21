'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../components/LoginPage'
import Logo from '../components/Logo'
import Notification from '../components/Notification'

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
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({ show: false, message: '', type: 'info' })

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
      setNotification({
        show: true,
        message: `${data.length} mercati aggiornati con successo`,
        type: 'success'
      })
    } catch (err) {
      setError('Errore nel caricamento dei mercati')
      console.error(err)
      setNotification({
        show: true,
        message: 'Errore nel caricamento, usando dati di esempio',
        type: 'warning'
      })
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
      <div className="min-h-screen bg-primary-flat flex items-center justify-center">
        <div className="text-center">
          <Logo size="xl" className="mx-auto mb-6 pulse-gentle" />
          <div className="flex items-center justify-center space-x-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xl text-gray-700 font-medium">Caricamento mercati...</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Connessione al bot di liquidità in corso
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-flat flex items-center justify-center">
        <div className="text-center card-pastel p-8 max-w-md">
          <Logo size="lg" className="mx-auto mb-4 opacity-50" />
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl text-red-600 font-semibold">{error}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Errore nella connessione al server. Riprova più tardi.
          </p>
          <button
            onClick={fetchMarkets}
            className="button-primary-flat"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-flat">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Logo size="lg" className="pulse-gentle" />
            <div>
              <h1 className="text-3xl font-bold text-primary-flat">
                Polymarket Bot Control
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dashboard di controllo per bot di liquidità
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-full">
              Benvenuto, <span className="font-semibold text-gray-800">{user?.username}</span>
            </span>
            <button
              onClick={fetchMarkets}
              className="button-primary-flat flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Aggiorna</span>
            </button>
            <button
              onClick={logout}
              className="button-danger-flat"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Barra di ricerca */}
        <div className="mb-6 fade-in">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Cerca nelle domande dei mercati..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-pastel block w-full pl-4 pr-20 py-3 text-gray-700 placeholder-gray-400 focus:placeholder-gray-300"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-8 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Cancella ricerca"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600 bg-white/50 px-3 py-2 rounded-lg inline-block">
              Trovati <span className="font-semibold text-blue-600">{sortedMarkets.length}</span> mercati che contengono &ldquo;<span className="font-medium">{searchTerm}</span>&rdquo;
            </div>
          )}
        </div>

        <div className="card-pastel fade-in">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>
                  {searchTerm ? `Mercati Filtrati (${filteredMarkets.length})` : `Mercati Attivi (${markets.length})`}
                </span>
              </h2>
              <div className="text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                Pagina <span className="font-semibold">{currentPage}</span> di <span className="font-semibold">{totalPages}</span> - 
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedMarkets.length)} di {sortedMarkets.length} mercati
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr>
                  <th className="table-pastel th px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <button
                      onClick={() => handleSort('question')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
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
                  <th className="table-pastel th px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <button
                      onClick={() => handleSort('reward')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
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
