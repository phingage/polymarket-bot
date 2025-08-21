'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Logo from './Logo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-flat flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="xl" className="mx-auto mb-6 pulse-gentle" />
          <h2 className="text-3xl font-bold text-primary-flat">
            Polymarket Bot Control
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accedi al pannello di controllo del bot di liquidità
          </p>
        </div>
        
        <form className="mt-8 space-y-6 card-pastel p-6 fade-in" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-pastel w-full"
                placeholder="Inserisci il tuo username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-pastel w-full"
                placeholder="Inserisci la tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full button-primary-flat py-3 text-lg font-semibold flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="-ml-1 mr-3 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )}
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
